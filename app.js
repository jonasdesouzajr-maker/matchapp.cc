console.log("Mastercode 48.0: Live Clock, Smart Chrome Strict Fix, & Split-Algorithm Logic Active");

let globalMatchTitle = "Match App";
let supabaseClient = null;
let isUserLoggedIn = false;
let userProfileData = {};

// Triple Array Algorithm for strict deduplication & UI segmentation
let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]'); // Acts as Portfolio
let dislikedList = JSON.parse(localStorage.getItem('match_dislikedList') || '[]');

let isAdFree = localStorage.getItem('match_adFree') === 'true'; 
let isVIP = localStorage.getItem('match_isVIP') === 'true';
let adblockEnabled = false;

const STRIPE_LINKS = {
    'ad_free': 'https://buy.stripe.com/fZu4gz6nEaDHbpY7k0gEg01',
    'vip_monthly': 'https://buy.stripe.com/fZu3cvbHY13779I47OgEg03',
    'vip_annual': 'https://buy.stripe.com/7sY28reUa137dy65bSgEg02'
};

try { if (window.supabase) supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'); } catch(e){}

// 🕒 GLOBAL REAL-TIME CLOCK ENGINE
function updateClock() {
    const clock = document.getElementById('real-time-clock');
    if(clock) {
        const now = new Date();
        const dateOpts = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        const timeOpts = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        clock.innerHTML = now.toLocaleDateString(undefined, dateOpts) + ' | ' + now.toLocaleTimeString(undefined, timeOpts);
    }
}
setInterval(updateClock, 1000);

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

// 🌐 STRICT CHROME & INCOGNITO ROUTER
window.openInChromeSmart = function() {
    const cleanUrl = 'matchapp.cc';
    const ua = navigator.userAgent;
    
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
        setTimeout(() => { window.location.href = "https://apps.apple.com/app/google-chrome/id535886823"; }, 1500);
        window.location.href = 'googlechrome://' + cleanUrl;
    } else if (/Android/.test(ua)) {
        window.location.href = 'intent://' + cleanUrl + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.android.chrome;end;';
    } else {
        // Strict Desktop Check: True Chrome only. Rejects Edge, Opera, Brave masking.
        const isTrueChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor) && !/Edg/.test(ua) && !/OPR/.test(ua);
        if (isTrueChrome) {
            alert("✅ You are already using Google Chrome desktop!");
        } else {
            window.open("https://www.google.com/chrome/", "_blank");
        }
    }
};

window.openIncognitoHelper = function() {
    navigator.clipboard.writeText("https://matchapp.cc");
    alert("🕵️ INCOGNITO MODE:\n\nBrowsers block automatic incognito tabs for your security.\n\nWe have copied 'https://matchapp.cc' to your clipboard! Click your browser menu, open a 'New Incognito Window', and paste it in.");
};

window.showAdblockGuide = function() {
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

// 👤 PROFILE ENGINE & AUTO-SLASH & DYNAMIC AGE
window.calculateAge = function(dobStr) {
    if (!dobStr || !dobStr.includes('/')) return 0;
    const parts = dobStr.split('/');
    if (parts.length !== 3) return 0;
    const dob = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    const today = new Date(); // Updates live based on current day
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
};

window.saveProfileData = async function() {
    const dobInput = document.getElementById('profile-dob').value.trim();
    const starSignSelect = document.getElementById('profile-starsign').value;
    const nameInput = document.getElementById('profile-name').value.trim();

    if (!dobInput || dobInput.length < 10 || !starSignSelect) { alert("Please enter complete Birthdate (DD/MM/YYYY) and Star Sign."); return; }
    const confirmLock = confirm("⚠️ PERMANENT WARNING:\n\nOnce confirmed, your Birthdate and Star Sign CANNOT be changed. Proceed?");
    if (!confirmLock) return;

    // Age is calculated live, we don't need to permanently store age, but we store the raw DOB string securely.
    const newMetadata = { ...userProfileData, full_name: nameInput, birthdate: dobInput, starsign: starSignSelect, profile_locked: true };
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
        alert("Please log in or register first to securely link your purchase!"); window.location.href = 'index.html'; return; 
    }
    const btn = document.getElementById(`btn-${tier}`);
    if(btn) { btn.innerText = "Redirecting securely to Stripe..."; btn.style.opacity = '0.7'; }
    const { data: { session } } = await supabaseClient.auth.getSession();
    window.location.href = `${STRIPE_LINKS[tier]}?client_reference_id=${session.user.id}___${tier}`;
};

window.addEventListener('DOMContentLoaded', async () => {
    updateClock(); // Init clock immediately
    
    // Auto-Slash DOB Formatter
    const dobInput = document.getElementById('profile-dob');
    if (dobInput) {
        dobInput.addEventListener('input', function(e) {
            if (userProfileData && userProfileData.profile_locked) return;
            let v = this.value.replace(/\D/g, ''); // Strip non-numeric
            if (v.length > 2 && v.length <= 4) v = v.substring(0,2) + '/' + v.substring(2);
            else if (v.length > 4) v = v.substring(0,2) + '/' + v.substring(2,4) + '/' + v.substring(4,8);
            this.value = v;
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
    localStorage.setItem('match_seenList', JSON.stringify(seenList)); 
    localStorage.setItem('match_savedList', JSON.stringify(savedList));
    localStorage.setItem('match_dislikedList', JSON.stringify(dislikedList));
    if (isUserLoggedIn && supabaseClient) {
        await supabaseClient.auth.updateUser({ data: { seen_list: seenList, saved_list: savedList, disliked_list: dislikedList } });
    }
}

// 🎬 CATALOG
const masterCatalog = [
    { title: "Superbad", category: "movie", platform: "Netflix", mood: "laugh", aesthetic: "colorful", era: "classic", pacing: "fast", trailerId: "MNpoTxeydiI", url: "https://www.netflix.com", synopsis: "High school seniors deal with separation anxiety during a wild party.", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80" },
    { title: "Stranger Things", category: "series", platform: "Netflix", mood: "intense", aesthetic: "retro", era: "modern", pacing: "epic", trailerId: "b9EkMc79ZSU", url: "https://www.netflix.com", synopsis: "Kids uncover secret experiments and terrifying supernatural forces.", poster: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=800&q=80" },
    { title: "Parasite", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", era: "modern", pacing: "standard", trailerId: "SEUXfv87Wpk", url: "https://www.max.com", synopsis: "Greed and class discrimination threaten a wealthy family.", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80" }
];

// 🚀 MATCH TRIGGER (Strict Deduplication check across all 3 lists)
window.triggerMatch = async function() {
    if (adblockEnabled) { document.getElementById('adblock-modal').style.display = 'flex'; return; }
    
    let unseenPool = masterCatalog.filter(item => 
        !seenList.includes(item.title) && 
        !savedList.includes(item.title) && 
        !dislikedList.includes(item.title)
    );
    if (unseenPool.length === 0) { alert("You have explored every match in the database for now!"); return; }
    
    const selected = unseenPool[Math.floor(Math.random() * unseenPool.length)];
    globalMatchTitle = selected.title; 
    
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
        document.getElementById('res-trailer').src = `https://www.youtube.com/embed/${selected.trailerId}`;
    }, 1500);
};

// 🔘 ACTION BUTTONS
window.saveToList = function() {
    if (!savedList.includes(globalMatchTitle)) { 
        savedList.push(globalMatchTitle); syncListsToDatabase(); 
        alert(`⭐ Added to your Portfolio Watch Later list!`); 
    }
};

window.markAsSeen = function() {
    if (!seenList.includes(globalMatchTitle)) { seenList.push(globalMatchTitle); syncListsToDatabase(); }
    triggerAdRetry();
};

window.markAsDisliked = function() {
    if (!dislikedList.includes(globalMatchTitle)) { dislikedList.push(globalMatchTitle); syncListsToDatabase(); }
    triggerAdRetry();
};

// ✖ CLOSE AD AND CLAIM MATCH FLOW
window.triggerAdRetry = function() {
    if (isVIP || isAdFree) { document.getElementById('result-box').style.display = 'none'; triggerMatch(); return; }
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
    document.getElementById('result-box').style.display = 'none';
    triggerMatch();
};

// 📺 PORTFOLIO INTERACTIVE POPUP
window.openPortfolioModal = function(title) {
    const item = masterCatalog.find(m => m.title === title);
    if(item) {
        document.getElementById('port-modal-title').innerText = item.title;
        document.getElementById('port-modal-synopsis').innerText = item.synopsis;
        document.getElementById('port-modal-plat').innerText = item.platform;
        document.getElementById('port-modal-bg').style.backgroundImage = `url('${item.poster}')`;
        document.getElementById('port-modal-link').onclick = function() { window.open(item.url, '_blank'); };
        document.getElementById('portfolio-modal').style.display = 'flex';
    }
};
