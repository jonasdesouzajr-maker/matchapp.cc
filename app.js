console.log("Mastercode 54.0: Auto-Slash DOB, Dynamic Age & Dual-Tier Profile Sync Active");

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
        const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        clock.innerHTML = `${dateStr} | ${timeStr}`;
    }
}
setInterval(updateClock, 1000);

function checkAdBlocker() {
    if (isAdFree || isVIP || window.location.pathname.includes('pricing.html')) return; 
    const bait = document.createElement('div');
    bait.className = 'adsbox ad-placement doubleclick adSense pub_300x250 text-ad textAd';
    bait.style.position = 'absolute'; bait.style.top = '-9999px'; bait.style.left = '-9999px';
    document.body.appendChild(bait);
    window.setTimeout(() => {
        const isBlocked = bait.offsetHeight === 0 || window.getComputedStyle(bait).display === 'none' || bait.offsetParent === null;
        if (isBlocked) { 
            const modal = document.getElementById('adblock-modal');
            if (modal) modal.style.setProperty('display', 'flex', 'important'); 
        }
        bait.remove();
    }, 500); 
}

window.openInChromeSmart = function() {
    const cleanUrl = 'matchapp.cc';
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
        setTimeout(() => { window.location.href = "https://apps.apple.com/app/google-chrome/id535886823"; }, 1500);
        window.location.href = 'googlechrome://' + cleanUrl;
    } else if (/Android/.test(ua)) {
        window.location.href = 'intent://' + cleanUrl + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.android.chrome;end;';
    } else {
        const isTrueChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor) && !/Edg/.test(ua) && !/OPR/.test(ua);
        if (isTrueChrome) alert("✅ You are already using Google Chrome desktop!");
        else window.open("https://www.google.com/chrome/", "_blank");
    }
};

window.openIncognitoHelper = function() { navigator.clipboard.writeText("https://matchapp.cc"); alert("🕵️ INCOGNITO MODE:\n\nLink copied to clipboard! Open your browser menu, click 'New Incognito Window', and paste it in."); };
window.showAdblockGuide = function() { alert("🛠️ HOW TO DISABLE:\n\n1. Click your Ad-Blocker icon in top right.\n2. Select 'Pause on this site'.\n3. Click 'Reload Page'."); };
window.dismissChromeBanner = function() { const banner = document.getElementById('chrome-banner'); if (banner) banner.style.display = 'none'; sessionStorage.setItem('dismissedChromeBanner', 'true'); };

/* 🔐 AUTH ENGINE */
window.openAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'flex'; };
window.closeAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'none'; if(document.getElementById('auth-message')) document.getElementById('auth-message').style.display = 'none'; };

window.signInWithGoogle = async function() {
    if (!supabaseClient) { alert("Server connection failed. Please refresh."); return; }
    const { error } = await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://matchapp.cc/callback.html' } });
    if (error) alert("Google Login Error: " + error.message);
};

window.handleEmailLogin = async function() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const msg = document.getElementById('auth-message');
    if (!email || !password) { msg.style.display='block'; msg.style.color='#ff5252'; msg.innerText="Enter email and password."; return; }
    msg.style.display='block'; msg.style.color='var(--gold)'; msg.innerText="Authenticating...";
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) { msg.style.color='#ff5252'; msg.innerText = error.message; }
    else { window.location.reload(); }
};

window.handleEmailSignup = async function() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const msg = document.getElementById('auth-message');
    if (!email || !password) { msg.style.display='block'; msg.style.color='#ff5252'; msg.innerText="Enter email and password."; return; }
    if (password.length < 6) { msg.style.display='block'; msg.style.color='#ff5252'; msg.innerText="Password must be at least 6 characters."; return; }
    msg.style.display='block'; msg.style.color='var(--gold)'; msg.innerText="Creating secure account...";
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) { msg.style.color='#ff5252'; msg.innerText = error.message; }
    else { msg.style.color='#25D366'; msg.innerText="Success! Logging you in..."; if (data.session) setTimeout(() => window.location.reload(), 1500); }
};

/* 👤 DYNAMIC AGE & DUAL-TIER PROFILE ENGINE */
window.calculateAge = function(dobStr) {
    if (!dobStr || !dobStr.includes('/')) return 0;
    const parts = dobStr.split('/');
    if (parts.length !== 3) return 0;
    const day = parseInt(parts[0], 10), month = parseInt(parts[1], 10) - 1, year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1920 || year > new Date().getFullYear()) return 0;
    const dob = new Date(year, month, day), today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age < 0 ? 0 : age;
};

window.saveProfileData = async function() {
    const isLockedAlready = userProfileData.profile_locked === true;
    let newMetadata = { ...userProfileData };

    // Capture Changeable Preferences
    newMetadata.pref_service = document.getElementById('pref-service').value;
    newMetadata.pref_genre = document.getElementById('pref-genre').value;
    newMetadata.pref_audio = document.getElementById('pref-audio').value;

    // Capture Permanent Identity Data (If not locked yet)
    if (!isLockedAlready) {
        const dobInput = document.getElementById('profile-dob').value.trim();
        const starSignSelect = document.getElementById('profile-starsign').value;
        const orientationSelect = document.getElementById('profile-orientation').value;
        const nameInput = document.getElementById('profile-name').value.trim();
        const countryInput = document.getElementById('profile-country').value.trim();

        if (!dobInput || dobInput.length < 10 || !starSignSelect || !orientationSelect || !nameInput || !countryInput) {
            alert("Please complete all Permanent Identity fields (Name, Country, Birthdate, Star Sign, Orientation) before saving."); return;
        }

        if (window.calculateAge(dobInput) === 0) { alert("Invalid birthdate entered. Please check the day, month, and year."); return; }

        const confirmLock = confirm("⚠️ FINAL WARNING:\n\nOnce saved, your Name, Country, Birthdate, Star Sign, and Orientation CANNOT be changed. Our AI locks this to prevent profile manipulation. \n\nChanging these later requires registering a completely new account. Proceed?");
        if (!confirmLock) return;

        newMetadata.full_name = nameInput;
        newMetadata.country = countryInput;
        newMetadata.birthdate = dobInput;
        newMetadata.starsign = starSignSelect;
        newMetadata.sexual_orientation = orientationSelect;
        newMetadata.profile_locked = true;
    }

    if (supabaseClient && isUserLoggedIn) await supabaseClient.auth.updateUser({ data: newMetadata });
    localStorage.setItem('match_userProfile', JSON.stringify(newMetadata));
    alert(isLockedAlready ? "✨ Preferences successfully updated!" : "✨ Identity permanently locked and preferences saved! Data securely synced."); 
    window.location.reload();
};

window.handleProfilePic = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (document.getElementById('profile-pic-preview')) document.getElementById('profile-pic-preview').src = e.target.result;
            localStorage.setItem('match_userAvatar', e.target.result);
        };
        reader.readAsDataURL(file);
    }
};

window.processCheckout = async function(tier) {
    if (!isUserLoggedIn || !supabaseClient) { alert("Please log in or register first to link your purchase securely!"); openAuthModal(); return; }
    const btn = document.getElementById(`btn-${tier}`);
    if (btn) { btn.innerText = "Redirecting securely to Stripe..."; btn.style.opacity = '0.7'; }
    const { data: { session } } = await supabaseClient.auth.getSession();
    window.location.href = `${STRIPE_LINKS[tier]}?client_reference_id=${session.user.id}___${tier}`;
};

/* 🎬 EXPANDED MULTI-FORMAT MASTER CATALOG */
const masterCatalog = [
    { title: "Superbad", category: "movie", platform: "Netflix", mood: "laugh", aesthetic: "colorful", trailerId: "MNpoTxeydiI", url: "https://www.netflix.com/title/70075482", synopsis: "High school seniors Seth and Evan attempt to buy booze for a wild house party, spiraling into an unforgettable night of hilarious chaos.", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1000&q=80" },
    { title: "Parasite", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", trailerId: "SEUXfv87Wpk", url: "https://www.max.com", synopsis: "Greed and class discrimination threaten the symbiotic relationship between the wealthy Park family and the destitute Kim clan.", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1000&q=80" },
    { title: "The Dark Knight", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", trailerId: "EXeTwQWrcwY", url: "https://www.max.com", synopsis: "When the Joker wreaks havoc on Gotham, Batman must accept his greatest psychological test of fighting injustice.", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80" },
    { title: "Interstellar", category: "movie", platform: "Prime", mood: "intense", aesthetic: "epic", trailerId: "zSWdZVtXT7E", url: "https://www.amazon.com/Prime-Video", synopsis: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80" },
    { title: "Inception", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", trailerId: "YoHD9XEInc0", url: "https://www.max.com", synopsis: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80" },
    { title: "Stranger Things", category: "series", platform: "Netflix", mood: "intense", aesthetic: "retro", trailerId: "b9EkMc79ZSU", url: "https://www.netflix.com/title/80057281", synopsis: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments and supernatural forces.", poster: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=1000&q=80" },
    { title: "The Last of Us", category: "series", platform: "Max", mood: "intense", aesthetic: "dark", trailerId: "uLtkt8BonwM", url: "https://www.max.com", synopsis: "After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl who may be humanity's last hope.", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80" },
    { title: "Crash Landing on You", category: "vertical_drama", platform: "Netflix", mood: "romantic", aesthetic: "bright", trailerId: "eXMjTXL221g", url: "https://www.netflix.com/title/81159258", synopsis: "A South Korean heiress accidentally paraglides into North Korea and into the life of an army officer who decides to help her hide.", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80" },
    { title: "Todas as Flores", category: "vertical_drama", platform: "Globoplay", mood: "intense", aesthetic: "dramatic", trailerId: "y10p-M08A_A", url: "https://globoplay.globo.com", synopsis: "A thrilling Brazilian novela about passion, vengeance, and family secrets in the fashion universe.", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1000&q=80" },
    { title: "Billionaire's Secret Heiress", category: "vertical_drama", platform: "ReelShort", mood: "intense", aesthetic: "modern", trailerId: "ScMzIvxBSi4", url: "https://www.reelshort.com", synopsis: "A high-stakes vertical drama filled with romance, betrayal, and secret identity twists.", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80" },
    { title: "The Ultimate Cinema Breakdown", category: "yt_video", platform: "YouTube", mood: "intense", aesthetic: "modern", trailerId: "d9MyW72ELq0", url: "https://www.youtube.com/watch?v=d9MyW72ELq0", synopsis: "Deep-dive analysis into the greatest film editing and storytelling techniques of the decade.", poster: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=1000&q=80" },
    { title: "Fast Film Hacks Short", category: "short", platform: "YouTube", mood: "laugh", aesthetic: "colorful", trailerId: "L_LUpnjgPso", url: "https://www.youtube.com/shorts/L_LUpnjgPso", synopsis: "60-second quick movie recommendations you can watch tonight!", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1000&q=80" },
    { title: "Cinematic Chillout Playlist", category: "spotify_playlist", platform: "Spotify", mood: "chill", aesthetic: "atmospheric", spotifyId: "37i9dQZF1DX4sWSpwq3LiO", spotifyType: "playlist", url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO", synopsis: "Curated ambient soundscapes and iconic acoustic film themes for relaxation.", poster: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80" },
    { title: "Movie Review Daily Podcast", category: "spotify_podcast", platform: "Spotify", mood: "chill", aesthetic: "informative", spotifyId: "0fA28Nnef4X3O6Oq0K1L5i", spotifyType: "show", url: "https://open.spotify.com/show/0fA28Nnef4X3O6Oq0K1L5i", synopsis: "The daily podcast reviewing the hottest new arrivals on streaming platforms.", poster: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1000&q=80" },
    { title: "Midnight City (Movie Vibe)", category: "spotify_track", platform: "Spotify", mood: "chill", aesthetic: "retro", spotifyId: "6GyDYK2LW23fO3A25L3C3a", spotifyType: "track", url: "https://open.spotify.com/track/6GyDYK2LW23fO3A25L3C3a", synopsis: "An iconic synthetic masterpiece that sets the ultimate late-night cinematic mood.", poster: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80" }
];

/* 🚀 MATCH ENGINE */
window.triggerMatch = async function() {
    if (adblockEnabled) { document.getElementById('adblock-modal').style.display = 'flex'; return; }
    const selCategory = document.getElementById('q-category')?.value || 'any';
    const selPlatform = document.getElementById('q-platform')?.value || 'any';
    const selMood = document.getElementById('q-mood')?.value || 'any';

    let pool = masterCatalog.filter(item => !seenList.includes(item.title) && !savedList.includes(item.title) && !dislikedList.includes(item.title));
    let targetedPool = pool;
    if (selCategory !== 'any') targetedPool = targetedPool.filter(i => i.category === selCategory);
    if (selPlatform !== 'any') targetedPool = targetedPool.filter(i => i.platform === selPlatform);
    if (selMood !== 'any') targetedPool = targetedPool.filter(i => i.mood === selMood);

    if (targetedPool.length === 0) {
        if (selCategory !== 'any') targetedPool = pool.filter(i => i.category === selCategory); else targetedPool = pool;
    }

    if (targetedPool.length === 0) {
        alert("✨ You have reviewed every title in our database! Clearing temporary view cache so you can rediscover matches...");
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

window.saveToList = function() { if (globalMatchTitle && !savedList.includes(globalMatchTitle)) { savedList.push(globalMatchTitle); syncListsToDatabase(); alert(`⭐ "${globalMatchTitle}" saved to your Watch Later Portfolio!`); } };
window.markAsSeen = function() { if (globalMatchTitle && !seenList.includes(globalMatchTitle)) { seenList.push(globalMatchTitle); syncListsToDatabase(); } triggerAdRetry(); };
window.markAsDisliked = function() { if (globalMatchTitle && !dislikedList.includes(globalMatchTitle)) { dislikedList.push(globalMatchTitle); syncListsToDatabase(); } triggerAdRetry(); };

window.triggerAdRetry = function() {
    if (isVIP || isAdFree) { document.getElementById('result-box').style.display = 'none'; triggerMatch(); return; }
    document.getElementById('reward-ad-modal').style.display = 'flex';
    let timeLeft = 15;
    const timerSpan = document.getElementById('ad-timer'), claimBtn = document.getElementById('claim-retry-btn'), closeBtn = document.getElementById('close-ad-btn');
    claimBtn.style.display = 'block'; closeBtn.style.display = 'none'; claimBtn.disabled = true; claimBtn.style.opacity = '0.5';
    
    const interval = setInterval(() => {
        timeLeft--; if (timerSpan) timerSpan.innerText = timeLeft;
        if (timeLeft <= 0) { clearInterval(interval); claimBtn.style.display = 'none'; closeBtn.style.display = 'block'; }
    }, 1000);
};

window.closeAdAndClaim = function() { document.getElementById('reward-ad-modal').style.display = 'none'; document.getElementById('result-box').style.display = 'none'; triggerMatch(); };
window.openPortfolioModal = function(title) {
    const item = masterCatalog.find(m => m.title === title);
    if (item) {
        document.getElementById('port-modal-title').innerText = item.title;
        document.getElementById('port-modal-synopsis').innerText = item.synopsis;
        document.getElementById('port-modal-plat').innerText = item.platform;
        document.getElementById('port-modal-bg').style.backgroundImage = `url('${item.poster}')`;
        document.getElementById('port-modal-link').onclick = function() { window.open(item.url, '_blank'); };
        document.getElementById('portfolio-modal').style.display = 'flex';
    }
};

window.addEventListener('DOMContentLoaded', async () => {
    updateClock();
    
    /* 🔥 AUTO-SLASH DOB FORMATTER */
    const dobInput = document.getElementById('profile-dob');
    if (dobInput) {
        dobInput.addEventListener('input', function(e) {
            if (userProfileData && userProfileData.profile_locked) return;
            if (e.inputType === 'deleteContentBackward') return; // Don't block backspacing

            let v = this.value.replace(/\D/g, ''); // Strip non-digits
            if (v.length > 8) v = v.substring(0, 8); // Max 8 digits (DDMMYYYY)

            let formatted = '';
            if (v.length > 4) formatted = `${v.substring(0,2)}/${v.substring(2,4)}/${v.substring(4)}`;
            else if (v.length > 2) formatted = `${v.substring(0,2)}/${v.substring(2)}`;
            else formatted = v;

            // Auto-append slash exactly when day or month is complete
            if (v.length === 2 || v.length === 4) formatted += '/';
            this.value = formatted;

            if (this.value.length >= 10) {
                const age = window.calculateAge(this.value);
                const ageDisp = document.getElementById('profile-age-display');
                if (ageDisp) ageDisp.value = age > 0 ? `${age} years old` : "Invalid Date";
            }
        });
    }

    const savedAvatar = localStorage.getItem('match_userAvatar');
    if (savedAvatar && document.getElementById('profile-pic-preview')) document.getElementById('profile-pic-preview').src = savedAvatar;

    if (isAdFree || isVIP) document.body.classList.add('ad-free-mode');
    checkAdBlocker(); setInterval(checkAdBlocker, 6000); 
    if (sessionStorage.getItem('dismissedChromeBanner') === 'true' && document.getElementById('chrome-banner')) document.getElementById('chrome-banner').style.display = 'none';

    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            isUserLoggedIn = true; userProfileData = session.user.user_metadata || {};
            
            if (session.user.user_metadata?.avatar_url && !localStorage.getItem('match_userAvatar')) {
                localStorage.setItem('match_userAvatar', session.user.user_metadata.avatar_url);
                if (document.getElementById('profile-pic-preview')) document.getElementById('profile-pic-preview').src = session.user.user_metadata.avatar_url;
            }

            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('payment') === 'success') {
                isAdFree = true; localStorage.setItem('match_adFree', 'true'); document.body.classList.add('ad-free-mode');
                if (urlParams.get('tier') === 'vip_monthly' || urlParams.get('tier') === 'vip_annual') { isVIP = true; localStorage.setItem('match_isVIP', 'true'); }
                alert("🎉 Premium Status Activated!"); window.history.replaceState({}, document.title, window.location.pathname); 
            }

            if (userProfileData.ad_free || userProfileData.vip_tier) { isAdFree = true; document.body.classList.add('ad-free-mode'); }
            if (userProfileData.vip_tier) isVIP = true;
            if (userProfileData.seen_list) seenList = userProfileData.seen_list;
            if (userProfileData.saved_list) savedList = userProfileData.saved_list;
            if (userProfileData.disliked_list) dislikedList = userProfileData.disliked_list;

            if(document.getElementById('nav-reg-btn')) document.getElementById('nav-reg-btn').style.display = 'none';
            if(document.getElementById('profile-link-tab')) document.getElementById('profile-link-tab').style.display = 'inline-block';
            if(document.getElementById('profile-pic-container')) document.getElementById('profile-pic-container').style.display = 'block';
            if (isVIP && document.getElementById('nav-upgrade-btn')) document.getElementById('nav-upgrade-btn').style.display = 'none';
            else if (!isAdFree && document.getElementById('nav-upgrade-btn')) document.getElementById('nav-upgrade-btn').style.display = 'block';
            if(document.getElementById('nav-logout-btn')) document.getElementById('nav-logout-btn').style.display = 'block';
            if(document.getElementById('adblock-signin-prompt')) document.getElementById('adblock-signin-prompt').style.display = 'none';
            if(document.getElementById('adblock-buy-prompt')) document.getElementById('adblock-buy-prompt').style.display = 'block';
        }
    }
});

window.doLogout = async function() { if (supabaseClient) { await supabaseClient.auth.signOut(); localStorage.clear(); window.location.reload(); } };
async function syncListsToDatabase() {
    localStorage.setItem('match_seenList', JSON.stringify(seenList)); localStorage.setItem('match_savedList', JSON.stringify(savedList)); localStorage.setItem('match_dislikedList', JSON.stringify(dislikedList));
    if (isUserLoggedIn && supabaseClient) { await supabaseClient.auth.updateUser({ data: { seen_list: seenList, saved_list: savedList, disliked_list: dislikedList } }); }
}
