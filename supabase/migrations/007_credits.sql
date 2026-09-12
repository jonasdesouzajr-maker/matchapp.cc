-- ============================================================
-- MatchApp — MIGRATION 007
-- Credit packs: one-time top-ups for matches and Ask AI
--
-- Run in Supabase → SQL Editor, after 006. Idempotent: safe to re-run.
--
-- WHAT A CREDIT IS
--
-- One credit = one AI action beyond the free daily allowance. A match and an
-- Ask AI question cost the same, deliberately: a two-currency system ("3 match
-- tokens, 1 AI token") is the kind of thing that feels clever on a pricing
-- page and generates support email forever.
--
-- HOW IT FITS THE EXISTING QUOTA
--
-- Credits are a FALLBACK, never a replacement. consume_match() still spends
-- the free daily allowance first and only touches the balance once the day's
-- allowance is gone. Someone who buys credits and then subscribes does not
-- silently burn what they paid for, and a subscriber's credits sit untouched
-- until the day they genuinely need an eleventh match.
--
-- Credits DO NOT EXPIRE. Expiring balances are the single largest source of
-- chargebacks and "you stole my money" support tickets in this category, and
-- the float here is worth a rounding error against that.
--
-- WHY THERE IS A LEDGER AND NOT JUST A NUMBER
--
-- A bare integer column cannot answer "why is my balance 12?", which is the
-- only question anyone ever asks about credits. Every grant and every spend
-- writes a row, the column is the running total, and the two can be
-- reconciled — so a support request is a query, not an apology.
-- ============================================================

-- ---------- balance ----------

alter table public.profiles
    add column if not exists credits integer not null default 0;

comment on column public.profiles.credits is
    'One-time credit balance. 1 credit = 1 AI action beyond the daily free '
    'allowance. Server-managed via consume_credit()/grant_credits(); never '
    'writable from the client.';

alter table public.profiles drop constraint if exists profiles_credits_non_negative;
alter table public.profiles add constraint profiles_credits_non_negative check (credits >= 0);

-- ---------- ledger ----------

create table if not exists public.credit_ledger (
    id          bigint generated always as identity primary key,
    user_id     uuid not null references auth.users(id) on delete cascade,
    delta       integer not null,               -- positive grant, negative spend
    balance     integer not null,               -- running total AFTER this row
    reason      text    not null,               -- 'purchase' | 'match' | 'ask_ai' | 'refund' | 'manual'
    pack        text,                           -- credit pack key, on purchases
    stripe_event_id text,                       -- links a grant to its Stripe event
    created_at  timestamptz not null default now()
);

comment on table public.credit_ledger is
    'Append-only history of every credit granted and spent. The profiles.credits '
    'column is the running total; this is how a balance can be explained.';

create index if not exists credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);

-- One grant per Stripe event, enforced by the database rather than by the
-- webhook remembering to check. Stripe retries deliveries, and a retry that
-- doubled someone's credits would be indistinguishable from generosity until
-- the month it wasn't.
create unique index if not exists credit_ledger_stripe_event_uniq
    on public.credit_ledger (stripe_event_id) where stripe_event_id is not null;

alter table public.credit_ledger enable row level security;

-- Owners read their own history. Nobody writes from the client at all —
-- every mutation goes through the SECURITY DEFINER functions below.
drop policy if exists credit_ledger_select_own on public.credit_ledger;
create policy credit_ledger_select_own on public.credit_ledger
    for select using (auth.uid() = user_id);

revoke all on public.credit_ledger from anon, authenticated;
grant select on public.credit_ledger to authenticated;

-- ---------- spend ----------

-- Spends exactly one credit, or reports that there were none. Takes the row
-- lock so two tabs firing at once cannot both pass the balance check and
-- spend the same last credit.
create or replace function public.consume_credit(p_reason text default 'match')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := auth.uid();
    v_bal integer;
begin
    if v_uid is null then
        return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    end if;

    if p_reason not in ('match', 'ask_ai') then
        p_reason := 'match';
    end if;

    select credits into v_bal from public.profiles where id = v_uid for update;
    if v_bal is null or v_bal <= 0 then
        return jsonb_build_object('ok', false, 'reason', 'no_credits', 'credits', coalesce(v_bal, 0));
    end if;

    update public.profiles set credits = credits - 1 where id = v_uid
    returning credits into v_bal;

    insert into public.credit_ledger (user_id, delta, balance, reason)
    values (v_uid, -1, v_bal, p_reason);

    return jsonb_build_object('ok', true, 'credits', v_bal, 'reason', p_reason);
end;
$$;

revoke all on function public.consume_credit(text) from public;
grant execute on function public.consume_credit(text) to authenticated;

-- ---------- grant ----------

-- Called ONLY by the stripe-webhook Edge Function with the service role.
-- p_stripe_event_id makes the whole thing idempotent against Stripe retries:
-- a second call with the same event id writes nothing and returns the
-- balance unchanged.
create or replace function public.grant_credits(
    p_user_id uuid,
    p_amount integer,
    p_pack text default null,
    p_stripe_event_id text default null,
    p_reason text default 'purchase'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_bal integer;
begin
    if p_amount is null or p_amount <= 0 then
        return jsonb_build_object('ok', false, 'reason', 'bad_amount');
    end if;

    if p_stripe_event_id is not null
       and exists (select 1 from public.credit_ledger where stripe_event_id = p_stripe_event_id) then
        select credits into v_bal from public.profiles where id = p_user_id;
        return jsonb_build_object('ok', true, 'duplicate', true, 'credits', coalesce(v_bal, 0));
    end if;

    insert into public.profiles (id) values (p_user_id) on conflict (id) do nothing;

    update public.profiles set credits = credits + p_amount where id = p_user_id
    returning credits into v_bal;

    if v_bal is null then
        return jsonb_build_object('ok', false, 'reason', 'no_such_user');
    end if;

    insert into public.credit_ledger (user_id, delta, balance, reason, pack, stripe_event_id)
    values (p_user_id, p_amount, v_bal, p_reason, p_pack, p_stripe_event_id);

    return jsonb_build_object('ok', true, 'credits', v_bal, 'granted', p_amount);
end;
$$;

-- Service role only. An authenticated user being able to call this would be
-- a free-credits button.
revoke all on function public.grant_credits(uuid, integer, text, text, text) from public, anon, authenticated;

-- ---------- quota integration ----------

-- consume_match() now falls through to a credit when the day's free
-- allowance is spent, instead of refusing outright. The free allowance is
-- always spent FIRST — see the note at the top of this file.
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
    v_bal      integer;
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
        -- Free allowance gone. Spend a credit if there is one.
        if coalesce(v_row.credits, 0) > 0 then
            update public.profiles
               set credits = credits - 1,
                   daily_match_count = v_used,
                   daily_match_date = current_date
             where id = v_uid
            returning credits into v_bal;

            insert into public.credit_ledger (user_id, delta, balance, reason)
            values (v_uid, -1, v_bal, 'match');

            return jsonb_build_object('allowed', true, 'used', v_used, 'limit', v_limit,
                                      'remaining', 0, 'paid_with_credit', true,
                                      'credits', v_bal, 'profile_complete', v_complete);
        end if;

        update public.profiles
           set daily_match_count = v_used, daily_match_date = current_date
         where id = v_uid;
        return jsonb_build_object('allowed', false, 'reason', 'limit_reached',
                                  'used', v_used, 'limit', v_limit, 'remaining', 0,
                                  'credits', coalesce(v_row.credits, 0),
                                  'profile_complete', v_complete);
    end if;

    update public.profiles
       set daily_match_count = v_used + 1, daily_match_date = current_date
     where id = v_uid;

    return jsonb_build_object('allowed', true, 'used', v_used + 1,
                              'limit', v_limit, 'remaining', v_limit - (v_used + 1),
                              'credits', coalesce(v_row.credits, 0),
                              'profile_complete', v_complete);
end;
$$;

-- match_status() reports the balance too, so the header badge and the
-- out-of-matches prompt can both tell the truth without a second round trip.
create or replace function public.match_credits()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := auth.uid();
    v_bal integer;
begin
    if v_uid is null then
        return jsonb_build_object('authenticated', false, 'credits', 0);
    end if;
    select credits into v_bal from public.profiles where id = v_uid;
    return jsonb_build_object('authenticated', true, 'credits', coalesce(v_bal, 0));
end;
$$;

revoke all on function public.match_credits() from public;
grant execute on function public.match_credits() to authenticated;
