console.log("Mastercode 47.0: Advanced Hardware Routing, Fallbacks, & VIP Modal Flows Active");

let globalMatchTitle = "Match App";
let supabaseClient = null;
let isUserLoggedIn = false;
let userProfileData = {};

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let isAdFree = localStorage.getItem('match_adFree') === 'true'; 
let isVIP = localStorage.getItem('match_isVIP') === 'true';
let adblockEnabled = false;

const STRIPE_LINKS = {
    'ad_free': 'https://buy.stripe.com/fZu4gz6nEaDHbpY7k0gEg01',
    'vip_monthly': 'https://buy.stripe.com/fZu3cvbHY13779I47OgEg03',
    'vip_annual': 'https://buy.stripe.com/7sY28reUa137dy65bSgEg02'
};

try { if (window.supabase) supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'); } catch(e){}

// 🛑 AD BLOCK DETECTION
function checkAdBlocker() {
    if (isAdFree || isVIP) return; 
    if (window.location.pathname.includes('pricing.html')) return; 
    
    const bait = document.createElement('div');
    bait.className = 'adsbox ad-placement doubleclick adSense pub_300x250 text-ad textAd';
    bait.style.position = 'absolute'; bait.style.top = '-9999px'; bait.style.left = '-9999px';
    document.body.appendChild(bait);
    window.setTimeout(() => {
        const isBlocked = bait.offsetHeight === 0 || window.getComputedStyle(bait).display === 'none' || bait.offsetParent === null;
        if (isBlocked) { 
            const modal = document.getElementById('adblock-modal');
            if(modal) modal.style.setProperty('display', 'flex', 'important'); 
        }
        bait.remove();
    }, 500); 
}

// 🌐 ADVANCED CHROME & INCOGNITO ROUTER
window.openInChromeSmart = function() {
    const cleanUrl = 'matchapp.cc';
    const ua = navigator.userAgent;
    
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
        // iOS: Tries to open Chrome, if fails, opens Apple App Store for Chrome
        setTimeout(() => { window.location.href = "https://apps.apple.com/app/google-chrome/id535886823"; }, 1500);
        window.location.href = 'googlechrome://' + cleanUrl;
    } else if (/Android/.test(ua)) {
        // Android: Intent natively falls back to Play Store if Chrome isn't installed
        window.location.href = 'intent://' + cleanUrl + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.android.chrome;end;';
    } else {
        // Desktop: If they aren't on Chrome, offer the download link
        if(window.chrome) { alert("You are already using a Chrome-based browser!"); } 
        else { window.open("https://www.google.com/chrome/", "_blank"); }
    }
};

window.openIncognitoHelper = function() {
    // Browsers block forced incognito windows. Best UX is copying link and instructing.
    navigator.clipboard.writeText("https://matchapp.cc");
    alert("🕵️ INCOGNITO MODE:\n\nFor security reasons, browsers require you to open Incognito mode manually.\n\nWe have copied 'https://matchapp.cc' to your clipboard! Open your browser menu, click 'New Incognito Window', and paste it in.");
};

window.showAdblockGuide = function() {
    // Browsers block direct access to chrome://extensions.
    alert("🛠️ HOW TO DISABLE:\n\n1. Look for the puzzle piece 🧩 or shield 🛡️ icon in your browser's top right corner.\n2. Click your Ad-Blocker extension.\n3. Select 'Pause on this site' or 'Disable for matchapp.cc'.\n4. Click 'Reload Page'.");
};

window.dismissChromeBanner = function() {
    document.getElementById('chrome-banner').style.display = 'none';
    sessionStorage.setItem('dismissedChromeBanner', 'true');
};

// 🔏 GOOGLE OAUTH
window.signInWithGoogle = async function() {
    if (!supabaseClient) { alert("Server error. Try again."); return; }
    const { data, error } = await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://matchapp.cc/callback.html' } });
    if (error) alert("Google Login Error: " + error.message);
};

// 👤 STRICT PROFILE ENGINE
window.calculateAge = function(dobStr) {
    if (!dobStr || !dobStr.includes('/')) return 0;
    const parts = dobStr.split('/');
    if (parts.length !== 3) return 0;
    const dob = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
};

window.saveProfileData = async function() {
    const dobInput = document.getElementById('profile-dob').value.trim();
    const starSignSelect = document.getElementById('profile-starsign').value;
    const nameInput = document.getElementById('profile-name').value.trim();

    if (!dobInput || !starSignSelect) { alert("Please enter Birthdate and Star Sign."); return; }
    const confirmLock = confirm("⚠️ PERMANENT WARNING:\n\nOnce confirmed, your Birthdate and Star Sign CANNOT be changed. Proceed?");
    if (!confirmLock) return;

    const newMetadata = { ...userProfileData, full_name: nameInput, birthdate: dobInput, age: window.calculateAge(dobInput), starsign: starSignSelect, profile_locked: true };
    if (supabaseClient && isUserLoggedIn) await supabaseClient.auth.updateUser({ data: newMetadata });
    localStorage.setItem('match_userProfile', JSON.stringify(newMetadata));
    alert("✨ Profile data locked and permanently saved."); window.location.reload();
};

window.handleProfilePic = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) { document.getElementById('profile-pic-preview').src = e.target.result; localStorage.setItem('match_userAvatar', e.target.result); };
        reader.readAsDataURL(file);
    }
};

window.processCheckout = async function(tier) {
    if (!isUserLoggedIn || !supabaseClient) { 
        alert("Please log in or register first to securely link your purchase!"); 
        window.location.href = 'index.html'; return; 
    }
    const btn = document.getElementById(`btn-${tier}`);
    if(btn) { btn.innerText = "Redirecting securely to Stripe..."; btn.style.opacity = '0.7'; }
    const { data: { session } } = await supabaseClient.auth.getSession();
    window.location.href = `${STRIPE_LINKS[tier]}?client_reference_id=${session.user.id}___${tier}`;
};

window.addEventListener('DOMContentLoaded', async () => {
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
                if(document.getElementById('profile-pic-preview')) document.getElementById('profile-pic-preview').src = session.user.user_metadata.avatar_url;
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

            if(document.getElementById('nav-reg-btn')) document.getElementById('nav-reg-btn').style.display = 'none';
            if(document.getElementById('profile-link-tab')) document.getElementById('profile-link-tab').style.display = 'inline-block';
            if(document.getElementById('profile-pic-container')) document.getElementById('profile-pic-container').style.display = 'block';
            
            if (isVIP && document.getElementById('nav-upgrade-btn')) document.getElementById('nav-upgrade-btn').style.display = 'none';
            else if (!isAdFree && document.getElementById('nav-upgrade-btn')) document.getElementById('nav-upgrade-btn').style.display = 'block';
            if(document.getElementById('nav-logout-btn')) document.getElementById('nav-logout-btn').style.display = 'block';
            
            // Adjust Adblock Modal for Logged in Users
            if(document.getElementById('adblock-signin-prompt')) document.getElementById('adblock-signin-prompt').style.display = 'none';
            if(document.getElementById('adblock-buy-prompt')) document.getElementById('adblock-buy-prompt').style.display = 'block';
        }
    }
});

window.doLogout = async function() { if (supabaseClient) { await supabaseClient.auth.signOut(); localStorage.clear(); window.location.reload(); } };
async function syncListsToDatabase() {
    localStorage.setItem('match_seenList', JSON.stringify(seenList)); localStorage.setItem('match_savedList', JSON.stringify(savedList));
    if (isUserLoggedIn && supabaseClient) await supabaseClient.auth.updateUser({ data: { seen_list: seenList, saved_list: savedList } });
}

// 🎬 CATALOG
const masterCatalog = [
    { title: "Superbad", category: "movie", platform: "Netflix", mood: "laugh", aesthetic: "colorful", era: "classic", pacing: "fast", trailerId: "MNpoTxeydiI", url: "https://www.netflix.com", synopsis: "High school seniors deal with separation anxiety during a wild party.", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80" },
    { title: "Stranger Things", category: "series", platform: "Netflix", mood: "intense", aesthetic: "retro", era: "modern", pacing: "epic", trailerId: "b9EkMc79ZSU", url: "https://www.netflix.com", synopsis: "Kids uncover secret experiments and terrifying supernatural forces.", poster: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=800&q=80" }
];

window.triggerMatch = async function() {
    if (adblockEnabled) { document.getElementById('adblock-modal').style.display = 'flex'; return; }
    let unseenPool = masterCatalog.filter(item => !seenList.includes(item.title));
    if (unseenPool.length === 0) { alert("You have watched every exact match in the database!"); return; }
    
    const selected = unseenPool[Math.floor(Math.random() * unseenPool.length)];
    globalMatchTitle = selected.title; 
    seenList.push(globalMatchTitle);
    syncListsToDatabase();

    if(document.getElementById('search-container')) document.getElementById('search-container').style.display = 'none';
    if(document.getElementById('questionnaire-box')) document.getElementById('questionnaire-box').style.display = 'none';
    document.getElementById('loading-box').style.display = 'block';

    setTimeout(() => {
        document.getElementById('loading-box').style.display = 'none';
        const resultBox = document.getElementById('result-box');
        resultBox.style.display = 'block';
        document.getElementById('res-header-bg').style.backgroundImage = `url('${selected.poster}')`;
        document.getElementById('res-title').innerText = selected.title;
        document.getElementById('res-synopsis').innerText = selected.synopsis;
        document.getElementById('res-platform').innerText = selected.platform;
        document.getElementById('res-trailer').src = `https://www.youtube.com/embed/${selected.trailerId}`;
        document.getElementById('res-direct-link').href = selected.url;
    }, 1500);
};

window.saveToList = function() {
    if (!savedList.includes(globalMatchTitle)) { savedList.push(globalMatchTitle); syncListsToDatabase(); alert(`⭐ "${globalMatchTitle}" saved!`); }
};

window.triggerAdRetry = function() {
    if (isVIP || isAdFree) { triggerMatch(); return; }
    document.getElementById('reward-ad-modal').style.display = 'flex';
    
    let timeLeft = 15;
    const timerSpan = document.getElementById('ad-timer');
    const claimBtn = document.getElementById('claim-retry-btn');
    const closeBtn = document.getElementById('close-ad-btn');
    
    claimBtn.style.display = 'block';
    closeBtn.style.display = 'none';
    claimBtn.disabled = true; claimBtn.style.opacity = '0.5';
    
    const interval = setInterval(() => {
        timeLeft--; timerSpan.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(interval);
            claimBtn.style.display = 'none'; 
            closeBtn.style.display = 'block'; 
        }
    }, 1000);
};

window.closeAdAndClaim = function() {
    document.getElementById('reward-ad-modal').style.display = 'none';
    triggerMatch();
};
