console.log("Mastercode 20.0: Ad-Block & Interstitial Engine Alive");

let supabaseClient = null;
let isUserLoggedIn = false;

// 1. AD-BLOCKER DETECTION (Runs on load)
window.addEventListener('DOMContentLoaded', async () => {
    setTimeout(checkAdBlocker, 1500); // Wait a moment for scripts to try loading
    
    // Init Supabase if exists
    try { if (window.supabase) supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'); } catch(e){}
    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            isUserLoggedIn = true;
            document.getElementById('nav-reg-btn').style.display = 'none';
            document.getElementById('nav-upgrade-btn').style.display = 'block';
        }
    }
});

function checkAdBlocker() {
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox'; // A class commonly targeted by blockers
    document.body.appendChild(testAd);
    window.setTimeout(() => {
        if (testAd.offsetHeight === 0) {
            document.getElementById('adblock-modal').style.display = 'flex';
        }
        testAd.remove();
    }, 100);
}

// 2. THE CORE MATCHING LOGIC (Simulated for brevity, keep your existing catalog/scoring here)
window.triggerMatch = async function() {
    // Basic validation & UI swap
    document.getElementById('questionnaire-box').style.display = 'none';
    
    // Simulate finding a match
    setTimeout(() => {
        document.getElementById('result-box').style.display = 'block';
        document.getElementById('res-title').innerText = "Simulated Match Title";
        document.getElementById('res-poster').src = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80";
    }, 1000);
};

// 3. "ALREADY SEEN IT" REWARDED AD LOGIC
window.triggerAdRetry = function() {
    let retriesUsed = parseInt(localStorage.getItem('adRetriesUsed') || '0');
    
    if (retriesUsed >= 5 && !isUserLoggedIn) {
        alert("You have used all 5 free ad-retries! Please Register/Upgrade to continue.");
        window.location.href = 'register.html';
        return;
    }

    // Show the modal
    document.getElementById('reward-ad-modal').style.display = 'flex';
    document.getElementById('retry-count').innerText = 5 - retriesUsed;
    
    let timeLeft = 15; // 15-second mandatory wait
    const timerSpan = document.getElementById('ad-timer');
    const claimBtn = document.getElementById('claim-retry-btn');
    
    claimBtn.disabled = true;
    claimBtn.style.opacity = '0.5';

    const interval = setInterval(() => {
        timeLeft--;
        timerSpan.innerText = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(interval);
            claimBtn.disabled = false;
            claimBtn.style.opacity = '1';
            claimBtn.style.background = 'var(--gold)';
            claimBtn.style.color = '#000';
            claimBtn.innerHTML = '✨ Claim New Match!';
            
            claimBtn.onclick = () => {
                localStorage.setItem('adRetriesUsed', retriesUsed + 1);
                document.getElementById('reward-ad-modal').style.display = 'none';
                document.getElementById('result-box').style.display = 'none';
                triggerMatch(); // Re-run the match logic!
            };
        }
    }, 1000);
};
