# matchapp.cc → matchapp.tv — 301 redirect setup

`.tv` is the primary, canonical, indexable domain.
`.cc` must become a permanent 301 redirect that preserves paths and query strings.

---

## Why this can't be done in this repository

This site is served by **GitHub Pages**, not Cloudflare Pages. Evidence: a `CNAME`
file (the GitHub Pages custom-domain mechanism) and no `wrangler.toml`,
`_redirects`, `_headers` or `functions/` directory anywhere in the repo.

GitHub Pages serves **one custom domain per repository** and has no redirect-rule
engine. There is no file you can commit here that produces a real HTTP 301 for a
second domain. It has to be done at the DNS/proxy layer, outside this repo.

**Do not** solve this with a second GitHub repo serving `<meta http-equiv="refresh">`.
That returns **HTTP 200**, not 301. Google treats it as a duplicate page rather
than a migration signal, which is the exact problem this migration exists to fix.

---

## Option A — Cloudflare free tier (recommended)

Gives a true 301 with path and query-string preservation, and costs nothing.

1. Create a free Cloudflare account and **Add a site** → `matchapp.cc`
2. Cloudflare shows two nameservers. Change the nameservers at whoever you bought
   `matchapp.cc` from to those two. Propagation is usually under an hour.
3. Once Cloudflare shows the zone as **Active**, add a placeholder DNS record so
   there is something to proxy:
   - Type `A`, Name `@`, IPv4 `192.0.2.1`, **Proxy status: Proxied** (orange cloud)
   - Type `CNAME`, Name `www`, Target `matchapp.cc`, **Proxied**

   `192.0.2.1` is a reserved documentation address that never serves anything.
   That is intentional — the redirect rule below fires before the origin is ever
   contacted, so no real server is needed.

4. Go to **Rules → Redirect Rules → Create rule**
   - Name: `cc to tv permanent`
   - If: **Hostname** `equals` `matchapp.cc` — then add a second condition with
     **Or**: **Hostname** `equals` `www.matchapp.cc`
   - Then: **Dynamic redirect**
   - Expression:
     ```
     concat("https://matchapp.tv", http.request.uri.path)
     ```
   - **Preserve query string: ON**
   - **Status code: 301**
5. Deploy the rule.

`http.request.uri.path` is what preserves deep links, so
`matchapp.cc/discover.html` lands on `matchapp.tv/discover.html` rather than the
homepage. The separate query-string toggle keeps `?lang=pt-BR` and
`?checkout=success` intact.

---

## Option B — Registrar forwarding

Many registrars offer built-in forwarding. If yours does, set:

- Forward `matchapp.cc` → `https://matchapp.tv`
- Type: **Permanent (301)** — not 302/temporary
- **Path forwarding / wildcard: ON** (wording varies)

Simpler, but confirm two things before relying on it: that it issues a genuine
301, and that it forwards paths rather than dumping everything on the homepage.
Some registrars quietly do neither.

---

## Verify before telling Google

```bash
curl -I https://matchapp.cc/
# want: HTTP/1.1 301 … Location: https://matchapp.tv/

curl -I https://matchapp.cc/discover.html
# want: Location: https://matchapp.tv/discover.html   (path preserved)

curl -I "https://matchapp.cc/?lang=pt-BR"
# want: Location: https://matchapp.tv/?lang=pt-BR      (query preserved)

curl -I https://matchapp.tv/
# want: HTTP/1.1 200 — and NOT a redirect back to .cc
```

That last check matters: a rule that matches too broadly can send `.tv` back to
`.cc` and create an infinite loop that takes the whole site down.

---

## Order of operations

1. Confirm `https://matchapp.tv` serves the app over valid HTTPS
2. Set up the redirect (Option A or B)
3. Run all four `curl` checks above
4. **Only then** — Google Search Console → add and verify `matchapp.tv`, submit
   `https://matchapp.tv/sitemap.xml`, then run **Change of Address** from `.cc`
5. Keep the `.cc` Search Console property for at least 6 months. Google needs the
   old property alive to process the move, and the 301 should stay up
   indefinitely — old inbound links never fully disappear.

---

## Don't change the support mailbox yet

`support@matchapp.cc` is still used across the site and in the Stripe fallback
flows. It is left alone deliberately: switching it before a
`support@matchapp.tv` mailbox actually exists and is monitored would bounce real
customer emails, including people trying to pay. Once the `.tv` mailbox is live,
that swap is a one-line find-and-replace.
