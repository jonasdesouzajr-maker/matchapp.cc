console.log("Mastercode 73.0: Fixed Auth Redirects, 20s Loading Sync, and Supabase Init");

// ==========================================
// 1. SUPABASE INITIALIZATION (CRITICAL FOR AUTH)
// ==========================================
// YOU MUST REPLACE THESE WITH YOUR EXACT PROJECT KEYS
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabaseClient = null;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("Supabase CDN failed to load. Authentication is offline.");
}

let globalMatchTitle = "MatchApp";
let isUserLoggedIn = false;

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let dislikedList = JSON.parse(localStorage.getItem('match_dislikedList') || '[]');
let userRatings = JSON.parse(localStorage.getItem('match_userRatings') || '{}');

let isAdFree = localStorage.getItem('match_adFree') === 'true'; 
let isVIP = localStorage.getItem('match_isVIP') === 'true';

// SFX & VFX Engine
window.playPremiumSound = function() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    } catch (e) { console.log('Audio blocked'); }
};

window.fireConfetti = function() {
    if (typeof confetti !== 'undefined') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#D4AF37', '#FFF', '#8A2BE2', '#E50914'], zIndex: 9999 });
};

function updateClock() { const clock = document.getElementById('real-time-clock'); if (clock) { const now = new Date(); clock.innerHTML = `${now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} | ${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`; } }
setInterval(updateClock, 1000);

// ==========================================
// MODAL & AUTHENTICATION LOGIC (TABBED & REDIRECTING)
// ==========================================
window.openAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'flex'; };
window.closeAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'none'; };

window.switchAuthTab = function(tab) {
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('tab-signup').classList.remove('active');
    document.getElementById('form-login').classList.remove('active');
    document.getElementById('form-signup').classList.remove('active');
    
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`form-${tab}`).classList.add('active');
};

window.signInWithGoogle = async function() { 
    if (!supabaseClient) { alert("Server connection failed. Please ensure Supabase keys are set in app.js."); return; } 
    const { error } = await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/profile/profile.html' } }); 
    if (error) alert("Google Login Error: " + error.message); 
};

window.handleEmailSignup = async function() {
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const msgEl = document.getElementById('auth-message');
    
    if(!email || !password) { 
        msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = "Please provide an email and password."; return; 
    }
    if (!supabaseClient) {
        msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = "Server configuration error. Keys missing."; return;
    }

    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if(error) { 
        msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = error.message; 
    } else { 
        msgEl.style.display = 'block'; msgEl.style.color = '#25D366'; msgEl.innerText = "Account created successfully! Redirecting..."; 
        window.dataLayer = window.dataLayer || []; window.dataLayer.push({ 'event': 'user_registration', 'user_email': email });
        setTimeout(() => { window.location.href = '/profile/profile.html'; }, 1500); 
    }
};

window.handleEmailLogin = async function() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const msgEl = document.getElementById('auth-message');
    if(!email || !password) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = "Please enter email and password."; return; }
    if (!supabaseClient) {
        msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = "Server configuration error. Keys missing."; return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if(error) { 
        msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = error.message; 
    } else { 
        msgEl.style.display = 'block'; msgEl.style.color = '#25D366'; msgEl.innerText = "Login successful! Redirecting to Profile..."; 
        window.dataLayer = window.dataLayer || []; window.dataLayer.push({'event': 'user_login'});
        setTimeout(() => { window.location.href = '/profile/profile.html'; }, 1000); 
    }
};

window.doLogout = async function() { if (supabaseClient) { await supabaseClient.auth.signOut(); } localStorage.clear(); window.location.href = '/index.html'; };

if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
            isUserLoggedIn = true;
            const regBtn = document.getElementById('nav-reg-btn');
            const profTab = document.getElementById('profile-link-tab');
            const logoutBtn = document.getElementById('nav-logout-btn');
            const upgradeBtn = document.getElementById('nav-upgrade-btn');
            
            if (regBtn) regBtn.style.display = 'none';
            if (profTab) profTab.style.display = 'inline-flex';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (upgradeBtn) { upgradeBtn.style.display = 'inline-flex'; if (isVIP || isAdFree) upgradeBtn.innerText = '👑 VIP Active'; }
        } else { isUserLoggedIn = false; }
    });
}

// ==========================================
// SECURE GEMINI AI MATCHING ENGINE (20s Locked Native Ads)
// ==========================================
function checkDailyLimit() {
    if (isVIP || isAdFree) return true; 
    const todayStr = new Date().toLocaleDateString(); 
    let lastDate = localStorage.getItem('match_lastDate'); 
    let dailyCount = parseInt(localStorage.getItem('match_dailyCount') || '0');
    if (lastDate !== todayStr) { dailyCount = 0; localStorage.setItem('match_lastDate', todayStr); }
    if (!isUserLoggedIn && dailyCount >= 5) { alert("🔒 You've used your 5 free guest matches today!\n\nPlease register to unlock your next daily allowance!"); window.openAuthModal(); return false; }
    if (isUserLoggedIn && dailyCount >= 5) { window.location.href = '/pricing/pricing.html'; return false; }
    dailyCount++; localStorage.setItem('match_dailyCount', dailyCount.toString()); return true;
}

async function fetchGeminiData(promptText) {
    if (!supabaseClient) throw new Error("Supabase client not initialized.");
    const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', { body: { prompt: promptText } });
    if (error || !data || !data.candidates) throw new Error(error?.message || "Gemini Proxy Request Failed");
    let rawText = data.candidates[0].content.parts[0].text;
    return JSON.parse(rawText.replace(/```json/gi, '').replace(/```/g, '').trim());
}

window.triggerMatch = async function(isSpecificSearch = false) {
    if (window.checkAdBlocker && window.adblockEnabled) return; 
    if (!checkDailyLimit()) return;

    window.dataLayer = window.dataLayer || [];
    let promptText = "";
    
    if (isSpecificSearch) {
        const query = document.getElementById('specific-search-input').value.trim();
        if(!query) { alert("Please enter a title to search."); return; }
        window.dataLayer.push({ 'event': 'search_requested', 'search_term': query });
        promptText = `You are a streaming concierge AI in late 2026. The user is specifically searching for where to stream: "${query}". Find the exact streaming platform where it is currently available globally/US. Output MUST be a valid JSON object matching this structure exactly: {"title": "Correct Title", "synopsis": "A compelling 3-4 sentence extended synopsis.", "platform": "The exact streaming service", "imdb": "IMDb rating as a string", "trailerId": "Exact 11-character YouTube video ID of the official trailer"}`;
    } else {
        const cat = document.getElementById('q-category').value; const plat = document.getElementById('q-platform').value;
        const mood = document.getElementById('q-mood').value; const aest = document.getElementById('q-aesthetic').value; const pac = document.getElementById('q-pacing').value;
        window.dataLayer.push({ 'event': 'match_requested' });
        const excludeStr = [...seenList, ...dislikedList].join(', ');
        promptText = `You are a streaming concierge AI in late 2026. Find a highly-rated streaming title based on these preferences: Format: ${cat}, Platform: ${plat}, Mood: ${mood}, Aesthetic: ${aest}, Pacing: ${pac}. CRITICAL: Do NOT recommend any of the following titles: ${excludeStr}. Return exactly one match. Ensure it is a real title currently available. Output MUST be a valid JSON object matching this structure exactly: {"title": "Title of movie/series", "synopsis": "A compelling 3-4 sentence extended synopsis.", "platform": "The streaming service", "imdb": "IMDb rating as a string", "trailerId": "Exact 11-character YouTube video ID of the official trailer"}`;
    }

    // Hide UI, Show Native Loading HTML Box
    if (document.getElementById('questionnaire-box')) document.getElementById('questionnaire-box').style.display = 'none';
    if (document.getElementById('search-box')) document.getElementById('search-box').style.display = 'none';
    if (document.getElementById('result-box')) document.getElementById('result-box').style.display = 'none';
    
    const loadBox = document.getElementById('loading-box');
    loadBox.style.display = 'block';

    let totalTime = isVIP || isAdFree ? 4 : 20; 
    let startTime = Date.now();
    
    // Reset Bar & Enable Ads explicitly
    document.getElementById('ai-progress-bar').style.width = '0%';
    document.getElementById('ad-timer-sim').innerText = totalTime;
    if (!isVIP && !isAdFree) {
        document.getElementById('free-loading-ads').style.display = 'flex';
        document.getElementById('vip-loading-msg').style.display = 'none';
    } else {
        document.getElementById('free-loading-ads').style.display = 'none';
        document.getElementById('vip-loading-msg').style.display = 'block';
    }

    // Precise Smooth Progress Bar Logic
    let timerInterval = setInterval(() => {
        let elapsed = (Date.now() - startTime) / 1000;
        let pct = Math.min((elapsed / totalTime) * 100, 100);
        document.getElementById('ai-progress-bar').style.width = pct + '%';
        document.getElementById('ad-timer-sim').innerText = Math.max(Math.ceil(totalTime - elapsed), 0);
    }, 50);

    let matchResult = null;
    try {
        let fetchPromise = fetchGeminiData(promptText);
        // Force exactly the delay specified (e.g., 20 seconds for free users to see ads)
        let delayPromise = new Promise(resolve => setTimeout(resolve, totalTime * 1000));
        let [apiResult] = await Promise.all([fetchPromise, delayPromise]); 
        matchResult = apiResult;
    } catch (err) {
        console.error("Gemini Fallback Triggered: ", err);
        matchResult = { title: "Dune: Part Two", synopsis: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge...", platform: "Max", imdb: "8.6", trailerId: "Way9Dexny3w" };
    }

    clearInterval(timerInterval);
    renderResult(matchResult);
};

function renderResult(selected) {
    document.getElementById('loading-box').style.display = 'none';
    const resultBox = document.getElementById('result-box');
    resultBox.style.display = 'block';
    
    window.playPremiumSound();
    window.fireConfetti();
    window.dataLayer.push({ 'event': 'match_revealed', 'title': selected.title });

    globalMatchTitle = selected.title;
    document.querySelectorAll('.star-rating-container .star').forEach(s => s.classList.remove('selected'));

    document.getElementById('res-title').innerText = selected.title;
    document.getElementById('res-synopsis').innerText = selected.synopsis;

    const badge = document.getElementById('res-platform-badge');
    badge.innerText = selected.platform;
    if (selected.platform.toLowerCase().includes('netflix')) badge.style.background = '#E50914';
    else if (selected.platform.toLowerCase().includes('max') || selected.platform.toLowerCase().includes('hbo')) badge.style.background = '#8A2BE2';
    else if (selected.platform.toLowerCase().includes('prime')) badge.style.background = '#00A8E1';
    else if (selected.platform.toLowerCase().includes('disney')) badge.style.background = '#113CCF';
    else badge.style.background = 'var(--gold)';
    badge.style.color = '#fff';

    const imdbBadge = document.getElementById('res-imdb-badge');
    if(imdbBadge) imdbBadge.innerText = `IMDb: ${selected.imdb || 'N/A'}`;

    const directBtn = document.getElementById('res-direct-link');
    directBtn.href = `https://www.google.com/search?q=Watch+${encodeURIComponent(selected.title)}+on+${encodeURIComponent(selected.platform)}`;
    directBtn.innerText = `▶ Search on ${selected.platform}`;

    const trailerBox = document.getElementById('res-trailer-container');
    if (trailerBox && selected.trailerId) {
        trailerBox.style.display = 'block';
        const iframe = document.getElementById('res-trailer');
        if (iframe) iframe.src = `https://www.youtube-nocookie.com/embed/${selected.trailerId}?autoplay=0&rel=0`;
    }
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.saveToList = function() { if (globalMatchTitle && !savedList.includes(globalMatchTitle)) { savedList.push(globalMatchTitle); syncListsToDatabase(); alert(`⭐ "${globalMatchTitle}" saved!`); if(typeof renderProfileGrids === 'function') renderProfileGrids(); } document.getElementById('result-box').style.display = 'none'; triggerMatch(false); };
window.markAsSeen = function() { if (globalMatchTitle && !seenList.includes(globalMatchTitle)) { seenList.push(globalMatchTitle); syncListsToDatabase(); if(typeof renderProfileGrids === 'function') renderProfileGrids(); } document.getElementById('result-box').style.display = 'none'; triggerMatch(false); };
window.markAsLiked = function() { if (globalMatchTitle) { userRatings[globalMatchTitle] = 5; if (!seenList.includes(globalMatchTitle)) seenList.push(globalMatchTitle); syncListsToDatabase(); if(typeof renderProfileGrids === 'function') renderProfileGrids(); } document.getElementById('result-box').style.display = 'none'; triggerMatch(false); };
window.markAsDisliked = function() { if (globalMatchTitle && !dislikedList.includes(globalMatchTitle)) { dislikedList.push(globalMatchTitle); userRatings[globalMatchTitle] = 1; syncListsToDatabase(); } document.getElementById('result-box').style.display = 'none'; triggerMatch(false); };

document.addEventListener('click', function (event) {
    if (!event.target.classList.contains('star')) return;
    const star = event.target; const rating = parseInt(star.getAttribute('data-value'));
    const container = star.closest('.star-rating-container');
    container.querySelectorAll('.star').forEach(s => s.classList.remove('selected')); star.classList.add('selected');
    if (globalMatchTitle) { userRatings[globalMatchTitle] = rating; if (!seenList.includes(globalMatchTitle)) seenList.push(globalMatchTitle); syncListsToDatabase(); if(typeof renderProfileGrids === 'function') renderProfileGrids(); }
});

async function syncListsToDatabase() { 
    localStorage.setItem('match_seenList', JSON.stringify(seenList)); localStorage.setItem('match_savedList', JSON.stringify(savedList)); localStorage.setItem('match_dislikedList', JSON.stringify(dislikedList)); localStorage.setItem('match_userRatings', JSON.stringify(userRatings)); 
    if (isUserLoggedIn && supabaseClient) { await supabaseClient.auth.updateUser({ data: { seen_list: seenList, saved_list: savedList, disliked_list: dislikedList, user_ratings: userRatings } }); } 
}
