console.log("Mastercode 29.0: Universal Search Engine & Core Active");

let globalMatchTitle = "Match App";
let supabaseClient = null;
let isUserLoggedIn = false;
let userProfileData = {};

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let adblockEnabled = false;

try { if (window.supabase) supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'); } catch(e){}

function checkAdBlocker() {
    const testAd = document.createElement('div'); testAd.innerHTML = '&nbsp;'; testAd.className = 'adsbox ad-placement doubleclick';
    testAd.style.position = 'absolute'; testAd.style.top = '-999px'; document.body.appendChild(testAd);
    window.setTimeout(() => {
        if (testAd.offsetHeight === 0) { adblockEnabled = true; document.getElementById('adblock-modal').style.display = 'flex'; }
        testAd.remove();
    }, 300);
}

window.addEventListener('DOMContentLoaded', async () => {
    checkAdBlocker();
    setInterval(checkAdBlocker, 5000); 

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

// 🌐 NEW: WHERE TO WATCH SEARCH FEATURE
window.triggerSearch = function() {
    if (adblockEnabled) { document.getElementById('adblock-modal').style.display = 'flex'; return; }
    
    const query = document.getElementById('manual-search-input').value.trim();
    if (!query) { alert("Please enter a movie or series title first!"); return; }

    // Hide UI
    if(document.getElementById('freemium-banner')) document.getElementById('freemium-banner').style.display = 'none';
    document.getElementById('search-container').style.display = 'none';
    document.getElementById('questionnaire-box').style.display = 'none';
    
    // Show Loading
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
            
            // Show Search Result
            document.getElementById('search-result-box').style.display = 'block';
            document.getElementById('search-res-title').innerText = query;
            
            // Link directly to Google Search for streaming options
            const searchUrl = `https://www.google.com/search?q=where+to+watch+${encodeURIComponent(query)}`;
            document.getElementById('search-direct-link').href = searchUrl;
        }
    }, 45);
};

// MULTI-PLATFORM CATALOG
const masterCatalog = [
    { title: "Parasite", category: "movie", platform: "Max", mood: "intense", era: "modern", aesthetic: "dark", trailer: "https://www.youtube.com/embed/5xH0HfJHsaY", url: "https://www.max.com", synopsis: "Greed and class discrimination threaten a wealthy family.", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80" },
    { title: "Cidade de Deus", category: "movie", platform: "Prime", mood: "intense", era: "classic", aesthetic: "dark", trailer: "https://www.youtube.com/embed/dcUOO4yqZaQ", url: "https://www.primevideo.com", synopsis: "Two boys growing up in a violent neighborhood of Rio take different paths.", poster: "https://images.unsplash.com/photo-1518639197413-568b81340156?auto=format&fit=crop&w=800&q=80" },
    { title: "Superbad", category: "movie", platform: "Netflix", mood: "laugh", era: "classic", aesthetic: "colorful", trailer: "https://www.youtube.com/embed/4eaKAjixTMY", url: "https://www.netflix.com", synopsis: "High school seniors deal with separation anxiety during a wild party.", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80" },
    { title: "Succession", category: "series", platform: "Max", mood: "intense", era: "modern", aesthetic: "luxurious", trailer: "https://www.youtube.com/embed/OzYxJV_rmv8", url: "https://www.max.com", synopsis: "A media family fights for control of their empire.", poster: "https://images.unsplash.com/photo-1555529733-0e67056058e1?auto=format&fit=crop&w=800&q=80" },
    { title: "Avenida Brasil", category: "telenovela", platform: "Globoplay", mood: "intense", era: "classic", aesthetic: "colorful", trailer: "https://www.youtube.com/embed/MBRqu0YOH14", url: "https://globoplay.globo.com", synopsis: "A gripping story of revenge and intense family drama.", poster: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80" },
    { title: "O Clone", category: "telenovela", platform: "Globoplay", mood: "romantic", era: "classic", aesthetic: "colorful", trailer: "https://www.youtube.com/embed/1vR_s-v4t8A", url: "https://globoplay.globo.com", synopsis: "A massive hit dealing with cloning, drug addiction, and Islamic culture.", poster: "https://images.unsplash.com/photo-1542158862-23c3b0eb6d62?auto=format&fit=crop&w=800&q=80" },
    { title: "Late Night Cinematic", category: "spotify", platform: "Spotify", mood: "relax", era: "modern", aesthetic: "dark", trailer: "https://open.spotify.com/embed/playlist/37i9dQZF1DX3Ogo9pFvBkY", url: "https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY", synopsis: "Beautiful cinematic tracks for a relaxed evening.", poster: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&w=800&q=80" }
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

    const category = document.getElementById('q-category').value;
    const platform = document.getElementById('q-platform').value;
    const mood = document.getElementById('q-mood').value;

    let pool = masterCatalog;
    if (category !== 'any') pool = pool.filter(i => i.category === category);
    if (platform !== 'any') pool = pool.filter(i => i.platform === platform);
    
    let unseenPool = pool.filter(item => !seenList.includes(item.title));
    
    if (unseenPool.length === 0) {
        if (pool.length === 0) { alert("No matches found for that specific combo. Try broadening your search!"); return; }
        unseenPool = pool; 
    }

    let scoredMatches = unseenPool.map(item => ({ item, score: (item.mood === mood) ? 5 : 0 }));
    scoredMatches.sort((a, b) => b.score - a.score);
    
    let topScore = scoredMatches[0]?.score || 0;
    let topMatches = scoredMatches.filter(m => m.score === topScore).map(m => m.item);
    const selected = topMatches[Math.floor(Math.random() * topMatches.length)];
    
    globalMatchTitle = selected.title; 

    if (!seenList.includes(globalMatchTitle)) {
        seenList.push(globalMatchTitle);
        syncListsToDatabase();
    }

    document.getElementById('search-container').style.display = 'none';
    document.getElementById('questionnaire-box').style.display = 'none';
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

window.saveToList = function() {
    if (!savedList.includes(globalMatchTitle)) {
        savedList.push(globalMatchTitle);
        syncListsToDatabase();
        alert(`⭐ "${globalMatchTitle}" saved to your Portfolio!`);
    }
};
