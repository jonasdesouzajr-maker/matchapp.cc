/* ============================================================
   TASTE DNA

   Turns signals the app was already collecting and then discarding —
   Watch Later, Seen It, Loved It, Not For Me — into a readable taste
   profile, and feeds that profile back into matching.

   Two reasons this matters more than it looks:
     1. It compounds. The more you use MatchApp, the better it knows you,
        which is a real reason to keep using this one rather than starting
        over somewhere else.
     2. It's honest about itself. Confidence is shown openly and low-signal
        profiles say so instead of inventing a personality from two clicks.

   Depends on app.js for CONTENT_CATALOG.
   ============================================================ */

// Weights reflect how much each action really tells us. An explicit "Loved It"
// is a far stronger statement than "I've seen this", which may just mean it
// existed. Rejections count negatively and slightly harder than saves count
// positively, because people are more deliberate about refusing things.
const TASTE_WEIGHTS = {
    loved:    3.0,
    saved:    2.0,
    seen:     0.75,
    disliked: -2.5
};

// Below this, we don't pretend to know someone's taste.
const TASTE_MIN_SIGNALS = 4;

function tasteCatalogIndex() {
    const idx = {};
    if (typeof CONTENT_CATALOG === 'undefined') return idx;
    for (const e of CONTENT_CATALOG) idx[e.title] = e;
    return idx;
}

function tasteReadLists() {
    const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } };
    return {
        seen:     read('match_seenList', '[]'),
        saved:    read('match_savedList', '[]'),
        disliked: read('match_dislikedList', '[]'),
        ratings:  read('match_userRatings', '{}')
    };
}

/**
 * Builds the taste profile. Returns null when there simply isn't enough
 * signal — the caller shows an explanatory empty state rather than a
 * fabricated one.
 */
window.computeTasteDNA = function () {
    const idx = tasteCatalogIndex();
    const lists = tasteReadLists();

    const titleOf = (i) => (typeof i === 'string' ? i : (i && i.title));
    const scores = {};   // title -> weight

    const add = (item, w) => {
        const t = titleOf(item);
        if (!t) return;
        scores[t] = (scores[t] || 0) + w;
    };

    lists.saved.forEach(i => add(i, TASTE_WEIGHTS.saved));
    lists.seen.forEach(i => add(i, TASTE_WEIGHTS.seen));
    lists.disliked.forEach(i => add(i, TASTE_WEIGHTS.disliked));
    Object.keys(lists.ratings || {}).forEach(t => {
        const r = lists.ratings[t];
        if (r >= 4) add(t, TASTE_WEIGHTS.loved);
    });

    const titles = Object.keys(scores);
    // Only titles we actually have metadata for can tell us anything.
    const known = titles.filter(t => idx[t]);

    const totalSignals = lists.saved.length + lists.seen.length + lists.disliked.length;

    if (known.length < TASTE_MIN_SIGNALS) {
        return {
            ready: false,
            totalSignals,
            known: known.length,
            needed: TASTE_MIN_SIGNALS
        };
    }

    // Accumulate positive and negative weight per attribute.
    const bucket = { moods: {}, cats: {}, vibes: {}, platforms: {} };
    const tally = (obj, key, w) => { if (!key) return; obj[key] = (obj[key] || 0) + w; };

    for (const t of known) {
        const e = idx[t];
        const w = scores[t];
        (e.moods  || []).forEach(m => tally(bucket.moods, m, w));
        (e.cats   || []).forEach(c => tally(bucket.cats, c, w));
        (e.vibes  || []).forEach(v => tally(bucket.vibes, v, w));
        if (e.platform) tally(bucket.platforms, e.platform, w);
    }

    // Rank on positive weight only — "things you avoid" is reported separately
    // rather than polluting the profile with negatives.
    const rank = (obj) => Object.entries(obj)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]);

    const toPercent = (entries, take) => {
        const top = entries.slice(0, take);
        const sum = top.reduce((s, [, v]) => s + v, 0);
        if (sum <= 0) return [];
        return top.map(([k, v]) => ({ key: k, pct: Math.round((v / sum) * 100), weight: v }));
    };

    const moods = toPercent(rank(bucket.moods), 4);
    const cats = toPercent(rank(bucket.cats), 3);
    const vibes = toPercent(rank(bucket.vibes), 3);
    const platforms = toPercent(rank(bucket.platforms), 3);

    const avoids = Object.entries(bucket.moods)
        .filter(([, v]) => v < 0)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 2)
        .map(([k]) => k);

    // Confidence is a plain function of how much the user has actually told
    // us. Stated openly so the profile never looks more certain than it is.
    let confidence = 'Emerging';
    if (known >= 25 || known.length >= 25) confidence = 'Sharp';
    else if (known.length >= 12) confidence = 'Strong';
    else if (known.length >= 7) confidence = 'Building';

    return {
        ready: true,
        totalSignals,
        known: known.length,
        confidence,
        moods, cats, vibes, platforms, avoids,
        headline: tasteHeadline(moods, cats)
    };
};

// A short human label. Built from the two strongest signals rather than a
// generic template, so it reads like a description of a person.
function tasteHeadline(moods, cats) {
    const m = moods[0] && moods[0].key;
    const c = cats[0] && cats[0].key;
    if (!m && !c) return 'Open-minded viewer';

    const moodWord = {
        'intense and thrilling': 'Thrill-seeker',
        'light and feel-good': 'Feel-good seeker',
        'romantic': 'Romantic',
        'heartbreaking': 'Emotional watcher',
        'funny': 'Comedy lover',
        'scary': 'Horror fan',
        'mind-bending': 'Puzzle-solver',
        'inspiring': 'Optimist',
        'cozy comfort watch': 'Comfort viewer',
        'dark and gritty': 'Dark-side dweller',
        'epic and adventurous': 'Adventurer',
        'nostalgic': 'Nostalgic soul',
        'gospel and faith': 'Faith-led viewer'
    }[m] || 'Curious viewer';

    const catWord = {
        'movie': 'film',
        'series': 'series',
        'limited series': 'limited-series',
        'documentary': 'documentary',
        'anime': 'anime',
        'K-drama': 'K-drama',
        'novela brasileira': 'novela',
        'vertical micro-drama': 'micro-drama',
        'podcast': 'podcast',
        'YouTube channel': 'YouTube',
        'stand-up comedy special': 'stand-up'
    }[c];

    return catWord ? `${moodWord} · ${catWord} person` : moodWord;
}

/* ---------- Feed the profile back into matching ----------
   Only used to break ties. When the user has NOT specified a mood/category,
   we bias the pool toward what they've historically liked instead of picking
   uniformly at random. When they HAVE specified something, their explicit
   choice always wins — a taste profile should never override what someone
   just told you they want right now. */
window.tasteBiasPool = function (pool, cat, mood) {
    const dna = window.computeTasteDNA();
    if (!dna || !dna.ready || !Array.isArray(pool) || pool.length < 3) return pool;

    // Explicit choices are not up for negotiation.
    const useMood = (mood === 'any' || !mood);
    const useCat = (cat === 'any' || !cat);
    if (!useMood && !useCat) return pool;

    const moodScore = {};
    dna.moods.forEach((m, i) => { moodScore[m.key] = (dna.moods.length - i); });
    const catScore = {};
    dna.cats.forEach((c, i) => { catScore[c.key] = (dna.cats.length - i); });

    const scored = pool.map(e => {
        let s = 0;
        if (useMood) (e.moods || []).forEach(m => { s += moodScore[m] || 0; });
        if (useCat) (e.cats || []).forEach(c => { s += catScore[c] || 0; });
        return { e, s };
    });

    const best = Math.max(...scored.map(x => x.s));
    if (best <= 0) return pool; // nothing matched the profile — leave it alone

    // Keep the top tier but never collapse to a single title, or the same
    // pick would repeat endlessly and the app would feel stuck.
    const top = scored.filter(x => x.s >= best * 0.6).map(x => x.e);
    return top.length >= 2 ? top : pool;
};
