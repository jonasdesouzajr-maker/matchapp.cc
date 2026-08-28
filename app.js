console.log("Mastercode 67.0: Auth Fixed, Progress Bar Monetized, Trailers Active");

let globalMatchTitle = "MatchApp";
let supabaseClient = null; // Ensure this is initialized with your Supabase credentials!
let isUserLoggedIn = false;
let userProfileData = {};

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let dislikedList = JSON.parse(localStorage.getItem('match_dislikedList') || '[]');
let userRatings = JSON.parse(localStorage.getItem('match_userRatings') || '{}');

let isAdFree = localStorage.getItem('match_adFree') === 'true'; 
let isVIP = localStorage.getItem('match_isVIP') === 'true';

/* FIXED TRAILER IDs - Real Working Previews */
const masterCatalog = [
    { title: "The Wizard of Oz", category: "movie", platform: "Max", mood: "chill", aesthetic: "colorful", pacing: "steady", imdb: "8.1", trailerId: "VNkgJAJTCsw", url: "https://play.max.com/movie/the-wizard-of-oz", synopsis: "A tornado transports a young Kansas girl to a magical land...", poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80" },
    { title: "The Shawshank Redemption", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", pacing: "slow", imdb: "9.3", trailerId: "NmzuHjWmXOc", url: "https://play.max.com/movie/the-shawshank-redemption", synopsis: "Two imprisoned men bond over a number of years, finding solace...", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1000&q=80" },
    { title: "Stranger Things", category: "series", platform: "Netflix", mood: "intense", aesthetic: "retro", pacing: "steady", imdb: "8.7", trailerId: "b9EkMc79ZSU", url: "https://www.netflix.com/title/80057281", synopsis: "When a young boy vanishes, a small town uncovers a mystery involving supernatural forces...", poster: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=1000&q=80" },
    { title: "Spider-Man: Into the Spider-Verse", category: "movie", platform: "Netflix", mood: "laugh", aesthetic: "colorful", pacing: "fast", imdb: "8.4", trailerId: "g4Hbz2jLxvQ", url: "https://www.netflix.com/title/81002747", synopsis: "Teen Miles Morales becomes the Spider-Man of his universe...", poster: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=1000&q=80" }
];

function updateClock() { const clock = document.getElementById('real-time-clock'); if (clock) { const now = new Date(); clock.innerHTML = `${now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} | ${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`; } }
setInterval(updateClock, 1000);

// ==========================================
// MODAL & AUTHENTICATION LOGIC (RESTORED)
// ==========================================
window.openAuthModal = function() {
    document.getElementById('main-auth-modal').style.display = 'flex';
};

window.closeAuthModal = function() {
    document.getElementById('main-auth-modal').style.display = 'none';
};

async function checkIfBanned(email) {
    if (!email || !supabaseClient) return false;
    const { data } = await supabaseClient.from('banned_emails').select('email').eq('email', email).single();
    return !!data;
}

window.handleEmailSignup = async function() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const msgEl = document.getElementById('auth-message');
    
    if(!email || !password) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = "Please fill both fields."; return; }

    const isBanned = await checkIfBanned(email);
    if (isBanned) {
        msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = "This email has been permanently deleted and cannot be used again."; 
        return; 
    }

    if (supabaseClient) {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if(error) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = error.message; } 
        else { msgEl.style.display = 'block'; msgEl.style.color = '#25D366'; msgEl.innerText = "Registration successful!"; setTimeout(closeAuthModal, 1500); }
    }
};

window.handleEmailLogin = async function() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const msgEl = document.getElementById('auth-message');
    
    if(!email || !password) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = "Please fill both fields."; return; }

    if (supabaseClient) {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if(error) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = error.message; } 
        else { msgEl.style.display = 'block'; msgEl.style.color = '#25D366'; msgEl.innerText = "Login successful!"; setTimeout(closeAuthModal, 1000); }
    }
};

window.doLogout = async function() { 
    if (supabaseClient) { await supabaseClient.auth.signOut(); }
    localStorage.clear(); 
    window.location.href = '/index.html'; 
};

// UI Listener to enforce VIP Button Logic
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
            
            // Only show VIP badge if user is logged in
            if (upgradeBtn) {
                upgradeBtn.style.display = 'inline-flex';
                if (isVIP || isAdFree) upgradeBtn.innerText = '👑 VIP Active';
            }
        } else {
            isUserLoggedIn = false;
        }
    });
}

// ==========================================
// MATCHING & LOADING ENGINE
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

window.triggerMatch = async function() {
    if (window.checkAdBlocker && window.adblockEnabled) return; 
    if (!checkDailyLimit()) return;

    let pool = masterCatalog.filter(item => !seenList.includes(item.title) && !savedList.includes(item.title) && !dislikedList.includes(item.title) && userRatings[item.title] !== 1);
    if (pool.length === 0) { seenList = []; syncListsToDatabase(); pool = masterCatalog; } 
    
    pool.sort(() => 0.5 - Math.random());
    const selected = pool[0];
    globalMatchTitle = selected.title; 

    if (document.getElementById('questionnaire-box')) document.getElementById('questionnaire-box').style.display = 'none';
    if (document.getElementById('result-box')) document.getElementById('result-box').style.display = 'none';
    
    const loadBox = document.getElementById('loading-box');
    loadBox.style.display = 'block';

    let totalTime = isVIP || isAdFree ? 2 : 20; 
    let timeLeft = totalTime;
    
    loadBox.innerHTML = `
        <div style="font-size: 50px; margin-bottom: 15px; animation: pulse 1.5s infinite;">🔮</div>
        <h3 style="color: var(--gold-glow); font-size: 20px; margin: 0;">Consulting AI Concierge...</h3>
        ${!isVIP && !isAdFree ? `
        <div class="progress-bar-container">
            <div id="ai-progress-bar" class="progress-bar-fill"></div>
        </div>
        <p style="color: #aaa; margin-top: 15px; font-size: 13px;">Sponsor break: Searching for the perfect match in <strong id="ad-timer-sim" style="color:#fff; font-size: 16px;">${timeLeft}</strong>s</p>
        <div class="ad-placement" style="margin-top:20px; background:transparent;">
            <script>atOptions = { 'key' : 'a993f73724a261dce748b6f9319072d5', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };</script><script src="https://www.highperformanceformat.com/a993f73724a261dce748b6f9319072d5/invoke.js"></script>
        </div>` : `<p style="color: var(--gold); margin-top: 10px;">VIP Fast-Track Active</p>`}
    `;

    const simInterval = setInterval(() => {
        timeLeft--;
        const timerEl = document.getElementById('ad-timer-sim');
        const barEl = document.getElementById('ai-progress-bar');
        
        if (timerEl) timerEl.innerText = timeLeft;
        if (barEl) {
            let pct = ((totalTime - timeLeft) / totalTime) * 100;
            barEl.style.width = pct + '%';
        }
        
        if (timeLeft <= 0) {
            clearInterval(simInterval);
            renderResult(selected);
        }
    }, 1000);
};

function renderResult(selected) {
    document.getElementById('loading-box').style.display = 'none';
    const resultBox = document.getElementById('result-box');
    resultBox.style.display = 'block';

    document.querySelectorAll('.star-rating-container .star').forEach(s => s.classList.remove('selected'));

    const posterImg = document.getElementById('res-poster-img'); if (posterImg && selected.poster) posterImg.src = selected.poster;
    document.getElementById('res-title').innerText = selected.title;
    document.getElementById('res-synopsis').innerText = selected.synopsis;

    const badge = document.getElementById('res-platform-badge');
    badge.innerText = selected.platform;
    if (selected.platform === 'Netflix') badge.style.background = '#E50914';
    else if (selected.platform === 'Max') badge.style.background = '#8A2BE2';
    else if (selected.platform === 'Prime') badge.style.background = '#00A8E1';
    else badge.style.background = 'var(--gold)';
    badge.style.color = '#fff';

    const imdbBadge = document.getElementById('res-imdb-badge');
    if(imdbBadge) imdbBadge.innerText = `IMDb: ${selected.imdb || 'N/A'}`;

    const directBtn = document.getElementById('res-direct-link');
    directBtn.href = selected.url;
    directBtn.innerText = `▶ Stream on ${selected.platform}`;

    const trailerBox = document.getElementById('res-trailer-container');
    if (trailerBox) {
        trailerBox.style.display = 'block';
        const iframe = document.getElementById('res-trailer');
        if (iframe) iframe.src = `https://www.youtube-nocookie.com/embed/${selected.trailerId}?autoplay=0&rel=0`;
    }
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.saveToList = function() { if (globalMatchTitle && !savedList.includes(globalMatchTitle)) { savedList.push(globalMatchTitle); syncListsToDatabase(); alert(`⭐ "${globalMatchTitle}" saved to your Watch Later Portfolio!`); if(typeof renderProfileGrids === 'function') renderProfileGrids(); } document.getElementById('result-box').style.display = 'none'; triggerMatch(); };
window.markAsSeen = function() { if (globalMatchTitle && !seenList.includes(globalMatchTitle)) { seenList.push(globalMatchTitle); syncListsToDatabase(); if(typeof renderProfileGrids === 'function') renderProfileGrids(); } document.getElementById('result-box').style.display = 'none'; triggerMatch(); };
window.markAsLiked = function() { if (globalMatchTitle) { userRatings[globalMatchTitle] = 5; if (!seenList.includes(globalMatchTitle)) seenList.push(globalMatchTitle); syncListsToDatabase(); if(typeof renderProfileGrids === 'function') renderProfileGrids(); } document.getElementById('result-box').style.display = 'none'; triggerMatch(); };
window.markAsDisliked = function() { if (globalMatchTitle && !dislikedList.includes(globalMatchTitle)) { dislikedList.push(globalMatchTitle); userRatings[globalMatchTitle] = 1; syncListsToDatabase(); } document.getElementById('result-box').style.display = 'none'; triggerMatch(); };

document.addEventListener('click', function (event) {
    if (!event.target.classList.contains('star')) return;
    const star = event.target; const rating = parseInt(star.getAttribute('data-value'));
    const container = star.closest('.star-rating-container');
    container.querySelectorAll('.star').forEach(s => s.classList.remove('selected')); star.classList.add('selected');
    if (globalMatchTitle) { userRatings[globalMatchTitle] = rating; if (!seenList.includes(globalMatchTitle)) seenList.push(globalMatchTitle); syncListsToDatabase(); if(typeof renderProfileGrids === 'function') renderProfileGrids(); }
});

async function syncListsToDatabase() { 
    localStorage.setItem('match_seenList', JSON.stringify(seenList)); 
    localStorage.setItem('match_savedList', JSON.stringify(savedList)); 
    localStorage.setItem('match_dislikedList', JSON.stringify(dislikedList)); 
    localStorage.setItem('match_userRatings', JSON.stringify(userRatings)); 
    if (isUserLoggedIn && supabaseClient) { await supabaseClient.auth.updateUser({ data: { seen_list: seenList, saved_list: savedList, disliked_list: dislikedList, user_ratings: userRatings } }); } 
}
