console.log("Mastercode 102: OS-Level DeepLinks, Never-Fail Covers, & Premium FX Active");

const SUPABASE_URL = 'https://zkymvqrmbabngsqblyye.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpreW12cXJtYmFibmdzcWJseXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDUyNDIsImV4cCI6MjEwMjM4MTI0Mn0._yEVFMfwVU6GBqQ8m3ljfOgA0HSLEDiKMOfYae6ZD8Q';

let supabaseClient = null;
try { if (window.supabase) supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch (e) {}
window.supabaseClient = supabaseClient;

let globalMatchTitle = ""; let globalMatchPoster = ""; let globalPlatform = ""; let isUserLoggedIn = false;
let isVIP = localStorage.getItem('match_isVIP') === 'true';

// ----------------------------------------------------
// THE LIMIT LOGIC (3 Free, 5 Registered, 10 VIP)
// ----------------------------------------------------
function checkDailyLimit() {
    const todayStr = new Date().toLocaleDateString(); 
    let lastDate = localStorage.getItem('match_lastDate'); 
    let dailyCount = parseInt(localStorage.getItem('match_dailyCount') || '0');
    
    if (lastDate !== todayStr) { dailyCount = 0; localStorage.setItem('match_lastDate', todayStr); }
    
    let maxLimit = 3; 
    if (isUserLoggedIn && !isVIP) maxLimit = 5; 
    if (isVIP) maxLimit = 10; 
    
    if (dailyCount >= maxLimit) {
        if (!isUserLoggedIn) {
            alert("🔒 You've used your 3 free searches today!\n\nRegister for FREE to unlock 5 daily searches."); 
            window.openAuthModal();
        } else if (!isVIP) {
            alert("🔒 You've used your 5 registered searches today!\n\nUpgrade to VIP for 10 daily searches."); 
            window.location.href = '/pricing/pricing.html';
        } else {
            alert("💎 VIP Limit Reached! You've used your 10 daily searches.");
        }
        return false;
    }
    
    dailyCount++; 
    localStorage.setItem('match_dailyCount', dailyCount.toString()); 
    return true;
}

// ----------------------------------------------------
// AUDIO & FX ENGINE
// ----------------------------------------------------
window.playPremiumSound = function() {
    try { 
        const ctx = new (window.AudioContext || window.webkitAudioContext)(); 
        const osc = ctx.createOscillator(); 
        const gain = ctx.createGain(); 
        osc.connect(gain); gain.connect(ctx.destination); 
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(600, ctx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); 
        gain.gain.setValueAtTime(0.3, ctx.currentTime); 
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2); 
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2); 
    } catch (e) { console.log("Audio FX skipped"); }
};

// ----------------------------------------------------
// "NEVER-FAIL" COVER DICTIONARY & GENERATOR
// ----------------------------------------------------
const OFFLINE_COVERS = {
    "The Bear": "https://image.tmdb.org/t/p/w500/q2gJGrH0aGZ1X1qP440xQzKqOee.jpg",
    "Shogun": "https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WwSCSOOOQ.jpg",
    "House of the Dragon": "https://image.tmdb.org/t/p/w500/t9XkeE7HzOsdQcOGaTOFdZCEYnF.jpg",
    "Deadpool & Wolverine": "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    "Dune: Part Two": "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGjjc9CW.jpg",
    "A Vida Secreta do Meu Marido Bilionário": "https://image.tmdb.org/t/p/w500/j9w5l2X4XhQx2J6p3N0V9a8S7g.jpg",
    "Marido Bilionário": "https://image.tmdb.org/t/p/w500/j9w5l2X4XhQx2J6p3N0V9a8S7g.jpg",
    "Fated to the Alpha": "https://image.tmdb.org/t/p/w500/8A1H55bC2m3n9P5D5d7lH2eO0O2.jpg",
    "The Joe Rogan Experience": "https://image.tmdb.org/t/p/w500/7aPRJUKFtdh6Qy8n3JpEqqV5m3W.jpg",
    "Jujutsu Kaisen": "https://image.tmdb.org/t/p/w500/hFWP5HkbVEe40hrptlzSyDpFBqw.jpg",
    "Queen of Tears": "https://image.tmdb.org/t/p/w500/8A1H55bC2m3n9P5D5d7lH2eO0O2.jpg"
};

async function getRealCoverImage(title) {
    // 1. Offline Dictionary
    const matchKey = Object.keys(OFFLINE_COVERS).find(k => title.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(title.toLowerCase()));
    if (matchKey) return OFFLINE_COVERS[matchKey];

    // 2. iTunes Search API (Ultra-Reliable CORS)
    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(title)}&media=movie&limit=1`);
        if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) return data.results[0].artworkUrl100.replace('100x100bb', '600x900bb');
        }
    } catch(e) {}
    
    // 3. TVMaze Fetch
    try {
        const tvRes = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(title)}`);
        if (tvRes.ok) { 
            const tvData = await tvRes.json(); 
            if (tvData && tvData.image && tvData.image.original) return tvData.image.original; 
        }
    } catch(e) {}
    
    // 4. ABSOLUTE FALLBACK: Dynamic Text Image Generator (Impossible to fail)
    return `https://placehold.co/600x900/1a0505/E5C158?text=${encodeURIComponent(title.replace(/ /g, '+'))}`;
}

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
    ['login', 'signup'].forEach(t => { document.getElementById(`tab-${t}`)?.classList.remove('active'); document.getElementById(`form-${t}`)?.classList.remove('active'); });
    document.getElementById(`tab-${tab}`)?.classList.add('active'); document.getElementById(`form-${tab}`)?.classList.add('active');
};

// ----------------------------------------------------
// AUTH LOGIC
// ----------------------------------------------------
window.handleEmailSignup = async function() {
    const email = document.getElementById('reg-email').value.trim(); 
    const password = document.getElementById('reg-password').value; 
    const msgEl = document.getElementById('auth-message');
    
    if (!supabaseClient) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = "Database connection offline."; return; }
    if(!email || !password) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = "Please provide an email and password."; return; }
    
    msgEl.style.display = 'block'; msgEl.style.color = '#fff'; msgEl.style.background = 'rgba(229,193,88,0.2)'; msgEl.innerText = "Creating account...";
    
    try {
        const { error } = await supabaseClient.auth.signUp({ email, password });
        if(error) { 
            msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = error.message; 
        } else { 
            msgEl.style.color = '#25D366'; msgEl.style.background = 'rgba(37,211,102,0.1)'; msgEl.innerText = "Account created! Routing to Profile Hub..."; 
            setTimeout(() => { window.location.href = '/profile/profile.html'; }, 1500); 
        }
    } catch(err) {
        msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = "Critical registration error.";
    }
};

window.handleEmailLogin = async function() {
    const email = document.getElementById('login-email').value.trim(); 
    const password = document.getElementById('login-password').value; 
    const msgEl = document.getElementById('auth-message');
    
    if (!supabaseClient) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = "Database connection offline."; return; }
    if(!email || !password) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = "Please enter email and password."; return; }
    
    msgEl.style.display = 'block'; msgEl.style.color = '#fff'; msgEl.style.background = 'rgba(229,193,88,0.2)'; msgEl.innerText = "Authenticating...";
    
    try {
        const { error, data } = await supabaseClient.auth.signInWithPassword({ email, password });
        if(error) { 
            msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = error.message; 
        } else if (data.user) { 
            msgEl.style.color = '#25D366'; msgEl.style.background = 'rgba(37,211,102,0.1)'; msgEl.innerText = "Welcome back! Routing to Home..."; 
            setTimeout(() => { window.location.reload(); }, 1000); 
        }
    } catch(err) {
        msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = "Critical authentication error.";
    }
};

window.doLogout = async function() { if (supabaseClient) { await supabaseClient.auth.signOut(); } localStorage.clear(); window.location.href = '/index.html'; };

if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
            isUserLoggedIn = true;
            document.getElementById('nav-reg-btn').style.display = 'none'; 
            document.getElementById('nav-logout-btn').style.display = 'inline-block';
            document.getElementById('profile-link-tab').style.display = 'inline-flex';
        }
    });
}

// ----------------------------------------------------
// AI MATCH EXECUTION
// ----------------------------------------------------
async function fetchGeminiData(promptText) {
    if (!supabaseClient) throw new Error("Database not connected");
    const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', { body: { prompt: promptText } });
    if (error || !data || !data.candidates) throw new Error("API Error");
    
    let rawText = data.candidates[0].content.parts[0].text;
    let startIndex = rawText.indexOf('{'); let endIndex = rawText.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) { return JSON.parse(rawText.substring(startIndex, endIndex + 1)); }
    throw new Error("Invalid format");
}

window.triggerMatch = async function(isSpecificSearch = false) {
    if (!checkDailyLimit()) return;
    
    const loadBox = document.getElementById('loading-box'); 
    const qBox = document.getElementById('questionnaire-box'); 
    const sBox = document.getElementById('search-box');
    const resultBox = document.getElementById('result-box');

    if (resultBox) resultBox.style.display = 'none';
    if (qBox) qBox.style.display = 'none'; 
    if (sBox) sBox.style.display = 'none';
    
    if (loadBox) { 
        loadBox.style.display = 'block'; 
        setTimeout(() => loadBox.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }

    let promptText = "";
    if (isSpecificSearch) {
        const input = document.getElementById('specific-search-input');
        if (!input || !input.value.trim()) { window.location.reload(); return; }
        promptText = `Find streaming information strictly for "${input.value.trim()}". Output valid JSON ONLY: {"title": "Exact Title Found", "synopsis": "A 2 sentence summary.", "platform": "Primary platform to watch it on"}`;
    } else {
        let cat = document.getElementById('q-category')?.value || 'any'; 
        let plat = document.getElementById('q-platform')?.value || 'any'; 
        let mood = document.getElementById('q-mood')?.value || 'any'; 
        promptText = `Find a perfect title recommendation based on: Format: ${cat}, Platform: ${plat}, Mood: ${mood}. Output valid JSON ONLY: {"title": "Title", "synopsis": "Summary.", "platform": "Platform"}`;
    }

    const startTime = Date.now();
    const MIN_WAIT_MS = (isVIP) ? 3000 : 13500;
    
    const pBar = document.getElementById('ai-progress-bar');
    if (pBar) pBar.style.width = '0%';
    let timerInterval = setInterval(() => {
        let pct = Math.min(((Date.now() - startTime) / MIN_WAIT_MS) * 95, 95);
        if (pBar) pBar.style.width = pct + '%';
    }, 100);

    let matchResult = null;
    try {
        matchResult = await fetchGeminiData(promptText);
    } catch (err) {
        matchResult = { title: isSpecificSearch ? document.getElementById('specific-search-input').value : "The Bear", synopsis: "Stream this popular title now.", platform: "Web" };
    }

    let timeSpent = Date.now() - startTime;
    if (timeSpent < MIN_WAIT_MS) await new Promise(resolve => setTimeout(resolve, MIN_WAIT_MS - timeSpent));

    if (pBar) pBar.style.width = '100%';
    clearInterval(timerInterval);
    
    renderResult(matchResult, isSpecificSearch);
};

// ----------------------------------------------------
// THE RENDER ENGINE (Bulletproof Image Swap & YouTube Box)
// ----------------------------------------------------
async function renderResult(selected, isSpecificSearch) {
    const loadBox = document.getElementById('loading-box'); const resultBox = document.getElementById('result-box');
    if (loadBox) loadBox.style.display = 'none';
    resultBox.style.display = 'block'; resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // TRIGGER PREMIUM FX
    window.playPremiumSound();
    if (typeof confetti !== 'undefined') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#E5C158', '#FFF', '#8A2BE2', '#E50914'] });

    document.getElementById('res-title').innerText = selected.title; 
    document.getElementById('res-synopsis').innerText = selected.synopsis;
    document.getElementById('res-platform-badge').innerText = selected.platform;

    // "NEVER FAIL" COVER PULL
    const posterEl = document.getElementById('res-poster-img'); 
    const realCover = await getRealCoverImage(selected.title);
    posterEl.style.display = 'block';
    
    // In case somehow the browser blocks the valid URL, it falls back to the dynamic generator directly inside the DOM
    posterEl.onerror = function() { 
        this.onerror = null; 
        this.src = `https://placehold.co/600x900/1a0505/E5C158?text=${encodeURIComponent(selected.title.replace(/ /g, '+'))}`; 
    };
    posterEl.src = realCover; 

    // DIRECT LINK SETUP
    const directBtn = document.getElementById('res-direct-link');
    if (selected.platform.toLowerCase().includes('spotify')) { 
        directBtn.href = `https://open.spotify.com/search/${encodeURIComponent(selected.title)}`; 
    } else if (selected.platform.toLowerCase().includes('reelshort')) { 
        directBtn.href = `https://www.reelshort.com/`; 
    } else if (selected.platform.toLowerCase().includes('dramabox')) { 
        directBtn.href = `https://www.dramabox.com/`; 
    } else { 
        directBtn.href = `https://www.google.com/search?q=Watch+${encodeURIComponent(selected.title)}+on+${encodeURIComponent(selected.platform)}`; 
    }

    // YOUTUBE BOX SETUP (No more broken iframes)
    const trailerContainer = document.getElementById('res-trailer-container');
    const ytLink = document.getElementById('yt-trailer-link');
    
    if (isSpecificSearch) {
        trailerContainer.style.display = 'none';
    } else {
        trailerContainer.style.display = 'block';
        ytLink.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(selected.title + " official trailer")}`;
    }
}
