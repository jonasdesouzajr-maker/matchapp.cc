/* ============================================================
   © 2026 MatchApp.cc — All Rights Reserved.
   Proprietary source code. Not licensed for reproduction, scraping,
   or reuse in competing products. See /terms.html Section 4.
   ============================================================ */

/* ============================================================
   MatchApp — AI NATURAL-LANGUAGE DISCOVERY
   Powers discover.html. Takes a plain-language question such as
   "Is there a TV show about Medecins Sans Frontieres?" and returns
   a real conversational answer (spoken and written) plus a ranked
   list of matching titles.

   BUG FIX (podcast-only results): the previous fallback searched
   movie + tvShow + podcast media for every question, unconditionally.
   iTunes' podcast search is far looser than its movie/show search —
   almost any phrase returns dozens of podcasts, while offbeat movie
   questions often return zero — so after filtering, results were
   frequently 100% podcasts regardless of what was asked. This
   version detects whether the question is actually about audio
   content before ever touching the podcast/music catalogs.

   Falls back to the keyless iTunes catalog if the AI proxy is
   unavailable, so the page never comes back empty — but the
   fallback is now honestly labelled as offline mode rather than
   presented as if it were the full conversational AI.
   ============================================================ */

const DISCOVER_MAX = 12;

function getQueryParam(name) {
    try { return new URLSearchParams(window.location.search).get(name) || ''; }
    catch (e) { return ''; }
}

/* ---------- Intent detection ---------- */
// Decides whether the question is actually about audio (podcasts, music,
// playlists, singles, audiobooks) so the fallback never pulls in podcasts
// for a question about a movie. (The AI Concierge path does its own,
// identical intent check server-side, in the Edge Function.)
function detectAudioIntent(q) {
    return /\b(podcast|playlist|song|songs|music|album|albums|single|singles|audiobook|spotify|listen|radio show)\b/i.test(q);
}

/* ---------- AI conversational answer ---------- */
async function askAIConversational(question) {
    if (!window.supabaseClient) throw new Error('No backend');

    // The actual prompt engineering — how the AI Concierge is instructed to
    // behave, what tone to use, how it structures its answer — now lives in
    // the gemini-proxy Edge Function, not here. This client only sends the
    // question and the context needed to personalize it; the server builds
    // the real prompt. (Previously the full prompt text was assembled in
    // this file, which meant anyone opening DevTools could read MatchApp's
    // exact AI instructions verbatim.)
    const country = localStorage.getItem('match_user_country') || '';
    const age = localStorage.getItem('match_user_age') || '';

    const { data, error } = await window.supabaseClient.functions.invoke('gemini-proxy', {
        body: { mode: 'discover', question, lang: window.MATCH_LANG || 'en', country, age }
    });
    if (error || !data) throw new Error('AI unavailable');
    if (data.error) throw new Error(data.error);
    if (!data.candidates || !data.candidates[0]) throw new Error('AI unavailable');

    const raw = data.candidates[0].content.parts[0].text;
    const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('Bad AI format');
    const parsed = JSON.parse(raw.substring(s, e + 1));
    if (!parsed.answer) throw new Error('Empty AI answer');
    parsed.results = parsed.results || [];
    parsed._live = true;
    return parsed;
}

/* ---------- Keyless fallback (intent-aware — the actual bug fix) ---------- */
function stripQuestionWords(q) {
    return q.replace(/^(is|are|was|were|does|do|did|can|could|what|which|who|where|when|why|how|show me|find me|any|there)\b/gi, ' ')
            .replace(/\b(a|an|the|about|on|for|with|tv|show|shows|series|movie|movies|film|films|please|me)\b/gi, ' ')
            .replace(/[?!.,]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
}

async function fallbackSearch(question) {
    const term = stripQuestionWords(question) || question;
    const audioIntent = detectAudioIntent(question);
    // Only the media types that actually match intent are searched — this is
    // the fix for the "only podcasts" bug. A question about a movie will
    // never touch the podcast catalog at all now.
    const mediaTypes = audioIntent ? ['podcast', 'musicTrack'] : ['movie', 'tvShow'];

    const out = [];
    for (const media of mediaTypes) {
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=${media}&limit=8`);
            if (!res.ok) continue;
            const data = await res.json();
            (data.results || []).forEach(r => {
                const title = r.trackName || r.collectionName;
                if (!title || out.some(o => o.title === title)) return;
                out.push({
                    title,
                    year: r.releaseDate ? String(r.releaseDate).substring(0, 4) : '',
                    type: media === 'tvShow' ? 'series' : (media === 'podcast' ? 'podcast' : (media === 'musicTrack' ? 'music' : 'movie')),
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

    const offlineNote = (typeof t === 'function') ? t('discover.offlineNote') : "Our AI concierge is temporarily offline, so here's what our catalog found for you:";
    const noResults = (typeof t === 'function') ? t('discover.noResults') : `We couldn't find a confident match for "${question}". Try rephrasing with a title, topic or person.`;

    return {
        answer: out.length ? `${offlineNote} “${question}”` : noResults,
        results: out.slice(0, DISCOVER_MAX),
        _live: false
    };
}

/* ---------- Typewriter reveal ---------- */
// Makes the answer feel spoken/written by a person rather than dumped on
// screen — mirrors how the loading meter narration already behaves.
function typewriterReveal(el, text, speedMs) {
    return new Promise(resolve => {
        el.textContent = '';
        el.style.display = 'block';
        let i = 0;
        const step = () => {
            if (i <= text.length) {
                el.textContent = text.slice(0, i);
                i += Math.max(1, Math.round(text.length / 90)); // scales with length, feels natural either way
                setTimeout(step, speedMs);
            } else {
                el.textContent = text;
                resolve();
            }
        };
        step();
    });
}

/* ---------- Text-to-speech ("read aloud") ---------- */
// Fully client-side via the Web Speech API — no backend needed. Voice and
// speed come from the user's Profile > Voice & AI settings (localStorage),
// with a sensible default matched to the current UI language.
function pickVoiceForLang(voices, lang) {
    const saved = localStorage.getItem('match_voice_name');
    if (saved) {
        const exact = voices.find(v => v.name === saved);
        if (exact) return exact;
    }
    const bcp = { 'pt-BR': 'pt-BR', 'zh': 'zh-CN' }[lang] || lang;
    return voices.find(v => v.lang && v.lang.toLowerCase().startsWith(bcp.toLowerCase()))
        || voices.find(v => v.lang && v.lang.toLowerCase().startsWith((bcp.split('-')[0] || 'en')))
        || voices.find(v => v.default)
        || voices[0] || null;
}

window.readAloud = function(text, btn) {
    if (!('speechSynthesis' in window)) {
        if (window.showToast) showToast((typeof t === 'function' ? t('discover.noTts') : 'Voice playback is not supported in this browser.'), true);
        return;
    }
    // Toggle off if this button is already speaking.
    if (btn && btn.classList.contains('speaking')) {
        speechSynthesis.cancel();
        btn.classList.remove('speaking');
        return;
    }
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    const voice = pickVoiceForLang(voices, window.MATCH_LANG || 'en');
    if (voice) { utter.voice = voice; utter.lang = voice.lang; }
    else { utter.lang = window.MATCH_LANG || 'en'; }
    utter.rate = parseFloat(localStorage.getItem('match_voice_rate') || '1');
    utter.pitch = 1;

    document.querySelectorAll('.discover-speak.speaking').forEach(b => b.classList.remove('speaking'));
    if (btn) btn.classList.add('speaking');
    utter.onend = () => { if (btn) btn.classList.remove('speaking'); };
    utter.onerror = () => { if (btn) btn.classList.remove('speaking'); };
    speechSynthesis.speak(utter);
};

/* ---------- Rendering ---------- */
function discoverCardHTML(item, idx) {
    const title = item.title;
    const safe = title.replace(/"/g, '&quot;');
    const meta = [item.year, item.type].filter(Boolean).join(' · ');
    const watchLabel = (typeof t === 'function') ? t('res.streamnow') : '▶ Watch / Listen';
    const saveLabel = (typeof t === 'function') ? t('discover.save') : '⭐ Save';
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
                <a id="dl-${idx}" class="gold-btn discover-play" href="#" target="_blank" rel="noopener">${watchLabel}</a>
                <button class="discover-save" onclick="saveDiscoverItem(${idx})" id="ds-${idx}">${saveLabel}</button>
            </div>
        </div>
    </article>`;
}

let DISCOVER_ITEMS = [];

async function hydrateDiscoverCard(item, idx) {
    const img = document.getElementById('dp-' + idx);
    const link = document.getElementById('dl-' + idx);
    if (!img) return;

    img.src = (typeof generateLocalPosterSVG === 'function') ? generateLocalPosterSVG(item.title) : '';

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
        link.textContent = isAudio ? (typeof t === 'function' ? t('res.listennow') : '🎧 Listen') : (typeof t === 'function' ? t('discover.watchNow') : '▶ Watch Now');
        item._url = url;
    }
}

window.saveDiscoverItem = function (idx) {
    const item = DISCOVER_ITEMS[idx];
    if (!item) return;
    let list = [];
    try { list = JSON.parse(localStorage.getItem('match_savedList') || '[]'); } catch (e) {}
    if (list.some(i => (i.title || i) === item.title)) {
        if (window.showToast) showToast(`"${item.title}" ${typeof t === 'function' ? t('discover.alreadySaved') : 'is already saved.'}`);
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
    if (btn) { btn.textContent = '✓'; btn.classList.add('saved'); }
    if (window.showToast) showToast(`⭐ "${item.title}" ${typeof t === 'function' ? t('discover.savedToast') : 'saved to Watch Later'}`);
};

/* ---------- Boot ---------- */
async function runDiscovery() {
    const q = getQueryParam('q').trim();
    const qEcho = document.getElementById('discover-query');
    const answerEl = document.getElementById('discover-answer');
    const answerWrap = document.getElementById('discover-answer-wrap');
    const speakBtn = document.getElementById('discover-speak-btn');
    const offlineBadge = document.getElementById('discover-offline-badge');
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
    try { payload = await askAIConversational(q); }
    catch (e) { payload = await fallbackSearch(q); source = 'fallback'; }

    if (typeof gtag === 'function') {
        gtag('event', 'ai_search', { search_term: q, source: source, results: (payload.results || []).length });
    }

    if (loadEl) loadEl.style.display = 'none';

    DISCOVER_ITEMS = payload.results || [];

    if (offlineBadge) offlineBadge.style.display = payload._live ? 'none' : 'inline-flex';

    if (answerEl && payload.answer) {
        if (answerWrap) answerWrap.style.display = 'block';
        await typewriterReveal(answerEl, payload.answer, 14);
        if (speakBtn) {
            speakBtn.style.display = 'inline-flex';
            speakBtn.onclick = () => window.readAloud(payload.answer, speakBtn);
            // Respect the user's "always read aloud" preference from profile settings.
            if (localStorage.getItem('match_voice_autoread') === 'true') {
                window.readAloud(payload.answer, speakBtn);
            }
        }
    }

    if (!DISCOVER_ITEMS.length) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }
    if (gridEl) {
        gridEl.innerHTML = DISCOVER_ITEMS.map((it, i) => discoverCardHTML(it, i)).join('');
        gridEl.style.display = 'grid';
    }
    await Promise.all(DISCOVER_ITEMS.map((it, i) => hydrateDiscoverCard(it, i)));
}

window.newDiscoverSearch = function () {
    const el = document.getElementById('discover-new-input');
    if (el && el.value.trim()) {
        window.location.href = '/discover.html?q=' + encodeURIComponent(el.value.trim());
    }
};

document.addEventListener('DOMContentLoaded', () => { setTimeout(runDiscovery, 350); });