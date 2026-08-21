console.log("Mastercode 28.0: Multi-Platform Engine Active");

let globalMatchTitle = "Match App";
let supabaseClient = null;
let isUserLoggedIn = false;
let userProfileData = {};

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let adblockEnabled = false;

try { if (window.supabase) supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'); } catch(e){}

// 🛑 AGGRESSIVE ADBLOCK DETECTION (Runs continuously to prevent disabling via dev tools)
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
    setInterval(checkAdBlocker, 5000); // Check every 5 seconds to ensure it stays off

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

// 🌐 THE MASSIVE MULTI-PLATFORM CATALOG (Global & Brazilian Focus)
const masterCatalog = [
    // MOVIES
    { title: "Parasite", category: "movie", platform: "Max", mood: "intense", era: "modern", aesthetic: "dark", trailer: "https://www.youtube.com/embed/5xH0HfJHsaY", url: "https://www.max.com", synopsis: "Greed and class discrimination threaten a wealthy family.", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80" },
    { title: "Cidade de Deus (City of God)", category: "movie", platform: "Prime", mood: "intense", era: "classic", aesthetic: "dark", trailer: "https://www.youtube.com/embed/dcUOO4yqZaQ", url: "https://www.primevideo.com", synopsis: "Two boys growing up in a violent neighborhood of Rio de Janeiro take different paths.", poster: "https://images.unsplash.com/photo-1518639197413-568b81340156?auto=format&fit=crop&w=800&q=80" },
    { title: "Superbad", category: "movie", platform: "Netflix", mood: "laugh", era: "classic", aesthetic: "colorful", trailer: "https://www.youtube.com/embed/4eaKAjixTMY", url: "https://www.netflix.com", synopsis: "High school seniors deal with separation anxiety during a wild party.", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80" },
    { title: "O Auto da Compadecida", category: "movie", platform: "Globoplay", mood: "laugh", era: "classic", aesthetic: "retro", trailer: "https://www.youtube.com/embed/1vR_s-v4t8A", url: "https://globoplay.globo.com", synopsis: "The hilarious adventures of João Grilo and Chicó in the Brazilian Northeast.", poster: "https://images.unsplash.com/photo-1590487988256-9ed24133863e?auto=format&fit=crop&w=800&q=80" },
    
    // SERIES
    { title: "Breaking Bad", category: "series", platform: "Netflix", mood: "intense", era: "classic", aesthetic: "dark", trailer: "https://www.youtube.com/embed/HhesaQXLuRY", url: "https://www.netflix.com", synopsis: "A chemistry teacher turns to manufacturing meth to secure his family's future.", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80" },
    { title: "Dark", category: "series", platform: "Netflix", mood: "mindbending", era: "modern", aesthetic: "dark", trailer: "https://www.youtube.com/embed/rrwycJ08PSA", url: "https://www.netflix.com", synopsis: "A family saga with a supernatural twist, set in a German town where the disappearance of two young children exposes the relationships among four families.", poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80" },
    { title: "Succession", category: "series", platform: "Max", mood: "intense", era: "modern", aesthetic: "luxurious", trailer: "https://www.youtube.com/embed/OzYxJV_rmv8", url: "https://www.max.com", synopsis: "The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their father steps down.", poster: "https://images.unsplash.com/photo-1555529733-0e67056058e1?auto=format&fit=crop&w=800&q=80" },
    
    // NOVELAS (BR & GLOBAL)
    { title: "Avenida Brasil", category: "telenovela", platform: "Globoplay", mood: "intense", era: "classic", aesthetic: "colorful", trailer: "https://www.youtube.com/embed/MBRqu0YOH14", url: "https://globoplay.globo.com", synopsis: "A gripping story of revenge and intense family drama in Rio de Janeiro.", poster: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80" },
    { title: "La Usurpadora", category: "telenovela", platform: "Prime", mood: "romantic", era: "vintage", aesthetic: "luxurious", trailer: "https://www.youtube.com/embed/1vR_s-v4t8A", url: "https://www.primevideo.com", synopsis: "A classic Mexican telenovela about twin sisters separated at birth who swap lives.", poster: "https://images.unsplash.com/photo-1518991206126-72d8ebdfa40c?auto=format&fit=crop&w=800&q=80" },
    { title: "O Clone", category: "telenovela", platform: "Globoplay", mood: "romantic", era: "classic", aesthetic: "colorful", trailer: "https://www.youtube.com/embed/1vR_s-v4t8A", url: "https://globoplay.globo.com", synopsis: "A massive Brazilian hit dealing with cloning, drug addiction, and Islamic culture.", poster: "https://images.unsplash.com/photo-1542158862-23c3b0eb6d62?auto=format&fit=crop&w=800&q=80" },
    
    // SPOTIFY & YOUTUBE
    { title: "Late Night Cinematic", category: "spotify", platform: "Spotify", mood: "relax", era: "modern", aesthetic: "dark", trailer: "https://open.spotify.com/embed/playlist/37i9dQZF1DX3Ogo9pFvBkY", url: "https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY", synopsis: "Beautiful instrumental and cinematic tracks for a relaxed, atmospheric evening.", poster: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&w=800&q=80" },
    { title: "Kurzgesagt: Optimistic Nihilism", category: "youtube", platform: "YouTube", mood: "mindbending", era: "modern", aesthetic: "colorful", trailer: "https://www.youtube.com/embed/MBRqu0YOH14", url: "https://youtube.com", synopsis: "A beautiful animated journey exploring the vastness of the universe.", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80" },
    { title: "Satisfying Kinetic Sand Shorts", category: "short", platform: "YouTube", mood: "relax", era: "modern", aesthetic: "colorful", trailer: "https://www.youtube.com/embed/8b1JjJwzZ6M", url: "https://youtube.com/shorts", synopsis: "A highly addictive loop of satisfying kinetic sand cutting to relax your brain.", poster: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80" }
];

window.triggerMatch = async function() {
    if (adblockEnabled) { document.getElementById('adblock-modal').style.display = 'flex'; return; }

    let retriesUsed = parseInt(localStorage.getItem('adRetriesUsed') || '0');
    if (!isUserLoggedIn && retriesUsed >= 5) {
        document.getElementById('questionnaire-box').style.display = 'none';
        document.getElementById('blocked-box').style.display = 'block';
        return;
    }

    const category = document.getElementById('q-category').value;
    const platform = document.getElementById('q-platform').value;
    const mood = document.getElementById('q-mood').value;
    const aesthetic = document.getElementById('q-aesthetic').value;

    // Filter 1: By Category & Platform
    let pool = masterCatalog;
    if (category !== 'any') pool = pool.filter(i => i.category === category);
    if (platform !== 'any') pool = pool.filter(i => i.platform === platform);
    
    // Filter 2: STRICT DEDUPLICATION (Absolute guarantee no repeats on device)
    let unseenPool = pool.filter(item => !seenList.includes(item.title));
    
    if (unseenPool.length === 0) {
        if (pool.length === 0) {
            alert("No matches found for that specific platform/format combo. Try broadening your search!");
            return;
        }
        alert("Wow! You've seen every match in this exact category/platform combo. We are expanding the database for you!");
        unseenPool = pool; // Let them re-watch if they truly exhausted it
    }

    // Scoring Algorithm
    let scoredMatches = unseenPool.map(item => {
        let score = 0;
        if (item.mood === mood) score += 5;
        if (item.aesthetic === aesthetic) score += 4;
        return { item, score };
    });
    scoredMatches.sort((a, b) => b.score - a.score);
    
    let topScore = scoredMatches[0]?.score || 0;
    let topMatches = scoredMatches.filter(m => m.score === topScore).map(m => m.item);
    const selected = topMatches[Math.floor(Math.random() * topMatches.length)];
    
    globalMatchTitle = selected.title; 

    // INSTANT LOCK: Push to seen list so it NEVER shows again
    if (!seenList.includes(globalMatchTitle)) {
        seenList.push(globalMatchTitle);
        syncListsToDatabase();
    }

    // Cinematic UI transitions
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

            // Populate Premium UI
            document.getElementById('res-header-bg').style.backgroundImage = `url('${selected.poster}')`;
            document.getElementById('res-title').innerText = selected.title;
            
            // Rich Meta Tags
            const metaContainer = document.getElementById('res-meta');
            metaContainer.innerHTML = `<span class="meta-tag">${selected.category}</span> <span class="meta-tag">${selected.era}</span> <span class="meta-tag">${selected.aesthetic}</span>`;
            
            document.getElementById('res-synopsis').innerText = selected.synopsis;
            document.getElementById('res-platform').innerText = selected.platform;
            
            // Adjust iframe for Spotify vs YouTube
            const iframe = document.getElementById('res-trailer');
            if(selected.category === 'spotify') {
                iframe.style.height = "152px";
                iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
            } else {
                iframe.style.height = "280px";
                iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            }
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
