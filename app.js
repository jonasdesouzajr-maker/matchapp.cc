console.log("Mastercode 88.0: Full Auth, TMDB Covers, SEO & Ads Active");

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
// GOOGLE CONSENT MODE V2
// ==========================================
(function initConsentMode() {
    const consentStatus = localStorage.getItem('matchapp_cookie_consent');
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}

    if (consentStatus === 'granted') {
        gtag('consent', 'update', { 'ad_storage': 'granted', 'ad_user_data': 'granted', 'ad_personalization': 'granted', 'analytics_storage': 'granted' });
        return; 
    }
    window.addEventListener('DOMContentLoaded', () => {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = `
            <div style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 600px; background: rgba(10,5,5,0.95); border: 1px solid var(--gold); border-radius: 12px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.9); z-index: 10000; text-align: center; backdrop-filter: blur(10px);">
                <h4 style="color: var(--gold); margin: 0 0 10px 0; font-size: 16px;">🍪 Privacy & Analytics</h4>
                <p style="color: #ccc; font-size: 13px; line-height: 1.5; margin-bottom: 15px;">We use cookies and Google Analytics to personalize content, tailor ads, and improve your streaming concierge experience globally.</p>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button id="btn-accept-cookies" class="gold-btn" style="padding: 8px 16px; font-size: 13px;">Accept All & Continue</button>
                    <a href="/consent.html" class="secondary-btn" style="padding: 8px 16px; font-size: 13px; text-decoration: none; border-color: #555; color: #bbb;">Review Privacy Policy</a>
                </div>
            </div>
        `;
        document.body.appendChild(banner);
        document.getElementById('btn-accept-cookies').addEventListener('click', () => {
            gtag('consent', 'update', { 'ad_storage': 'granted', 'ad_user_data': 'granted', 'ad_personalization': 'granted', 'analytics_storage': 'granted' });
            localStorage.setItem('matchapp_cookie_consent', 'granted');
            banner.style.display = 'none';
        });
    });
})();

// ==========================================
// APP VARIABLES
// ==========================================
let globalMatchTitle = "";
let globalMatchPoster = "";
let isUserLoggedIn = false;

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let dislikedList = JSON.parse(localStorage.getItem('match_dislikedList') || '[]');
let userRatings = JSON.parse(localStorage.getItem('match_userRatings') || '{}');

let isAdFree = localStorage.getItem('match_adFree') === 'true'; 
let isVIP = localStorage.getItem('match_isVIP') === 'true';

// Utilities
function updateClock() { 
    try {
        const clock = document.getElementById('real-time-clock'); 
        if (clock) { 
            const now = new Date(); 
            clock.innerHTML = `${now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} | ${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`; 
        } 
    } catch(e) {}
}
updateClock(); setInterval(updateClock, 1000);

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

// ==========================================
// AUTHENTICATION & MODAL LOGIC
// ==========================================
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

    const { data, error } = await supabaseClient.auth.signUp({ email, password });
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

// ==========================================
// MATCHING ENGINE & STRICT AI
// ==========================================
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
    
    if (isSpecificSearch) {
        const input = document.getElementById('specific-search-input');
        if (!input || !input.value.trim()) { alert("Please enter a title to search."); loadBox.style.display = 'none'; return; }
        const query = input.value.trim();
        promptText = `You are an elite streaming concierge AI. Search for: "${query}". Output JSON EXACTLY matching: {"title": "Correct Title", "synopsis": "A 3-sentence synopsis.", "platform": "Streaming service", "imdb": "Rating", "trailerId": "Exact 11-character YouTube video ID", "posterPath": "Exact TMDB poster path starting with / (e.g. /1pdfLvkbY9ohJlCjQH2JGjjc91p.jpg)"}`;
    } else {
        const cat = document.getElementById('q-category')?.value || 'any'; 
        const plat = document.getElementById('q-platform')?.value || 'any';
        const mood = document.getElementById('q-mood')?.value || 'any'; 
        
        promptText = `You are a streaming concierge AI. Find a highly-rated, hidden gem based STRICTLY on: Format: ${cat}, Platform: ${plat}, Mood: ${mood}. 
        CRITICAL RULES: 
        1. DO NOT recommend any of these: ${exclusionList}.
        2. FIND UNIQUE HIDDEN GEMS. No obvious defaults.
        Output MUST be valid JSON: {"title": "Title", "synopsis": "3-sentence synopsis.", "platform": "Streaming service", "imdb": "Rating", "trailerId": "Exact 11-character YouTube video ID", "posterPath": "Exact TMDB poster path starting with / (e.g. /mXZVPptJ3xUIVe8z0D5E7Y9E2F1.jpg)"}`;
    }

    const qBox = document.getElementById('questionnaire-box');
    const sBox = document.getElementById('search-box');
    if (qBox) qBox.style.display = 'none';
    if (sBox) sBox.style.display = 'none';

    let totalTime = isVIP || isAdFree ? 4 : 12; 
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
        console.error("AI Fallback:", err);
        matchResult = { title: "The Bear", synopsis: "A young chef from the fine dining world comes home to Chicago to run his family sandwich shop.", platform: "Hulu", imdb: "8.6", trailerId: "y-caqB_P72E", posterPath: "/mXZVPptJ3xUIVe8z0D5E7Y9E2F1.jpg" };
    }

    let elapsedMs = Date.now() - startTimeMs;
    let remainingMs = (totalTime * 1000) - elapsedMs;
    if (remainingMs > 0) await new Promise(resolve => setTimeout(resolve, remainingMs));

    clearInterval(timerInterval);
    if (pBar) pBar.style.width = '100%';
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
    
    // THE TMDB POSTER HACK + DYNAMIC TEXT FALLBACK
    if (selected.posterPath && selected.posterPath.startsWith('/')) {
        globalMatchPoster = `https://image.tmdb.org/t/p/w500${selected.posterPath}`;
    } else {
        globalMatchPoster = `https://via.placeholder.com/500x750/0a0505/D4AF37?text=${encodeURIComponent(selected.title)}`;
    }
    
    document.getElementById('res-title').innerText = selected.title;
    document.getElementById('res-synopsis').innerText = selected.synopsis;
    
    const posterEl = document.getElementById('res-poster-img');
    if (posterEl) {
        posterEl.src = globalMatchPoster;
        posterEl.onerror = function() { this.src = `https://via.placeholder.com/500x750/0a0505/D4AF37?text=${encodeURIComponent(selected.title)}`; };
    }

    const badge = document.getElementById('res-platform-badge');
    badge.innerText = selected.platform;
    document.getElementById('res-imdb-badge').innerText = `IMDb: ${selected.imdb || 'N/A'}`;

    const directBtn = document.getElementById('res-direct-link');
    directBtn.href = `https://www.google.com/search?q=Watch+${encodeURIComponent(selected.title)}+on+${encodeURIComponent(selected.platform)}`;
    directBtn.innerText = `▶ Search on ${selected.platform}`;

    // GUARANTEED WORKING TRAILER HACK
    const trailerBox = document.getElementById('res-trailer-container');
    const iframe = document.getElementById('res-trailer');
    const ytFallbackLink = document.getElementById('res-trailer-fallback');
    
    if (trailerBox && iframe) {
        trailerBox.style.display = 'block';
        if (selected.trailerId && selected.trailerId.length === 11) {
            iframe.src = `https://www.youtube.com/embed/${selected.trailerId}?modestbranding=1&rel=0`;
        } else {
            // Unofficial search fallback if Gemini failed to get an ID
            iframe.src = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(selected.title + " official trailer")}`;
        }
        if (ytFallbackLink) {
            ytFallbackLink.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(selected.title + " trailer")}`;
        }
    }
}

// ==========================================
// WATCH LATER & HISTORY (SAVING POSTERS)
// ==========================================
window.recordAction = function(type) {
    if (!globalMatchTitle) return;
    if (!isUserLoggedIn) {
        alert("💎 Join for FREE!\n\nTo save titles & covers to your Portfolio, please create a free account.");
        window.openAuthModal(); return;
    }

    const itemObj = { title: globalMatchTitle, posterUrl: globalMatchPoster };
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
