console.log("Mastercode 37.0: Lifetime Ad-Free Engine & Universal Deep-Links Active");

let globalMatchTitle = "Match App";
let supabaseClient = null;
let isUserLoggedIn = false;
let userProfileData = {};

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let isAdFree = localStorage.getItem('match_adFree') === 'true'; 
let adblockEnabled = false;

try { if (window.supabase) supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'); } catch(e){}

// AD BLOCK DETECTION (COMPLETELY BYPASSED IF VIP/AD-FREE)
function checkAdBlocker() {
    if (isAdFree) return; // VIPs don't get checked for adblockers!
    const testAd = document.createElement('div'); testAd.innerHTML = '&nbsp;'; testAd.className = 'adsbox ad-placement doubleclick';
    testAd.style.position = 'absolute'; testAd.style.top = '-999px'; document.body.appendChild(testAd);
    window.setTimeout(() => {
        if (testAd.offsetHeight === 0) { adblockEnabled = true; document.getElementById('adblock-modal').style.display = 'flex'; }
        testAd.remove();
    }, 300);
}

// 🌐 BULLETPROOF CHROME DETECTOR & DEEP-LINK
window.openInChrome = function() {
    const currentUrl = window.location.href.replace(/^https?:\/\//, '');
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    
    if (isIOS) {
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

// 💎 SUBSCRIPTION / PURCHASE LOGIC
window.openUpgradeModal = function() {
    document.getElementById('upgrade-modal').style.display = 'flex';
};

window.closeUpgradeModal = function() {
    document.getElementById('upgrade-modal').style.display = 'none';
};

window.purchaseAdFree = function() {
    const btn = document.getElementById('purchase-btn');
    btn.innerText = "Processing Secure Checkout...";
    btn.style.opacity = '0.7';
    
    // Simulate secure checkout delay
    setTimeout(async () => {
        localStorage.setItem('match_adFree', 'true');
        isAdFree = true;
        document.body.classList.add('ad-free-mode');
        
        if (isUserLoggedIn && supabaseClient) {
            await supabaseClient.auth.updateUser({ data: { ad_free: true } });
        }
        
        alert("🎉 Purchase Successful! You now have Lifetime Ad-Free access.");
        document.getElementById('upgrade-modal').style.display = 'none';
        
        // If they were stuck on the limit screen, unblock them
        if (document.getElementById('blocked-box').style.display === 'block') {
             document.getElementById('blocked-box').style.display = 'none';
             document.getElementById('questionnaire-box').style.display = 'block';
             localStorage.setItem('adRetriesUsed', '0');
        }
    }, 1500);
};

window.addEventListener('DOMContentLoaded', async () => {
    // Apply Ad-Free CSS class instantly if they own it
    if (isAdFree) document.body.classList.add('ad-free-mode');

    checkAdBlocker();
    setInterval(checkAdBlocker, 5000); 

    if (localStorage.getItem('hasSeenWelcome') !== 'true') {
        const welcomeModal = document.getElementById('welcome-modal');
        if (welcomeModal) welcomeModal.style.display = 'flex';
    }

    // Hide Chrome Banner if previously dismissed
    if (sessionStorage.getItem('dismissedChromeBanner') === 'true') {
        const banner = document.getElementById('chrome-banner');
        if (banner) banner.style.display = 'none';
    }

    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            isUserLoggedIn = true;
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

// 🎬 THE EXPANDED CATALOG
const masterCatalog = [
    { title: "Superbad", category: "movie", platform: "Netflix", mood: "laugh", aesthetic: "colorful", era: "classic", pacing: "fast", trailerId: "MNpoTxeydiI", url: "https://www.netflix.com", synopsis: "High school seniors deal with separation anxiety during a wild party.", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80" },
    { title: "Stranger Things", category: "series", platform: "Netflix", mood: "intense", aesthetic: "retro", era: "modern", pacing: "epic", trailerId: "b9EkMc79ZSU", url: "https://www.netflix.com", synopsis: "A group of kids uncover secret experiments and terrifying supernatural forces.", poster: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=800&q=80" },
    { title: "The Crown", category: "series", platform: "Netflix", mood: "intense", aesthetic: "luxurious", era: "classic", pacing: "standard", trailerId: "JWtnJjn6ng0", url: "https://www.netflix.com", synopsis: "Follows the political rivalries and romance of Queen Elizabeth II's reign.", poster: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80" },
    { title: "Bridgerton", category: "series", platform: "Netflix", mood: "romantic", aesthetic: "luxurious", era: "vintage", pacing: "standard", trailerId: "qBapaNnKN0E", url: "https://www.netflix.com", synopsis: "Wealth, lust, and betrayal set against the backdrop of Regency-era England.", poster: "https://images.unsplash.com/photo-1582711012124-a56cf82307a0?auto=format&fit=crop&w=800&q=80" },
    { title: "Black Mirror", category: "series", platform: "Netflix", mood: "mindbending", aesthetic: "dark", era: "modern", pacing: "standard", trailerId: "V0XOApF5nLU", url: "https://www.netflix.com", synopsis: "An anthology series exploring a twisted, high-tech multiverse.", poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80" },
    { title: "Parasite", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", era: "modern", pacing: "standard", trailerId: "SEUXfv87Wpk", url: "https://www.max.com", synopsis: "Greed and class discrimination threaten a wealthy family.", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80" },
    { title: "Succession", category: "series", platform: "Max", mood: "intense", aesthetic: "luxurious", era: "modern", pacing: "standard", trailerId: "OzYxJV_rmv8", url: "https://www.max.com", synopsis: "A media family fights for control of their empire.", poster: "https://images.unsplash.com/photo-1555529733-0e67056058e1?auto=format&fit=crop&w=800&q=80" },
    { title: "The Great Gatsby", category: "movie", platform: "Max", mood: "romantic", aesthetic: "luxurious", era: "classic", pacing: "standard", trailerId: "sN183rJltNM", url: "https://www.max.com", synopsis: "A writer gets drawn into the lavish, tragic world of his millionaire neighbor.", poster: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80" },
    { title: "Euphoria", category: "series", platform: "Max", mood: "intense", aesthetic: "colorful", era: "modern", pacing: "fast", trailerId: "cZAxLQiPANY", url: "https://www.max.com", synopsis: "A look at life for a group of high school students.", poster: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80" },
    { title: "Dune", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", era: "modern", pacing: "epic", trailerId: "8g18jFHCLXk", url: "https://www.max.com", synopsis: "A noble family becomes embroiled in a war for control over the galaxy's most valuable asset.", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80" },
    { title: "Interstellar", category: "movie", platform: "Prime", mood: "mindbending", aesthetic: "dark", era: "modern", pacing: "epic", trailerId: "zSWdZVtXT7E", url: "https://www.primevideo.com", synopsis: "Explorers travel through a wormhole in space to ensure humanity's survival.", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80" },
    { title: "Cidade de Deus", category: "movie", platform: "Prime", mood: "intense", aesthetic: "dark", era: "classic", pacing: "standard", trailerId: "ioUEvrOaAoU", url: "https://www.primevideo.com", synopsis: "Two boys growing up in a violent neighborhood of Rio take different paths.", poster: "https://images.unsplash.com/photo-1518639197413-568b81340156?auto=format&fit=crop&w=800&q=80" },
    { title: "The Boys", category: "series", platform: "Prime", mood: "intense", aesthetic: "dark", era: "modern", pacing: "fast", trailerId: "M1bhOaLV4FU", url: "https://www.primevideo.com", synopsis: "A group of vigilantes set out to take down corrupt superheroes.", poster: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80" },
    { title: "The Office", category: "series", platform: "Prime", mood: "laugh", aesthetic: "retro", era: "classic", pacing: "fast", trailerId: "cKKHFAew_ls", url: "https://www.primevideo.com", synopsis: "A mockumentary on a group of typical office workers.", poster: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80" },
    { title: "Fleabag", category: "series", platform: "Prime", mood: "laugh", aesthetic: "colorful", era: "modern", pacing: "fast", trailerId: "aX2ViKQFL_k", url: "https://www.primevideo.com", synopsis: "A dry-witted woman navigates life and love in London.", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80" },
    { title: "Avengers: Endgame", category: "movie", platform: "Disney", mood: "intense", aesthetic: "colorful", era: "modern", pacing: "epic", trailerId: "TcMBFSGVi1c", url: "https://www.disneyplus.com", synopsis: "The Avengers assemble once more to reverse Thanos' actions.", poster: "https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=800&q=80" },
    { title: "The Mandalorian", category: "series", platform: "Disney", mood: "intense", aesthetic: "dark", era: "modern", pacing: "standard", trailerId: "aOC8E8z_ifw", url: "https://www.disneyplus.com", synopsis: "The travels of a lone bounty hunter in the outer reaches of the galaxy.", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80" },
    { title: "Moana", category: "movie", platform: "Disney", mood: "relax", aesthetic: "colorful", era: "modern", pacing: "standard", trailerId: "LKFuXETZUsI", url: "https://www.disneyplus.com", synopsis: "A sweeping, animated feature film about an adventurous teenager.", poster: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80" },
    { title: "Avenida Brasil", category: "telenovela", platform: "Globoplay", mood: "intense", aesthetic: "colorful", era: "classic", pacing: "epic", trailerId: "tYv8j-d3Bmw", url: "https://globoplay.globo.com", synopsis: "A gripping story of revenge and intense family drama.", poster: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80" },
    { title: "O Clone", category: "telenovela", platform: "Globoplay", mood: "romantic", aesthetic: "luxurious", era: "classic", pacing: "epic", trailerId: "gMtwYw8Q6eY", url: "https://globoplay.globo.com", synopsis: "A massive hit dealing with cloning, love, and destiny.", poster: "https://images.unsplash.com/photo-1542158862-23c3b0eb6d62?auto=format&fit=crop&w=800&q=80" },
    { title: "Rebelde", category: "telenovela", platform: "Globoplay", mood: "laugh", aesthetic: "retro", era: "classic", pacing: "epic", trailerId: "q3aM-uM51H8", url: "https://globoplay.globo.com", synopsis: "Teenagers at an elite boarding school form a pop band.", poster: "https://images.unsplash.com/photo-1518991206126-72d8ebdfa40c?auto=format&fit=crop&w=800&q=80" },
    { title: "O Auto da Compadecida", category: "movie", platform: "Globoplay", mood: "laugh", aesthetic: "retro", era: "classic", pacing: "fast", trailerId: "6mUifXv-9tE", url: "https://globoplay.globo.com", synopsis: "The hilarious adventures of João Grilo and Chicó in the Northeast of Brazil.", poster: "https://images.unsplash.com/photo-1518639197413-568b81340156?auto=format&fit=crop&w=800&q=80" },
    { title: "Kurzgesagt - Optimistic Nihilism", category: "youtube", platform: "YouTube", mood: "mindbending", aesthetic: "colorful", era: "modern", pacing: "fast", trailerId: "MBRqu0YOH14", url: "https://youtube.com", synopsis: "A beautiful animated journey exploring the vastness of the universe.", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80" },
    { title: "Satisfying Kinetic Sand", category: "short", platform: "YouTube", mood: "relax", aesthetic: "colorful", era: "modern", pacing: "fast", trailerId: "mR_Pq6V3oP4", url: "https://youtube.com/shorts", synopsis: "A highly addictive loop of satisfying kinetic sand cutting.", poster: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80" },
    { title: "MrBeast - 100 Days in Circle", category: "youtube", platform: "YouTube", mood: "laugh", aesthetic: "colorful", era: "modern", pacing: "fast", trailerId: "Hwybp38Gn0s", url: "https://youtube.com", synopsis: "An insane social experiment for a massive cash prize.", poster: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80" },
    { title: "Late Night Cinematic", category: "spotify", platform: "Spotify", mood: "relax", aesthetic: "dark", era: "modern", pacing: "standard", spotifyId: "playlist/37i9dQZF1DX3Ogo9pFvBkY", url: "https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY", synopsis: "Beautiful cinematic tracks for a relaxed evening.", poster: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&w=800&q=80" },
    { title: "Phonk Workout", category: "spotify", platform: "Spotify", mood: "intense", aesthetic: "dark", era: "modern", pacing: "fast", spotifyId: "playlist/37i9dQZF1DWWY64wDtewQt", url: "https://open.spotify.com/playlist/37i9dQZF1DWWY64wDtewQt", synopsis: "Aggressive phonk beats for heavy lifting and high energy.", poster: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80" },
    { title: "Retro 80s Hits", category: "spotify", platform: "Spotify", mood: "laugh", aesthetic: "retro", era: "vintage", pacing: "standard", spotifyId: "playlist/37i9dQZF1DX4UtSsVN1WsYY", url: "https://open.spotify.com/playlist/37i9dQZF1DX4UtSsVN1WsYY", synopsis: "The greatest upbeat hits of the 1980s.", poster: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80" },
    { title: "Classical Focus", category: "spotify", platform: "Spotify", mood: "relax", aesthetic: "luxurious", era: "classic", pacing: "standard", spotifyId: "playlist/37i9dQZF1DWWEJlAGA9gs0", url: "https://open.spotify.com/playlist/37i9dQZF1DWWEJlAGA9gs0", synopsis: "Soothing classical masterpieces.", poster: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80" }
];

// 🔥 STRICT SCORING ALGORITHM
window.triggerMatch = async function() {
    if (adblockEnabled) { document.getElementById('adblock-modal').style.display = 'flex'; return; }

    let retriesUsed = parseInt(localStorage.getItem('adRetriesUsed') || '0');
    
    // VIPs have unlimited matches. Only block free users after 5 tries.
    if (!isUserLoggedIn && !isAdFree && retriesUsed >= 5) {
        document.getElementById('search-container').style.display = 'none';
        document.getElementById('questionnaire-box').style.display = 'none';
        document.getElementById('blocked-box').style.display = 'block';
        return;
    }

    const category = document.getElementById('q-category') ? document.getElementById('q-category').value : 'any';
    const platform = document.getElementById('q-platform') ? document.getElementById('q-platform').value : 'any';
    const mood = document.getElementById('q-mood') ? document.getElementById('q-mood').value : 'any';
    const aesthetic = document.getElementById('q-aesthetic') ? document.getElementById('q-aesthetic').value : 'any';
    const era = document.getElementById('q-era') ? document.getElementById('q-era').value : 'any';
    const pacing = document.getElementById('q-pacing') ? document.getElementById('q-pacing').value : 'any';

    let unseenPool = masterCatalog.filter(item => !seenList.includes(item.title));
    if (unseenPool.length === 0) {
        alert("Incredible! You have seen every title in our database. We are actively adding more!");
        return;
    }

    let scoredMatches = unseenPool.map(item => {
        let score = 0;
        let strictMatch = true;

        if (category !== 'any' && item.category !== category) strictMatch = false;
        if (platform !== 'any' && item.platform !== platform) strictMatch = false;
        
        if (strictMatch) score += 1000; 

        if (mood !== 'any' && item.mood === mood) score += 100;
        if (aesthetic !== 'any' && item.aesthetic === aesthetic) score += 50;
        if (era !== 'any' && item.era === era) score += 25;
        if (pacing !== 'any' && item.pacing === pacing) score += 25;

        return { item, score, strictMatch };
    });

    let validMatches = scoredMatches.filter(m => m.strictMatch);
    
    if (validMatches.length === 0) {
        validMatches = scoredMatches; 
        alert("⚠️ We couldn't find an EXACT match for this specific combination on that platform, but we broadened the search to find your next closest vibe!");
    }

    validMatches.sort((a, b) => b.score - a.score);
    let topScore = validMatches[0].score;
    let bestMatches = validMatches.filter(m => m.score === topScore).map(m => m.item);
    const selected = bestMatches[Math.floor(Math.random() * bestMatches.length)];
    
    globalMatchTitle = selected.title; 

    seenList.push(globalMatchTitle);
    syncListsToDatabase();

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
            
            document.getElementById('loading-box').style.display = 'none';
            
            const resultBox = document.getElementById('result-box');
            resultBox.style.display = 'block';
            resultBox.style.animation = 'none';
            resultBox.offsetHeight; 
            resultBox.style.animation = null;

            document.getElementById('res-header-bg').style.backgroundImage = `url('${selected.poster}')`;
            document.getElementById('res-title').innerText = selected.title;
            document.getElementById('res-synopsis').innerText = selected.synopsis;
            document.getElementById('res-platform').innerText = selected.platform;
            
            const iframe = document.getElementById('res-trailer');
            
            if(selected.category === 'spotify') {
                iframe.style.height = "152px";
                iframe.src = `https://open.spotify.com/embed/${selected.spotifyId}`;
            } else {
                iframe.style.height = "280px";
                const userLang = (navigator.language || 'en').split('-')[0];
                iframe.src = `https://www.youtube.com/embed/${selected.trailerId}?hl=${userLang}&cc_load_policy=1&cc_lang_pref=${userLang}&autoplay=0`;
            }
            
            document.getElementById('res-direct-link').href = selected.url;
        }
    }, 40);
};

window.markAsSeenAndSkip = function() {
    alert(`✔️ "${globalMatchTitle}" has been logged as Seen/Heard. The Concierge is spinning up a fresh alternative for you now!`);
    document.getElementById('result-box').style.display = 'none';
    triggerMatch(); 
};

// 🔄 VIP AD-BYPASS OR REWARD AD
window.triggerAdRetry = function() {
    let retriesUsed = parseInt(localStorage.getItem('adRetriesUsed') || '0');
    
    // If the user bought Ad-Free, instantly bypass everything!
    if (isAdFree) {
        document.getElementById('result-box').style.display = 'none';
        triggerMatch();
        return;
    }

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

window.saveToList = function() {
    if (!savedList.includes(globalMatchTitle)) {
        savedList.push(globalMatchTitle);
        syncListsToDatabase();
        alert(`⭐ "${globalMatchTitle}" saved to your Portfolio!`);
    }
};

window.triggerSearch = function() {
    if (adblockEnabled) { document.getElementById('adblock-modal').style.display = 'flex'; return; }
    const query = document.getElementById('manual-search-input').value.trim();
    if (!query) { alert("Please enter a movie or series title first!"); return; }

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
            
            const searchBox = document.getElementById('search-result-box');
            searchBox.style.display = 'block';
            searchBox.style.animation = 'none';
            searchBox.offsetHeight; 
            searchBox.style.animation = null;

            document.getElementById('search-res-title').innerText = query;
            const searchUrl = `https://www.google.com/search?q=where+to+watch+${encodeURIComponent(query)}`;
            document.getElementById('search-direct-link').href = searchUrl;
        }
    }, 45);
};
