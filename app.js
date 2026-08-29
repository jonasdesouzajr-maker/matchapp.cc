console.log("Mastercode 82.0: Adsterra API Token & Smartlink Monetization Injected");

// ==========================================
// 1. SUPABASE LIVE INITIALIZATION
// ==========================================
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

// ==========================================
// ADSTERRA MONETIZATION CONFIGURATION
// ==========================================
const API_KEY_ADSTERRA = '3ff95a977cddd2b1b865c9186acdd8de'; 
const ADSTERRA_SMARTLINK = 'https://brunettesir.com/z1sa7fhf?key=58a1ba12988b562f63b85c00cb649448';

let globalMatchTitle = "MatchApp";
let isUserLoggedIn = false;

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let dislikedList = JSON.parse(localStorage.getItem('match_dislikedList') || '[]');
let userRatings = JSON.parse(localStorage.getItem('match_userRatings') || '{}');

let isAdFree = localStorage.getItem('match_adFree') === 'true'; 
let isVIP = localStorage.getItem('match_isVIP') === 'true';

(function checkStripePaymentReturn() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
        const plan = params.get('plan');
        if (plan === 'vip_monthly') {
            localStorage.setItem('match_isVIP', 'true');
            isVIP = true;
        } else if (plan === 'ad_free') {
            localStorage.setItem('match_adFree', 'true');
            isAdFree = true;
        }
        
        if (supabaseClient) {
            supabaseClient.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    supabaseClient.from('profiles').upsert({
                        id: user.id,
                        is_vip: isVIP,
                        is_ad_free: isAdFree,
                        updated_at: new Date().toISOString()
                    });
                }
            });
        }

        setTimeout(() => {
            if (typeof window.fireConfetti === 'function') window.fireConfetti();
            if (typeof window.playPremiumSound === 'function') window.playPremiumSound();
            alert("🎉 Payment Successful!\n\nYour account features have been permanently unlocked. Enjoy unlimited, ad-free AI matching!");
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 800);
    }
})();

function updateClock() { 
    try {
        const clock = document.getElementById('real-time-clock'); 
        if (clock) { 
            const now = new Date(); 
            clock.innerHTML = `${now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} | ${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`; 
        } 
    } catch(e) {}
}
updateClock();
setInterval(updateClock, 1000);

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
    if (typeof confetti !== 'undefined') {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#D4AF37', '#FFF', '#8A2BE2', '#E50914'], zIndex: 9999 });
    }
};

window.openAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'flex'; };
window.closeAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'none'; };

window.switchAuthTab = function(tab) {
    const tabLog = document.getElementById('tab-login');
    const tabSign = document.getElementById('tab-signup');
    const formLog = document.getElementById('form-login');
    const formSign = document.getElementById('form-signup');
    
    if(tabLog) tabLog.classList.remove('active');
    if(tabSign) tabSign.classList.remove('active');
    if(formLog) formLog.classList.remove('active');
    if(formSign) formSign.classList.remove('active');
    
    const activeTab = document.getElementById(`tab-${tab}`);
    const activeForm = document.getElementById(`form-${tab}`);
    if(activeTab) activeTab.classList.add('active');
    if(activeForm) activeForm.classList.add('active');
};

window.signInWithGoogle = async function() { 
    if (!supabaseClient) { alert("Server connection failed. Database client not initialized."); return; } 
    const { error } = await supabaseClient.auth.signInWithOAuth({ 
        provider: 'google', 
        options: { 
            redirectTo: window.location.origin + '/profile/profile.html',
            scopes: 'https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/user.gender.read'
        } 
    }); 
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
        msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = "Server error: Database not connected."; return;
    }
    msgEl.style.display = 'block'; msgEl.style.color = '#fff'; msgEl.innerText = "Connecting...";

    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if(error) { 
        msgEl.style.color = '#ff5252'; msgEl.innerText = error.message; 
    } else { 
        msgEl.style.color = '#25D366'; msgEl.innerText = "Account created successfully! Redirecting..."; 
        if(typeof gtag === 'function') gtag('event', 'sign_up', { method: 'email' });
        setTimeout(() => { window.location.href = '/profile/profile.html'; }, 1500); 
    }
};

window.handleEmailLogin = async function() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const msgEl = document.getElementById('auth-message');
    
    if(!email || !password) { 
        msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = "Please enter email and password."; return; 
    }
    if (!supabaseClient) {
        msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = "Server error: Database not connected."; return;
    }
    msgEl.style.display = 'block'; msgEl.style.color = '#fff'; msgEl.innerText = "Authenticating...";

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if(error) { 
        msgEl.style.color = '#ff5252'; msgEl.innerText = error.message; 
    } else { 
        msgEl.style.color = '#25D366'; msgEl.innerText = "Login successful! Routing to Hub..."; 
        if(typeof gtag === 'function') gtag('event', 'login', { method: 'email' });
        setTimeout(() => { window.location.href = '/profile/profile.html'; }, 1000); 
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
            const meta = user.user_metadata || {};

            try {
                const fullName = meta.full_name || meta.name || '';
                const avatarUrl = meta.avatar_url || meta.picture || '';
                const email = user.email || '';

                await supabaseClient.from('profiles').upsert({
                    id: user.id,
                    email: email,
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id', ignoreDuplicates: true });
            } catch(e) {}

            const regBtn = document.getElementById('nav-reg-btn');
            const profTab = document.getElementById('profile-link-tab');
            const logoutBtn = document.getElementById('nav-logout-btn');
            const upgradeBtn = document.getElementById('nav-upgrade-btn');
            const profPic = document.getElementById('profile-pic-preview');

            if (meta.avatar_url || meta.picture) {
                if (profPic) profPic.src = meta.avatar_url || meta.picture;
            }
            
            if (regBtn) regBtn.style.display = 'none';
            if (profTab) profTab.style.display = 'inline-flex';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (upgradeBtn) { upgradeBtn.style.display = 'inline-flex'; if (isVIP || isAdFree) upgradeBtn.innerText = '👑 VIP Active'; }
        } else { isUserLoggedIn = false; }
    });
}

function checkDailyLimit() {
    if (isVIP || isAdFree) return true; 
    const todayStr = new Date().toLocaleDateString(); 
    let lastDate = localStorage.getItem('match_lastDate'); 
    let dailyCount = parseInt(localStorage.getItem('match_dailyCount') || '0');
    
    if (lastDate !== todayStr) { dailyCount = 0; localStorage.setItem('match_lastDate', todayStr); }
    if (!isUserLoggedIn && dailyCount >= 5) { 
        alert("🔒 You've used your 5 free matches today!\n\nPlease register to unlock your next daily allowance!"); 
        window.openAuthModal(); 
        return false; 
    }
    if (isUserLoggedIn && dailyCount >= 5) { window.location.href = '/pricing/pricing.html'; return false; }
    
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
    if (window.checkAdBlocker && window.adblockEnabled) return; 
    if (!checkDailyLimit()) return;

    let promptText = "";
    const randomSeed = Math.floor(Math.random() * 999999); 
    
    if (isSpecificSearch) {
        const input = document.getElementById('specific-search-input');
        if (!input) return;
        const query = input.value.trim();
        if(!query) { alert("Please enter a title to search."); return; }
        
        if(typeof gtag === 'function') gtag('event', 'search', { search_term: query });
        promptText = `You are a streaming concierge AI in late 2026. The user is searching for where to stream: "${query}". Find the exact streaming platform where it is currently available. Random seed for processing variant: ${randomSeed}. Output MUST be exactly: {"title": "Correct Title", "synopsis": "A compelling 3-4 sentence extended synopsis.", "platform": "The exact streaming service", "imdb": "IMDb rating as a string", "trailerId": "Exact 11-character YouTube video ID of the official trailer"}`;
    } else {
        const cat = document.getElementById('q-category')?.value || 'any'; 
        const plat = document.getElementById('q-platform')?.value || 'any';
        const mood = document.getElementById('q-mood')?.value || 'any'; 
        const aest = document.getElementById('q-aesthetic')?.value || 'any'; 
        const pac = document.getElementById('q-pacing')?.value || 'any';
        
        if(typeof gtag === 'function') gtag('event', 'ai_match_requested');
        const excludeStr = [...seenList, ...dislikedList].join(', ');
        
        promptText = `You are a streaming concierge AI in late 2026. Find a highly-rated, hidden gem streaming title based on: Format: ${cat}, Platform: ${plat}, Mood: ${mood}, Aesthetic: ${aest}, Pacing: ${pac}. CRITICAL: Do NOT recommend any of these titles ever again: ${excludeStr}. RANDOMIZATION SEED: ${randomSeed}. You MUST scour your catalog globally and provide a highly unique recommendation different from defaults. Output MUST be a valid JSON object matching exactly: {"title": "Title of movie/series", "synopsis": "A compelling 3-4 sentence extended synopsis.", "platform": "The streaming service", "imdb": "IMDb rating as a string", "trailerId": "Exact 11-character YouTube video ID (must be working embeddable)"}`;
    }

    const qBox = document.getElementById('questionnaire-box');
    const sBox = document.getElementById('search-box');
    const rBox = document.getElementById('result-box');
    if (qBox) qBox.style.display = 'none';
    if (sBox) sBox.style.display = 'none';
    if (rBox) rBox.style.display = 'none';
    
    const loadBox = document.getElementById('loading-box');
    if (!loadBox) return;
    loadBox.style.display = 'block';

    let totalTime = isVIP || isAdFree ? 4 : 20; 
    let startTimeMs = Date.now();
    
    const pBar = document.getElementById('ai-progress-bar');
    const tSim = document.getElementById('ad-timer-sim');
    const freeAds = document.getElementById('free-loading-ads');
    const vipMsg = document.getElementById('vip-loading-msg');
    
    if (pBar) pBar.style.width = '0%';
    if (tSim) tSim.innerText = totalTime;
    
    if (!isVIP && !isAdFree) {
        if(freeAds) freeAds.style.display = 'flex';
        if(vipMsg) vipMsg.style.display = 'none';
    } else {
        if(freeAds) freeAds.style.display = 'none';
        if(vipMsg) vipMsg.style.display = 'block';
    }

    let timerInterval = setInterval(() => {
        let elapsed = (Date.now() - startTimeMs) / 1000;
        let pct = Math.min((elapsed / totalTime) * 100, 100);
        if (pBar) pBar.style.width = pct + '%';
        if (tSim) tSim.innerText = Math.max(Math.ceil(totalTime - elapsed), 0);
    }, 50);

    let matchResult = null;
    
    try {
        matchResult = await fetchGeminiData(promptText);
    } catch (err) {
        console.error("AI Fallback Invoked.");
        const fallbacks = [
            { title: "Dune: Part Two", synopsis: "Paul Atreides unites with Chani and the Fremen on a warpath of revenge against the conspirators who destroyed his family.", platform: "Max", imdb: "8.6", trailerId: "U2Qp5pL3ovA" },
            { title: "Severance", synopsis: "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.", platform: "Apple TV+", imdb: "8.7", trailerId: "xEQP4VVukv8" },
            { title: "Shōgun", synopsis: "When a mysterious European ship is found marooned in a nearby fishing village, Lord Yoshii Toranaga discovers secrets that could tip the scales of power.", platform: "Hulu", imdb: "8.7", trailerId: "yAN5uspO_hk" },
            { title: "Fallout", synopsis: "In a future, post-apocalyptic Los Angeles brought about by nuclear decimation, citizens must live in underground bunkers to protect themselves.", platform: "Prime Video", imdb: "8.4", trailerId: "V-mugKDQRug" },
            { title: "Dark Matter", synopsis: "A physicist is abducted into an alternate version of his life. To get back to his true family, he must embark on a harrowing journey to save them.", platform: "Apple TV+", imdb: "7.7", trailerId: "j6ucGbOkaG8" }
        ];
        matchResult = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    let elapsedMs = Date.now() - startTimeMs;
    let remainingMs = (totalTime * 1000) - elapsedMs;
    if (remainingMs > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingMs));
    }

    clearInterval(timerInterval);
    if (pBar) pBar.style.width = '100%';
    renderResult(matchResult);
};

function renderResult(selected) {
    const loadBox = document.getElementById('loading-box');
    const resultBox = document.getElementById('result-box');
    if (loadBox) loadBox.style.display = 'none';
    if (!resultBox) return;
    
    const actionGrid = document.getElementById('action-btn-grid');
    if(actionGrid) {
        actionGrid.innerHTML = `
            <button onclick="recordAction('save')" class="secondary-btn" style="border-color: var(--gold); color: var(--gold-glow);">⭐ Watch Later</button>
            <button onclick="recordAction('seen')" class="secondary-btn" style="border-color: #25D366; color: #25D366;">✔️ Seen It</button>
            <button onclick="recordAction('like')" class="secondary-btn" style="border-color: #2196F3; color: #2196F3;">👍 Like</button>
            <button onclick="recordAction('dislike')" class="secondary-btn" style="border-color: #ff5252; color: #ff5252;">👎 Don't Like</button>
        `;
    }

    resultBox.style.display = 'block';
    
    window.playPremiumSound();
    window.fireConfetti();

    globalMatchTitle = selected.title;
    
    document.querySelectorAll('.star-rating-container .star').forEach(s => s.classList.remove('selected'));

    const titleEl = document.getElementById('res-title');
    const synEl = document.getElementById('res-synopsis');
    if (titleEl) titleEl.innerText = selected.title;
    if (synEl) synEl.innerText = selected.synopsis;

    const badge = document.getElementById('res-platform-badge');
    if (badge) {
        badge.innerText = selected.platform;
        const pLower = selected.platform.toLowerCase();
        if (pLower.includes('netflix')) badge.style.background = '#E50914';
        else if (pLower.includes('max') || pLower.includes('hbo')) badge.style.background = '#8A2BE2';
        else if (pLower.includes('prime')) badge.style.background = '#00A8E1';
        else if (pLower.includes('disney')) badge.style.background = '#113CCF';
        else if (pLower.includes('hulu')) badge.style.background = '#1ce783';
        else if (pLower.includes('peacock')) badge.style.background = '#ffffff';
        else if (pLower.includes('crunchyroll')) badge.style.background = '#f47521';
        else if (pLower.includes('paramount')) badge.style.background = '#0064ff';
        else if (pLower.includes('apple')) badge.style.background = '#fff'; 
        else badge.style.background = 'var(--gold)';
        
        badge.style.color = (pLower.includes('apple') || pLower.includes('peacock')) ? '#000' : '#fff';
    }

    const imdbBadge = document.getElementById('res-imdb-badge');
    if(imdbBadge) imdbBadge.innerText = `IMDb: ${selected.imdb || 'N/A'}`;

    const directBtn = document.getElementById('res-direct-link');
    if (directBtn) {
        directBtn.href = `https://www.google.com/search?q=Watch+${encodeURIComponent(selected.title)}+on+${encodeURIComponent(selected.platform)}`;
        directBtn.innerText = `▶ Search on ${selected.platform}`;
    }

    const trailerBox = document.getElementById('res-trailer-container');
    const iframe = document.getElementById('res-trailer');
    const fallbackBtn = document.getElementById('res-trailer-fallback');
    
    if (trailerBox && iframe && selected.trailerId) {
        trailerBox.style.display = 'block';
        iframe.src = `https://www.youtube.com/embed/${selected.trailerId}?modestbranding=1&rel=0`;
        if (fallbackBtn) {
            fallbackBtn.href = `https://youtu.be/${selected.trailerId}`;
        }
    } else if (trailerBox) {
        trailerBox.style.display = 'none';
    }
    
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.recordAction = function(type) {
    if (!globalMatchTitle) return;

    if (type === 'save') {
        if (!savedList.includes(globalMatchTitle)) savedList.push(globalMatchTitle);
        alert(`⭐ "${globalMatchTitle}" saved to your Portfolio!`);
    } else if (type === 'seen') {
        if (!seenList.includes(globalMatchTitle)) seenList.push(globalMatchTitle);
    } else if (type === 'like') {
        userRatings[globalMatchTitle] = 5;
        if (!seenList.includes(globalMatchTitle)) seenList.push(globalMatchTitle);
    } else if (type === 'dislike') {
        userRatings[globalMatchTitle] = 1;
        if (!dislikedList.includes(globalMatchTitle)) dislikedList.push(globalMatchTitle);
    }
    
    syncListsToDatabase();
    if(typeof renderProfileGrids === 'function') renderProfileGrids();

    const actionGrid = document.getElementById('action-btn-grid');
    if (actionGrid) {
        actionGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 20px; background: rgba(37,211,102,0.1); border: 1px solid #25D366; border-radius: 12px; margin-bottom: 10px; animation: fadeIn 0.4s ease;">
                <h4 style="color:#25D366; margin:0 0 10px 0; font-size: 18px;">✅ Action Recorded!</h4>
                <p style="color:#ddd; font-size:14px; margin:0 0 15px 0;">Would you like to generate a new AI match?</p>
                <div style="display:flex; gap:10px; justify-content:center; flex-wrap: wrap;">
                    <button onclick="document.getElementById('result-box').style.display='none'; triggerMatch(false);" class="gold-btn" style="padding:10px 20px;">Yes, Match Again 🔄</button>
                    <button onclick="window.location.href='/profile/profile.html'" class="secondary-btn" style="padding:10px 20px; border-color: #fff; color: #fff;">View My Hub 📂</button>
                </div>
            </div>
        `;
    }
};

document.addEventListener('click', function (event) {
    const star = event.target.closest('.star');
    if (!star) return;

    const rating = parseInt(star.getAttribute('data-value'));
    const container = star.closest('.star-rating-container');
    if (!container) return;

    container.querySelectorAll('.star').forEach(s => {
        const val = parseInt(s.getAttribute('data-value'));
        if (val <= rating) {
            s.classList.add('selected');
        } else {
            s.classList.remove('selected');
        }
    });

    if (globalMatchTitle) { 
        userRatings[globalMatchTitle] = rating; 
        if (!seenList.includes(globalMatchTitle)) seenList.push(globalMatchTitle); 
        syncListsToDatabase(); 
        if(typeof renderProfileGrids === 'function') renderProfileGrids(); 
    }
});

async function syncListsToDatabase() { 
    localStorage.setItem('match_seenList', JSON.stringify(seenList)); 
    localStorage.setItem('match_savedList', JSON.stringify(savedList)); 
    localStorage.setItem('match_dislikedList', JSON.stringify(dislikedList)); 
    localStorage.setItem('match_userRatings', JSON.stringify(userRatings)); 
    
    if (isUserLoggedIn && supabaseClient) { 
        await supabaseClient.auth.updateUser({ 
            data: { 
                seen_list: seenList, 
                saved_list: savedList, 
                disliked_list: dislikedList, 
                user_ratings: userRatings 
            } 
        }); 
    } 
}
