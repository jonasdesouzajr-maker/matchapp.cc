-- ============================================================
-- MatchApp — MIGRATION 006
-- Saved watch contacts
--
-- Run in Supabase → SQL Editor, after 005. Idempotent: safe to re-run.
--
-- WHY THIS EXISTS
--
-- The people you watch with are the same three or four people forever, and
-- the app made you retype their number or address on every single session.
-- Contacts are saved with the CHANNEL they were reached on, so "watch with
-- Ana" is one tap and goes out the way Ana actually replies.
--
-- WHY IT IS A JSONB COLUMN AND NOT A TABLE
--
-- This list is the account holder's own private address book. It is only ever
-- read by the row's owner, is always written whole, and is never queried
-- across users. A separate table would buy joins and per-row policies that
-- nothing here needs, and would make "delete the account, delete the
-- contacts" a cascade to maintain rather than a property of the row.
--
-- DATA PROTECTION — READ BEFORE EXTENDING THIS
--
-- The values stored here are THIRD PARTIES' personal data: other people's
-- email addresses and phone numbers, held without those people's knowledge.
-- Under GDPR Art. 6 and LGPD Art. 7 that is defensible while, and only
-- while, it stays a household-purpose convenience for the account holder:
--
--   * It is never read by anyone but the owning account (RLS below).
--   * It is never used to invite, notify, market to, or profile the contact.
--   * It is never used to match or suggest users to each other. Turning this
--     into a social graph is exactly the step that would make it a
--     controller-level processing activity with notice obligations to people
--     who never visited the site.
--   * It is deleted with the account, automatically, because it is a column
--     on the profile row.
--
-- The client keeps the authoritative copy in localStorage and treats this as
-- a cross-device mirror, so a user who never signs in never uploads anyone
-- else's details at all.
-- ============================================================

alter table public.profiles
    add column if not exists watch_contacts jsonb not null default '[]'::jsonb;

comment on column public.profiles.watch_contacts is
    'The account holder''s private list of people they share matches with: '
    '[{id, name, channel, value, lastUsed}]. Third-party personal data held '
    'for the owner''s convenience only. Never used for outreach, suggestions, '
    'or user-to-user matching. Owner-readable only; deleted with the account.';

-- Guard rails on shape and size. A profile row is fetched on nearly every
-- page load, so an unbounded blob here would be paid for on every request,
-- and a malformed one would break the client's merge on sign-in.
alter table public.profiles
    drop constraint if exists profiles_watch_contacts_is_array;
alter table public.profiles
    add constraint profiles_watch_contacts_is_array
    check (jsonb_typeof(watch_contacts) = 'array');

alter table public.profiles
    drop constraint if exists profiles_watch_contacts_bounded;
alter table public.profiles
    add constraint profiles_watch_contacts_bounded
    check (jsonb_array_length(watch_contacts) <= 100);

-- RLS: this column rides on the profiles row, so it inherits whatever
-- owner-only policies that table already carries. The block below is a
-- belt-and-braces assertion that those policies exist, and fails loudly at
-- migration time rather than silently leaving an address book readable.
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'profiles'
    ) then
        raise exception
            'profiles has no RLS policies — refusing to add watch_contacts. '
            'Fix the profiles policies first; this column holds third-party '
            'personal data and must never be world-readable.';
    end if;

    if not (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass) then
        raise exception 'RLS is disabled on public.profiles — refusing to add watch_contacts.';
    end if;
end $$;
