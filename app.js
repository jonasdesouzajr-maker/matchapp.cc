console.log("Mastercode 38.0: Automated Payment Gateway Routing Active");

let globalMatchTitle = "Match App";
let supabaseClient = null;
let isUserLoggedIn = false;
let userProfileData = {};

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let isAdFree = localStorage.getItem('match_adFree') === 'true'; 
let adblockEnabled = false;

// 🛑 INSERT YOUR REAL PAYMENT LINK HERE (e.g., Stripe Payment Link)
const PAYMENT_LINK_URL = "https://buy.stripe.com/your_live_link_here"; 

try { if (window.supabase) supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'); } catch(e){}

// AD BLOCK DETECTION
function checkAdBlocker() {
    if (isAdFree) return; 
    const testAd = document.createElement('div'); testAd.innerHTML = '&nbsp;'; testAd.className = 'adsbox ad-placement doubleclick';
    testAd.style.position = 'absolute'; testAd.style.top = '-999px'; document.body.appendChild(testAd);
    window.setTimeout(() => {
        if (testAd.offsetHeight === 0) { adblockEnabled = true; document.getElementById('adblock-modal').style.display = 'flex'; }
        testAd.remove();
    }, 300);
}

// 🌐 UNIVERSAL CHROME DETECTOR
window.openInChrome = function() {
    const currentUrl = window.location.href.replace(/^https?:\/\//, '');
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
        window.location.href = 'googlechrome://' + currentUrl;
    } else {
        window.location.href = 'intent://' + currentUrl + '#Intent;scheme=https;package=com.android.chrome;end;';
    }
}

window.dismissChromeBanner = function() {
    document.getElementById('chrome-banner').style.display = 'none';
    sessionStorage.setItem('dismissedChromeBanner', 'true');
};

window.closeWelcomeModal = function() {
    document.getElementById('welcome-modal').style.display = 'none';
    localStorage.setItem('hasSeenWelcome', 'true');
};

// 💎 AUTOMATED SUBSCRIPTION ROUTING
window.openUpgradeModal = function() {
    document.getElementById('upgrade-modal').style.display = 'flex';
};

window.closeUpgradeModal = function() {
    document.getElementById('upgrade-modal').style.display = 'none';
};

window.purchaseAdFree = async function() {
    if (!isUserLoggedIn || !supabaseClient) {
        alert("Please log in or register first so we can apply the Lifetime Ad-Free pass to your account!");
        window.location.href = 'register.html';
        return;
    }

    const btn = document.getElementById('purchase-btn');
    btn.innerText = "Redirecting to Secure Checkout...";
    btn.style.opacity = '0.7';
    
    // Get the current user ID to pass to the payment gateway
    const { data: { session } } = await supabaseClient.auth.getSession();
    const userId = session.user.id;

    // Redirect to your payment gateway, passing the Supabase User ID as a reference parameter.
    // In Stripe, you append `?client_reference_id=` so the webhook knows who paid.
    window.location.href = `${PAYMENT_LINK_URL}?client_reference_id=${userId}`;
};

window.addEventListener('DOMContentLoaded', async () => {
    if (isAdFree) document.body.classList.add('ad-free-mode');
    checkAdBlocker();
    setInterval(checkAdBlocker, 5000); 

    if (localStorage.getItem('hasSeenWelcome') !== 'true') {
        const welcomeModal = document.getElementById('welcome-modal');
        if (welcomeModal) welcomeModal.style.display = 'flex';
    }

    if (sessionStorage.getItem('dismissedChromeBanner') === 'true') {
        const banner = document.getElementById('chrome-banner');
        if (banner) banner.style.display = 'none';
    }

    if (supabaseClient) {
        // Force refresh session to catch webhook updates if they just returned from paying
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (session) {
            isUserLoggedIn = true;
            
            // Check URL for successful payment redirect
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('payment') === 'success') {
                // The webhook might take 1-2 seconds to hit the database. We force a local visual update instantly.
                isAdFree = true;
                localStorage.setItem('match_adFree', 'true');
                document.body.classList.add('ad-free-mode');
                alert("🎉 Payment Confirmed! Your Lifetime Ad-Free pass is now active.");
                
                // Clean the URL so they don't see ?payment=success on refresh
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            // Sync with authoritative database truth
            userProfileData = session.user.user_metadata || {};
            if (userProfileData.ad_free) {
                isAdFree = true;
                localStorage.setItem('match_adFree', 'true');
                document.body.classList.add('ad-free-mode');
            }

            if (userProfileData.seen_list) seenList = userProfileData.seen_list;
            if (userProfileData.saved_list) savedList = userProfileData.saved_list;
            if(userProfileData.pref_category) document.getElementById('q-category').value = userProfileData.pref_category;
            if(userProfileData.pref_platform) document.getElementById('q-platform').value = userProfileData.pref_platform;
            if(userProfileData.pref_mood) document.getElementById('q-mood').value = userProfileData.pref_mood;
            if(userProfileData.pref_aesthetic) document.getElementById('q-aesthetic').value = userProfileData.pref_aesthetic;

            document.getElementById('nav-reg-btn').style.display = 'none';
            document.getElementById('nav-profile-btn').style.display = 'block';
            document.getElementById('nav-upgrade-btn').style.display = 'block';
            document.getElementById('nav-logout-btn').style.display = 'block';
        }
    }
});

window.doLogout = async function() { if (supabaseClient) { await supabaseClient.auth.signOut(); window.location.reload(); } };
async function syncListsToDatabase() {
    localStorage.setItem('match_seenList', JSON.stringify(seenList));
    localStorage.setItem('match_savedList', JSON.stringify(savedList));
    if (isUserLoggedIn && supabaseClient) await supabaseClient.auth.updateUser({ data: { seen_list: seenList, saved_list: savedList } });
}

// (Keep your masterCatalog array and triggerMatch algorithms identical below this point)
