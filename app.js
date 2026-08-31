console.log("Mastercode 92.0: Vertical Drama & Micro-Novela AI Engine Active");

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

// Global Variables
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

// Utilities
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
    const tabLog = document.getElementById('tab-login');
    const tabSign = document.getElementById('tab-signup');
    const formLog = document.getElementById('form-login');
    const formSign = document.getElementById('form-signup');
    if(tabLog) tabLog.classList.remove('active'); if(tabSign) tabSign.classList.remove('active');
    if(formLog) formLog.classList.remove('active'); if(formSign) formSign.classList.remove('active');
    
    const activeTab = document.getElementById(`tab-${tab}`);
    const activeForm = document.getElementById(`form-${tab}`);
    if(activeTab) activeTab.classList.add('active'); if(activeForm) activeForm.classList.add('active');
};

window.signInWithGoogle = async function() { 
    if (!supabaseClient) return alert("Database client not initialized."); 
    const { error } = await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/profile/profile.html' } }); 
    if (error) alert("Google Login Error: " + error.message); 
};

window.handleEmailSignup = async function() {
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const msgEl = document.getElementById('auth-message');
    
    if(!email || !password) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = "Please provide an email and password."; return; }
    if (!supabaseClient) return;
    
    msgEl.style.display = 'block'; msgEl.style.color = '#fff'; msgEl.innerText = "Creating account...";

    const { error } = await supabaseClient.auth.signUp({ email, password });
    if(error) { 
        msgEl.style.color = '#ff5252'; msgEl.innerText = error.message; 
    } else { 
        msgEl.style.color = '#25D366'; msgEl.innerText = "Account created! Routing to Profile Hub to complete setup..."; 
        setTimeout(() => { window.location.href = '/profile/profile.html'; }, 1500); 
    }
};

window.handleEmailLogin = async function() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const msgEl = document.getElementById('auth-message');
    
    if(!email || !password) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = "Please enter email and password."; return; }
    msgEl.style.display = 'block'; msgEl.style.color = '#fff'; msgEl.innerText = "Authenticating...";

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if(error) { 
        msgEl.style.color = '#ff5252'; msgEl.innerText = error.message; 
    } else { 
        msgEl.style.color = '#25D366'; msgEl.innerText = "Welcome back! Routing to Home..."; 
        setTimeout(() => { window.location.reload(); }, 1000); 
    }
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
    if (!isUserLoggedIn && dailyCount >= 3) { 
        alert("🔒 You've used your 3 free anonymous matches today!\n\nPlease register for FREE to unlock your daily allowance and save titles!"); 
        window.openAuthModal(); return false; 
    }
    if (isUserLoggedIn && dailyCount >= 7) { 
        alert("💎 Daily limit reached!\n\nUpgrade to VIP for UNLIMITED matches and Ad-Free browsing!");
        window.location.href = '/pricing/pricing.html'; return false; 
    }
    
    dailyCount++; localStorage.setItem('match_dailyCount', dailyCount.toString()); return true;
}

async function fetchGeminiData(promptText) {
    if (!supabaseClient) throw new Error("Database client not initialized.");
    const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', { body: { prompt: promptText } });
    if (error || !data || !data.candidates) throw new Error(error?.message || "Gemini Proxy Request Failed");
    let rawText = data.candidates[0].content.parts[0].text;
    return JSON.parse(rawText.replace(/```json/gi, '').replace(/```/g, '').trim());
}

window.triggerMatch = async function(isSpecificSearch = false) {
    if (!checkDailyLimit()) return;

    const loadBox = document.getElementById('loading-box');
    if (loadBox) {
        loadBox.style.display = 'block';
        loadBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    let promptText = "";
    let exclusionList = seenList.map(item => item.title || item).join(', ');
    
    // NEW VERTICAL DRAMA ENGINE PROMPT
    const strictRules = `CRITICAL ENGINE RULES: 
    1. DO NOT recommend any title in this list: [${exclusionList}].
    2. "trailerId": Provide a REAL, VERIFIED 11-character YouTube video ID. If you do not know the exact real ID, output EXACTLY the word "SEARCH". Do NOT invent an ID.
    3. IF Platform is "Spotify", recommend a real Spotify Podcast or Playlist.
    4. IF Format is "microdrama", recommend an authentic vertical drama, short novela, or micro-drama from ReelShort, DramaBox, ShortMax, Kwai, TikTok, or Globoplay (e.g., "A Vida Secreta do Meu Marido Bilionário", "Nas Profundezas do Amor", "Fated to the Alpha").
    Output MUST be valid JSON: {"title": "Title", "synopsis": "3-sentence synopsis.", "platform": "Platform Name", "imdb": "Rating", "trailerId": "11-char-id OR SEARCH", "posterPath": "TMDB poster path starting with / or direct HTTPS poster cover image URL"}`;

    if (isSpecificSearch) {
        const input = document.getElementById('specific-search-input');
        if (!input || !input.value.trim()) { alert("Please enter a title to search."); loadBox.style.display = 'none'; return; }
        promptText = `You are an elite streaming concierge AI. Search for: "${input.value.trim()}". ${strictRules}`;
    } else {
        const cat = document.getElementById('q-category')?.value || 'any'; 
        const plat = document.getElementById('q-platform')?.value || 'any';
        const mood = document.getElementById('q-mood')?.value || 'any'; 
        promptText = `You are a streaming concierge AI. Find a highly-rated match based on: Format: ${cat}, Platform: ${plat}, Mood: ${mood}. ${strictRules}`;
    }

    const qBox = document.getElementById('questionnaire-box');
    const sBox = document.getElementById('search-box');
    if (qBox) qBox.style.display = 'none';
    if (sBox) sBox.style.display = 'none';

    let totalTime = isVIP || isAdFree ? 4 : 10; 
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
        console.error("AI Generation Engine Fallback:", err);
        matchResult = { 
            title: "A Vida Secreta do Meu Marido Bilionário", 
            synopsis: "A dramatic vertical micro-drama where a seemingly ordinary husband hides a massive billionaire empire from his wife, leading to intense reveals and romance.", 
            platform: "ReelShort", imdb: "8.6", trailerId: "SEARCH", posterPath: "https://placehold.co/500x750/0a0505/D4AF37/png?text=Billionaire+Husband" 
        };
    }

    let elapsedMs = Date.now() - startTimeMs;
    let remainingMs = (totalTime * 1000) - elapsedMs;
    if (remainingMs > 0) await new Promise(resolve => setTimeout(resolve, remainingMs));

    clearInterval(timerInterval);
    if (pBar) pBar.style.width = '100%';

    if (!seenList.some(i => (i.title || i) === matchResult.title)) {
        let storagePoster = `https://placehold.co/500x750/0a0505/D4AF37/png?text=${encodeURIComponent(matchResult.title)}`;
        if (matchResult.posterPath && matchResult.posterPath.startsWith('/')) {
            storagePoster = `https://image.tmdb.org/t/p/w500${matchResult.posterPath}`;
        } else if (matchResult.posterPath && matchResult.posterPath.startsWith('http')) {
            storagePoster = matchResult.posterPath;
        }
        seenList.push({ title: matchResult.title, posterUrl: storagePoster, platform: matchResult.platform });
        localStorage.setItem('match_seenList', JSON.stringify(seenList));
    }

    renderResult(matchResult);
};

function renderResult(selected) {
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
    
    const fallbackImage = `https://placehold.co/500x750/0a0505/D4AF37/png?text=${encodeURIComponent(selected.title)}`;
    
    if (selected.posterPath && selected.posterPath.startsWith('/')) {
        globalMatchPoster = `https://image.tmdb.org/t/p/w500${selected.posterPath}`;
    } else if (selected.posterPath && selected.posterPath.startsWith('http')) {
        globalMatchPoster = selected.posterPath;
    } else {
        globalMatchPoster = fallbackImage;
    }
    
    document.getElementById('res-title').innerText = selected.title;
    document.getElementById('res-synopsis').innerText = selected.synopsis;
    
    const posterEl = document.getElementById('res-poster-img');
    if (posterEl) {
        posterEl.src = globalMatchPoster;
        posterEl.onerror = function() { 
            this.onerror = null; 
            this.src = fallbackImage; 
        };
    }

    const badge = document.getElementById('res-platform-badge');
    badge.innerText = selected.platform;
    document.getElementById('res-imdb-badge').innerText = `IMDb/Rating: ${selected.imdb || 'N/A'}`;

    const directBtn = document.getElementById('res-direct-link');
    if (selected.platform.toLowerCase().includes('spotify')) {
        directBtn.href = `https://open.spotify.com/search/${encodeURIComponent(selected.title)}`;
        directBtn.innerText = `🎧 Open on Spotify`;
    } else if (selected.platform.toLowerCase().includes('reelshort')) {
        directBtn.href = `https://www.reelshort.com/`;
        directBtn.innerText = `📱 Open on ReelShort`;
    } else if (selected.platform.toLowerCase().includes('dramabox')) {
        directBtn.href = `https://www.dramabox.com/`;
        directBtn.innerText = `📺 Open on DramaBox`;
    } else {
        directBtn.href = `https://www.google.com/search?q=Watch+${encodeURIComponent(selected.title)}+on+${encodeURIComponent(selected.platform)}`;
        directBtn.innerText = `▶ Stream on ${selected.platform}`;
    }

    const trailerBox = document.getElementById('res-trailer-container');
    const iframe = document.getElementById('res-trailer');
    const ytFallbackLink = document.getElementById('res-trailer-fallback');
    
    if (trailerBox && iframe) {
        trailerBox.style.display = 'block';
        if (selected.trailerId && selected.trailerId.length === 11 && selected.trailerId !== 'SEARCH') {
            iframe.src = `https://www.youtube-nocookie.com/embed/${selected.trailerId}?rel=0&modestbranding=1`;
        } else {
            iframe.src = `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(selected.title + " trailer episode 1")}`;
        }
        if (ytFallbackLink) {
            ytFallbackLink.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(selected.title + " official trailer")}`;
        }
    }
}

window.recordAction = function(type) {
    if (!globalMatchTitle) return;
    if (!isUserLoggedIn) {
        alert("💎 Join for FREE!\n\nTo save titles & covers to your Portfolio, please create a free account.");
        window.openAuthModal(); return;
    }

    const itemObj = { title: globalMatchTitle, posterUrl: globalMatchPoster, platform: globalPlatform };
    const existsInList = (list) => list.some(i => (i.title || i) === globalMatchTitle);

    if (type === 'save') {
        if (!existsInList(savedList)) savedList.push(itemObj);
        alert(`⭐ "${globalMatchTitle}" saved to your Portfolio!`);
    } else if (type === 'seen') {
        if (!existsInList(seenList)) seenList.push(itemObj);
    } else if (type === 'like') {
        userRatings[globalMatchTitle] = 5;
        if (!existsInList(seenList)) seenList.push(itemObj);
    } else if (type === 'dislike') {
        userRatings[globalMatchTitle] = 1;
        if (!existsInList(dislikedList)) dislikedList.push(itemObj);
    }
    
    syncListsToDatabase();
    alert("Action Recorded! Generate your next match now.");
    document.getElementById('result-box').style.display = 'none';
    document.getElementById('questionnaire-box').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

async function syncListsToDatabase() { 
    localStorage.setItem('match_seenList', JSON.stringify(seenList)); 
    localStorage.setItem('match_savedList', JSON.stringify(savedList)); 
    localStorage.setItem('match_dislikedList', JSON.stringify(dislikedList)); 
    localStorage.setItem('match_userRatings', JSON.stringify(userRatings)); 
    
    if (isUserLoggedIn && supabaseClient) { 
        await supabaseClient.auth.updateUser({ 
            data: { seen_list: seenList, saved_list: savedList, disliked_list: dislikedList, user_ratings: userRatings } 
        }); 
    } 
}
