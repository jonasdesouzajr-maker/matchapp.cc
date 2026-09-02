# MatchApp — Supabase Setup

## ⚠️ Required: run the quota migration

The match quota and share-reward system is enforced **server-side**. Until the
migration below is applied, the RPCs it defines do not exist, and the client
falls back to the old localStorage metering (which still works, but is
tamper-able).

### How to apply

> **Paste the file's CONTENTS, not its path.** Pasting
> `supabase/migrations/001_server_quota.sql` into the editor makes Postgres try
> to run the filename as SQL and fails with
> `ERROR: 42601: syntax error at or near "supabase"`.

1. Open `migrations/001_server_quota.sql` on GitHub and click **Raw**
2. Select all (Ctrl/Cmd-A) and copy
3. Supabase → **SQL Editor** → **New query** → paste → **Run**

You should see `Success. No rows returned`.

This migration is idempotent — safe to re-run.

### Verify it worked

Run this in the SQL Editor while signed in as any user:

```sql
select public.match_status();
```

Expected shape:

```json
{"authenticated": true, "used": 0, "limit": 5, "remaining": 5,
 "is_vip": false, "share_rewards_left": 3, "reset_in_seconds": 0}
```

---

## What if `profiles` didn't exist?

That's fine — the migration **creates it**, along with:
- a trigger that auto-creates a profile row whenever someone signs up
- a backfill for any users who registered before the migration ran
- RLS policies scoped to `auth.uid() = id`

If you previously saw `ERROR: 42P01: relation "public.profiles" does not exist`,
that's what this fixes.

---

## What the migration does

| Object | Purpose |
|---|---|
| `profiles.daily_match_count` | Matches consumed today |
| `profiles.daily_match_date` | Date the counter refers to (auto-rolls) |
| `profiles.share_rewards` | Timestamps of granted share bonuses |
| `consume_match()` | Atomically checks + increments. Returns `allowed` |
| `claim_share_reward()` | Grants a bonus, max 3 per rolling 6h |
| `match_status()` | Read-only status for the header badge |

### Why it can't be tampered with

`REVOKE UPDATE ... FROM authenticated` removes the client's ability to write
the quota columns at all. UPDATE is then re-granted **only** on the columns a
user legitimately edits (name, country, dob, star sign, age, avatar). The three
functions are `SECURITY DEFINER`, so they run with the owner's rights and are
the only path that can touch the counters — and each enforces the limit itself
before writing. `FOR UPDATE` row locks make concurrent requests safe, and
`SET search_path = public` prevents search-path hijacking.

---

## Known limitation: anonymous visitors

Anonymous users have no authenticated identity, so there is nothing to meter
against server-side. Their **3 free matches remain client-side** and can be
reset by clearing localStorage.

This is a deliberate trade-off, not an oversight. Metering anonymous users
properly would require device fingerprinting or IP rate limiting, both of which
carry privacy and false-positive costs (shared IPs, VPNs, offices) that
outweigh protecting a free tier whose purpose is conversion. The registered
tier — where accounts, VIP billing, and abuse actually matter — **is** enforced.

If you later want anonymous limits enforced too, the cleanest route is an Edge
Function fronting the match call with IP-based rate limiting.
