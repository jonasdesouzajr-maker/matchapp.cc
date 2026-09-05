-- ============================================================
-- 004_activity_stats.sql
-- REAL, privacy-safe activity counters for public social proof.
--
-- Purpose: let the homepage show a genuine "matches made" figure
-- instead of a fabricated one. Everything here is an AGGREGATE
-- rollup only — no user ids, no titles, no per-person rows — so
-- exposing it to anonymous visitors leaks nothing about anybody.
--
-- Idempotent: safe to run repeatedly.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Daily rollup table (one row per calendar day, not per event)
-- ------------------------------------------------------------
create table if not exists public.match_activity (
    day         date primary key,
    match_count bigint      not null default 0,
    updated_at  timestamptz not null default now()
);

comment on table public.match_activity is
    'Aggregate daily match counts for public social proof. No personal data.';

-- Seed today's row so the very first read never returns an empty set.
insert into public.match_activity (day, match_count)
values (current_date, 0)
on conflict (day) do nothing;

-- ------------------------------------------------------------
-- 2. Increment helper — called from consume_match()
-- ------------------------------------------------------------
create or replace function public.bump_match_activity()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.match_activity (day, match_count, updated_at)
    values (current_date, 1, now())
    on conflict (day) do update
        set match_count = public.match_activity.match_count + 1,
            updated_at  = now();
end;
$$;

-- ------------------------------------------------------------
-- 3. Public read-only aggregate endpoint
--    Returns ONLY summed numbers. Callable by anonymous visitors.
-- ------------------------------------------------------------
create or replace function public.activity_stats()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
    select jsonb_build_object(
        'matches_total',   coalesce((select sum(match_count) from public.match_activity), 0),
        'matches_today',   coalesce((select match_count from public.match_activity where day = current_date), 0),
        'matches_7d',      coalesce((select sum(match_count) from public.match_activity
                                      where day > current_date - 7), 0),
        'matches_30d',     coalesce((select sum(match_count) from public.match_activity
                                      where day > current_date - 30), 0),
        'members_total',   coalesce((select count(*) from public.profiles), 0)
    );
$$;

-- ------------------------------------------------------------
-- 4. Rewire consume_match() to record the aggregate.
--    Body is identical to 002_profile_tiers.sql except for the
--    single bump_match_activity() call after a successful consume.
-- ------------------------------------------------------------
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

    -- Record the aggregate aggregate-only counter (no personal data).
    perform public.bump_match_activity();

    return jsonb_build_object('allowed', true, 'used', v_used + 1,
                              'limit', v_limit, 'remaining', v_limit - (v_used + 1),
                              'profile_complete', v_complete);
end;
$$;

-- ------------------------------------------------------------
-- 5. Permissions
--    The rollup table itself stays locked; reads go exclusively
--    through activity_stats(), which returns aggregates only.
-- ------------------------------------------------------------
alter table public.match_activity enable row level security;

-- No permissive policy is created on purpose: nothing can read the
-- raw table directly. SECURITY DEFINER functions bypass RLS, so the
-- aggregate endpoint still works.
revoke all on table public.match_activity from anon, authenticated;

grant execute on function public.activity_stats()      to anon, authenticated;
grant execute on function public.bump_match_activity() to authenticated;
grant execute on function public.consume_match()       to authenticated;
