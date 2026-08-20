console.log("Mastercode 23.0: Deduplication Engine & Portfolio Sync Active");

let globalMatchTitle = "Match App";
let globalSearchQuery = "";
let supabaseClient = null;
let isUserLoggedIn = false;
let userProfileData = {};

// Local State Arrays
let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let adblockEnabled = false;

try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU');
    }
} catch (e) { console.warn("Supabase init warning."); }

// STRICT ADBLOCK DETECTION
function checkAdBlocker() {
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox ad-placement doubleclick';
    testAd.style.position = 'absolute';
    testAd.style.top = '-999px';
    document.body.appendChild(testAd);
    window.setTimeout(() => {
        if (testAd.offsetHeight === 0) {
            adblockEnabled = true;
            document.getElementById('adblock-modal').style.display = 'flex';
        }
        testAd.remove();
    }, 400);
}

window.addEventListener('DOMContentLoaded', async () => {
    checkAdBlocker();

    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            isUserLoggedIn = true;
            userProfileData = session.user.user_metadata || {};
            
            // Sync DB Arrays to Local State
            if (userProfileData.seen_list) seenList = userProfileData.seen_list;
            if (userProfileData.saved_list) savedList = userProfileData.saved_list;

            document.getElementById('nav-reg-btn').style.display = 'none';
            document.getElementById('nav-portfolio-btn').style.display = 'block';
            document.getElementById('nav-upgrade-btn').style.display = 'block';
            if(document.getElementById('freemium-banner')) document.getElementById('freemium-banner').style.display = 'none';
        }
    }
});

// SYNC HELPER FUNCTION (Saves permanently to account if logged in)
async function syncListsToDatabase() {
    localStorage.setItem('match_seenList', JSON.stringify(seenList));
    localStorage.setItem('match_savedList', JSON.stringify(savedList));
    if (isUserLoggedIn && supabaseClient) {
        await supabaseClient.auth.updateUser({ data: { seen_list: seenList, saved_list: savedList } });
    }
}

// FULL CATALOG
const masterCatalog = [
    { title: "Parasite", category: "movie", mood: "intense", era: "modern", tone: "dark", pacing: "standard", trailer: "https://www.youtube.com/embed/5xH0HfJHsaY", url: "https://www.max.com", streaming: "Max", synopsis: "Greed and class discrimination threaten a wealthy family and a destitute clan.", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80" },
    { title: "The Matrix", category: "movie", mood: "mindbending", era: "classic", tone: "dark", pacing: "standard", trailer: "https://www.youtube.com/embed/vKQi3bBA1y8", url: "https://www.primevideo.com", streaming: "Prime Video", synopsis: "A hacker discovers the true nature of his reality.", poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80" },
    { title: "Superbad", category: "movie", mood: "laugh", era: "classic", tone: "light", pacing: "standard", trailer: "https://www.youtube.com/embed/4eaKAjixTMY", url: "https://www.netflix.com", streaming: "Netflix", synopsis: "Two high school seniors deal with separation anxiety during a wild party.", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80" },
    { title: "Breaking Bad", category: "series", mood: "intense", era: "classic", tone: "dark", pacing: "epic", trailer: "https://www.youtube.com/embed/HhesaQXLuRY", url: "https://www.netflix.com", streaming: "Netflix", synopsis: "A chemistry teacher turns to manufacturing meth to secure his family's future.", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80" },
    { title: "The Office (US)", category: "series", mood: "laugh", era: "modern", tone: "light", pacing: "fast", trailer: "https://www.youtube.com/embed/L_W--YYhYA4", url: "https://www.peacocktv.com", streaming: "Peacock", synopsis: "A mockumentary on a group of typical office workers.", poster: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80" },
    { title: "Avenida Brasil", category: "series", mood: "intense", era: "classic", tone: "dramatic", pacing: "epic", trailer: "https://www.youtube.com/embed/MBRqu0YOH14", url: "https://globoplay.globo.com", streaming: "Globoplay", synopsis: "A gripping story of revenge and intense family drama in Rio de Janeiro.", poster: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80" }
];

window.triggerMatch = async function() {
    if (adblockEnabled) {
        document.getElementById('adblock-modal').style.display = 'flex';
        return;
    }

    if (!isUserLoggedIn && localStorage.getItem('hasUsedFreeMatch') === 'true') {
        document.getElementById('questionnaire-box').style.display = 'none';
        document.getElementById('blocked-box').style.display = 'block';
        return;
    }

    const category = document.getElementById('q-category').value;
    const mood = document.getElementById('q-mood').value;

    // Filter 1: By Category
    let pool = category !== 'any' ? masterCatalog.filter(i => i.category === category) : masterCatalog;
    
    // Filter 2: THE DEDUPLICATION MATRIX (Remove anything in seenList)
    let unseenPool = pool.filter(item => !seenList.includes(item.title));
    
    if (unseenPool.length === 0) {
        alert("Wow! You've seen every match in this category. We are expanding the algorithm...");
        unseenPool = pool; // Fallback if they exhausted the database
    }

    // Scoring Algorithm
    let scoredMatches = unseenPool.map(item => {
        let score = (item.mood === mood) ? 5 : 0;
        return { item, score };
    });
    scoredMatches.sort((a, b) => b.score - a.score);
    
    // Pick the top matched item randomly to ensure variety
    let topScore = scoredMatches[0]?.score || 0;
    let topMatches = scoredMatches.filter(m => m.score === topScore).map(m => m.item);
    const selected = topMatches[Math.floor(Math.random() * topMatches.length)];
    
    globalMatchTitle = selected.title; 
    globalSearchQuery = `Where to watch ${selected.title} online`;

    // UI transitions
    document.getElementById('questionnaire-box').style.display = 'none';
    document.getElementById('loading-box').style.display = 'block';

    const bar = document.getElementById('progress-bar');
    let width = 0;
    let interval = setInterval(() => {
        width += 4; 
        if (bar) bar.style.width = width + '%';
        if (width >= 100) {
            clearInterval(interval);
            if (!isUserLoggedIn) localStorage.setItem('hasUsedFreeMatch', 'true');

            document.getElementById('loading-box').style.display = 'none';
            document.getElementById('result-box').style.display = 'block';

            document.getElementById('res-title').innerText = selected.title;
            document.getElementById('res-synopsis').innerText = selected.synopsis;
            document.getElementById('res-platform').innerText = selected.streaming;
            document.getElementById('res-trailer').src = selected.trailer;
            document.getElementById('res-direct-link').href = selected.url;
        }
    }, 50);
};

// PORTFOLIO LOGIC
window.saveToList = function() {
    if (!savedList.includes(globalMatchTitle)) {
        savedList.push(globalMatchTitle);
        syncListsToDatabase();
        alert(`⭐ "${globalMatchTitle}" saved to your Portfolio!`);
    } else {
        alert("This item is already in your saved list.");
    }
};

window.openPortfolio = function() {
    document.getElementById('portfolio-modal').style.display = 'flex';
    
    const savedContainer = document.getElementById('saved-list-container');
    const seenContainer = document.getElementById('seen-list-container');
    
    savedContainer.innerHTML = savedList.length ? savedList.map(t => `<div class="portfolio-item">${t}</div>`).join('') : `<p style="font-size:12px; color:#888;">No saved items yet.</p>`;
    seenContainer.innerHTML = seenList.length ? seenList.map(t => `<div class="portfolio-item seen">${t}</div>`).join('') : `<p style="font-size:12px; color:#888;">No seen items tracked yet.</p>`;
};

// REWARDED AD-WALL / ALREADY SEEN LOGIC
window.triggerAdRetry = function() {
    // Force this item into the seenList so it is NEVER matched again
    if (!seenList.includes(globalMatchTitle)) {
        seenList.push(globalMatchTitle);
        syncListsToDatabase();
    }

    let retriesUsed = parseInt(localStorage.getItem('adRetriesUsed') || '0');
    if (retriesUsed >= 5 && !isUserLoggedIn) {
        document.getElementById('result-box').style.display = 'none';
        document.getElementById('blocked-box').style.display = 'block';
        return;
    }

    document.getElementById('reward-ad-modal').style.display = 'flex';
    document.getElementById('retry-count').innerText = retriesUsed + 1;
    
    let timeLeft = 15;
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
                triggerMatch(); // This will automatically exclude the one they just marked as seen!
            };
        }
    }, 1000);
};

window.openLiveGoogleSearch = function() { window.open(`https://www.google.com/search?q=${encodeURIComponent(globalSearchQuery)}`, '_blank'); };
