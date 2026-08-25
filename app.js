console.log("Mastercode 49.0: 100% Airtight Deduplication, Immersive Results & Auto-Formatting DOB/Age Active");

let globalMatchTitle = "Match App";
let supabaseClient = null;
let isUserLoggedIn = false;
let userProfileData = {};

// Triple Array Storage Engine for Strict Deduplication
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

try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU');
    }
} catch(e) {}

// 🕒 GLOBAL REAL-TIME CLOCK ENGINE
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

// 🛑 AD BLOCK DETECTION
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

// 🌐 ADVANCED CHROME ROUTER
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

window.openIncognitoHelper = function() {
    navigator.clipboard.writeText("https://matchapp.cc");
    alert("🕵️ INCOGNITO MODE:\n\nLink copied to clipboard! Open your browser menu, click 'New Incognito Window', and paste it in.");
};

window.showAdblockGuide = function() {
    alert("🛠️ HOW TO DISABLE:\n\n1. Click your Ad-Blocker icon in top right.\n2. Select 'Pause on this site' or 'Disable for matchapp.cc'.\n3. Click 'Reload Page'.");
};

window.dismissChromeBanner = function() {
    const banner = document.getElementById('chrome-banner');
    if (banner) banner.style.display = 'none';
    sessionStorage.setItem('dismissedChromeBanner', 'true');
};

// 🔏 GOOGLE OAUTH
window.signInWithGoogle = async function() {
    if (!supabaseClient) { alert("Server connection failed. Please refresh."); return; }
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'https://matchapp.cc/callback.html' }
    });
    if (error) alert("Google Login Error: " + error.message);
};

// 👤 PROFILE ENGINE & AUTOMATIC SLASH DOB & DYNAMIC AGE
window.calculateAge = function(dobStr) {
    if (!dobStr || !dobStr.includes('/')) return 0;
    const parts = dobStr.split('/');
    if (parts.length !== 3) return 0;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1920 || year > new Date().getFullYear()) return 0;
    
    const dob = new Date(year, month, day);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age < 0 ? 0 : age;
};

window.saveProfileData = async function() {
    const dobInput = document.getElementById('profile-dob').value.trim();
    const starSignSelect = document.getElementById('profile-starsign').value;
    const nameInput = document.getElementById('profile-name').value.trim();

    if (!dobInput || dobInput.length < 10 || !starSignSelect) {
        alert("Please enter a valid Birthdate (DD/MM/YYYY) and select your Star Sign.");
        return;
    }

    const calcAge = window.calculateAge(dobInput);
    if (calcAge === 0) {
        alert("Invalid birthdate entered. Please check the day, month, and year.");
        return;
    }

    const confirmLock = confirm("⚠️ PERMANENT WARNING:\n\nOnce confirmed, your Birthdate and Star Sign CANNOT be changed. Proceed?");
    if (!confirmLock) return;

    const newMetadata = { ...userProfileData, full_name: nameInput, birthdate: dobInput, starsign: starSignSelect, profile_locked: true };
    if (supabaseClient && isUserLoggedIn) await supabaseClient.auth.updateUser({ data: newMetadata });
    localStorage.setItem('match_userProfile', JSON.stringify(newMetadata));
    alert("✨ Profile locked and permanently saved!");
    window.location.reload();
};

window.handleProfilePic = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('profile-pic-preview');
            if (preview) preview.src = e.target.result;
            localStorage.setItem('match_userAvatar', e.target.result);
        };
        reader.readAsDataURL(file);
    }
};

window.processCheckout = async function(tier) {
    if (!isUserLoggedIn || !supabaseClient) { 
        alert("Please log in or register first to link your purchase securely!"); 
        window.location.href = 'index.html';
        return; 
    }
    const btn = document.getElementById(`btn-${tier}`);
    if (btn) { btn.innerText = "Redirecting securely to Stripe..."; btn.style.opacity = '0.7'; }
    const { data: { session } } = await supabaseClient.auth.getSession();
    window.location.href = `${STRIPE_LINKS[tier]}?client_reference_id=${session.user.id}___${tier}`;
};

window.addEventListener('DOMContentLoaded', async () => {
    updateClock();
    
    // Automatic Slash Formatting & Dynamic Age Engine
    const dobInput = document.getElementById('profile-dob');
    if (dobInput) {
        dobInput.addEventListener('input', function() {
            if (userProfileData && userProfileData.profile_locked) return;
            let digits = this.value.replace(/\D/g, '');
            if (digits.length > 8) digits = digits.substring(0, 8);
            
            if (digits.length >= 5) {
                this.value = `${digits.substring(0,2)}/${digits.substring(2,4)}/${digits.substring(4)}`;
            } else if (digits.length >= 3) {
                this.value = `${digits.substring(0,2)}/${digits.substring(2)}`;
            } else {
                this.value = digits;
            }

            if (this.value.length === 10) {
                const age = window.calculateAge(this.value);
                const ageDisp = document.getElementById('profile-age-display');
                if (ageDisp) ageDisp.value = age > 0 ? `${age} years old` : "Invalid Date";
            }
        });
    }

    const savedAvatar = localStorage.getItem('match_userAvatar');
    if (savedAvatar && document.getElementById('profile-pic-preview')) {
        document.getElementById('profile-pic-preview').src = savedAvatar;
    }

    if (isAdFree || isVIP) document.body.classList.add('ad-free-mode');
    checkAdBlocker();
    setInterval(checkAdBlocker, 6000); 

    if (sessionStorage.getItem('dismissedChromeBanner') === 'true' && document.getElementById('chrome-banner')) {
        document.getElementById('chrome-banner').style.display = 'none';
    }

    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            isUserLoggedIn = true;
            userProfileData = session.user.user_metadata || {};
            
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

window.doLogout = async function() {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
        localStorage.clear();
        window.location.reload();
    }
};

async function syncListsToDatabase() {
    localStorage.setItem('match_seenList', JSON.stringify(seenList)); 
    localStorage.setItem('match_savedList', JSON.stringify(savedList));
    localStorage.setItem('match_dislikedList', JSON.stringify(dislikedList));
    if (isUserLoggedIn && supabaseClient) {
        await supabaseClient.auth.updateUser({
            data: { seen_list: seenList, saved_list: savedList, disliked_list: dislikedList }
        });
    }
}

// 🎬 ENRICHED EXPANDED MASTER CATALOG
const masterCatalog = [
    { title: "Superbad", category: "movie", platform: "Netflix", mood: "laugh", aesthetic: "colorful", trailerId: "MNpoTxeydiI", url: "https://www.netflix.com/title/70075482", synopsis: "High school seniors Seth and Evan attempt to buy booze for a wild house party, spiraling into an unforgettable night of hilarious chaos, bad decisions, and unforgettable cops.", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1000&q=80" },
    { title: "Stranger Things", category: "series", platform: "Netflix", mood: "intense", aesthetic: "retro", trailerId: "b9EkMc79ZSU", url: "https://www.netflix.com/title/80057281", synopsis: "When a young boy vanishes, a small Indiana town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl with telekinetic powers.", poster: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=1000&q=80" },
    { title: "Parasite", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", trailerId: "SEUXfv87Wpk", url: "https://www.max.com", synopsis: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1000&q=80" },
    { title: "The Dark Knight", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", trailerId: "EXeTwQWrcwY", url: "https://www.max.com", synopsis: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80" },
    { title: "Interstellar", category: "movie", platform: "Prime", mood: "intense", aesthetic: "epic", trailerId: "zSWdZVtXT7E", url: "https://www.amazon.com/Prime-Video", synopsis: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80" },
    { title: "Inception", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", trailerId: "YoHD9XEInc0", url: "https://www.max.com", synopsis: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80" }
];

// 🚀 MATCH TRIGGER (100% AIRTIGHT DEDUPLICATION)
window.triggerMatch = async function() {
    if (adblockEnabled) {
        document.getElementById('adblock-modal').style.display = 'flex';
        return;
    }

    const selCategory = document.getElementById('q-category')?.value || 'any';
    const selPlatform = document.getElementById('q-platform')?.value || 'any';
    const selMood = document.getElementById('q-mood')?.value || 'any';
    const selAesthetic = document.getElementById('q-aesthetic')?.value || 'any';

    // Filter strictly excluding seen, saved, and disliked titles
    let pool = masterCatalog.filter(item => 
        !seenList.includes(item.title) && 
        !savedList.includes(item.title) && 
        !dislikedList.includes(item.title)
    );

    if (selCategory !== 'any') pool = pool.filter(i => i.category === selCategory);
    if (selPlatform !== 'any') pool = pool.filter(i => i.platform === selPlatform);
    if (selMood !== 'any') pool = pool.filter(i => i.mood === selMood);
    if (selAesthetic !== 'any') pool = pool.filter(i => i.aesthetic === selAesthetic);

    if (pool.length === 0) {
        alert("✨ You have reviewed every title in this filter! Try setting 'Platform' or 'Mood' to 'Any' to explore fresh matches.");
        return;
    }

    const selected = pool[Math.floor(Math.random() * pool.length)];
    globalMatchTitle = selected.title; 

    if (document.getElementById('questionnaire-box')) document.getElementById('questionnaire-box').style.display = 'none';
    if (document.getElementById('result-box')) document.getElementById('result-box').style.display = 'none';
    document.getElementById('loading-box').style.display = 'block';

    setTimeout(() => {
        document.getElementById('loading-box').style.display = 'none';
        const resultBox = document.getElementById('result-box');
        resultBox.style.display = 'block';

        // Set Immersive Visual Elements
        document.getElementById('res-header-bg').style.backgroundImage = `url('${selected.poster}')`;
        document.getElementById('res-title').innerText = selected.title;
        document.getElementById('res-synopsis').innerText = selected.synopsis;

        // Platform Badge Styling
        const badge = document.getElementById('res-platform-badge');
        badge.innerText = selected.platform;
        if (selected.platform === 'Netflix') badge.style.background = 'var(--netflix-red)';
        else if (selected.platform === 'Max') badge.style.background = 'var(--max-purple)';
        else if (selected.platform === 'Prime') badge.style.background = 'var(--prime-blue)';
        else badge.style.background = 'var(--gold)';
        badge.style.color = '#fff';

        // Streaming Link & Embed Trailer
        const directBtn = document.getElementById('res-direct-link');
        directBtn.href = selected.url;
        directBtn.innerText = `▶ Stream on ${selected.platform}`;

        const iframe = document.getElementById('res-trailer');
        iframe.src = `https://www.youtube-nocookie.com/embed/${selected.trailerId}?autoplay=0&rel=0`;

        resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 1200);
};

// 🔘 ACTION BUTTON HANDLERS
window.saveToList = function() {
    if (globalMatchTitle && !savedList.includes(globalMatchTitle)) {
        savedList.push(globalMatchTitle);
        syncListsToDatabase();
        alert(`⭐ "${globalMatchTitle}" saved to your Watch Later Portfolio!`);
    }
};

window.markAsSeen = function() {
    if (globalMatchTitle && !seenList.includes(globalMatchTitle)) {
        seenList.push(globalMatchTitle);
        syncListsToDatabase();
    }
    triggerAdRetry();
};

window.markAsDisliked = function() {
    if (globalMatchTitle && !dislikedList.includes(globalMatchTitle)) {
        dislikedList.push(globalMatchTitle);
        syncListsToDatabase();
    }
    triggerAdRetry();
};

// ✖ AD BREAK & REWARDED RE-MATCH FLOW
window.triggerAdRetry = function() {
    if (isVIP || isAdFree) {
        document.getElementById('result-box').style.display = 'none';
        triggerMatch();
        return;
    }
    document.getElementById('reward-ad-modal').style.display = 'flex';
    
    let timeLeft = 15;
    const timerSpan = document.getElementById('ad-timer');
    const claimBtn = document.getElementById('claim-retry-btn');
    const closeBtn = document.getElementById('close-ad-btn');
    
    claimBtn.style.display = 'block';
    closeBtn.style.display = 'none';
    claimBtn.disabled = true; claimBtn.style.opacity = '0.5';
    
    const interval = setInterval(() => {
        timeLeft--;
        if (timerSpan) timerSpan.innerText = timeLeft;
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

// 📺 INTERACTIVE PORTFOLIO DETAILS MODAL
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
