console.log("Mastercode 43.0: Omnipresent Monetization, Cross-Browser Engine & Strict Deduplication Active");

let globalMatchTitle = "Match App";
let supabaseClient = null;
let isUserLoggedIn = false;
let userProfileData = {};

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let isAdFree = localStorage.getItem('match_adFree') === 'true'; 
let isVIP = localStorage.getItem('match_isVIP') === 'true';
let adblockEnabled = false;

// 💳 AUTOMATED STRIPE CHECKOUT
const STRIPE_LINKS = {
    'ad_free': 'https://buy.stripe.com/fZu4gz6nEaDHbpY7k0gEg01',
    'vip_monthly': 'https://buy.stripe.com/fZu3cvbHY13779I47OgEg03',
    'vip_annual': 'https://buy.stripe.com/7sY28reUa137dy65bSgEg02'
};

try { if (window.supabase) supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'); } catch(e){}

// 🛑 MULTI-LAYER AD-BLOCK DETECTION
function checkAdBlocker() {
    if (isAdFree || isVIP) return; 
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
    }, 400); // 400ms ensures it doesn't false-flag slow connections
}

// 🌐 INTENT-BASED CHROME DEEP-LINK ROUTER
window.openInChrome = function() {
    const targetUrl = window.location.href;
    const cleanUrl = targetUrl.replace(/^https?:\/\//, '');
    const ua = navigator.userAgent;
    
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
        window.location.href = 'googlechrome://' + cleanUrl;
    } else {
        window.location.href = 'intent://' + cleanUrl + '#Intent;scheme=https;package=com.android.chrome;end;';
    }

    setTimeout(() => {
        const fallbackModal = document.getElementById('chrome-fallback-modal');
        if(fallbackModal) fallbackModal.style.display = 'flex';
    }, 1500);
};

window.copyLinkForChrome = function() {
    navigator.clipboard.writeText(window.location.href);
    alert("📋 Link copied! Open your Google Chrome app and paste it into the address bar.");
};

window.dismissChromeBanner = function() {
    document.getElementById('chrome-banner').style.display = 'none';
    sessionStorage.setItem('dismissedChromeBanner', 'true');
};

window.closeWelcomeModal = function() {
    document.getElementById('welcome-modal').style.display = 'none';
    localStorage.setItem('hasSeenWelcome', 'true');
};

// 🔏 GOOGLE OAUTH
window.signInWithGoogle = async function() {
    if (!supabaseClient) { alert("Server connection error. Please try again."); return; }
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname }
    });
    if (error) alert("Google Login Error: " + error.message);
};

// 👤 PROFILE ENGINE & AGE CALCULATOR
window.calculateAge = function(dobStr) {
    if (!dobStr || !dobStr.includes('/')) return 0;
    const parts = dobStr.split('/');
    if (parts.length !== 3) return 0;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const dob = new Date(year, month, day);
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

    if (!dobInput || !starSignSelect) {
        alert("Please enter your Birthdate (DD/MM/YYYY) and select your Star Sign.");
        return;
    }

    const confirmLock = confirm("⚠️ PERMANENT SETTING WARNING:\n\nOnce you save your Birthdate and Star Sign, they CANNOT be changed or edited ever again. Are you sure this information is correct?");
    if (!confirmLock) return;

    const calculatedAge = window.calculateAge(dobInput);
    
    const newMetadata = {
        ...userProfileData,
        full_name: nameInput,
        birthdate: dobInput,
        age: calculatedAge,
        starsign: starSignSelect,
        profile_locked: true
    };

    if (supabaseClient && isUserLoggedIn) {
        const { error } = await supabaseClient.auth.updateUser({ data: newMetadata });
        if (error) { alert("Error saving profile: " + error.message); return; }
    }

    localStorage.setItem('match_userProfile', JSON.stringify(newMetadata));
    alert("✨ Profile saved and permanently locked!");
    window.location.reload();
};

window.handleProfilePic = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Str = e.target.result;
            const preview = document.getElementById('profile-pic-preview');
            if(preview) preview.src = base64Str;
            localStorage.setItem('match_userAvatar', base64Str);
        };
        reader.readAsDataURL(file);
    }
};

window.openUpgradeModal = function() { document.getElementById('upgrade-modal').style.display = 'flex'; };
window.closeUpgradeModal = function() { document.getElementById('upgrade-modal').style.display = 'none'; };

window.processCheckout = async function(tier) {
    if (!isUserLoggedIn || !supabaseClient) {
        alert("Please log in or register first so we can securely link this purchase to your account!");
        window.location.href = 'register.html';
        return;
    }
    const btn = document.getElementById(tier === 'ad_free' ? 'purchase-btn' : `btn-${tier}`);
    if(btn) { btn.innerText = "Redirecting to Secure Checkout..."; btn.style.opacity = '0.7'; }

    const { data: { session } } = await supabaseClient.auth.getSession();
    window.location.href = `${STRIPE_LINKS[tier]}?client_reference_id=${session.user.id}___${tier}`;
};

window.addEventListener('DOMContentLoaded', async () => {
    const savedAvatar = localStorage.getItem('match_userAvatar');
    if (savedAvatar) {
        const preview = document.getElementById('profile-pic-preview');
        if(preview) preview.src = savedAvatar;
    }

    if (isAdFree || isVIP) document.body.classList.add('ad-free-mode');
    checkAdBlocker();
    setInterval(checkAdBlocker, 5000); 

    if (localStorage.getItem('hasSeenWelcome') !== 'true' && document.getElementById('welcome-modal')) {
        document.getElementById('welcome-modal').style.display = 'flex';
    }
    if (sessionStorage.getItem('dismissedChromeBanner') === 'true' && document.getElementById('chrome-banner')) {
        document.getElementById('chrome-banner').style.display = 'none';
    }

    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            isUserLoggedIn = true;
            userProfileData = session.user.user_metadata || {};

            if (session.user.user_metadata?.avatar_url && !localStorage.getItem('match_userAvatar')) {
                const googleAvatar = session.user.user_metadata.avatar_url;
                localStorage.setItem('match_userAvatar', googleAvatar);
                const preview = document.getElementById('profile-pic-preview');
                if(preview) preview.src = googleAvatar;
            }

            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('payment') === 'success') {
                const tierBought = urlParams.get('tier');
                isAdFree = true; localStorage.setItem('match_adFree', 'true');
                document.body.classList.add('ad-free-mode');
                if (tierBought === 'vip_monthly' || tierBought === 'vip_annual') {
                    isVIP = true; localStorage.setItem('match_isVIP', 'true');
                }
                alert("🎉 Payment Confirmed! Your account has been upgraded successfully.");
                window.history.replaceState({}, document.title, window.location.pathname); 
            }

            if (userProfileData.ad_free || userProfileData.vip_tier) {
                isAdFree = true; localStorage.setItem('match_adFree', 'true');
                document.body.classList.add('ad-free-mode');
            }
            if (userProfileData.vip_tier) {
                isVIP = true; localStorage.setItem('match_isVIP', 'true');
            }

            if (userProfileData.seen_list) seenList = userProfileData.seen_list;
            if (userProfileData.saved_list) savedList = userProfileData.saved_list;

            if(document.getElementById('nav-reg-btn')) document.getElementById('nav-reg-btn').style.display = 'none';
            if(document.getElementById('profile-link-tab')) document.getElementById('profile-link-tab').style.display = 'inline-block';
            if(document.getElementById('profile-link-tab-small')) document.getElementById('profile-link-tab-small').style.display = 'inline-block';
            if (isVIP && document.getElementById('nav-upgrade-btn')) document.getElementById('nav-upgrade-btn').style.display = 'none';
            else if (!isAdFree && document.getElementById('nav-upgrade-btn')) document.getElementById('nav-upgrade-btn').style.display = 'block';
            if(document.getElementById('nav-logout-btn')) document.getElementById('nav-logout-btn').style.display = 'block';
        }
    }
});

window.doLogout = async function() { if (supabaseClient) { await supabaseClient.auth.signOut(); localStorage.clear(); window.location.reload(); } };
async function syncListsToDatabase() {
    localStorage.setItem('match_seenList', JSON.stringify(seenList));
    localStorage.setItem('match_savedList', JSON.stringify(savedList));
    if (isUserLoggedIn && supabaseClient) await supabaseClient.auth.updateUser({ data: { seen_list: seenList, saved_list: savedList } });
}

// 🎬 THE ALGORITHM CATALOG (Expanded & Error-Free)
const masterCatalog = [
    { title: "Superbad", category: "movie", platform: "Netflix", mood: "laugh", aesthetic: "colorful", era: "classic", pacing: "fast", trailerId: "MNpoTxeydiI", url: "https://www.netflix.com", synopsis: "High school seniors deal with separation anxiety during a wild party.", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80" },
    { title: "Stranger Things", category: "series", platform: "Netflix", mood: "intense", aesthetic: "retro", era: "modern", pacing: "epic", trailerId: "b9EkMc79ZSU", url: "https://www.netflix.com", synopsis: "Kids uncover secret experiments and terrifying supernatural forces.", poster: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=800&q=80" },
    { title: "Parasite", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", era: "modern", pacing: "standard", trailerId: "SEUXfv87Wpk", url: "https://www.max.com", synopsis: "Greed and class discrimination threaten a wealthy family.", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80" },
    { title: "Interstellar", category: "movie", platform: "Prime", mood: "mindbending", aesthetic: "dark", era: "modern", pacing: "epic", trailerId: "zSWdZVtXT7E", url: "https://www.primevideo.com", synopsis: "Explorers travel through a wormhole in space to ensure humanity's survival.", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80" },
    { title: "Avengers: Endgame", category: "movie", platform: "Disney", mood: "intense", aesthetic: "colorful", era: "modern", pacing: "epic", trailerId: "TcMBFSGVi1c", url: "https://www.disneyplus.com", synopsis: "The Avengers assemble once more to reverse Thanos' actions.", poster: "https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=800&q=80" },
    { title: "Avenida Brasil", category: "telenovela", platform: "Globoplay", mood: "intense", aesthetic: "colorful", era: "classic", pacing: "epic", trailerId: "tYv8j-d3Bmw", url: "https://globoplay.globo.com", synopsis: "A gripping story of revenge and intense family drama.", poster: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80" }
];

// 🔥 STRICT 100% DEDUPLICATION ENGINE
window.triggerMatch = async function() {
    if (adblockEnabled) { document.getElementById('adblock-modal').style.display = 'flex'; return; }
    
    // Unseen Pool strictly removes anything that exists in the seenList array
    let unseenPool = masterCatalog.filter(item => !seenList.includes(item.title));
    
    if (unseenPool.length === 0) { 
        alert("Incredible! You have watched every single exact match in our current global database! We are adding more titles daily."); 
        return; 
    }
    
    const selected = unseenPool[Math.floor(Math.random() * unseenPool.length)];
    globalMatchTitle = selected.title; 
    
    // Instantly log it so it can NEVER be repeated
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
    if (!savedList.includes(globalMatchTitle)) {
        savedList.push(globalMatchTitle);
        syncListsToDatabase();
        alert(`⭐ "${globalMatchTitle}" saved to your Portfolio!`);
    }
};

window.triggerAdRetry = function() {
    if (isVIP || isAdFree) { triggerMatch(); return; }
    document.getElementById('reward-ad-modal').style.display = 'flex';
    let timeLeft = 15;
    const timerSpan = document.getElementById('ad-timer');
    const claimBtn = document.getElementById('claim-retry-btn');
    claimBtn.disabled = true; claimBtn.style.opacity = '0.5';
    const interval = setInterval(() => {
        timeLeft--; timerSpan.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(interval);
            claimBtn.disabled = false; claimBtn.style.opacity = '1';
            claimBtn.innerHTML = '✨ Claim New Match!';
            claimBtn.onclick = () => { document.getElementById('reward-ad-modal').style.display = 'none'; triggerMatch(); };
        }
    }, 1000);
};
