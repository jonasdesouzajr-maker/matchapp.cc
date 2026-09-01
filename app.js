console.log("Mastercode 96.0: Silent Fallback Catalog & 3-Tier Cover API Active");

const SUPABASE_URL = 'https://zkymvqrmbabngsqblyye.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpreW12cXJtYmFibmdzcWJseXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDUyNDIsImV4cCI6MjEwMjM4MTI0Mn0._yEVFMfwVU6GBqQ8m3ljfOgA0HSLEDiKMOfYae6ZD8Q';

let supabaseClient = null;
try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = supabaseClient; 
    }
} catch (e) { console.error("Supabase Initialization Error:", e); }

let globalMatchTitle = ""; let globalMatchPoster = ""; let globalPlatform = ""; let isUserLoggedIn = false;
let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let dislikedList = JSON.parse(localStorage.getItem('match_dislikedList') || '[]');
let userRatings = JSON.parse(localStorage.getItem('match_userRatings') || '{}');
let isAdFree = localStorage.getItem('match_adFree') === 'true'; 
let isVIP = localStorage.getItem('match_isVIP') === 'true';

// 🔥 GUARANTEED SILENT FALLBACK CATALOG (Protects against AI API Failures)
const FALLBACK_CATALOG = [
    { title: "The Pitt", synopsis: "A gripping medical drama following frontline workers navigating daily chaos.", platform: "Max", imdb: "8.5", trailerId: "null", format: "series", mood: "intense" },
    { title: "Fallout", synopsis: "In a post-apocalyptic Los Angeles, citizens must live in underground bunkers to protect themselves from mutants.", platform: "Prime Video", imdb: "8.6", trailerId: "V-mugKDQRug", format: "series", mood: "mindbending" },
    { title: "A Vida Secreta do Meu Marido Bilionário", synopsis: "A heart-pounding vertical drama where a hidden identity shakes the foundation of a marriage.", platform: "ReelShort", imdb: "7.9", trailerId: "null", format: "microdrama", mood: "romantic" },
    { title: "Nas Profundezas do Amor", synopsis: "A captivating novela about forbidden passions and deep secrets in high society.", platform: "Globoplay", imdb: "8.1", trailerId: "null", format: "microdrama", mood: "romantic" },
    { title: "The Joe Rogan Experience", synopsis: "Long-form conversations with comedians, scientists, athletes, and artists.", platform: "Spotify", imdb: "8.8", trailerId: "null", format: "podcast", mood: "funny" },
    { title: "Fated to the Alpha", synopsis: "A gripping tale of werewolf packs, soulmates, and a forbidden love.", platform: "DramaBox", imdb: "8.0", trailerId: "null", format: "microdrama", mood: "romantic" },
    { title: "Breaking Bad", synopsis: "A chemistry teacher diagnosed with cancer turns to manufacturing methamphetamine.", platform: "Netflix", imdb: "9.5", trailerId: "HhesaQXLuRY", format: "series", mood: "intense" },
    { title: "Dune: Part Two", synopsis: "Paul Atreides unites with the Fremen while on a warpath of revenge.", platform: "Max", imdb: "8.8", trailerId: "Way9Dexny3w", format: "movie", mood: "mindbending" },
    { title: "Anyone But You", synopsis: "After a first date, Bea and Ben's fiery attraction turns ice cold until they reunite in Australia.", platform: "Netflix", imdb: "6.2", trailerId: "V5eE1zO1Qc0", format: "movie", mood: "funny" },
    { title: "Queen of Tears", synopsis: "The queen of department stores and her small-town husband weather a marital crisis.", platform: "Netflix", imdb: "8.3", trailerId: "vB43D5-3VfA", format: "dorama", mood: "romantic" },
    { title: "Jujutsu Kaisen", synopsis: "A boy swallows a cursed talisman and becomes cursed himself.", platform: "Any Platform", imdb: "8.5", trailerId: "pkKQAjeBscE", format: "anime", mood: "intense" },
    { title: "Huberman Lab", synopsis: "Neuroscience and science-based tools for everyday life.", platform: "Spotify", imdb: "9.0", trailerId: "null", format: "podcast", mood: "mindbending" },
    { title: "Deadpool & Wolverine", synopsis: "Two iconic mutants team up for an action-packed, hilariously violent adventure.", platform: "Disney+", imdb: "8.1", trailerId: "73_1biulkYk", format: "movie", mood: "funny" }
];

function getFallbackMatch(format, platform, mood) {
    let pool = FALLBACK_CATALOG;
    if (format && format !== 'any') { let fP = pool.filter(i => i.format === format); if(fP.length > 0) pool = fP; }
    if (platform && platform !== 'any') { let pP = pool.filter(i => i.platform.toLowerCase().includes(platform.toLowerCase())); if(pP.length > 0) pool = pP; }
    if (mood && mood !== 'any') { let mP = pool.filter(i => i.mood === mood); if(mP.length > 0) pool = mP; }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return { title: pick.title, synopsis: pick.synopsis, platform: pick.platform, imdb: pick.imdb, trailerId: pick.trailerId, posterPath: "/fallback" };
}

// 🔥 3-TIER BULLETPROOF COVER FETCHER (Bypasses CORS & Adblockers)
async function getRealCoverImage(title, aiFallbackPath) {
    try {
        const tvRes = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(title)}`);
        if (tvRes.ok) { const tvData = await tvRes.json(); if (tvData && tvData.image && tvData.image.original) return tvData.image.original; }
    } catch(e) {}
    try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://itunes.apple.com/search?term=${encodeURIComponent(title)}&limit=1`)}`;
        const itRes = await fetch(proxyUrl);
        if (itRes.ok) { const proxyData = await itRes.json(); const itData = JSON.parse(proxyData.contents); if (itData.results && itData.results.length > 0 && itData.results[0].artworkUrl100) return itData.results[0].artworkUrl100.replace('100x100bb', '600x900bb'); }
    } catch(e) {}
    if (aiFallbackPath && aiFallbackPath.startsWith('/')) return `https://image.tmdb.org/t/p/w500${aiFallbackPath}`;
    if (aiFallbackPath && aiFallbackPath.startsWith('http')) return aiFallbackPath;
    return 'fallback';
}

window.playPremiumSound = function() {
    try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2); } catch (e) { }
};

window.fireConfetti = function() {
    if (typeof confetti !== 'undefined') { confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 }, colors: ['#E5C158', '#FFF', '#8A2BE2', '#E50914'], zIndex: 9999 }); }
};

window.selectMarqueeItem = function(titleName) {
    const searchInput = document.getElementById('specific-search-input'); const searchBox = document.getElementById('search-box');
    if (searchInput && searchBox) { searchInput.value = titleName; searchBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); searchInput.focus(); }
};

window.openAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'flex'; };
window.closeAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'none'; };
window.switchAuthTab = function(tab) {
    ['login', 'signup'].forEach(t => { document.getElementById(`tab-${t}`)?.classList.remove('active'); document.getElementById(`form-${t}`)?.classList.remove('active'); });
    document.getElementById(`tab-${tab}`)?.classList.add('active'); document.getElementById(`form-${tab}`)?.classList.add('active');
};

window.signInWithGoogle = async function() { 
    if (!supabaseClient) return alert("Database client not initialized."); 
    const { error } = await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/profile/profile.html' } }); 
    if (error) alert("Google Login Error: " + error.message); 
};

window.handleEmailSignup = async function() {
    const email = document.getElementById('reg-email').value.trim(); const password = document.getElementById('reg-password').value; const msgEl = document.getElementById('auth-message');
    if(!email || !password) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = "Please provide an email and password."; return; }
    if (!supabaseClient) return;
    msgEl.style.display = 'block'; msgEl.style.color = '#fff'; msgEl.style.background = 'rgba(229,193,88,0.2)'; msgEl.innerText = "Creating account...";
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if(error) { msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = error.message; } 
    else { msgEl.style.color = '#25D366'; msgEl.style.background = 'rgba(37,211,102,0.1)'; msgEl.innerText = "Account created! Routing to Profile Hub..."; setTimeout(() => { window.location.href = '/profile/profile.html'; }, 1500); }
};

window.handleEmailLogin = async function() {
    const email = document.getElementById('login-email').value.trim(); const password = document.getElementById('login-password').value; const msgEl = document.getElementById('auth-message');
    if(!email || !password) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = "Please enter email and password."; return; }
    msgEl.style.display = 'block'; msgEl.style.color = '#fff'; msgEl.style.background = 'rgba(229,193,88,0.2)'; msgEl.innerText = "Authenticating...";
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if(error) { msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = error.message; } 
    else { msgEl.style.color = '#25D366'; msgEl.style.background = 'rgba(37,211,102,0.1)'; msgEl.innerText = "Welcome back! Routing to Home..."; setTimeout(() => { window.location.reload(); }, 1000); }
};

window.doLogout = async function() { if (supabaseClient) { await supabaseClient.auth.signOut(); } localStorage.clear(); window.location.href = '/index.html'; };

if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
            isUserLoggedIn = true;
            const user = session.user;
            const { data: profile } = await supabaseClient.from('profiles').select('is_vip, is_ad_free, avatar_url').eq('id', user.id).single();
            if(profile) {
                if(profile.is_vip) { isVIP = true; localStorage.setItem('match_isVIP', 'true'); }
                if(profile.is_ad_free) { isAdFree = true; localStorage.setItem('match_adFree', 'true'); }
            }
            const regBtn = document.getElementById('nav-reg-btn'); const profTab = document.getElementById('profile-link-tab'); const logoutBtn = document.getElementById('nav-logout-btn');
            
            if (profTab) {
                profTab.style.display = 'inline-flex';
                let avatarSrc = localStorage.getItem('match_custom_avatar') || profile?.avatar_url || user.user_metadata?.avatar_url || `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23FFF'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>`;
                let badge = (isVIP || isAdFree) ? `<span style="font-size: 14px; margin-left: 5px;">💎</span>` : `<span style="font-size: 14px; margin-left: 5px;">✅</span>`;
                profTab.innerHTML = `<img src="${avatarSrc}" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--gold); object-fit: cover; margin-right: 8px;"> Profile ${badge}`;
            }
            if (regBtn) regBtn.style.display = 'none'; if (logoutBtn) logoutBtn.style.display = 'inline-block';
        } else { isUserLoggedIn = false; }
    });
}

function checkDailyLimit() {
    if (isVIP || isAdFree) return true; 
    const todayStr = new Date().toLocaleDateString(); let lastDate = localStorage.getItem('match_lastDate'); let dailyCount = parseInt(localStorage.getItem('match_dailyCount') || '0');
    if (lastDate !== todayStr) { dailyCount = 0; localStorage.setItem('match_lastDate', todayStr); }
    if (!isUserLoggedIn && dailyCount >= 3) { alert("🔒 You've used your 3 free matches today!\n\nRegister for FREE to unlock your personal profile and get more matches."); window.openAuthModal(); return false; }
    if (isUserLoggedIn && dailyCount >= 7) { alert("💎 Daily limit reached!\n\nUpgrade to VIP for UNLIMITED matches and Ad-Free browsing!"); window.location.href = '/pricing/pricing.html'; return false; }
    dailyCount++; localStorage.setItem('match_dailyCount', dailyCount.toString()); return true;
}

async function fetchGeminiData(promptText) {
    if (!supabaseClient) throw new Error("Database not connected");
    const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', { body: { prompt: promptText } });
    if (error || !data || !data.candidates) throw new Error("API Timeout");
    
    let rawText = data.candidates[0].content.parts[0].text;
    let startIndex = rawText.indexOf('{'); let endIndex = rawText.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) { return JSON.parse(rawText.substring(startIndex, endIndex + 1)); }
    throw new Error("Invalid format returned");
}

window.triggerMatch = async function(isSpecificSearch = false) {
    if (!checkDailyLimit()) return;
    
    const loadBox = document.getElementById('loading-box'); const qBox = document.getElementById('questionnaire-box'); const sBox = document.getElementById('search-box');
    if (loadBox) { loadBox.style.display = 'block'; loadBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    if (qBox) qBox.style.display = 'none'; if (sBox) sBox.style.display = 'none';

    let exclusionList = seenList.map(item => item.title || item).join(', ');
    let savedAge = localStorage.getItem('match_user_age'); let savedCountry = localStorage.getItem('match_user_country'); let savedSign = localStorage.getItem('match_user_sign');
    let personaContext = (isUserLoggedIn && savedAge && savedCountry) ? `CRITICAL AUDIENCE MATCH: The user is ${savedAge} years old, lives in ${savedCountry}, and is a ${savedSign || 'unknown'} star sign. You MUST select a title that strongly appeals to this demographic. ` : "";
    
    const strictRules = `RULES: 1. EXCLUDE: [${exclusionList}]. 2. "trailerId": MUST be the exact 11-char YouTube ID. If you are not 100% sure, output exactly "null". 3. IF Platform is "Spotify", recommend a Podcast. IF "microdrama", recommend a ReelShort/DramaBox/Globoplay. Output valid JSON ONLY: {"title": "Title", "synopsis": "3-sentence synopsis.", "platform": "Platform", "imdb": "Rating", "trailerId": "11-char-id or null", "posterPath": "/path.jpg"}`;

    let promptText = ""; let cat = 'any'; let plat = 'any'; let mood = 'any';
    if (isSpecificSearch) {
        const input = document.getElementById('specific-search-input');
        if (!input || !input.value.trim()) { alert("Please enter a title."); window.location.reload(); return; }
        promptText = `${personaContext} Search exactly for: "${input.value.trim()}". ${strictRules}`;
    } else {
        cat = document.getElementById('q-category')?.value || 'any'; plat = document.getElementById('q-platform')?.value || 'any'; mood = document.getElementById('q-mood')?.value || 'any'; 
        promptText = `${personaContext} Find a perfect match based on: Format: ${cat}, Platform: ${plat}, Mood: ${mood}. ${strictRules}`;
    }

    let totalTime = isVIP || isAdFree ? 5 : 20; 
    let startTimeMs = Date.now();
    const pBar = document.getElementById('ai-progress-bar');
    if (pBar) pBar.style.width = '0%';
    
    let timerInterval = setInterval(() => {
        let elapsed = (Date.now() - startTimeMs) / 1000;
        let pct = Math.min((elapsed / totalTime) * 100, 100);
        if (pBar) pBar.style.width = pct + '%';
    }, 50);

    let matchResult = null;
    try {
        matchResult = await fetchGeminiData(promptText);
    } catch (err) {
        console.warn("AI Backend Volume High, triggering Silent Catalog Fallback.", err);
        matchResult = getFallbackMatch(cat, plat, mood); // GUARANTEED FALLBACK
    }

    let elapsedMs = Date.now() - startTimeMs;
    let remainingMs = (totalTime * 1000) - elapsedMs;
    if (remainingMs > 0) { await new Promise(resolve => setTimeout(resolve, remainingMs)); }

    clearInterval(timerInterval);
    if (pBar) pBar.style.width = '100%';

    if (!seenList.some(i => (i.title || i) === matchResult.title)) {
        seenList.push({ title: matchResult.title, posterUrl: matchResult.posterPath, platform: matchResult.platform });
        localStorage.setItem('match_seenList', JSON.stringify(seenList));
    }

    renderResult(matchResult);
};

async function renderResult(selected) {
    const loadBox = document.getElementById('loading-box'); const resultBox = document.getElementById('result-box');
    if (loadBox) loadBox.style.display = 'none'; if (!resultBox) return;
    
    resultBox.style.display = 'block'; resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.playPremiumSound(); window.fireConfetti();

    globalMatchTitle = selected.title; globalPlatform = selected.platform || "Streaming";
    
    document.getElementById('res-title').innerText = selected.title; document.getElementById('res-synopsis').innerText = selected.synopsis;
    document.getElementById('res-platform-badge').innerText = selected.platform; document.getElementById('res-imdb-badge').innerText = `IMDb: ${selected.imdb || 'N/A'}`;

    const posterEl = document.getElementById('res-poster-img'); const cssFallback = document.getElementById('res-css-poster');
    
    if (posterEl && cssFallback) {
        posterEl.style.display = 'none'; cssFallback.style.display = 'none';
        const realCover = await getRealCoverImage(selected.title, selected.posterPath);
        globalMatchPoster = realCover;
        if (realCover !== 'fallback') {
            posterEl.src = realCover; posterEl.style.display = 'block';
            posterEl.onerror = function() { this.style.display = 'none'; cssFallback.style.display = 'flex'; cssFallback.innerText = selected.title; };
        } else {
            cssFallback.style.display = 'flex'; cssFallback.innerText = selected.title;
        }
    }

    const directBtn = document.getElementById('res-direct-link');
    if (selected.platform.toLowerCase().includes('spotify')) { directBtn.href = `https://open.spotify.com/search/${encodeURIComponent(selected.title)}`; directBtn.innerText = `🎧 Open on Spotify`;
    } else if (selected.platform.toLowerCase().includes('reelshort')) { directBtn.href = `https://www.reelshort.com/`; directBtn.innerText = `📱 Open on ReelShort`;
    } else if (selected.platform.toLowerCase().includes('dramabox')) { directBtn.href = `https://www.dramabox.com/`; directBtn.innerText = `📺 Open on DramaBox`;
    } else { directBtn.href = `https://www.google.com/search?q=Watch+${encodeURIComponent(selected.title)}+on+${encodeURIComponent(selected.platform)}`; directBtn.innerText = `▶ Stream on ${selected.platform}`; }

    // 🔥 TRAILER BUG FIX: STRICT HIDING
    const iframe = document.getElementById('res-trailer');
    const iframeWrapper = document.getElementById('res-iframe-wrapper'); 
    const ytFallbackLink = document.getElementById('res-trailer-fallback');
    
    if (iframeWrapper) iframeWrapper.style.display = 'none'; 
    if (selected.trailerId && selected.trailerId.length === 11 && selected.trailerId !== 'null' && !selected.trailerId.includes(' ')) {
        if (iframe) iframe.src = `https://www.youtube-nocookie.com/embed/${selected.trailerId}?rel=0`;
        if (iframeWrapper) iframeWrapper.style.display = 'block'; 
    }
    
    if (ytFallbackLink) {
        ytFallbackLink.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(selected.title + " official trailer")}`;
        ytFallbackLink.innerText = `▶️ Search Official Trailer on YouTube`;
    }
}

window.recordAction = function(type) {
    if (!globalMatchTitle) return;
    if (!isUserLoggedIn) { alert("💎 Join for FREE!\n\nTo save titles & covers to your Portfolio, please create a free account."); window.openAuthModal(); return; }

    const itemObj = { title: globalMatchTitle, posterUrl: globalMatchPoster, platform: globalPlatform };
    const existsInList = (list) => list.some(i => (i.title || i) === globalMatchTitle);

    if (type === 'save') { if (!existsInList(savedList)) savedList.push(itemObj); alert(`⭐ "${globalMatchTitle}" saved to your Portfolio!`); } 
    else if (type === 'seen') { if (!existsInList(seenList)) seenList.push(itemObj); } 
    else if (type === 'like') { userRatings[globalMatchTitle] = 5; if (!existsInList(seenList)) seenList.push(itemObj); } 
    else if (type === 'dislike') { userRatings[globalMatchTitle] = 1; if (!existsInList(dislikedList)) dislikedList.push(itemObj); }
    
    syncListsToDatabase(); alert("Action Recorded! Generate your next match now.");
    document.getElementById('result-box').style.display = 'none'; document.getElementById('questionnaire-box').style.display = 'block'; window.scrollTo({ top: 0, behavior: 'smooth' });
};

async function syncListsToDatabase() { 
    localStorage.setItem('match_seenList', JSON.stringify(seenList)); localStorage.setItem('match_savedList', JSON.stringify(savedList)); localStorage.setItem('match_dislikedList', JSON.stringify(dislikedList)); localStorage.setItem('match_userRatings', JSON.stringify(userRatings)); 
    if (isUserLoggedIn && supabaseClient) { await supabaseClient.auth.updateUser({ data: { seen_list: seenList, saved_list: savedList, disliked_list: dislikedList, user_ratings: userRatings } }); } 
}
