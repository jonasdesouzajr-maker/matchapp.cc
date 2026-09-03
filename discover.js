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

// Builds the same prompt the Edge Function builds, used ONLY as a compatibility
// fallback when the deployed function is an older version that doesn't yet
// understand mode:'discover'. Keeping this here means Ask AI works whether or
// not the latest Edge Function has been redeployed.
function buildLegacyDiscoverPrompt(question, langName, country, age) {
    const audioIntent = detectAudioIntent(question);
    let personal = '';
    if (country) personal += ` The viewer is in ${country}; prefer titles genuinely available there.`;
    if (age) personal += ` The viewer is ${age} years old; keep suggestions age-appropriate.`;

    return `You are the friendly, knowledgeable AI concierge inside MatchApp, a streaming discovery app. ` +
        `A user just asked you: "${question}"\n\n` +
        `Respond exactly like a real, warm, well-informed person would in a chat — not a search engine. ` +
        `Write 2-4 natural sentences that directly answer what they asked, using your own knowledge of movies, ` +
        `TV series, documentaries, K-dramas, anime, telenovelas, podcasts, music and audiobooks. ` +
        `Be specific and genuinely helpful, the way you'd explain it to a friend.${personal}\n\n` +
        (audioIntent
            ? `This question is about audio content (podcasts, music, playlists, or audiobooks) — only suggest audio titles.`
            : `This question is about something to watch — only suggest movies, series, documentaries or similar visual titles, not podcasts or music, unless the user explicitly asked for audio.`) +
        `\n\nCRITICAL: Write your "answer" field in ${langName}, matching the language the user asked in. ` +
        `Then list 3 to ${DISCOVER_MAX} real, existing titles that back up your answer, best match first. ` +
        `Output valid JSON ONLY, no markdown fences, no text outside the JSON: ` +
        `{"answer":"Your natural 2-4 sentence conversational reply in ${langName}.","results":[{"title":"Exact Title","year":"YYYY","type":"movie|series|documentary|podcast|music","platform":"Where to watch or listen","synopsis":"One or two sentences, in ${langName}."}]}`;
}

const LANG_NAMES_DISCOVER = {
    'en': 'English', 'pt-BR': 'Brazilian Portuguese', 'es': 'Spanish', 'fr': 'French',
    'de': 'German', 'it': 'Italian', 'tr': 'Turkish', 'ru': 'Russian', 'ar': 'Arabic',
    'hi': 'Hindi', 'id': 'Indonesian', 'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese'
};

function parseAIResponse(data) {
    if (!data) throw new Error('AI unavailable');
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

async function askAIConversational(question, history) {
    if (!window.supabaseClient) throw new Error('No backend');

    // The prompt engineering lives in the gemini-proxy Edge Function, so the
    // client normally just sends structured params. But if that function
    // hasn't been redeployed yet, it returns a 400 for mode:'discover' —
    // which used to cascade into the useless keyword-search fallback and the
    // "couldn't find a confident match" message. We now detect that and retry
    // with the legacy {prompt} shape, which every deployed version accepts.
    const country = localStorage.getItem('match_user_country') || '';
    const age = localStorage.getItem('match_user_age') || '';
    const lang = window.MATCH_LANG || 'en';

    // Attempt 1 — current contract (server-side prompt building).
    let firstError = null;
    try {
        const { data, error } = await window.supabaseClient.functions.invoke('gemini-proxy', {
            body: { mode: 'discover', question, lang, country, age, history: history || [] }
        });
        if (!error && data && !data.error) return parseAIResponse(data);
        firstError = (error && error.message) || (data && data.error) || 'unknown';
    } catch (e) { firstError = e.message || String(e); }

    console.warn('[MatchApp AI] discover-mode attempt failed:', firstError,
        '\n→ Retrying with the legacy prompt format (this is expected if the Edge Function has not been redeployed).');

    // Attempt 2 — legacy contract, for an Edge Function that predates mode:'discover'.
    const langName = LANG_NAMES_DISCOVER[lang] || 'English';
    let prompt = buildLegacyDiscoverPrompt(question, langName, country, age);

    // Carry prior turns so follow-up questions stay in context.
    if (history && history.length) {
        const transcript = history.map(h => `${h.role === 'user' ? 'User' : 'You'}: ${h.text}`).join('\n');
        prompt = `Here is the conversation so far:\n${transcript}\n\n${prompt}\n\n` +
            `IMPORTANT: This is a follow-up in an ongoing conversation. Take the earlier turns into account ` +
            `and do not repeat titles you already recommended above unless the user asks about them specifically.`;
    }

    const { data, error } = await window.supabaseClient.functions.invoke('gemini-proxy', { body: { prompt } });
    if (error) {
        const detail = error.message || String(error);
        console.error('[MatchApp AI] Both attempts failed. Legacy attempt error:', detail,
            '\n→ Run the diagnostic to see exactly why: open /ai-check.html on this site.');
        throw new Error('AI unavailable: ' + detail);
    }
    if (data && data.error) {
        console.error('[MatchApp AI] Edge Function returned an error:', data.error, data.detail || '',
            '\n→ Run the diagnostic: open /ai-check.html on this site.');
        throw new Error('AI unavailable: ' + data.error);
    }
    return parseAIResponse(data);
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
/* ============================================================
   CONVERSATIONAL CHAT ENGINE
   Ask AI is now a real multi-turn conversation rather than a
   one-shot search. Each thread is saved to localStorage so a user
   can come back and keep going, and each *turn* consumes one from
   the daily allowance (3 free / 5 registered+complete profile /
   10 VIP) — the same accounting the match engine uses.
   ============================================================ */

const CHAT_STORE_KEY = 'match_chatThreads';
const CHAT_MAX_THREADS = 20;

let currentThread = null;   // { id, title, turns: [{role, text, results, ts}], createdAt, updatedAt }

function loadThreads() {
    try { return JSON.parse(localStorage.getItem(CHAT_STORE_KEY) || '[]'); }
    catch (e) { return []; }
}
function saveThreads(threads) {
    try {
        localStorage.setItem(CHAT_STORE_KEY, JSON.stringify(threads.slice(0, CHAT_MAX_THREADS)));
    } catch (e) { /* quota exceeded — non-fatal, chat still works this session */ }
}
function persistCurrentThread() {
    if (!currentThread || !currentThread.turns.length) return;
    const threads = loadThreads().filter(t => t.id !== currentThread.id);
    threads.unshift(currentThread);
    saveThreads(threads);
    renderThreadList();
}
function newThreadId() { return 't' + Date.now() + Math.random().toString(36).slice(2, 7); }

window.startNewChat = function () {
    currentThread = null;
    const log = document.getElementById('chat-log');
    if (log) log.innerHTML = '';
    const empty = document.getElementById('discover-empty');
    if (empty) empty.style.display = 'none';
    const input = document.getElementById('discover-new-input');
    if (input) { input.value = ''; input.focus(); }
    history.replaceState(null, '', '/discover.html');
    document.title = 'Talk to Our AI Concierge — MatchApp';
    renderThreadList();
};

window.openThread = function (id) {
    const t = loadThreads().find(x => x.id === id);
    if (!t) return;
    currentThread = t;
    const log = document.getElementById('chat-log');
    if (log) log.innerHTML = '';
    DISCOVER_ITEMS = [];
    t.turns.forEach(turn => {
        if (turn.role === 'user') appendUserBubble(turn.text);
        else appendAssistantBubble(turn.text, turn.results || [], { instant: true });
    });
    renderThreadList();
    const log2 = document.getElementById('chat-log');
    if (log2) log2.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.deleteThread = function (id, ev) {
    if (ev) ev.stopPropagation();
    saveThreads(loadThreads().filter(t => t.id !== id));
    if (currentThread && currentThread.id === id) window.startNewChat();
    else renderThreadList();
};

function renderThreadList() {
    const host = document.getElementById('chat-history-list');
    if (!host) return;
    const threads = loadThreads();
    if (!threads.length) {
        host.innerHTML = `<p class="chat-history-empty">${typeof t === 'function' ? t('chat.noHistory') : 'No saved conversations yet.'}</p>`;
        return;
    }
    host.innerHTML = threads.map(th => `
        <div class="chat-thread-item ${currentThread && currentThread.id === th.id ? 'active' : ''}" onclick="openThread('${th.id}')">
            <span class="chat-thread-title">${(th.title || 'Conversation').replace(/</g, '&lt;').slice(0, 60)}</span>
            <button class="chat-thread-del" onclick="deleteThread('${th.id}', event)" aria-label="Delete conversation">✕</button>
        </div>`).join('');
}

/* ---------- Bubble rendering ---------- */
function appendUserBubble(text) {
    const log = document.getElementById('chat-log');
    if (!log) return;
    const div = document.createElement('div');
    div.className = 'chat-bubble chat-user';
    div.textContent = text;
    log.appendChild(div);
    return div;
}

function appendAssistantBubble(text, results, opts) {
    const log = document.getElementById('chat-log');
    if (!log) return null;
    const wrap = document.createElement('div');
    wrap.className = 'chat-bubble chat-assistant';

    const row = document.createElement('div');
    row.className = 'chat-answer-row';
    const p = document.createElement('p');
    p.className = 'chat-answer-text';
    row.appendChild(p);

    const speak = document.createElement('button');
    speak.className = 'discover-speak';
    speak.title = 'Read aloud';
    speak.setAttribute('aria-label', 'Read answer aloud');
    speak.textContent = '🔊';
    speak.onclick = () => window.readAloud(text, speak);
    row.appendChild(speak);

    wrap.appendChild(row);

    const grid = document.createElement('div');
    grid.className = 'chat-results-grid';
    wrap.appendChild(grid);

    log.appendChild(wrap);

    if (opts && opts.instant) p.textContent = text;
    return { wrap, textEl: p, grid, speakBtn: speak };
}

async function renderResultsInto(grid, items, baseIndex) {
    if (!items || !items.length) return;
    grid.innerHTML = items.map((it, i) => discoverCardHTML(it, baseIndex + i)).join('');
    grid.style.display = 'grid';
    await Promise.all(items.map((it, i) => hydrateDiscoverCard(it, baseIndex + i)));
}

/* ---------- The main ask flow ---------- */
async function askAndRender(question) {
    if (!question || !question.trim()) return;
    question = question.trim();

    const loadEl = document.getElementById('discover-loading');
    const emptyEl = document.getElementById('discover-empty');
    if (emptyEl) emptyEl.style.display = 'none';

    // Every turn costs one from the daily allowance, same as a match.
    if (typeof checkDailyLimit === 'function' && !(await checkDailyLimit())) {
        return;
    }

    if (!currentThread) {
        currentThread = { id: newThreadId(), title: question.slice(0, 60), turns: [], createdAt: Date.now(), updatedAt: Date.now() };
    }

    appendUserBubble(question);
    currentThread.turns.push({ role: 'user', text: question, ts: Date.now() });

    // Auto-scroll to the loading animation so the user sees work happening.
    if (loadEl) {
        loadEl.style.display = 'block';
        setTimeout(() => loadEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    }

    const input = document.getElementById('discover-new-input');
    if (input) input.value = '';

    // Pass prior turns so follow-ups keep context.
    const history = currentThread.turns
        .slice(0, -1)
        .map(t => ({ role: t.role, text: t.text }));

    let payload, source = 'ai';
    try { payload = await askAIConversational(question, history); }
    catch (e) { payload = await fallbackSearch(question); source = 'fallback'; }

    if (typeof gtag === 'function') {
        gtag('event', 'ai_search', { search_term: question, source: source, results: (payload.results || []).length });
    }

    if (loadEl) loadEl.style.display = 'none';

    const offlineBadge = document.getElementById('discover-offline-badge');
    if (offlineBadge) offlineBadge.style.display = payload._live ? 'none' : 'inline-flex';

    const bubble = appendAssistantBubble(payload.answer, payload.results || [], { instant: false });

    // Auto-scroll to the response before the typewriter starts.
    if (bubble && bubble.wrap) {
        setTimeout(() => bubble.wrap.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
    }

    if (bubble) {
        await typewriterReveal(bubble.textEl, payload.answer, 14);
        if (localStorage.getItem('match_voice_autoread') === 'true') {
            window.readAloud(payload.answer, bubble.speakBtn);
        }
    }

    const baseIndex = DISCOVER_ITEMS.length;
    const newItems = payload.results || [];
    DISCOVER_ITEMS = DISCOVER_ITEMS.concat(newItems);
    if (bubble && newItems.length) await renderResultsInto(bubble.grid, newItems, baseIndex);

    currentThread.turns.push({ role: 'assistant', text: payload.answer, results: newItems, ts: Date.now() });
    currentThread.updatedAt = Date.now();
    persistCurrentThread();

    // Keep the follow-up box in view so continuing the conversation is obvious.
    const row = document.querySelector('.newsearch-row');
    if (row) setTimeout(() => row.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
}

window.newDiscoverSearch = function () {
    const el = document.getElementById('discover-new-input');
    if (el && el.value.trim()) askAndRender(el.value.trim());
};

/* ---------- Boot ---------- */
async function runDiscovery() {
    renderThreadList();
    const q = getQueryParam('q').trim();
    const loadEl = document.getElementById('discover-loading');
    const emptyEl = document.getElementById('discover-empty');

    if (!q) {
        if (loadEl) loadEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }
    document.title = `${q} — MatchApp AI Concierge`;
    if (loadEl) loadEl.style.display = 'none';
    await askAndRender(q);
}

document.addEventListener('DOMContentLoaded', () => { setTimeout(runDiscovery, 350); });
