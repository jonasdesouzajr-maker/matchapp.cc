-- ============================================================
-- MatchApp — MIGRATION 008
-- Server-side rate limiting for the Gemini proxy
--
-- Run in Supabase → SQL Editor, after 007. Idempotent: safe to re-run.
--
-- THE HOLE THIS CLOSES
--
-- Every limit MatchApp had lived on the client: localStorage for anonymous
-- visitors, and consume_match() for signed-in ones. consume_match() is real
-- server enforcement — but it guards the MATCH FLOW, not the Gemini proxy.
-- Nothing stopped a caller from skipping the app entirely and posting
-- straight to the Edge Function in a loop. The Supabase anon key is public by
-- design (it ships in our own JavaScript, as it must), so "you need the anon
-- key" was never a control.
--
-- That made the proxy an open, billed endpoint. This is the meter.
--
-- WHY IP AND NOT JUST USER ID
--
-- Anonymous visitors are a real, wanted audience — the free-match funnel
-- depends on them — so they cannot be required to sign in. They also have no
-- user id to count against, which leaves the caller's address as the only
-- durable key. Signed-in users are metered by user id instead, which is both
-- more accurate and survives a changing mobile IP.
--
-- ADDRESSES ARE HASHED, NEVER STORED RAW. An IP address is personal data
-- under GDPR Art. 4 and the LGPD. What is stored is a SHA-256 of the address
-- plus a server-side salt, which is enough to count repeat callers and not
-- enough to identify one, and rows are swept after an hour. The salt lives in
-- Edge Function secrets, so even a full database leak does not turn these
-- back into addresses.
-- ============================================================

create table if not exists public.ai_rate_limit (
    bucket_key  text        not null,          -- 'u:<uuid>' or 'ip:<sha256>'
    window_start timestamptz not null,
    hits        integer     not null default 0,
    primary key (bucket_key, window_start)
);

comment on table public.ai_rate_limit is
    'Sliding-window counters for Gemini proxy calls. Keys are opaque: either a '
    'user id or a salted SHA-256 of the caller address — never a raw IP. '
    'Swept hourly by prune_ai_rate_limit().';

create index if not exists ai_rate_limit_window_idx on public.ai_rate_limit (window_start);

alter table public.ai_rate_limit enable row level security;
-- No policies, deliberately: nothing but the service role may touch this.
-- A client that could read it could map usage; one that could write it could
-- clear its own counter.
revoke all on public.ai_rate_limit from anon, authenticated;

-- ------------------------------------------------------------
-- The meter.
--
-- Called by the Edge Function with the service role BEFORE any Gemini
-- request is made. Returns whether the call is allowed and how much is left.
-- Counts in fixed one-minute windows: simple, index-friendly, and accurate
-- enough for a control whose job is to stop a loop rather than to bill.
-- ------------------------------------------------------------
create or replace function public.check_ai_rate_limit(
    p_key   text,
    p_limit integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_window timestamptz := date_trunc('minute', now());
    v_hits   integer;
begin
    if p_key is null or length(p_key) = 0 then
        return jsonb_build_object('allowed', false, 'reason', 'no_key');
    end if;

    -- One statement, so two concurrent calls cannot both read the old count
    -- and both decide they are under the limit.
    insert into public.ai_rate_limit (bucket_key, window_start, hits)
    values (p_key, v_window, 1)
    on conflict (bucket_key, window_start)
    do update set hits = public.ai_rate_limit.hits + 1
    returning hits into v_hits;

    if v_hits > p_limit then
        return jsonb_build_object('allowed', false, 'reason', 'rate_limited',
                                  'hits', v_hits, 'limit', p_limit,
                                  'retry_after_seconds',
                                  60 - extract(second from now())::integer);
    end if;

    return jsonb_build_object('allowed', true, 'hits', v_hits, 'limit', p_limit);
end;
$$;

-- Service role only. A client that could call this could also call it until
-- its own window rolled over, or probe other people's keys.
revoke all on function public.check_ai_rate_limit(text, integer) from public, anon, authenticated;

-- ------------------------------------------------------------
-- Housekeeping. Counters are worthless once their window has passed, and an
-- unswept table on a busy day is a slow leak. Call from a cron job, or let
-- the Edge Function fire it opportunistically.
-- ------------------------------------------------------------
create or replace function public.prune_ai_rate_limit()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_deleted integer;
begin
    delete from public.ai_rate_limit where window_start < now() - interval '1 hour';
    get diagnostics v_deleted = row_count;
    return v_deleted;
end;
$$;

revoke all on function public.prune_ai_rate_limit() from public, anon, authenticated;
