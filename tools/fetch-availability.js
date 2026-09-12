#!/usr/bin/env node
/* ============================================================
   Fetch real streaming availability from TMDB.

   Writes data/availability.json. Nothing else reads TMDB at build time, so
   this file is the single source of truth for every "where to watch" claim
   the site makes. If a title is absent from it, no availability page exists
   for that title — which is the point.

   WHY THIS RUNS IN CI AND NOT AT REQUEST TIME:
   availability changes slowly (weeks, not minutes) and the catalog is ~184
   titles. Fetching per visitor would mean thousands of identical API calls a
   day, a TMDB rate-limit problem and a slow page. A nightly job costs ~370
   calls and makes every page static.

   DATA HONESTY RULES, enforced here rather than trusted downstream:
     • Only providers TMDB actually returns are recorded.
     • Region is recorded with the data — availability is per-country and a
       page that omits the region is lying by omission.
     • A title TMDB cannot confidently match is skipped entirely rather than
       guessed at.
     • TMDB sources this from JustWatch and requires attribution; the page
       generator carries it.

   Requires: TMDB_API_KEY (a v3 API key) in the environment.
   Run: node tools/fetch-availability.js
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const API = 'https://api.themoviedb.org/3';
const KEY = process.env.TMDB_API_KEY;

// Regions to record. Brazil first — it is MatchApp's primary audience.
const REGIONS = ['BR', 'US', 'GB', 'PT'];

// TMDB asks for no more than ~50 requests/second; this is far below that and
// keeps us a good citizen on a free key.
const DELAY_MS = 120;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadCatalog() {
    const src = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
    const start = src.indexOf('const CONTENT_CATALOG');
    const end = src.indexOf('const VERTICAL_DRAMA_TITLES');
    const sandbox = {};
    new Function('exports', src.slice(start, end) + ';exports.C = CONTENT_CATALOG;')(sandbox);
    return sandbox.C;
}

async function tmdb(pathname) {
    const sep = pathname.includes('?') ? '&' : '?';
    const res = await fetch(`${API}${pathname}${sep}api_key=${KEY}`);
    if (!res.ok) return null;
    return res.json();
}

/* Only movies and scripted series have meaningful provider data. A YouTube
   channel, a podcast or a news feed does not "stream on Netflix" and asking
   TMDB about it returns noise at best. */
const ELIGIBLE = new Set(['movie', 'series', 'K-drama', 'anime', 'documentary', 'novela', 'telenovela']);
const isEligible = e => (e.cats || []).some(c => ELIGIBLE.has(c));

/* A match is only accepted when the normalised titles agree. TMDB's search is
   fuzzy and will happily return *something* for almost any string — accepting
   its first result unchecked is how a page ends up claiming the wrong film is
   on Netflix. */
const norm = s => String(s).toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

async function findId(entry) {
    const kind = (entry.cats || []).includes('movie') ? 'movie' : 'tv';
    const q = encodeURIComponent(entry.title);
    const yearParam = entry.year
        ? (kind === 'movie' ? `&primary_release_year=${entry.year}` : `&first_air_date_year=${entry.year}`)
        : '';
    const data = await tmdb(`/search/${kind}?query=${q}${yearParam}&include_adult=false`);
    if (!data || !data.results || !data.results.length) return null;

    const wanted = norm(entry.title);
    const hit = data.results.find(r => norm(r.title || r.name) === wanted);
    if (!hit) return null;                       // no confident match -> skip
    return { id: hit.id, kind, tmdbTitle: hit.title || hit.name };
}

async function getProviders(id, kind) {
    const data = await tmdb(`/${kind}/${id}/watch/providers`);
    if (!data || !data.results) return null;

    const out = {};
    for (const region of REGIONS) {
        const r = data.results[region];
        if (!r) continue;
        const pack = {};
        // flatrate = included with a subscription; rent/buy = transactional.
        // Kept separate because "on Netflix" and "£3.49 to rent" are very
        // different answers to "where can I watch this".
        if (r.flatrate && r.flatrate.length) pack.stream = r.flatrate.map(p => p.provider_name);
        if (r.rent && r.rent.length)         pack.rent   = r.rent.map(p => p.provider_name);
        if (r.buy && r.buy.length)           pack.buy    = r.buy.map(p => p.provider_name);
        if (r.link) pack.link = r.link;       // JustWatch deep link for the region
        if (Object.keys(pack).length) out[region] = pack;
    }
    return Object.keys(out).length ? out : null;
}

async function main() {
    if (!KEY) {
        console.error('TMDB_API_KEY is not set. Add it as a repository secret.');
        process.exit(1);
    }

    const catalog = loadCatalog().filter(isEligible);
    console.log(`${catalog.length} eligible titles (of ${loadCatalog().length} total)`);

    const availability = {};
    let matched = 0, withProviders = 0, skipped = 0;

    for (const entry of catalog) {
        try {
            const found = await findId(entry);
            await sleep(DELAY_MS);
            if (!found) { skipped++; continue; }
            matched++;

            const providers = await getProviders(found.id, found.kind);
            await sleep(DELAY_MS);
            if (!providers) continue;

            availability[entry.title] = {
                tmdbId: found.id,
                kind: found.kind,
                year: entry.year || null,
                regions: providers
            };
            withProviders++;
            console.log(`  ✓ ${entry.title} — ${Object.keys(providers).join(', ')}`);
        } catch (e) {
            console.log(`  ! ${entry.title}: ${e.message}`);
            skipped++;
        }
    }

    fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
    fs.writeFileSync(
        path.join(ROOT, 'data', 'availability.json'),
        JSON.stringify({ generated: new Date().toISOString(), source: 'TMDB / JustWatch', titles: availability }, null, 2)
    );

    console.log(`\nmatched: ${matched} | with provider data: ${withProviders} | skipped: ${skipped}`);
    console.log('-> data/availability.json');
}

main();
