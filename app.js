console.log("Mastercode 60.0: Advanced AI Matchmaker & Rich Profile Engine Active");

let globalMatchTitle = "Match App";
let supabaseClient = null;
let isUserLoggedIn = false;
let userProfileData = {};

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let dislikedList = JSON.parse(localStorage.getItem('match_dislikedList') || '[]');

let isAdFree = localStorage.getItem('match_adFree') === 'true'; 
let isVIP = localStorage.getItem('match_isVIP') === 'true';
let adblockEnabled = false;

const STRIPE_LINKS = {
    'ad_free': 'https://buy.stripe.com/fZu4gz6nEaDHbpY7k0gEg01',
    'vip_monthly': 'https://buy.stripe.com/fZu3cvbHY13779I47OgEg03',
    'vip_annual': 'https://buy.stripe.com/7sY28reUa137dy65bSgEg02'
};

try { if (window.supabase) supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'); } catch(e) {}

function updateClock() {
    const clock = document.getElementById('real-time-clock');
    if (clock) {
        const now = new Date();
        clock.innerHTML = `${now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} | ${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }
}
setInterval(updateClock, 1000);

function checkDailyLimit() {
    if (isVIP || isAdFree) return true; 
    const todayStr = new Date().toLocaleDateString();
    let lastDate = localStorage.getItem('match_lastDate');
    let dailyCount = parseInt(localStorage.getItem('match_dailyCount') || '0');
    if (lastDate !== todayStr) { dailyCount = 0; localStorage.setItem('match_lastDate', todayStr); }
    if (!isUserLoggedIn && dailyCount >= 5) { alert("🔒 You've used your 5 free guest matches today!\n\nPlease register for a FREE account to lock in your identity, save your history, and unlock your next daily allowance!"); openAuthModal(); return false; }
    if (isUserLoggedIn && dailyCount >= 5) { alert("💎 You've reached your daily limit of 5 free matches!\n\nUpgrade to a VIP Pack for unlimited matches, zero ads, and premium AI features!"); window.location.href = 'pricing.html'; return false; }
    dailyCount++; localStorage.setItem('match_dailyCount', dailyCount.toString()); return true;
}

window.checkAdBlocker = function() {
    if (isAdFree || isVIP || window.location.pathname.includes('pricing')) return; 
    const bait = document.createElement('div');
    bait.className = 'adsbox doubleclick adSense pub_300x250 text-ad textAd ad-banner sponsor';
    bait.style.position = 'absolute'; bait.style.top = '-9999px'; bait.style.left = '-9999px'; bait.style.width = '10px'; bait.style.height = '10px';
    document.body.appendChild(bait);
    window.setTimeout(() => {
        const isBlocked = bait.offsetHeight === 0 || bait.offsetWidth === 0 || window.getComputedStyle(bait).display === 'none' || bait.offsetParent === null;
        const modal = document.getElementById('adblock-modal');
        if (isBlocked) { adblockEnabled = true; if (modal) modal.style.setProperty('display', 'flex', 'important'); } 
        else { adblockEnabled = false; if (modal) modal.style.setProperty('display', 'none', 'important'); }
        bait.remove();
    }, 250); 
};

window.openInChromeSmart = function() { const cleanUrl = 'matchapp.cc'; const ua = navigator.userAgent; if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) { setTimeout(() => { window.location.href = "https://apps.apple.com/app/google-chrome/id535886823"; }, 1500); window.location.href = 'googlechrome://' + cleanUrl; } else if (/Android/.test(ua)) { window.location.href = 'intent://' + cleanUrl + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.android.chrome;end;'; } else { const isTrueChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor) && !/Edg/.test(ua) && !/OPR/.test(ua); if (isTrueChrome) alert("✅ You are already using Google Chrome desktop!"); else window.open("https://www.google.com/chrome/", "_blank"); } };
window.showAdblockGuide = function() { alert("🛠️ HOW TO DISABLE:\n\n1. Click your Ad-Blocker or Shield icon in the URL bar.\n2. Select 'Pause on this site' or disable Tracking Prevention.\n3. Click 'I Disabled It' below."); };
window.dismissChromeBanner = function() { const banner = document.getElementById('chrome-banner'); if (banner) banner.style.display = 'none'; sessionStorage.setItem('dismissedChromeBanner', 'true'); };
window.openIncognitoHelper = function() { navigator.clipboard.writeText("https://matchapp.cc"); alert("🕵️ LINK COPIED!\n\n1. Open your browser menu (or press Ctrl+Shift+N / Cmd+Shift+N).\n2. Select 'New Incognito/Private Window'.\n3. Paste the link to enjoy MatchApp without ad-blocker tracking conflicts!"); };

window.openAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'flex'; };
window.closeAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'none'; if(document.getElementById('auth-message')) document.getElementById('auth-message').style.display = 'none'; };
window.signInWithGoogle = async function() { if (!supabaseClient) { alert("Server connection failed. Please refresh."); return; } const { error } = await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://matchapp.cc/callback.html' } }); if (error) alert("Google Login Error: " + error.message); };
window.handleEmailLogin = async function() { const email = document.getElementById('auth-email').value.trim(); const password = document.getElementById('auth-password').value; const msg = document.getElementById('auth-message'); if (!email || !password) { msg.style.display='block'; msg.style.color='#ff5252'; msg.innerText="Enter email and password."; return; } msg.style.display='block'; msg.style.color='var(--gold)'; msg.innerText="Authenticating..."; const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password }); if (error) { msg.style.color='#ff5252'; msg.innerText = error.message; } else { window.location.reload(); } };
window.handleEmailSignup = async function() { const email = document.getElementById('auth-email').value.trim(); const password = document.getElementById('auth-password').value; const msg = document.getElementById('auth-message'); if (!email || !password) { msg.style.display='block'; msg.style.color='#ff5252'; msg.innerText="Enter email and password."; return; } if (password.length < 6) { msg.style.display='block'; msg.style.color='#ff5252'; msg.innerText="Password must be at least 6 characters."; return; } msg.style.display='block'; msg.style.color='var(--gold)'; msg.innerText="Creating secure account..."; const { data, error } = await supabaseClient.auth.signUp({ email, password }); if (error) { msg.style.color='#ff5252'; msg.innerText = error.message; } else { msg.style.color='#25D366'; msg.innerText="Success! Logging you in..."; if (data.session) setTimeout(() => window.location.reload(), 1500); } };

window.calculateAge = function(dobStr) { if (!dobStr || !dobStr.includes('/')) return 0; const parts = dobStr.split('/'); if (parts.length !== 3) return 0; const day = parseInt(parts[0], 10), month = parseInt(parts[1], 10) - 1, year = parseInt(parts[2], 10); if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1920 || year > new Date().getFullYear()) return 0; const dob = new Date(year, month, day), today = new Date(); let age = today.getFullYear() - dob.getFullYear(); const m = today.getMonth() - dob.getMonth(); if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--; return age < 0 ? 0 : age; };
window.saveProfileData = async function() { 
    const isLockedAlready = userProfileData.profile_locked === true; 
    let newMetadata = { ...userProfileData }; 
    newMetadata.pref_service = document.getElementById('pref-service')?.value; 
    newMetadata.pref_service_sec = document.getElementById('pref-service-sec')?.value;
    newMetadata.pref_genre = document.getElementById('pref-genre')?.value; 
    newMetadata.pref_audio = document.getElementById('pref-audio')?.value; 
    newMetadata.pref_pacing = document.getElementById('pref-pacing')?.value;
    newMetadata.pref_decade = document.getElementById('pref-decade')?.value;

    if (!isLockedAlready) { 
        const dobInput = document.getElementById('profile-dob')?.value.trim(); 
        const starSignSelect = document.getElementById('profile-starsign')?.value; 
        const orientationSelect = document.getElementById('profile-orientation')?.value; 
        const nameInput = document.getElementById('profile-name')?.value.trim(); 
        const countryInput = document.getElementById('profile-country')?.value.trim(); 
        
        if (!dobInput || dobInput.length < 10 || !starSignSelect || !orientationSelect || !nameInput || !countryInput) { alert("Please complete all Permanent Identity fields before saving."); return; } 
        if (window.calculateAge(dobInput) === 0) { alert("Invalid birthdate entered."); return; } 
        
        const confirmLock = confirm("⚠️ FINAL WARNING:\n\nOnce saved, your Name, Country, Birthdate, Star Sign, and Orientation CANNOT be changed. Proceed?"); 
        if (!confirmLock) return; 
        
        newMetadata.full_name = nameInput; newMetadata.country = countryInput; newMetadata.birthdate = dobInput; newMetadata.starsign = starSignSelect; newMetadata.sexual_orientation = orientationSelect; newMetadata.profile_locked = true; 
    } 
    
    if (supabaseClient && isUserLoggedIn) await supabaseClient.auth.updateUser({ data: newMetadata }); 
    localStorage.setItem('match_userProfile', JSON.stringify(newMetadata)); 
    alert(isLockedAlready ? "✨ Preferences successfully updated!" : "✨ Identity permanently locked and preferences saved!"); 
    window.location.reload(); 
};

window.handleProfilePic = function(event) { const file = event.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = function(e) { if (document.getElementById('profile-pic-preview')) document.getElementById('profile-pic-preview').src = e.target.result; localStorage.setItem('match_userAvatar', e.target.result); }; reader.readAsDataURL(file); } };
window.processCheckout = async function(tier) { if (!isUserLoggedIn || !supabaseClient) { alert("Please log in or register first to link your purchase securely!"); openAuthModal(); return; } const btn = document.getElementById(`btn-${tier}`); if (btn) { btn.innerText = "Redirecting securely to Stripe..."; btn.style.opacity = '0.7'; } const { data: { session } } = await supabaseClient.auth.getSession(); window.location.href = `${STRIPE_LINKS[tier]}?client_reference_id=${session.user.id}___${tier}`; };

/* 🎬 EXPANDED MASTER CATALOG (Now with Pacing & Aesthetics) */
const masterCatalog = [
    { title: "Superbad", category: "movie", platform: "Netflix", mood: "laugh", aesthetic: "colorful", pacing: "fast", trailerId: "MNpoTxeydiI", url: "https://www.netflix.com/title/70075482", synopsis: "High school seniors Seth and Evan attempt to buy booze for a wild house party, spiraling into an unforgettable night of hilarious chaos.", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1000&q=80" },
    { title: "Parasite", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", pacing: "steady", trailerId: "SEUXfv87Wpk", url: "https://www.max.com", synopsis: "Greed and class discrimination threaten the symbiotic relationship between the wealthy Park family and the destitute Kim clan.", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1000&q=80" },
    { title: "The Dark Knight", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", pacing: "fast", trailerId: "EXeTwQWrcwY", url: "https://www.max.com", synopsis: "When the Joker wreaks havoc on Gotham, Batman must accept his greatest psychological test of fighting injustice.", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80" },
    { title: "Interstellar", category: "movie", platform: "Prime", mood: "intense", aesthetic: "epic", pacing: "slow", trailerId: "zSWdZVtXT7E", url: "https://www.amazon.com", synopsis: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80" },
    { title: "Inception", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", pacing: "fast", trailerId: "YoHD9XEInc0", url: "https://www.max.com", synopsis: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80" },
    { title: "Everything Everywhere All at Once", category: "movie", platform: "Prime", mood: "laugh", aesthetic: "colorful", pacing: "fast", trailerId: "wxN1T1uxQ2g", url: "https://www.amazon.com", synopsis: "An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes.", poster: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=1000&q=80" },
    { title: "Dune: Part Two", category: "movie", platform: "Max", mood: "intense", aesthetic: "epic", pacing: "steady", trailerId: "Way9Dexny3w", url: "https://www.max.com", synopsis: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1000&q=80" },
    { title: "Glass Onion", category: "movie", platform: "Netflix", mood: "laugh", aesthetic: "bright", pacing: "steady", trailerId: "gj5ibYSz8C0", url: "https://www.netflix.com", synopsis: "Famed Southern detective Benoit Blanc travels to Greece for his latest case.", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80" },
    { title: "Stranger Things", category: "series", platform: "Netflix", mood: "intense", aesthetic: "retro", pacing: "steady", trailerId: "b9EkMc79ZSU", url: "https://www.netflix.com/title/80057281", synopsis: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments and supernatural forces.", poster: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=1000&q=80" },
    { title: "The Last of Us", category: "series", platform: "Max", mood: "intense", aesthetic: "dark", pacing: "slow", trailerId: "uLtkt8BonwM", url: "https://www.max.com", synopsis: "After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl who may be humanity's last hope.", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80" },
    { title: "The Boys", category: "series", platform: "Prime", mood: "intense", aesthetic: "dark", pacing: "fast", trailerId: "M1bhOaLV4FU", url: "https://www.amazon.com", synopsis: "A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers.", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80" },
    { title: "Crash Landing on You", category: "vertical_drama", platform: "Netflix", mood: "romantic", aesthetic: "bright", pacing: "steady", trailerId: "eXMjTXL221g", url: "https://www.netflix.com/title/81159258", synopsis: "A South Korean heiress accidentally paraglides into North Korea and into the life of an army officer who decides to help her hide.", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80" },
    { title: "Queen of Tears", category: "vertical_drama", platform: "Netflix", mood: "romantic", aesthetic: "bright", pacing: "steady", trailerId: "3mZz7A3hWjY", url: "https://www.netflix.com", synopsis: "The queen of department stores and her small-town husband weather a marital crisis until love miraculously begins to bloom again.", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1000&q=80" }
];

/* 🚀 SMART MATCH ENGINE (Multi-Level Filtering) */
window.triggerMatch = async function() {
    window.checkAdBlocker(); if (adblockEnabled) return; 
    if (!checkDailyLimit()) return;

    const selCategory = document.getElementById('q-category')?.value || 'any';
    const selPlatform = document.getElementById('q-platform')?.value || 'any';
    const selMood = document.getElementById('q-mood')?.value || 'any';
    const selAesthetic = document.getElementById('q-aesthetic')?.value || 'any';
    const selPacing = document.getElementById('q-pacing')?.value || 'any';

    let pool = masterCatalog.filter(item => !seenList.includes(item.title) && !savedList.includes(item.title) && !dislikedList.includes(item.title));
    let targetedPool = pool;
    
    // Level 1: Strict Filtering
    if (selCategory !== 'any') targetedPool = targetedPool.filter(i => i.category === selCategory);
    if (selPlatform !== 'any') targetedPool = targetedPool.filter(i => i.platform === selPlatform);
    if (selMood !== 'any') targetedPool = targetedPool.filter(i => i.mood === selMood);
    if (selAesthetic !== 'any') targetedPool = targetedPool.filter(i => i.aesthetic === selAesthetic);
    if (selPacing !== 'any') targetedPool = targetedPool.filter(i => i.pacing === selPacing);
    
    // Level 2: Fallback (Drop Aesthetic & Pacing if too specific)
    if (targetedPool.length === 0) {
        targetedPool = pool.filter(i => (selCategory === 'any' || i.category === selCategory) && (selPlatform === 'any' || i.platform === selPlatform) && (selMood === 'any' || i.mood === selMood));
    }
    // Level 3: Ultimate Fallback (Just find something in the category)
    if (targetedPool.length === 0) {
        targetedPool = pool.filter(i => (selCategory === 'any' || i.category === selCategory));
    }
    // Level 4: Reset Cache
    if (targetedPool.length === 0) {
        alert("✨ You have reviewed every title in our database for this query! Clearing temporary view cache to rediscover matches...");
        seenList = []; syncListsToDatabase(); targetedPool = masterCatalog;
    }

    const selected = targetedPool[Math.floor(Math.random() * targetedPool.length)];
    globalMatchTitle = selected.title; 

    if (document.getElementById('questionnaire-box')) document.getElementById('questionnaire-box').style.display = 'none';
    if (document.getElementById('result-box')) document.getElementById('result-box').style.display = 'none';
    document.getElementById('loading-box').style.display = 'block';

    setTimeout(() => {
        document.getElementById('loading-box').style.display = 'none';
        const resultBox = document.getElementById('result-box');
        resultBox.style.display = 'block';

        const posterImg = document.getElementById('res-poster-img');
        if (posterImg && selected.poster) { posterImg.src = selected.poster; posterImg.alt = selected.title; }

        document.getElementById('res-title').innerText = selected.title;
        document.getElementById('res-synopsis').innerText = selected.synopsis;

        const badge = document.getElementById('res-platform-badge');
        badge.innerText = selected.platform;
        if (selected.platform === 'Netflix') badge.style.background = 'var(--netflix-red)';
        else if (selected.platform === 'Max') badge.style.background = 'var(--max-purple)';
        else if (selected.platform === 'Prime') badge.style.background = 'var(--prime-blue)';
        else if (selected.platform === 'Spotify') badge.style.background = 'var(--spotify-green)';
        else if (selected.platform === 'Globoplay') badge.style.background = 'var(--globoplay-orange)';
        else badge.style.background = 'var(--gold)';
        badge.style.color = '#fff';

        const directBtn = document.getElementById('res-direct-link');
        directBtn.href = selected.url;
        directBtn.innerText = selected.category.includes('spotify') ? `▶ Listen on ${selected.platform}` : `▶ Stream on ${selected.platform}`;

        const trailerBox = document.getElementById('res-trailer-container');
        const spotifyBox = document.getElementById('res-spotify-container');

        if (selected.category.includes('spotify') && selected.spotifyId) {
            if (trailerBox) trailerBox.style.display = 'none';
            if (spotifyBox) {
                spotifyBox.style.display = 'block';
                const type = selected.spotifyType || 'track';
                spotifyBox.innerHTML = `<iframe src="https://open.spotify.com/embed/${type}/${selected.spotifyId}?utm_source=generator&theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
            }
        } else {
            if (spotifyBox) spotifyBox.style.display = 'none';
            if (trailerBox) {
                trailerBox.style.display = 'block';
                const iframe = document.getElementById('res-trailer');
                if (iframe) iframe.src = `https://www.youtube-nocookie.com/embed/${selected.trailerId}?autoplay=0&rel=0`;
            }
        }
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 1200);
};

window.saveToList = function() { if (globalMatchTitle && !savedList.includes(globalMatchTitle)) { savedList.push(globalMatchTitle); syncListsToDatabase(); alert(`⭐ "${globalMatchTitle}" saved to your Watch Later Portfolio!`); renderProfileGrids(); } triggerAdRetry(); };
window.markAsSeen = function() { if (globalMatchTitle && !seenList.includes(globalMatchTitle)) { seenList.push(globalMatchTitle); syncListsToDatabase(); renderProfileGrids(); } triggerAdRetry(); };
window.markAsDisliked = function() { if (globalMatchTitle && !dislikedList.includes(globalMatchTitle)) { dislikedList.push(globalMatchTitle); syncListsToDatabase(); } triggerAdRetry(); };

window.triggerAdRetry = function() {
    if (isVIP || isAdFree) { document.getElementById('result-box').style.display = 'none'; triggerMatch(); return; }
    document.getElementById('reward-ad-modal').style.display = 'flex';
    let timeLeft = 30;
    const timerSpan = document.getElementById('ad-timer'), claimBtn = document.getElementById('claim-retry-btn'), closeBtn = document.getElementById('close-ad-btn');
    claimBtn.style.display = 'block'; closeBtn.style.display = 'none'; claimBtn.disabled = true; claimBtn.style.opacity = '0.5';
    const interval = setInterval(() => {
        timeLeft--; if (timerSpan) timerSpan.innerText = timeLeft;
        if (timeLeft <= 0) { clearInterval(interval); claimBtn.style.display = 'none'; closeBtn.style.display = 'block'; }
    }, 1000);
};

window.closeAdAndClaim = function() { document.getElementById('reward-ad-modal').style.display = 'none'; document.getElementById('result-box').style.display = 'none'; triggerMatch(); };
window.openPortfolioModal = function(title) { const item = masterCatalog.find(m => m.title === title); if (item) { document.getElementById('port-modal-title').innerText = item.title; document.getElementById('port-modal-synopsis').innerText = item.synopsis; document.getElementById('port-modal-plat').innerText = item.platform; document.getElementById('port-modal-bg').style.backgroundImage = `url('${item.poster}')`; document.getElementById('port-modal-link').onclick = function() { window.open(item.url, '_blank'); }; document.getElementById('portfolio-modal').style.display = 'flex'; } };

/* 🖼️ RICH PROFILE RENDERING ENGINE */
window.renderProfileGrids = function() {
    const pGrid = document.getElementById('portfolio-grid');
    const hGrid = document.getElementById('history-grid');
    if (!pGrid || !hGrid) return; // Only runs if on profile page

    // Render Watch Later (Portfolio)
    if (savedList.length > 0) {
        pGrid.innerHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px;">' + savedList.map(title => {
            const item = masterCatalog.find(m => m.title === title);
            const safeTitle = title.replace(/'/g, "\\'");
            const poster = item ? item.poster : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80';
            return `<div onclick="openPortfolioModal('${safeTitle}')" style="background: url('${poster}') center/cover; height: 150px; border-radius: 8px; position: relative; cursor: pointer; border: 1px solid rgba(212,175,55,0.3); overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                <div style="position: absolute; bottom: 0; width: 100%; background: linear-gradient(transparent, rgba(0,0,0,0.9)); padding: 25px 8px 8px 8px; text-align: center;">
                    <span style="color: #fff; font-size: 11px; font-weight: bold; text-shadow: 1px 1px 3px #000;">${title}</span>
                </div>
            </div>`;
        }).join('') + '</div>';
    } else { pGrid.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 0;">No saved titles yet. Go find your match!</p>`; }

    // Render Seen It (History)
    if (seenList.length > 0) {
        hGrid.innerHTML = '<div style="display: flex; flex-direction: column; gap: 8px;">' + seenList.map(title => {
            return `<div style="background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid #25D366;">
                <span style="color: #ddd; font-size: 13px; font-weight: bold;">${title}</span>
                <span style="background: rgba(37,211,102,0.15); color: #25D366; font-size: 10px; padding: 3px 8px; border-radius: 12px;">✔️ Seen</span>
            </div>`;
        }).join('') + '</div>';
    } else { hGrid.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 0;">Your watch history is empty.</p>`; }
};

window.addEventListener('DOMContentLoaded', async () => {
    updateClock();
    
    // Auto-format Date of Birth
    const dobInput = document.getElementById('profile-dob');
    if (dobInput) {
        dobInput.addEventListener('input', function(e) {
            if (userProfileData && userProfileData.profile_locked) return;
            if (e.inputType === 'deleteContentBackward') return; 
            let v = this.value.replace(/\D/g, ''); if (v.length > 8) v = v.substring(0, 8); 
            let formatted = '';
            if (v.length > 4) formatted = `${v.substring(0,2)}/${v.substring(2,4)}/${v.substring(4)}`; else if (v.length > 2) formatted = `${v.substring(0,2)}/${v.substring(2)}`; else formatted = v;
            if (v.length === 2 || v.length === 4) formatted += '/';
            this.value = formatted;
            if (this.value.length >= 10) { const age = window.calculateAge(this.value); const ageDisp = document.getElementById('profile-age-display'); if (ageDisp) ageDisp.value = age > 0 ? `${age} years old` : "Invalid Date"; }
        });
    }

    const savedAvatar = localStorage.getItem('match_userAvatar'); if (savedAvatar && document.getElementById('profile-pic-preview')) document.getElementById('profile-pic-preview').src = savedAvatar;
    if (isAdFree || isVIP) document.body.classList.add('ad-free-mode'); 
    
    window.checkAdBlocker(); setInterval(window.checkAdBlocker, 5000); 
    if (sessionStorage.getItem('dismissedChromeBanner') === 'true' && document.getElementById('chrome-banner')) document.getElementById('chrome-banner').style.display = 'none';

    renderProfileGrids(); // Initial render for guests

    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            isUserLoggedIn = true; userProfileData = session.user.user_metadata || {};
            
            // Populate Profile Data if on profile page
            if (document.getElementById('user-email-display')) {
                document.getElementById('user-email-display').innerText = session.user.email;
                if(userProfileData.pref_service) document.getElementById('pref-service').value = userProfileData.pref_service;
                if(userProfileData.pref_service_sec) document.getElementById('pref-service-sec').value = userProfileData.pref_service_sec;
                if(userProfileData.pref_genre) document.getElementById('pref-genre').value = userProfileData.pref_genre;
                if(userProfileData.pref_audio) document.getElementById('pref-audio').value = userProfileData.pref_audio;
                if(userProfileData.pref_pacing) document.getElementById('pref-pacing').value = userProfileData.pref_pacing;
                if(userProfileData.pref_decade) document.getElementById('pref-decade').value = userProfileData.pref_decade;
                
                if(userProfileData.full_name) document.getElementById('profile-name').value = userProfileData.full_name;
                if(userProfileData.country) document.getElementById('profile-country').value = userProfileData.country;
                if(userProfileData.starsign) document.getElementById('profile-starsign').value = userProfileData.starsign;
                if(userProfileData.sexual_orientation) document.getElementById('profile-orientation').value = userProfileData.sexual_orientation;
                if(userProfileData.birthdate) { document.getElementById('profile-dob').value = userProfileData.birthdate; document.getElementById('profile-age-display').value = window.calculateAge(userProfileData.birthdate) + " years old"; }
                
                if (userProfileData.profile_locked) {
                    ['profile-dob', 'profile-starsign', 'profile-orientation', 'profile-name', 'profile-country'].forEach(id => {
                        const el = document.getElementById(id); if (el) { el.disabled = true; el.style.opacity = '0.5'; }
                    });
                    document.getElementById('lock-status').innerHTML = '✅ Identity Data Securely Locked'; document.getElementById('lock-status').style.color = '#25D366';
                }
            }

            if (session.user.user_metadata?.avatar_url && !localStorage.getItem('match_userAvatar')) { localStorage.setItem('match_userAvatar', session.user.user_metadata.avatar_url); if (document.getElementById('profile-pic-preview')) document.getElementById('profile-pic-preview').src = session.user.user_metadata.avatar_url; }
            
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('payment') === 'success') { isAdFree = true; localStorage.setItem('match_adFree', 'true'); document.body.classList.add('ad-free-mode'); if (urlParams.get('tier') === 'vip_monthly' || urlParams.get('tier') === 'vip_annual') { isVIP = true; localStorage.setItem('match_isVIP', 'true'); } alert("🎉 Premium Status Activated!"); window.history.replaceState({}, document.title, window.location.pathname); }
            if (userProfileData.ad_free || userProfileData.vip_tier) { isAdFree = true; document.body.classList.add('ad-free-mode'); }
            if (userProfileData.vip_tier) isVIP = true;
            
            if (userProfileData.seen_list) seenList = userProfileData.seen_list;
            if (userProfileData.saved_list) savedList = userProfileData.saved_list;
            if (userProfileData.disliked_list) dislikedList = userProfileData.disliked_list;
            renderProfileGrids(); // Re-render with logged-in user data

            if(document.getElementById('nav-reg-btn')) document.getElementById('nav-reg-btn').style.display = 'none';
            if(document.getElementById('profile-link-tab')) document.getElementById('profile-link-tab').style.display = 'inline-block';
            if(document.getElementById('profile-pic-container')) document.getElementById('profile-pic-container').style.display = 'block';
            if (isVIP && document.getElementById('nav-upgrade-btn')) document.getElementById('nav-upgrade-btn').style.display = 'none'; else if (!isAdFree && document.getElementById('nav-upgrade-btn')) document.getElementById('nav-upgrade-btn').style.display = 'block';
            if(document.getElementById('nav-logout-btn')) document.getElementById('nav-logout-btn').style.display = 'block';
            if(document.getElementById('adblock-signin-prompt')) document.getElementById('adblock-signin-prompt').style.display = 'none';
            if(document.getElementById('adblock-buy-prompt')) document.getElementById('adblock-buy-prompt').style.display = 'block';
        }
    }
});

window.doLogout = async function() { if (supabaseClient) { await supabaseClient.auth.signOut(); localStorage.clear(); window.location.reload(); } };
async function syncListsToDatabase() { 
    localStorage.setItem('match_seenList', JSON.stringify(seenList)); 
    localStorage.setItem('match_savedList', JSON.stringify(savedList)); 
    localStorage.setItem('match_dislikedList', JSON.stringify(dislikedList)); 
    if (isUserLoggedIn && supabaseClient) { await supabaseClient.auth.updateUser({ data: { seen_list: seenList, saved_list: savedList, disliked_list: dislikedList } }); } 
}
