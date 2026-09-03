-- ============================================================
-- MatchApp — MIGRATION 002
-- Profile-completeness gating + Business tier
--
-- Run this AFTER 001_server_quota.sql, in Supabase → SQL Editor.
-- Idempotent: safe to re-run.
--
-- WHY: registered users now only get the full 5 daily sessions once
-- their profile is actually complete (name, country, dob, star sign,
-- age — avatar stays optional). An incomplete profile gets the same
-- 3 as an anonymous visitor, which is what makes filling it in worth
-- doing. Adds a Business tier above VIP.
-- ============================================================

-- Business tier flag (above VIP)
alter table public.profiles add column if not exists is_business boolean not null default false;

comment on column public.profiles.is_business is 'Business plan subscriber. Server-managed; do not write from client.';

-- Profile is "complete" when every required identity field is filled.
-- avatar_url is deliberately NOT required.
create or replace function public.profile_is_complete(p_row public.profiles)
returns boolean
language sql
immutable
as $$
    select coalesce(nullif(trim(p_row.full_name), ''), null) is not null
       and coalesce(nullif(trim(p_row.country),   ''), null) is not null
       and coalesce(nullif(trim(p_row.dob),       ''), null) is not null
       and coalesce(nullif(trim(p_row.star_sign), ''), null) is not null
       and p_row.age is not null;
$$;

-- Tiered limits: 3 incomplete profile / 5 complete / 10 VIP / 50 Business.
create or replace function public.match_daily_limit_v2(
    p_is_vip boolean, p_is_business boolean, p_profile_complete boolean
)
returns integer
language sql
immutable
as $$
    select case
        when p_is_business then 50
        when p_is_vip then 10
        when p_profile_complete then 5
        else 3
    end;
$$;

-- Rewire consume_match() to the new tiering.
create or replace function public.consume_match()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid      uuid := auth.uid();
    v_row      public.profiles%rowtype;
    v_limit    integer;
    v_used     integer;
    v_complete boolean;
begin
    if v_uid is null then
        return jsonb_build_object('allowed', false, 'reason', 'not_authenticated');
    end if;

    select * into v_row from public.profiles where id = v_uid for update;
    if not found then
        insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;
        select * into v_row from public.profiles where id = v_uid for update;
    end if;

    v_used     := case when v_row.daily_match_date = current_date then v_row.daily_match_count else 0 end;
    v_complete := public.profile_is_complete(v_row);
    v_limit    := public.match_daily_limit_v2(
                    coalesce(v_row.is_vip, false),
                    coalesce(v_row.is_business, false),
                    v_complete);

    if v_used >= v_limit then
        update public.profiles
           set daily_match_count = v_used, daily_match_date = current_date
         where id = v_uid;
        return jsonb_build_object('allowed', false, 'reason', 'limit_reached',
                                  'used', v_used, 'limit', v_limit, 'remaining', 0,
                                  'profile_complete', v_complete);
    end if;

    update public.profiles
       set daily_match_count = v_used + 1, daily_match_date = current_date
     where id = v_uid;

    return jsonb_build_object('allowed', true, 'used', v_used + 1,
                              'limit', v_limit, 'remaining', v_limit - (v_used + 1),
                              'profile_complete', v_complete);
end;
$$;

-- Rewire match_status() to report tier + completeness, so the frontend can
-- prompt the user to finish their profile and unlock the extra sessions.
create or replace function public.match_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid      uuid := auth.uid();
    v_row      public.profiles%rowtype;
    v_limit    integer;
    v_used     integer;
    v_recent   timestamptz[];
    v_oldest   timestamptz;
    v_complete boolean;
begin
    if v_uid is null then
        return jsonb_build_object('authenticated', false);
    end if;

    select * into v_row from public.profiles where id = v_uid;
    if not found then
        return jsonb_build_object('authenticated', false, 'reason', 'no_profile');
    end if;

    v_used     := case when v_row.daily_match_date = current_date then v_row.daily_match_count else 0 end;
    v_complete := public.profile_is_complete(v_row);
    v_limit    := public.match_daily_limit_v2(
                    coalesce(v_row.is_vip, false),
                    coalesce(v_row.is_business, false),
                    v_complete);

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
        'is_business', coalesce(v_row.is_business, false),
        'profile_complete', v_complete,
        'share_rewards_left', greatest(0, 3 - coalesce(array_length(v_recent, 1), 0)),
        'reset_in_seconds', case when coalesce(array_length(v_recent, 1), 0) >= 3
            then greatest(0, extract(epoch from (v_oldest + interval '6 hours' - now()))::int)
            else 0 end
    );
end;
$$;

grant execute on function public.profile_is_complete(public.profiles) to authenticated;
grant execute on function public.match_daily_limit_v2(boolean, boolean, boolean) to authenticated;

-- is_business must never be writable from the browser, same as is_vip.
-- (The column-level grant from migration 001 already excludes it, but this
--  re-asserts the safe list in case that grant is ever re-run.)
revoke update on public.profiles from authenticated;
grant update (
    full_name, country, dob, star_sign, age, profile_locked, avatar_url,
    saved_list, seen_list, disliked_list, user_ratings
) on public.profiles to authenticated;

select 'Migration 002 applied. Tiers: 3 incomplete / 5 complete / 10 VIP / 50 Business.' as result;
