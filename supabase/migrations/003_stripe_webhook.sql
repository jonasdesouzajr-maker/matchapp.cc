-- ============================================================
-- MatchApp — MIGRATION 003
-- Stripe webhook support: customer linkage + event audit log
--
-- Run this AFTER 002_profile_tiers.sql, in Supabase → SQL Editor.
-- Idempotent: safe to re-run.
--
-- WHY THIS IS NEEDED
-- checkout.session.completed carries client_reference_id, so we know
-- which user just paid. But cancellation events
-- (customer.subscription.deleted / .updated) do NOT — they only carry
-- the Stripe customer and subscription IDs. So we record those on the
-- profile at purchase time, giving us a way to find the right user
-- when a subscription later lapses or is cancelled.
-- ============================================================

-- ---------- 1. Stripe linkage on profiles ----------
alter table public.profiles add column if not exists stripe_customer_id     text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists subscription_status    text;
alter table public.profiles add column if not exists subscription_plan      text;
alter table public.profiles add column if not exists subscription_updated_at timestamptz;

comment on column public.profiles.stripe_customer_id     is 'Stripe customer ID. Set by the stripe-webhook function; never written from the client.';
comment on column public.profiles.stripe_subscription_id is 'Active Stripe subscription ID, if any.';
comment on column public.profiles.subscription_status    is 'Last known Stripe status: active, past_due, canceled, etc.';
comment on column public.profiles.subscription_plan      is 'Which plan is active: ad_free, vip_monthly, vip_annual, business.';

-- Looking a user up by Stripe customer is the hot path for cancellations.
create index if not exists profiles_stripe_customer_idx on public.profiles (stripe_customer_id);

-- ---------- 2. Webhook event log ----------
-- Two jobs: an audit trail you can actually read when a payment looks wrong,
-- and idempotency — Stripe retries webhooks, and retries must not double-apply.
create table if not exists public.stripe_events (
    id             text primary key,          -- Stripe's evt_... id
    type           text not null,
    user_id        uuid references auth.users(id) on delete set null,
    plan           text,
    payload_digest text,
    processed_at   timestamptz not null default now()
);

comment on table public.stripe_events is 'Audit log of processed Stripe webhook events. Primary key doubles as the idempotency guard.';

alter table public.stripe_events enable row level security;

-- No client access at all. Only the service role (used by the Edge Function)
-- touches this table, and service_role bypasses RLS by design.
revoke all on public.stripe_events from anon, authenticated;

-- ---------- 3. Keep the billing columns unwritable from the browser ----------
-- Re-assert the safe UPDATE list. The new Stripe columns are deliberately
-- absent, exactly like is_vip / is_business — a user must never be able to
-- grant themselves a paid tier by writing their own profile row.
revoke update on public.profiles from authenticated;
grant update (
    full_name, country, dob, star_sign, age, profile_locked, avatar_url,
    saved_list, seen_list, disliked_list, user_ratings
) on public.profiles to authenticated;

-- ---------- 4. Verify ----------
select
    (select count(*) from information_schema.columns
      where table_schema='public' and table_name='profiles'
        and column_name in ('stripe_customer_id','stripe_subscription_id','subscription_status','subscription_plan','subscription_updated_at')
    ) as stripe_columns_added,
    (select count(*) from information_schema.tables
      where table_schema='public' and table_name='stripe_events') as events_table_created;
