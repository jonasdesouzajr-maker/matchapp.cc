# MatchApp — Supabase Setup

## ⚠️ Required: deploy the gemini-proxy Edge Function

> **Already deployed this before?** The file changed again — the AI
> Concierge's prompt engineering moved from the browser into this function
> (see "What changed most recently" below). **Redeploy it**, same steps as
> before.

**Root cause of both the "always shows the same result" and "Ask AI only
returns podcasts" bugs:** Google shut down Gemini 1.0, 1.5, and 2.0 Flash
between early and mid-2026. Any Edge Function still pointed at one of those
retired model names has been returning 404 on every single call — silently,
since the frontend was written to treat any proxy failure as "fall back to
offline mode" rather than surface the error.

`supabase/functions/gemini-proxy/index.ts` is the fix: it tries a short chain
of currently-supported models (`gemini-3.5-flash` → `gemini-2.5-flash` →
`gemini-3.1-flash-lite`), only falling through to the next one on an actual
failure — so a future Google deprecation alone can't take this down again.

### What changed most recently

The AI Concierge's actual prompt — the instructions that shape its tone,
what it's allowed to recommend, how it structures its JSON reply — used to
be built as a plain string in `discover.js`, fully readable by anyone who
opened the browser's DevTools. It now lives in this function instead. The
browser sends only `{ mode: "discover", question, lang, country, age }`;
the function assembles the real prompt server-side. The main questionnaire's
match engine is unaffected — it still sends a pre-built `{ prompt }` directly,
which this function still accepts for backward compatibility.

### How to deploy

**Option A — Supabase CLI** (if you have it installed locally):
```bash
supabase functions deploy gemini-proxy --project-ref <your-project-ref>
```

**Option B — Dashboard** (no CLI needed):
1. Supabase Dashboard → **Edge Functions** → open (or create) `gemini-proxy`
2. Open `supabase/functions/gemini-proxy/index.ts` on GitHub, click **Raw**
3. Select all, copy, paste over the existing function code in the dashboard editor
4. Click **Deploy**

### Also verify the secret is set

The function reads `GEMINI_API_KEY` from the project's Edge Function secrets.
Dashboard → **Edge Functions** → **Manage secrets** → confirm `GEMINI_API_KEY`
exists and is a valid key from [Google AI Studio](https://aistudio.google.com/apikey).
If it's missing, the function now returns a clear `"GEMINI_API_KEY secret is
not set"` error instead of failing silently — check the Edge Function logs
in the dashboard if Ask AI still isn't working after deploying.

### Verify it worked

Ask a real question on `/discover.html` — you should get a natural-language
answer within a couple of seconds, not the offline-mode badge. The response
also includes a `_servedByModel` field if you want to confirm which model in
the chain actually answered (visible in the browser's Network tab).

---

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
