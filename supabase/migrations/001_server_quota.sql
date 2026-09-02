-- ============================================================
-- MatchApp — FULL DATABASE SETUP
--   • Creates the profiles table (if it does not exist yet)
--   • Auto-creates a profile row on signup
--   • Row Level Security so users only touch their own row
--   • Server-enforced match quota + share rewards
--
-- Run once: Supabase → SQL Editor → New query → paste → Run.
-- Idempotent: safe to re-run.
--
-- IMPORTANT: paste the CONTENTS of this file, not its filename.
-- ============================================================


-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
create table if not exists public.profiles (
    id             uuid primary key references auth.users(id) on delete cascade,

    -- Core identity (locked once saved, per the app's identity-lock feature)
    full_name      text,
    country        text,
    dob            text,
    star_sign      text,
    age            integer,
    profile_locked boolean not null default false,
    avatar_url     text,

    -- Entitlements
    is_vip         boolean not null default false,
    is_ad_free     boolean not null default false,

    -- Portfolios (mirrored from localStorage so they follow the account)
    saved_list     jsonb not null default '[]'::jsonb,
    seen_list      jsonb not null default '[]'::jsonb,
    disliked_list  jsonb not null default '[]'::jsonb,
    user_ratings   jsonb not null default '{}'::jsonb,

    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

-- Columns are added individually too, so an existing partial table gets
-- upgraded rather than erroring out.
alter table public.profiles add column if not exists full_name      text;
alter table public.profiles add column if not exists country        text;
alter table public.profiles add column if not exists dob            text;
alter table public.profiles add column if not exists star_sign      text;
alter table public.profiles add column if not exists age            integer;
alter table public.profiles add column if not exists profile_locked boolean not null default false;
alter table public.profiles add column if not exists avatar_url     text;
alter table public.profiles add column if not exists is_vip         boolean not null default false;
alter table public.profiles add column if not exists is_ad_free     boolean not null default false;
alter table public.profiles add column if not exists saved_list     jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists seen_list      jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists disliked_list  jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists user_ratings   jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists created_at     timestamptz not null default now();
alter table public.profiles add column if not exists updated_at     timestamptz not null default now();

-- Server-managed quota columns
alter table public.profiles add column if not exists daily_match_count integer       not null default 0;
alter table public.profiles add column if not exists daily_match_date  date          not null default current_date;
alter table public.profiles add column if not exists share_rewards     timestamptz[] not null default '{}'::timestamptz[];

comment on column public.profiles.daily_match_count is 'Matches consumed today. Server-managed; client cannot write this.';
comment on column public.profiles.daily_match_date  is 'Date the counter refers to. Rolls over automatically.';
comment on column public.profiles.share_rewards     is 'Timestamps of granted share bonuses (rolling 6h window).';


-- ============================================================
-- 2. AUTO-CREATE A PROFILE ON SIGNUP
--    Without this, a new user has no row and every profile
--    read/write silently fails.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, full_name, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
        coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Backfill rows for any users who signed up before this migration.
insert into public.profiles (id)
select u.id from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;


-- ============================================================
-- 3. KEEP updated_at FRESH
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
    before update on public.profiles
    for each row execute function public.touch_updated_at();


-- ============================================================
-- 4. ROW LEVEL SECURITY + COLUMN LOCKDOWN
--    Users may read and edit their own row, but the quota columns
--    are removed from their UPDATE grant entirely, so the only way
--    to change them is through the RPCs in section 6.
-- ============================================================
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
    for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
    for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
    for update using (auth.uid() = id) with check (auth.uid() = id);

-- Strip blanket UPDATE, then re-grant only the columns a user legitimately edits.
revoke update on public.profiles from authenticated;
revoke update on public.profiles from anon;

grant select on public.profiles to authenticated;
grant insert on public.profiles to authenticated;
grant update (
    full_name, country, dob, star_sign, age, profile_locked, avatar_url,
    saved_list, seen_list, disliked_list, user_ratings
) on public.profiles to authenticated;

-- Note: is_vip, is_ad_free, daily_match_count, daily_match_date and
-- share_rewards are deliberately NOT in that grant. Billing and quota
-- state must never be writable from the browser.


-- ============================================================
-- 5. LIMIT RESOLUTION
-- ============================================================
create or replace function public.match_daily_limit(p_is_vip boolean)
returns integer language sql immutable as $$
    select case when p_is_vip then 10 else 5 end;
$$;


-- ============================================================
-- 6. QUOTA RPCs (the only writers of the quota columns)
-- ============================================================

-- Consume one match. Returns { allowed, used, limit, remaining, reason }
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
        insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;
        select * into v_row from public.profiles where id = v_uid for update;
    end if;

    v_used  := case when v_row.daily_match_date = current_date then v_row.daily_match_count else 0 end;
    v_limit := public.match_daily_limit(coalesce(v_row.is_vip, false));

    if v_used >= v_limit then
        update public.profiles
           set daily_match_count = v_used, daily_match_date = current_date
         where id = v_uid;
        return jsonb_build_object('allowed', false, 'reason', 'limit_reached',
                                  'used', v_used, 'limit', v_limit, 'remaining', 0);
    end if;

    update public.profiles
       set daily_match_count = v_used + 1, daily_match_date = current_date
     where id = v_uid;

    return jsonb_build_object('allowed', true, 'used', v_used + 1,
                              'limit', v_limit, 'remaining', v_limit - (v_used + 1));
end;
$$;


-- Claim a share bonus. Max 3 per rolling 6 hours; refunds one match.
create or replace function public.claim_share_reward()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid    uuid := auth.uid();
    v_row    public.profiles%rowtype;
    v_window interval := interval '6 hours';
    v_max    integer  := 3;
    v_recent timestamptz[];
    v_oldest timestamptz;
    v_used   integer;
begin
    if v_uid is null then
        return jsonb_build_object('granted', false, 'reason', 'not_authenticated');
    end if;

    select * into v_row from public.profiles where id = v_uid for update;
    if not found then
        return jsonb_build_object('granted', false, 'reason', 'no_profile');
    end if;

    select coalesce(array_agg(ts), '{}'::timestamptz[])
      into v_recent
      from unnest(coalesce(v_row.share_rewards, '{}'::timestamptz[])) ts
     where ts > now() - v_window;

    if coalesce(array_length(v_recent, 1), 0) >= v_max then
        select min(ts) into v_oldest from unnest(v_recent) ts;
        update public.profiles set share_rewards = v_recent where id = v_uid;
        return jsonb_build_object('granted', false, 'reason', 'window_full',
            'remaining_rewards', 0,
            'reset_in_seconds', greatest(0, extract(epoch from (v_oldest + v_window - now()))::int));
    end if;

    v_used := case when v_row.daily_match_date = current_date
                   then greatest(0, v_row.daily_match_count - 1) else 0 end;

    update public.profiles
       set share_rewards     = v_recent || now(),
           daily_match_count = v_used,
           daily_match_date  = current_date
     where id = v_uid;

    return jsonb_build_object('granted', true,
        'remaining_rewards', v_max - (coalesce(array_length(v_recent, 1), 0) + 1),
        'used', v_used);
end;
$$;


-- Read-only status for the header badge.
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

    select coalesce(array_agg(ts), '{}'::timestamptz[])
      into v_recent
      from unnest(coalesce(v_row.share_rewards, '{}'::timestamptz[])) ts
     where ts > now() - interval '6 hours';

    select min(ts) into v_oldest from unnest(v_recent) ts;

    return jsonb_build_object(
        'authenticated', true,
        'used', v_used,
        'limit', v_limit,
        'remaining', greatest(0, v_limit - v_used),
        'is_vip', coalesce(v_row.is_vip, false),
        'share_rewards_left', greatest(0, 3 - coalesce(array_length(v_recent, 1), 0)),
        'reset_in_seconds', case when coalesce(array_length(v_recent, 1), 0) >= 3
            then greatest(0, extract(epoch from (v_oldest + interval '6 hours' - now()))::int)
            else 0 end
    );
end;
$$;


-- ============================================================
-- 7. EXPOSE THE RPCs
-- ============================================================
grant execute on function public.consume_match()            to authenticated;
grant execute on function public.claim_share_reward()       to authenticated;
grant execute on function public.match_status()             to authenticated;
grant execute on function public.match_daily_limit(boolean) to authenticated;

-- Anonymous visitors have no server identity, so they are not granted these.
-- Their 3 free matches stay client-side by design (see README).


-- ============================================================
-- 8. VERIFY
-- ============================================================
select count(*) as profiles_ready from public.profiles;
