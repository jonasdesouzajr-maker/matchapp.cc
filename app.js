console.log("Mastercode 26.0: Strict Deduplication & Cinematic Engine Active");

let globalMatchTitle = "Match App";
let supabaseClient = null;
let isUserLoggedIn = false;
let userProfileData = {};

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let adblockEnabled = false;

try { if (window.supabase) supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'); } catch(e){}

// STRICT ADBLOCK DETECTION
function checkAdBlocker() {
    const testAd = document.createElement('div'); testAd.innerHTML = '&nbsp;'; testAd.className = 'adsbox ad-placement doubleclick';
    testAd.style.position = 'absolute'; testAd.style.top = '-999px'; document.body.appendChild(testAd);
    window.setTimeout(() => {
        if (testAd.offsetHeight === 0) { adblockEnabled = true; document.getElementById('adblock-modal').style.display = 'flex'; }
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
            
            if (userProfileData.seen_list) seenList = userProfileData.seen_list;
            if (userProfileData.saved_list) savedList = userProfileData.saved_list;

            // Load Default Preferences from Profile
            if(userProfileData.pref_category) document.getElementById('q-category').value = userProfileData.pref_category;
            if(userProfileData.pref_mood) document.getElementById('q-mood').value = userProfileData.pref_mood;
            if(userProfileData.pref_era) document.getElementById('q-era').value = userProfileData.pref_era;
            if(userProfileData.pref_company) document.getElementById('q-company').value = userProfileData.pref_company;

            // Header UI
            document.getElementById('nav-reg-btn').style.display = 'none';
            document.getElementById('nav-profile-btn').style.display = 'block';
            document.getElementById('nav-upgrade-btn').style.display = 'block';
            document.getElementById('nav-logout-btn').style.display = 'block';
            document.getElementById('nav-portfolio-btn').style.display = 'block';
            if(document.getElementById('freemium-banner')) document.getElementById('freemium-banner').style.display = 'none';
        }
    }
});

window.doLogout = async function() {
    if (supabaseClient) { await supabaseClient.auth.signOut(); window.location.reload(); }
};

async function syncListsToDatabase() {
    localStorage.setItem('match_seenList', JSON.stringify(seenList));
    localStorage.setItem('match_savedList', JSON.stringify(savedList));
    if (isUserLoggedIn && supabaseClient) await supabaseClient.auth.updateUser({ data: { seen_list: seenList, saved_list: savedList } });
}

// AMPLIFIED CATALOG (20+ Items)
const masterCatalog = [
    { title: "Parasite", category: "movie", mood: "intense", era: "modern", tone: "dark", pacing: "standard", trailer: "https://www.youtube.com/embed/5xH0HfJHsaY", url: "https://www.max.com", streaming: "Max", synopsis: "Greed and class discrimination threaten a wealthy family and a destitute clan. An Oscar-winning masterpiece.", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80" },
    { title: "The Matrix", category: "movie", mood: "mindbending", era: "classic", tone: "dark", pacing: "standard", trailer: "https://www.youtube.com/embed/vKQi3bBA1y8", url: "https://www.primevideo.com", streaming: "Prime", synopsis: "A computer hacker discovers the shocking truth about reality and his role in the war against its controllers.", poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80" },
    { title: "Superbad", category: "movie", mood: "laugh", era: "classic", tone: "light", pacing: "standard", trailer: "https://www.youtube.com/embed/4eaKAjixTMY", url: "https://www.netflix.com", streaming: "Netflix", synopsis: "Two high school seniors deal with separation anxiety during a wild, booze-soaked party.", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80" },
    { title: "Inception", category: "movie", mood: "mindbending", era: "modern", tone: "dark", pacing: "epic", trailer: "https://www.youtube.com/embed/YoHD9XEInc0", url: "https://www.max.com", streaming: "Max", synopsis: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.", poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80" },
    { title: "Interstellar", category: "movie", mood: "intense", era: "modern", tone: "dramatic", pacing: "epic", trailer: "https://www.youtube.com/embed/zSWdZVtXT7E", url: "https://www.primevideo.com", streaming: "Prime", synopsis: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", poster: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=80" },
    { title: "Breaking Bad", category: "series", mood: "intense", era: "classic", tone: "dark", pacing: "epic", trailer: "https://www.youtube.com/embed/HhesaQXLuRY", url: "https://www.netflix.com", streaming: "Netflix", synopsis: "A chemistry teacher turns to manufacturing meth to secure his family's future.", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80" },
    { title: "The Office (US)", category: "series", mood: "laugh", era: "modern", tone: "light", pacing: "fast", trailer: "https://www.youtube.com/embed/L_W--YYhYA4", url: "https://www.peacocktv.com", streaming: "Peacock", synopsis: "A mockumentary on a group of typical office workers at Dunder Mifflin.", poster: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80" },
    { title: "Stranger Things", category: "series", mood: "intense", era: "retro", tone: "dark", pacing: "standard", trailer: "https://www.youtube.com/embed/b9EkMc79ZSU", url: "https://www.netflix.com", streaming: "Netflix", synopsis: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments and terrifying supernatural forces.", poster: "https://images.unsplash.com/photo-1614145121029-83a9f7b68bf4?auto=format&fit=crop&w=800&q=80" },
    { title: "Brooklyn Nine-Nine", category: "series", mood: "laugh", era: "modern", tone: "light", pacing: "fast", trailer: "https://www.youtube.com/embed/sEOuJ4z5aTc", url: "https://www.peacocktv.com", streaming: "Peacock", synopsis: "Follows the exploits of hilarious Detective Jake Peralta and his diverse, lovable colleagues.", poster: "https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&w=800&q=80" },
    { title: "Avenida Brasil", category: "series", mood: "intense", era: "classic", tone: "dramatic", pacing: "epic", trailer: "https://www.youtube.com/embed/MBRqu0YOH14", url: "https://globoplay.globo.com", streaming: "Globoplay", synopsis: "A gripping story of revenge and intense family drama in Rio de Janeiro.", poster: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80" },
    { title: "Kurzgesagt: Optimistic Nihilism", category: "youtube", mood: "mindbending", era: "modern", tone: "surreal", pacing: "fast", trailer: "https://www.youtube.com/embed/MBRqu0YOH14", url: "https://youtube.com", streaming: "YouTube", synopsis: "A beautiful animated journey exploring the vastness of the universe and finding meaning in it all.", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80" }
];

window.triggerMatch = async function() {
    if (adblockEnabled) { document.getElementById('adblock-modal').style.display = 'flex'; return; }

    let retriesUsed = parseInt(localStorage.getItem('adRetriesUsed') || '0');
    if (!isUserLoggedIn && retriesUsed >= 5) {
        document.getElementById('questionnaire-box').style.display = 'none';
        document.getElementById('result-box').style.display = 'none';
        document.getElementById('blocked-box').style.display = 'block';
        return;
    }

    const category = document.getElementById('q-category').value;
    const mood = document.getElementById('q-mood').value;

    // Filter 1: By Category
    let pool = category !== 'any' ? masterCatalog.filter(i => i.category === category) : masterCatalog;
    
    // Filter 2: STRICT DEDUPLICATION (Remove anything they've seen)
    let unseenPool = pool.filter(item => !seenList.includes(item.title));
    
    // Failsafe if they've seen EVERYTHING
    if (unseenPool.length === 0) {
        alert("Wow! You've seen every match in this category. We are resetting your seen list to find hidden gems!");
        seenList = []; // Reset locally so they can keep playing
        unseenPool = pool; 
    }

    // Scoring Algorithm
    let scoredMatches = unseenPool.map(item => ({ item, score: (item.mood === mood) ? 5 : 0 }));
    scoredMatches.sort((a, b) => b.score - a.score);
    
    let topScore = scoredMatches[0]?.score || 0;
    let topMatches = scoredMatches.filter(m => m.score === topScore).map(m => m.item);
    const selected = topMatches[Math.floor(Math.random() * topMatches.length)];
    
    globalMatchTitle = selected.title; 

    // ABSOLUTE DEDUPLICATION: Instantly push to seen list once generated!
    if (!seenList.includes(globalMatchTitle)) {
        seenList.push(globalMatchTitle);
        syncListsToDatabase(); // Save forever
    }

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
            
            if (!isUserLoggedIn && localStorage.getItem('hasUsedFreeMatch') !== 'true') {
                localStorage.setItem('hasUsedFreeMatch', 'true');
            }

            document.getElementById('loading-box').style.display = 'none';
            document.getElementById('result-box').style.display = 'block';

            // Populate Cinematic UI
            document.getElementById('res-header-bg').style.backgroundImage = `url('${selected.poster}')`;
            document.getElementById('res-title').innerText = selected.title;
            document.getElementById('res-meta').innerText = `${selected.category} • ${selected.era} • ${selected.tone}`;
            document.getElementById('res-synopsis').innerText = selected.synopsis;
            document.getElementById('res-platform').innerText = selected.streaming;
            document.getElementById('res-trailer').src = selected.trailer;
            document.getElementById('res-direct-link').href = selected.url;
        }
    }, 45);
};

window.saveToList = function() {
    if (!savedList.includes(globalMatchTitle)) {
        savedList.push(globalMatchTitle);
        syncListsToDatabase();
        alert(`⭐ "${globalMatchTitle}" saved to your Portfolio!`);
    } else { alert("This item is already in your portfolio."); }
};

window.openPortfolio = function() {
    document.getElementById('portfolio-modal').style.display = 'flex';
    const savedContainer = document.getElementById('saved-list-container');
    const seenContainer = document.getElementById('seen-list-container');
    
    savedContainer.innerHTML = savedList.length ? savedList.map(t => `<div style="padding: 6px; border-bottom: 1px solid #333; font-size:12px;">⭐ ${t}</div>`).join('') : `<p style="font-size:12px; color:#888;">No saved items yet.</p>`;
    seenContainer.innerHTML = seenList.length ? seenList.map(t => `<div style="padding: 6px; border-bottom: 1px solid #333; font-size:12px; color:#ff8787;">🚫 ${t}</div>`).join('') : `<p style="font-size:12px; color:#888;">No seen items tracked yet.</p>`;
};

// REWARDED AD WATCH RETRY
window.triggerAdRetry = function() {
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
    
    claimBtn.disabled = true; claimBtn.style.opacity = '0.5';

    const interval = setInterval(() => {
        timeLeft--; timerSpan.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(interval);
            claimBtn.disabled = false; claimBtn.style.opacity = '1';
            claimBtn.style.background = 'var(--gold)'; claimBtn.style.color = '#000';
            claimBtn.innerHTML = '✨ Claim New Match!';
            
            claimBtn.onclick = () => {
                localStorage.setItem('adRetriesUsed', retriesUsed + 1);
                document.getElementById('reward-ad-modal').style.display = 'none';
                document.getElementById('result-box').style.display = 'none';
                
                const rewardBanner = document.getElementById('ad-reward-banner');
                if (rewardBanner) rewardBanner.style.display = 'block';

                triggerMatch(); 
            };
        }
    }, 1000);
};
