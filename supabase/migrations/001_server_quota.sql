-- ============================================================
-- MatchApp — SERVER-ENFORCED MATCH QUOTA & SHARE REWARDS
-- Run this once in Supabase → SQL Editor → New query → Run.
--
-- WHY THIS EXISTS
-- Quota used to live in localStorage, where anyone could open
-- devtools and reset their counter. This moves the accounting into
-- Postgres behind SECURITY DEFINER functions, so the client can
-- *ask* to consume a match but cannot *set* how many it has used.
--
-- The client is deliberately NOT granted UPDATE on these columns.
-- The only path to changing them is through the two RPCs below,
-- which enforce the limits themselves.
-- ============================================================

-- ---------- 1. Columns on profiles ----------
alter table public.profiles
    add column if not exists daily_match_count integer      not null default 0,
    add column if not exists daily_match_date  date         not null default current_date,
    add column if not exists share_rewards     timestamptz[] not null default '{}';

comment on column public.profiles.daily_match_count is 'Matches consumed today. Server-managed; do not write from client.';
comment on column public.profiles.daily_match_date  is 'UTC date the counter refers to. Rolls over automatically.';
comment on column public.profiles.share_rewards     is 'Timestamps of granted share bonuses (rolling 6h window).';

-- ---------- 2. Lock the columns down ----------
-- Users may read their own row, but must not write the quota columns.
-- Grant UPDATE only on the columns a user legitimately edits.
revoke update on public.profiles from authenticated;

grant update (full_name, country, dob, star_sign, age, profile_locked, avatar_url)
    on public.profiles to authenticated;

-- Reads stay as they were (RLS still restricts to own row).
grant select on public.profiles to authenticated;

-- Make sure row-level security is on and scoped to the owner.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
    for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
    for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- 3. Limit resolution ----------
create or replace function public.match_daily_limit(p_is_vip boolean)
returns integer
language sql
immutable
as $$
    select case when p_is_vip then 10 else 5 end;
$$;

-- ---------- 4. Consume one match ----------
-- Returns: { allowed, used, "limit", remaining, reason }
create or replace function public.consume_match()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid   uuid := auth.uid();
    v_row   public.profiles%rowtype;
    v_limit integer;
    v_used  integer;
begin
    if v_uid is null then
        return jsonb_build_object('allowed', false, 'reason', 'not_authenticated');
    end if;

    select * into v_row from public.profiles where id = v_uid for update;
    if not found then
        return jsonb_build_object('allowed', false, 'reason', 'no_profile');
    end if;

    -- Roll the counter over on a new UTC day.
    if v_row.daily_match_date <> current_date then
        v_used := 0;
    else
        v_used := v_row.daily_match_count;
    end if;

    v_limit := public.match_daily_limit(coalesce(v_row.is_vip, false));

    if v_used >= v_limit then
        update public.profiles
           set daily_match_count = v_used,
               daily_match_date  = current_date
         where id = v_uid;
        return jsonb_build_object(
            'allowed', false, 'reason', 'limit_reached',
            'used', v_used, 'limit', v_limit, 'remaining', 0
        );
    end if;

    update public.profiles
       set daily_match_count = v_used + 1,
           daily_match_date  = current_date
     where id = v_uid;

    return jsonb_build_object(
        'allowed', true, 'used', v_used + 1, 'limit', v_limit,
        'remaining', v_limit - (v_used + 1)
    );
end;
$$;

-- ---------- 5. Claim a share bonus ----------
-- Max 3 rewards per rolling 6 hours. A reward refunds one consumed match.
-- Returns: { granted, remaining_rewards, reset_in_seconds, reason }
create or replace function public.claim_share_reward()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid     uuid := auth.uid();
    v_row     public.profiles%rowtype;
    v_window  interval := interval '6 hours';
    v_max     integer  := 3;
    v_recent  timestamptz[];
    v_oldest  timestamptz;
    v_used    integer;
begin
    if v_uid is null then
        return jsonb_build_object('granted', false, 'reason', 'not_authenticated');
    end if;

    select * into v_row from public.profiles where id = v_uid for update;
    if not found then
        return jsonb_build_object('granted', false, 'reason', 'no_profile');
    end if;

    -- Keep only rewards inside the rolling window.
    select coalesce(array_agg(ts), '{}')
      into v_recent
      from unnest(coalesce(v_row.share_rewards, '{}')) ts
     where ts > now() - v_window;

    if array_length(v_recent, 1) >= v_max then
        select min(ts) into v_oldest from unnest(v_recent) ts;
        update public.profiles set share_rewards = v_recent where id = v_uid;
        return jsonb_build_object(
            'granted', false, 'reason', 'window_full',
            'remaining_rewards', 0,
            'reset_in_seconds', greatest(0, extract(epoch from (v_oldest + v_window - now()))::int)
        );
    end if;

    -- Refund one match against today's counter (never below zero).
    if v_row.daily_match_date = current_date then
        v_used := greatest(0, v_row.daily_match_count - 1);
    else
        v_used := 0;
    end if;

    update public.profiles
       set share_rewards     = v_recent || now(),
           daily_match_count = v_used,
           daily_match_date  = current_date
     where id = v_uid;

    return jsonb_build_object(
        'granted', true,
        'remaining_rewards', v_max - (coalesce(array_length(v_recent, 1), 0) + 1),
        'used', v_used
    );
end;
$$;

-- ---------- 6. Read current status without consuming ----------
-- Returns: { used, "limit", remaining, share_rewards_left, reset_in_seconds }
create or replace function public.match_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid    uuid := auth.uid();
    v_row    public.profiles%rowtype;
    v_limit  integer;
    v_used   integer;
    v_recent timestamptz[];
    v_oldest timestamptz;
begin
    if v_uid is null then
        return jsonb_build_object('authenticated', false);
    end if;

    select * into v_row from public.profiles where id = v_uid;
    if not found then
        return jsonb_build_object('authenticated', false, 'reason', 'no_profile');
    end if;

    v_used  := case when v_row.daily_match_date = current_date then v_row.daily_match_count else 0 end;
    v_limit := public.match_daily_limit(coalesce(v_row.is_vip, false));

    select coalesce(array_agg(ts), '{}')
      into v_recent
      from unnest(coalesce(v_row.share_rewards, '{}')) ts
     where ts > now() - interval '6 hours';

    select min(ts) into v_oldest from unnest(v_recent) ts;

    return jsonb_build_object(
        'authenticated', true,
        'used', v_used,
        'limit', v_limit,
        'remaining', greatest(0, v_limit - v_used),
        'is_vip', coalesce(v_row.is_vip, false),
        'share_rewards_left', greatest(0, 3 - coalesce(array_length(v_recent, 1), 0)),
        'reset_in_seconds', case
            when coalesce(array_length(v_recent, 1), 0) >= 3
            then greatest(0, extract(epoch from (v_oldest + interval '6 hours' - now()))::int)
            else 0 end
    );
end;
$$;

-- ---------- 7. Expose the RPCs ----------
grant execute on function public.consume_match()      to authenticated;
grant execute on function public.claim_share_reward() to authenticated;
grant execute on function public.match_status()       to authenticated;
grant execute on function public.match_daily_limit(boolean) to authenticated;

-- Anonymous visitors have no server identity, so they are not granted these.
-- Their 3 free matches stay client-side by design (see README note).
