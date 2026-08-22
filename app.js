console.log("Mastercode 31.0: Advanced Deduplication & Scoring Engine Active");

let globalMatchTitle = "Match App";
let supabaseClient = null;
let isUserLoggedIn = false;
let userProfileData = {};

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let adblockEnabled = false;

try { if (window.supabase) supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'); } catch(e){}

// AD BLOCK DETECTION
function checkAdBlocker() {
    const testAd = document.createElement('div'); testAd.innerHTML = '&nbsp;'; testAd.className = 'adsbox ad-placement doubleclick';
    testAd.style.position = 'absolute'; testAd.style.top = '-999px'; document.body.appendChild(testAd);
    window.setTimeout(() => {
        if (testAd.offsetHeight === 0) { adblockEnabled = true; document.getElementById('adblock-modal').style.display = 'flex'; }
        testAd.remove();
    }, 300);
}

// CHROME DEEP LINK DETECTOR
window.openInChrome = function() {
    const url = window.location.href.replace(/^https?:\/\//, '');
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = 'googlechrome://' + url;
    } else if (/Android/i.test(navigator.userAgent)) {
        window.location.href = 'intent://' + url + '#Intent;scheme=https;package=com.android.chrome;end;';
    } else {
        alert("Please open Google Chrome and paste our website address for the best experience!");
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    checkAdBlocker();
    setInterval(checkAdBlocker, 5000); 

    // Show Chrome banner if not Chrome
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    if (!isChrome && document.getElementById('chrome-banner')) {
        document.getElementById('chrome-banner').style.display = 'flex';
    }

    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            isUserLoggedIn = true;
            userProfileData = session.user.user_metadata || {};
            
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
            if(document.getElementById('freemium-banner')) document.getElementById('freemium-banner').style.display = 'none';
        }
    }
});

window.doLogout = async function() { if (supabaseClient) { await supabaseClient.auth.signOut(); window.location.reload(); } };
async function syncListsToDatabase() {
    localStorage.setItem('match_seenList', JSON.stringify(seenList));
    localStorage.setItem('match_savedList', JSON.stringify(savedList));
    if (isUserLoggedIn && supabaseClient) await supabaseClient.auth.updateUser({ data: { seen_list: seenList, saved_list: savedList } });
}

// 🌐 THE MASTER CATALOG (Expanded for precise algorithm matching)
const masterCatalog = [
    // MOVIES
    { title: "Parasite", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", era: "modern", pacing: "standard", trailer: "https://www.youtube.com/embed/5xH0HfJHsaY", url: "https://www.max.com", synopsis: "Greed and class discrimination threaten a wealthy family.", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80" },
    { title: "Cidade de Deus", category: "movie", platform: "Prime", mood: "intense", aesthetic: "dark", era: "classic", pacing: "standard", trailer: "https://www.youtube.com/embed/dcUOO4yqZaQ", url: "https://www.primevideo.com", synopsis: "Two boys growing up in a violent neighborhood of Rio take different paths.", poster: "https://images.unsplash.com/photo-1518639197413-568b81340156?auto=format&fit=crop&w=800&q=80" },
    { title: "Superbad", category: "movie", platform: "Netflix", mood: "laugh", aesthetic: "colorful", era: "classic", pacing: "fast", trailer: "https://www.youtube.com/embed/4eaKAjixTMY", url: "https://www.netflix.com", synopsis: "High school seniors deal with separation anxiety during a wild party.", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80" },
    { title: "Interstellar", category: "movie", platform: "Prime", mood: "mindbending", aesthetic: "dark", era: "modern", pacing: "epic", trailer: "https://www.youtube.com/embed/zSWdZVtXT7E", url: "https://www.primevideo.com", synopsis: "Explorers travel through a wormhole in space to ensure humanity's survival.", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80" },
    { title: "The Great Gatsby", category: "movie", platform: "Max", mood: "romantic", aesthetic: "luxurious", era: "classic", pacing: "standard", trailer: "https://www.youtube.com/embed/rARN6agiW7o", url: "https://www.max.com", synopsis: "A writer gets drawn into the lavish, tragic world of his millionaire neighbor.", poster: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80" },
    
    // SERIES
    { title: "Succession", category: "series", platform: "Max", mood: "intense", aesthetic: "luxurious", era: "modern", pacing: "standard", trailer: "https://www.youtube.com/embed/OzYxJV_rmv8", url: "https://www.max.com", synopsis: "A media family fights for control of their empire.", poster: "https://images.unsplash.com/photo-1555529733-0e67056058e1?auto=format&fit=crop&w=800&q=80" },
    { title: "Stranger Things", category: "series", platform: "Netflix", mood: "intense", aesthetic: "retro", era: "modern", pacing: "epic", trailer: "https://www.youtube.com/embed/b9EkMc79ZSU", url: "https://www.netflix.com", synopsis: "A group of kids uncover secret experiments and terrifying supernatural forces.", poster: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=800&q=80" },
    { title: "The Office", category: "series", platform: "Prime", mood: "laugh", aesthetic: "retro", era: "classic", pacing: "fast", trailer: "https://www.youtube.com/embed/cKKHFAew_ls", url: "https://www.primevideo.com", synopsis: "A mockumentary on a group of typical office workers.", poster: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80" },

    // NOVELAS
    { title: "Avenida Brasil", category: "telenovela", platform: "Globoplay", mood: "intense", aesthetic: "colorful", era: "classic", pacing: "epic", trailer: "https://www.youtube.com/embed/MBRqu0YOH14", url: "https://globoplay.globo.com", synopsis: "A gripping story of revenge and intense family drama.", poster: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80" },
    { title: "O Clone", category: "telenovela", platform: "Globoplay", mood: "romantic", aesthetic: "luxurious", era: "classic", pacing: "epic", trailer: "https://www.youtube.com/embed/1vR_s-v4t8A", url: "https://globoplay.globo.com", synopsis: "A massive hit dealing with cloning, love, and destiny.", poster: "https://images.unsplash.com/photo-1542158862-23c3b0eb6d62?auto=format&fit=crop&w=800&q=80" },
    { title: "Rebelde", category: "telenovela", platform: "Globoplay", mood: "laugh", aesthetic: "retro", era: "classic", pacing: "epic", trailer: "https://www.youtube.com/embed/1vR_s-v4t8A", url: "https://globoplay.globo.com", synopsis: "Teenagers at an elite boarding school form a pop band.", poster: "https://images.unsplash.com/photo-1518991206126-72d8ebdfa40c?auto=format&fit=crop&w=800&q=80" },

    // SPOTIFY
    { title: "Late Night Cinematic", category: "spotify", platform: "Spotify", mood: "relax", aesthetic: "dark", era: "modern", pacing: "standard", trailer: "https://open.spotify.com/embed/playlist/37i9dQZF1DX3Ogo9pFvBkY", url: "https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY", synopsis: "Beautiful cinematic tracks for a relaxed evening.", poster: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&w=800&q=80" },
    { title: "Phonk Workout", category: "spotify", platform: "Spotify", mood: "intense", aesthetic: "dark", era: "modern", pacing: "fast", trailer: "https://open.spotify.com/embed/playlist/37i9dQZF1DWWY64wDtewQt", url: "https://open.spotify.com/playlist/37i9dQZF1DWWY64wDtewQt", synopsis: "Aggressive phonk beats for heavy lifting and high energy.", poster: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80" },
    { title: "Retro 80s Hits", category: "spotify", platform: "Spotify", mood: "laugh", aesthetic: "retro", era: "vintage", pacing: "standard", trailer: "https://open.spotify.com/embed/playlist/37i9dQZF1DX4UtSsVN1WsYY", url: "https://open.spotify.com/playlist/37i9dQZF1DX4UtSsVN1WsYY", synopsis: "The greatest upbeat hits of the 1980s.", poster: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80" },

    // YOUTUBE & SHORTS
    { title: "Kurzgesagt - Optimistic Nihilism", category: "youtube", platform: "YouTube", mood: "mindbending", aesthetic: "colorful", era: "modern", pacing: "fast", trailer: "https://www.youtube.com/embed/MBRqu0YOH14", url: "https://youtube.com", synopsis: "A beautiful animated journey exploring the vastness of the universe.", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80" },
    { title: "Satisfying Kinetic Sand", category: "short", platform: "YouTube", mood: "relax", aesthetic: "colorful", era: "modern", pacing: "fast", trailer: "https://www.youtube.com/embed/8b1JjJwzZ6M", url: "https://youtube.com/shorts", synopsis: "A highly addictive loop of satisfying kinetic sand cutting.", poster: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80" }
];

window.triggerMatch = async function() {
    if (adblockEnabled) { document.getElementById('adblock-modal').style.display = 'flex'; return; }

    let retriesUsed = parseInt(localStorage.getItem('adRetriesUsed') || '0');
    if (!isUserLoggedIn && retriesUsed >= 5) {
        document.getElementById('search-container').style.display = 'none';
        document.getElementById('questionnaire-box').style.display = 'none';
        document.getElementById('blocked-box').style.display = 'block';
        return;
    }

    // 1. Get User Preferences
    const category = document.getElementById('q-category') ? document.getElementById('q-category').value : 'any';
    const platform = document.getElementById('q-platform') ? document.getElementById('q-platform').value : 'any';
    const mood = document.getElementById('q-mood') ? document.getElementById('q-mood').value : 'any';
    const aesthetic = document.getElementById('q-aesthetic') ? document.getElementById('q-aesthetic').value : 'any';
    const era = document.getElementById('q-era') ? document.getElementById('q-era').value : 'any';
    const pacing = document.getElementById('q-pacing') ? document.getElementById('q-pacing').value : 'any';

    // 2. THE FIREWALL (Strict Deduplication)
    let unseenPool = masterCatalog.filter(item => !seenList.includes(item.title));

    if (unseenPool.length === 0) {
        alert("Incredible! You have literally seen every title in our current database. We are actively adding more!");
        return;
    }

    // 3. Strict Filtering
    let filteredPool = unseenPool;
    if (category !== 'any') filteredPool = filteredPool.filter(i => i.category === category);
    if (platform !== 'any') filteredPool = filteredPool.filter(i => i.platform === platform);
    if (era !== 'any') filteredPool = filteredPool.filter(i => i.era === era);
    if (pacing !== 'any') filteredPool = filteredPool.filter(i => i.pacing === pacing);

    // 4. Algorithm Fallback (If user is too specific, gracefully expand search)
    if (filteredPool.length === 0) {
        console.log("Strict match failed. Relaxing Era and Pacing...");
        filteredPool = unseenPool;
        if (category !== 'any') filteredPool = filteredPool.filter(i => i.category === category);
        if (platform !== 'any') filteredPool = filteredPool.filter(i => i.platform === platform);
        
        if (filteredPool.length === 0) {
            console.log("Platform match failed. Searching all platforms for format...");
            filteredPool = unseenPool;
            if (category !== 'any') filteredPool = filteredPool.filter(i => i.category === category);
        }
    }

    // 5. Intelligent Scoring Engine (Finds the *Perfect* Fit)
    let scoredMatches = filteredPool.map(item => {
        let score = 0;
        if (item.mood === mood) score += 10;
        if (item.aesthetic === aesthetic) score += 8;
        if (item.era === era) score += 5;
        if (item.pacing === pacing) score += 5;
        return { item, score };
    });
    
    // Sort highest score first
    scoredMatches.sort((a, b) => b.score - a.score);
    
    // Pick from the top tied scores to ensure variety but high quality
    let topScore = scoredMatches[0].score;
    let topMatches = scoredMatches.filter(m => m.score === topScore).map(m => m.item);
    const selected = topMatches[Math.floor(Math.random() * topMatches.length)];
    
    globalMatchTitle = selected.title; 

    // Add to Seen List immediately
    seenList.push(globalMatchTitle);
    syncListsToDatabase();

    // UI Transitions
    if(document.getElementById('search-container')) document.getElementById('search-container').style.display = 'none';
    if(document.getElementById('questionnaire-box')) document.getElementById('questionnaire-box').style.display = 'none';
    document.getElementById('loading-box').style.display = 'block';

    const bar = document.getElementById('progress-bar');
    let width = 0;
    let interval = setInterval(() => {
        width += 4; 
        if (bar) bar.style.width = width + '%';
        if (width >= 100) {
            clearInterval(interval);
            if (!isUserLoggedIn && localStorage.getItem('hasUsedFreeMatch') !== 'true') localStorage.setItem('hasUsedFreeMatch', 'true');

            document.getElementById('loading-box').style.display = 'none';
            document.getElementById('result-box').style.display = 'block';

            document.getElementById('res-header-bg').style.backgroundImage = `url('${selected.poster}')`;
            document.getElementById('res-title').innerText = selected.title;
            document.getElementById('res-synopsis').innerText = selected.synopsis;
            document.getElementById('res-platform').innerText = selected.platform;
            
            const iframe = document.getElementById('res-trailer');
            if(selected.category === 'spotify') iframe.style.height = "152px";
            else iframe.style.height = "280px";
            
            iframe.src = selected.trailer;
            document.getElementById('res-direct-link').href = selected.url;
        }
    }, 40);
};

// ACTIONS
window.saveToList = function() {
    if (!savedList.includes(globalMatchTitle)) {
        savedList.push(globalMatchTitle);
        syncListsToDatabase();
        alert(`⭐ "${globalMatchTitle}" saved to your Portfolio!`);
    }
};

window.markAsSeenAndSkip = function() {
    alert(`✔️ "${globalMatchTitle}" marked as seen/heard. We are spinning up a fresh match for you!`);
    document.getElementById('result-box').style.display = 'none';
    triggerMatch(); // Run algorithm again instantly, for free
};

window.triggerAdRetry = function() {
    let retriesUsed = parseInt(localStorage.getItem('adRetriesUsed') || '0');
    if (retriesUsed >= 5 && !isUserLoggedIn) {
        document.getElementById('result-box').style.display = 'none';
        document.getElementById('blocked-box').style.display = 'block';
        return;
    }
    
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
            
            claimBtn.onclick = () => {
                localStorage.setItem('adRetriesUsed', retriesUsed + 1);
                document.getElementById('reward-ad-modal').style.display = 'none';
                document.getElementById('result-box').style.display = 'none';
                triggerMatch(); 
            };
        }
    }, 1000);
};

window.triggerSearch = function() {
    if (adblockEnabled) { document.getElementById('adblock-modal').style.display = 'flex'; return; }
    const query = document.getElementById('manual-search-input').value.trim();
    if (!query) { alert("Please enter a movie or series title first!"); return; }

    if(document.getElementById('freemium-banner')) document.getElementById('freemium-banner').style.display = 'none';
    document.getElementById('search-container').style.display = 'none';
    document.getElementById('questionnaire-box').style.display = 'none';
    
    document.getElementById('loading-box').style.display = 'block';
    document.getElementById('loading-spinner').innerText = "📡";
    document.getElementById('loading-text').innerText = "Querying Global Databases...";
    document.getElementById('loading-subtext').innerText = `Locating streaming rights for "${query}" in your region...`;

    const bar = document.getElementById('progress-bar');
    let width = 0;
    let interval = setInterval(() => {
        width += 5; 
        if (bar) bar.style.width = width + '%';
        if (width >= 100) {
            clearInterval(interval);
            document.getElementById('loading-box').style.display = 'none';
            document.getElementById('search-result-box').style.display = 'block';
            document.getElementById('search-res-title').innerText = query;
            const searchUrl = `https://www.google.com/search?q=where+to+watch+${encodeURIComponent(query)}`;
            document.getElementById('search-direct-link').href = searchUrl;
        }
    }, 45);
};
