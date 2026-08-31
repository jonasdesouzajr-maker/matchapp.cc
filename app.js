console.log("Mastercode 94.0: Apple API Cover Engine & True Match Logic Active");

const SUPABASE_URL = 'https://zkymvqrmbabngsqblyye.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpreW12cXJtYmFibmdzcWJseXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDUyNDIsImV4cCI6MjEwMjM4MTI0Mn0._yEVFMfwVU6GBqQ8m3ljfOgA0HSLEDiKMOfYae6ZD8Q';

let supabaseClient = null;
try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = supabaseClient; 
    }
} catch (e) {
    console.error("Supabase Initialization Error:", e);
}

let globalMatchTitle = "";
let globalMatchPoster = "";
let globalPlatform = "";
let isUserLoggedIn = false;

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let dislikedList = JSON.parse(localStorage.getItem('match_dislikedList') || '[]');
let userRatings = JSON.parse(localStorage.getItem('match_userRatings') || '{}');

let isAdFree = localStorage.getItem('match_adFree') === 'true'; 
let isVIP = localStorage.getItem('match_isVIP') === 'true';

// 🎨 APPLE API COVER MATCHER (Guarantees Blockbuster Quality Covers)
async function getRealCoverImage(title, aiFallbackPath) {
    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(title)}&media=movie&limit=1`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            // Replaces tiny thumbnail with massive 600x900 high-res cover
            return data.results[0].artworkUrl100.replace('100x100bb', '600x900bb');
        }
    } catch (e) { console.log("Apple API failed, using AI fallback"); }

    if (aiFallbackPath && aiFallbackPath.startsWith('/')) return `https://image.tmdb.org/t/p/w500${aiFallbackPath}`;
    if (aiFallbackPath && aiFallbackPath.startsWith('http')) return aiFallbackPath;
    
    return 'fallback'; // Triggers beautiful CSS Gold card
}

window.playPremiumSound = function() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    } catch (e) { }
};

window.fireConfetti = function() {
    if (typeof confetti !== 'undefined') { confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#D4AF37', '#FFF', '#8A2BE2', '#E50914'], zIndex: 9999 }); }
};

window.selectMarqueeItem = function(titleName) {
    const searchInput = document.getElementById('specific-search-input');
    const searchBox = document.getElementById('search-box');
    if (searchInput && searchBox) {
        searchInput.value = titleName;
        searchBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchInput.focus();
    }
};

window.openAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'flex'; };
window.closeAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'none'; };

window.switchAuthTab = function(tab) {
    const tabs = ['login', 'signup'];
    tabs.forEach(t => {
        document.getElementById(`tab-${t}`)?.classList.remove('active');
        document.getElementById(`form-${t}`)?.classList.remove('active');
    });
    document.getElementById(`tab-${tab}`)?.classList.add('active');
    document.getElementById(`form-${tab}`)?.classList.add('active');
};

window.signInWithGoogle = async function() { 
    if (!supabaseClient) return alert("Database client not initialized."); 
    const { error } = await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/profile/profile.html' } }); 
    if (error) alert("Google Login Error: " + error.message); 
};

window.doLogout = async function() { 
    if (supabaseClient) { await supabaseClient.auth.signOut(); } 
    localStorage.clear(); 
    window.location.href = '/index.html'; 
};

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
            const regBtn = document.getElementById('nav-reg-btn');
            const profTab = document.getElementById('profile-link-tab');
            const logoutBtn = document.getElementById('nav-logout-btn');
            
            if (profTab) {
                profTab.style.display = 'inline-flex';
                let avatarSrc = localStorage.getItem('match_custom_avatar') || profile?.avatar_url || user.user_metadata?.avatar_url || `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23FFF'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>`;
                let badge = (isVIP || isAdFree) ? `<span style="font-size: 14px; margin-left: 5px;">💎</span>` : `<span style="font-size: 14px; margin-left: 5px;">✅</span>`;
                profTab.innerHTML = `<img src="${avatarSrc}" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--gold); object-fit: cover; margin-right: 8px;"> Profile ${badge}`;
            }
            if (regBtn) regBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
        } else { 
            isUserLoggedIn = false; 
        }
    });
}

function checkDailyLimit() {
    if (isVIP || isAdFree) return true; 
    const todayStr = new Date().toLocaleDateString(); 
    let lastDate = localStorage.getItem('match_lastDate'); 
    let dailyCount = parseInt(localStorage.getItem('match_dailyCount') || '0');
    if (lastDate !== todayStr) { dailyCount = 0; localStorage.setItem('match_lastDate', todayStr); }
    if (!isUserLoggedIn && dailyCount >= 3) { alert("🔒 You've used your 3 free matches today! Register for FREE to unlock more."); window.openAuthModal(); return false; }
    if (isUserLoggedIn && dailyCount >= 7) { alert("💎 Daily limit reached! Upgrade to VIP for UNLIMITED matches!"); window.location.href = '/pricing/pricing.html'; return false; }
    dailyCount++; localStorage.setItem('match_dailyCount', dailyCount.toString()); return true;
}

// BULLETPROOF JSON PARSER
async function fetchGeminiData(promptText) {
    if (!supabaseClient) throw new Error("Database not connected");
    const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', { body: { prompt: promptText } });
    if (error || !data || !data.candidates) throw new Error("API Timeout");
    
    let rawText = data.candidates[0].content.parts[0].text;
    let startIndex = rawText.indexOf('{');
    let endIndex = rawText.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
        let cleanJson = rawText.substring(startIndex, endIndex + 1);
        return JSON.parse(cleanJson);
    }
    throw new Error("Invalid format returned");
}

window.triggerMatch = async function(isSpecificSearch = false) {
    if (!checkDailyLimit()) return;
    
    const loadBox = document.getElementById('loading-box');
    const qBox = document.getElementById('questionnaire-box');
    const sBox = document.getElementById('search-box');
    
    if (loadBox) { loadBox.style.display = 'block'; loadBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    if (qBox) qBox.style.display = 'none';
    if (sBox) sBox.style.display = 'none';

    let exclusionList = seenList.map(item => item.title || item).join(', ');
    
    const strictRules = `CRITICAL RULES: 
    1. EXCLUDE ALL of these previous matches: [${exclusionList}]. Do NOT repeat them.
    2. "trailerId": Provide EXACTLY an 11-character YouTube ID if known, otherwise output "".
    Output valid JSON ONLY: {"title": "Title", "synopsis": "3-sentence synopsis.", "platform": "Platform Name", "imdb": "Rating", "trailerId": "11-char-id or empty", "posterPath": "/path.jpg"}`;

    let promptText = "";
    if (isSpecificSearch) {
        const input = document.getElementById('specific-search-input');
        if (!input || !input.value.trim()) { alert("Please enter a title."); window.location.reload(); return; }
        promptText = `Search exactly for: "${input.value.trim()}". ${strictRules}`;
    } else {
        const cat = document.getElementById('q-category')?.value || 'any'; 
        const plat = document.getElementById('q-platform')?.value || 'any';
        const mood = document.getElementById('q-mood')?.value || 'any'; 
        promptText = `Find a perfect match based on: Format: ${cat}, Platform: ${plat}, Mood: ${mood}. ${strictRules}`;
    }

    let totalTime = isVIP || isAdFree ? 4 : 8; 
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
        console.error("AI Match Error:", err);
        clearInterval(timerInterval);
        // THE REPEATING TITLE IS GONE. It now gracefully fails and lets the user try again.
        alert("⚠️ The AI Concierge servers are experiencing high volume. Please try matching again in a few seconds.");
        if (loadBox) loadBox.style.display = 'none';
        if (qBox) qBox.style.display = 'block';
        if (sBox) sBox.style.display = 'block';
        return; 
    }

    clearInterval(timerInterval);
    if (pBar) pBar.style.width = '100%';

    // Save logic
    if (!seenList.some(i => (i.title || i) === matchResult.title)) {
        seenList.push({ title: matchResult.title, posterUrl: matchResult.posterPath, platform: matchResult.platform });
        localStorage.setItem('match_seenList', JSON.stringify(seenList));
    }

    renderResult(matchResult);
};

async function renderResult(selected) {
    const loadBox = document.getElementById('loading-box');
    const resultBox = document.getElementById('result-box');
    if (loadBox) loadBox.style.display = 'none';
    if (!resultBox) return;
    
    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

    window.playPremiumSound();
    window.fireConfetti();

    globalMatchTitle = selected.title;
    globalPlatform = selected.platform || "Streaming";
    
    document.getElementById('res-title').innerText = selected.title;
    document.getElementById('res-synopsis').innerText = selected.synopsis;
    document.getElementById('res-platform-badge').innerText = selected.platform;
    document.getElementById('res-imdb-badge').innerText = `IMDb/Rating: ${selected.imdb || 'N/A'}`;

    // 🚀 INJECTING THE REAL COVER ART 
    const posterEl = document.getElementById('res-poster-img');
    const cssFallback = document.getElementById('res-css-poster');
    
    if (posterEl && cssFallback) {
        posterEl.style.display = 'none';
        cssFallback.style.display = 'none';
        
        // Ping Apple API for stunning high-res cover
        const realCover = await getRealCoverImage(selected.title, selected.posterPath);
        globalMatchPoster = realCover;
        
        if (realCover !== 'fallback') {
            posterEl.src = realCover;
            posterEl.style.display = 'block';
            posterEl.onerror = function() {
                this.style.display = 'none';
                cssFallback.style.display = 'flex';
                cssFallback.innerText = selected.title;
            };
        } else {
            cssFallback.style.display = 'flex';
            cssFallback.innerText = selected.title;
        }
    }

    // DIRECT STREAMING BUTTON LOGIC
    const directBtn = document.getElementById('res-direct-link');
    if (selected.platform.toLowerCase().includes('spotify')) { directBtn.href = `https://open.spotify.com/search/${encodeURIComponent(selected.title)}`; directBtn.innerText = `🎧 Open on Spotify`;
    } else if (selected.platform.toLowerCase().includes('reelshort')) { directBtn.href = `https://www.reelshort.com/`; directBtn.innerText = `📱 Open on ReelShort`;
    } else if (selected.platform.toLowerCase().includes('dramabox')) { directBtn.href = `https://www.dramabox.com/`; directBtn.innerText = `📺 Open on DramaBox`;
    } else { directBtn.href = `https://www.google.com/search?q=Watch+${encodeURIComponent(selected.title)}+on+${encodeURIComponent(selected.platform)}`; directBtn.innerText = `▶ Stream on ${selected.platform}`; }

    // 🚀 BULLETPROOF TRAILER LOGIC
    const iframe = document.getElementById('res-trailer');
    const iframeWrapper = document.querySelector('.video-container'); 
    const ytFallbackLink = document.getElementById('res-trailer-fallback');
    
    // Always hide the black box first so broken iframes NEVER show
    if (iframeWrapper) iframeWrapper.style.display = 'none'; 
    
    // If AI gave a perfect 11-char ID, show the video
    if (selected.trailerId && selected.trailerId.length === 11 && !selected.trailerId.includes(' ')) {
        if (iframe) iframe.src = `https://www.youtube-nocookie.com/embed/${selected.trailerId}?rel=0`;
        if (iframeWrapper) iframeWrapper.style.display = 'block'; 
    }
    
    // Guaranteed fallback button to YouTube (Always works)
    if (ytFallbackLink) {
        ytFallbackLink.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(selected.title + " official trailer")}`;
        ytFallbackLink.innerText = `▶️ Watch Official Trailer on YouTube`;
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
    
    syncListsToDatabase();
    alert("Action Recorded! Generate your next match now.");
    document.getElementById('result-box').style.display = 'none';
    document.getElementById('questionnaire-box').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

async function syncListsToDatabase() { 
    localStorage.setItem('match_seenList', JSON.stringify(seenList)); localStorage.setItem('match_savedList', JSON.stringify(savedList)); localStorage.setItem('match_dislikedList', JSON.stringify(dislikedList)); localStorage.setItem('match_userRatings', JSON.stringify(userRatings)); 
    if (isUserLoggedIn && supabaseClient) { await supabaseClient.auth.updateUser({ data: { seen_list: seenList, saved_list: savedList, disliked_list: dislikedList, user_ratings: userRatings } }); } 
}
