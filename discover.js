/* ============================================================
   MatchApp — AI NATURAL-LANGUAGE DISCOVERY
   Powers discover.html. Takes a plain-language question such as
   "Is there a TV show about Medecins Sans Frontieres?" and returns
   a ranked list of real titles with covers, synopses and links.

   Falls back to the keyless iTunes catalog if the AI proxy is
   unavailable, so the page never comes back empty.
   ============================================================ */

const DISCOVER_MAX = 12;

function getQueryParam(name) {
    try { return new URLSearchParams(window.location.search).get(name) || ''; }
    catch (e) { return ''; }
}

/* ---------- AI list generation ---------- */
async function askAIForList(question) {
    if (!window.supabaseClient) throw new Error('No backend');

    const country = localStorage.getItem('match_user_country') || '';
    const age = localStorage.getItem('match_user_age') || '';
    let personal = '';
    if (country) personal += ` Viewer is in ${country}; prefer titles streamable there.`;
    if (age) personal += ` Viewer is ${age} years old; keep results age-appropriate.`;

    const prompt = `A user asked: "${question}". Identify real, existing movies, TV series, documentaries, ` +
        `K-dramas, anime, telenovelas, podcasts or albums that genuinely answer this question.${personal} ` +
        `Return between 3 and ${DISCOVER_MAX} results, best match first. ` +
        `If the question names an organisation, event, person or topic, include titles genuinely about that subject. ` +
        `Output valid JSON ONLY, no markdown: ` +
        `{"answer":"One sentence answering the question directly.","results":[{"title":"Exact Title","year":"YYYY","type":"movie|series|documentary|podcast","platform":"Where to watch","synopsis":"Two sentences."}]}`;

    const { data, error } = await window.supabaseClient.functions.invoke('gemini-proxy', { body: { prompt } });
    if (error || !data || !data.candidates) throw new Error('AI unavailable');

    const raw = data.candidates[0].content.parts[0].text;
    const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('Bad AI format');
    const parsed = JSON.parse(raw.substring(s, e + 1));
    if (!parsed.results || !parsed.results.length) throw new Error('Empty AI list');
    return parsed;
}

/* ---------- Keyless fallback ---------- */
function stripQuestionWords(q) {
    return q.replace(/^(is|are|was|were|does|do|did|can|could|what|which|who|where|when|why|how|show me|find me|any|there)\b/gi, ' ')
            .replace(/\b(a|an|the|about|on|for|with|tv|show|shows|series|movie|movies|film|films|please|me)\b/gi, ' ')
            .replace(/[?!.,]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
}

async function fallbackSearch(question) {
    const term = stripQuestionWords(question) || question;
    const out = [];
    for (const media of ['movie', 'tvShow', 'podcast']) {
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=${media}&limit=6`);
            if (!res.ok) continue;
            const data = await res.json();
            (data.results || []).forEach(r => {
                const title = r.trackName || r.collectionName;
                if (!title || out.some(o => o.title === title)) return;
                out.push({
                    title,
                    year: r.releaseDate ? String(r.releaseDate).substring(0, 4) : '',
                    type: media === 'tvShow' ? 'series' : (media === 'podcast' ? 'podcast' : 'movie'),
                    platform: 'any',
                    synopsis: r.longDescription || r.shortDescription || `${r.primaryGenreName || ''}${r.artistName ? ' — ' + r.artistName : ''}`.trim(),
                    _meta: {
                        artwork: (r.artworkUrl100 || '').replace('100x100bb', '600x900bb'),
                        preview: r.previewUrl || null,
                        storeUrl: r.trackViewUrl || r.collectionViewUrl || null
                    }
                });
            });
        } catch (e) { /* try next media type */ }
    }
    return { answer: out.length
        ? `Here's what we found matching "${question}".`
        : `We couldn't find a confident match for "${question}". Try rephrasing with a title, topic or person.`,
        results: out.slice(0, DISCOVER_MAX) };
}

/* ---------- Rendering ---------- */
function discoverCardHTML(item, idx) {
    const title = item.title;
    const safe = title.replace(/"/g, '&quot;');
    const meta = [item.year, item.type].filter(Boolean).join(' · ');
    return `
    <article class="discover-card" style="animation-delay:${idx * 70}ms">
        <div class="discover-poster">
            <img id="dp-${idx}" src="" alt="${safe}" loading="lazy">
            <div class="discover-rank">#${idx + 1}</div>
        </div>
        <div class="discover-body">
            <h3>${safe}</h3>
            ${meta ? `<div class="discover-meta">${meta}</div>` : ''}
            <p>${(item.synopsis || '').replace(/</g, '&lt;')}</p>
            <div class="discover-actions">
                <a id="dl-${idx}" class="gold-btn discover-play" href="#" target="_blank" rel="noopener">▶ Watch / Listen</a>
                <button class="discover-save" onclick="saveDiscoverItem(${idx})" id="ds-${idx}">⭐ Save</button>
            </div>
        </div>
    </article>`;
}

let DISCOVER_ITEMS = [];

async function hydrateDiscoverCard(item, idx) {
    const img = document.getElementById('dp-' + idx);
    const link = document.getElementById('dl-' + idx);
    if (!img) return;

    // Instant local placeholder so nothing renders blank.
    img.src = (typeof generateLocalPosterSVG === 'function')
        ? generateLocalPosterSVG(item.title)
        : '';

    let meta = item._meta || null;
    if (!meta && typeof getRichMetadata === 'function') {
        meta = await getRichMetadata(item.title, item.type || '');
    }
    if (meta && meta.artwork) {
        img.onerror = function () {
            this.onerror = null;
            if (typeof generateLocalPosterSVG === 'function') this.src = generateLocalPosterSVG(item.title);
        };
        img.src = meta.artwork;
    }
    item._resolved = meta;

    if (link) {
        const isAudio = /podcast|album|music/i.test(item.type || '');
        let url;
        if (typeof platformSearchUrl === 'function' && item.platform && item.platform !== 'any' &&
            typeof PLATFORMS !== 'undefined' && PLATFORMS[item.platform]) {
            url = platformSearchUrl(item.platform, item.title);
        } else if (isAudio) {
            url = `https://open.spotify.com/search/${encodeURIComponent(item.title)}`;
        } else {
            url = `https://www.justwatch.com/us/search?q=${encodeURIComponent(item.title)}`;
        }
        link.href = url;
        link.textContent = isAudio ? '🎧 Listen' : '▶ Watch Now';
        item._url = url;
    }
}

window.saveDiscoverItem = function (idx) {
    const item = DISCOVER_ITEMS[idx];
    if (!item) return;
    let list = [];
    try { list = JSON.parse(localStorage.getItem('match_savedList') || '[]'); } catch (e) {}
    if (list.some(i => (i.title || i) === item.title)) {
        if (window.showToast) showToast(`"${item.title}" is already saved.`);
        return;
    }
    list.unshift({
        title: item.title,
        posterUrl: (item._resolved && item._resolved.artwork) || '',
        platform: item.platform && item.platform !== 'any' ? item.platform : '',
        streamUrl: item._url || '',
        isAudio: /podcast|album|music/i.test(item.type || ''),
        addedAt: Date.now()
    });
    localStorage.setItem('match_savedList', JSON.stringify(list));
    const btn = document.getElementById('ds-' + idx);
    if (btn) { btn.textContent = '✓ Saved'; btn.classList.add('saved'); }
    if (window.showToast) showToast(`⭐ Saved "${item.title}" to Watch Later`);
};

/* ---------- Boot ---------- */
async function runDiscovery() {
    const q = getQueryParam('q').trim();
    const qEcho = document.getElementById('discover-query');
    const answerEl = document.getElementById('discover-answer');
    const gridEl = document.getElementById('discover-grid');
    const loadEl = document.getElementById('discover-loading');
    const emptyEl = document.getElementById('discover-empty');

    if (qEcho) qEcho.textContent = q ? `“${q}”` : '';
    if (!q) {
        if (loadEl) loadEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }
    document.title = `${q} — MatchApp AI Search`;

    // Discovery consumes a match from the daily allowance, same as a normal match.
    if (typeof checkDailyLimit === 'function' && !(await checkDailyLimit())) {
        if (loadEl) loadEl.style.display = 'none';
        return;
    }

    let payload, source = 'ai';
    try { payload = await askAIForList(q); }
    catch (e) { payload = await fallbackSearch(q); source = 'fallback'; }

    // The questions people ask here are free keyword research — track them.
    if (typeof gtag === 'function') {
        gtag('event', 'ai_search', {
            search_term: q,
            source: source,
            results: (payload.results || []).length
        });
    }

    if (loadEl) loadEl.style.display = 'none';

    DISCOVER_ITEMS = payload.results || [];
    if (answerEl && payload.answer) {
        answerEl.textContent = payload.answer;
        answerEl.style.display = 'block';
    }
    if (!DISCOVER_ITEMS.length) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }
    if (gridEl) {
        gridEl.innerHTML = DISCOVER_ITEMS.map((it, i) => discoverCardHTML(it, i)).join('');
        gridEl.style.display = 'grid';
    }
    // Hydrate covers in parallel so the grid fills fast.
    await Promise.all(DISCOVER_ITEMS.map((it, i) => hydrateDiscoverCard(it, i)));
}

window.newDiscoverSearch = function () {
    const el = document.getElementById('discover-new-input');
    if (el && el.value.trim()) {
        window.location.href = '/discover.html?q=' + encodeURIComponent(el.value.trim());
    }
};

document.addEventListener('DOMContentLoaded', () => { setTimeout(runDiscovery, 350); });
