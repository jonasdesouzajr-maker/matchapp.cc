console.log("Mastercode 100: Exact Search, CDN Proxy Covers, and YouTube Fallbacks Active");

const SUPABASE_URL = 'https://zkymvqrmbabngsqblyye.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpreW12cXJtYmFibmdzcWJseXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDUyNDIsImV4cCI6MjEwMjM4MTI0Mn0._yEVFMfwVU6GBqQ8m3ljfOgA0HSLEDiKMOfYae6ZD8Q';

let supabaseClient = null;
try { if (window.supabase) supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch (e) {}

let globalMatchTitle = ""; let globalMatchPoster = ""; let globalPlatform = ""; let isUserLoggedIn = false;
let isVIP = localStorage.getItem('match_isVIP') === 'true';

// ----------------------------------------------------
// THE LIMIT LOGIC (3 Free, 5 Registered, 10 VIP)
// ----------------------------------------------------
function checkDailyLimit() {
    const todayStr = new Date().toLocaleDateString(); 
    let lastDate = localStorage.getItem('match_lastDate'); 
    let dailyCount = parseInt(localStorage.getItem('match_dailyCount') || '0');
    
    if (lastDate !== todayStr) { dailyCount = 0; localStorage.setItem('match_lastDate', todayStr); }
    
    let maxLimit = 3; // Free Unregistered
    if (isUserLoggedIn && !isVIP) maxLimit = 5; // Registered
    if (isVIP) maxLimit = 10; // VIP
    
    if (dailyCount >= maxLimit) {
        if (!isUserLoggedIn) {
            alert("🔒 You've used your 3 free searches today!\n\nRegister for FREE to unlock 5 daily searches."); 
            window.openAuthModal();
        } else if (!isVIP) {
            alert("🔒 You've used your 5 registered searches today!\n\nUpgrade to VIP for 10 daily searches."); 
            window.location.href = '/pricing/pricing.html';
        } else {
            alert("💎 VIP Limit Reached! You've used your 10 daily searches.");
        }
        return false;
    }
    
    dailyCount++; 
    localStorage.setItem('match_dailyCount', dailyCount.toString()); 
    return true;
}

// ----------------------------------------------------
// THE IMAGE BULLETPROOFING ENGINE (WSRV.NL CDN Proxy)
// ----------------------------------------------------
async function getRealCoverImage(title) {
    try {
        // Query TVMaze via an open proxy to guarantee response
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.tvmaze.com/singlesearch/shows?q=${title}`)}`;
        const tvRes = await fetch(proxyUrl);
        if (tvRes.ok) { 
            const proxyData = await tvRes.json(); 
            const tvData = JSON.parse(proxyData.contents); 
            if (tvData && tvData.image && tvData.image.original) {
                // Route through wsrv.nl proxy to strip hotlinking blocks
                return `https://wsrv.nl/?url=${tvData.image.original.replace('https://', '')}&w=600`;
            }
        }
    } catch(e) {}
    
    try {
        const proxyUrl2 = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://itunes.apple.com/search?term=${title}&limit=1`)}`;
        const itRes = await fetch(proxyUrl2);
        if (itRes.ok) { 
            const proxyData2 = await itRes.json(); 
            const itData = JSON.parse(proxyData2.contents); 
            if (itData.results && itData.results.length > 0 && itData.results[0].artworkUrl100) {
                let artUrl = itData.results[0].artworkUrl100.replace('100x100bb', '600x900bb');
                return `https://wsrv.nl/?url=${artUrl.replace('https://', '')}&w=600`;
            }
        }
    } catch(e) {}
    
    return 'fallback';
}

window.selectMarqueeItem = function(titleName) {
    const searchInput = document.getElementById('specific-search-input');
    const searchBox = document.getElementById('search-box');
    if (searchInput && searchBox) { 
        searchInput.value = titleName; 
        searchBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
        searchInput.focus(); 
    }
};

window.openAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'flex'; };
window.closeAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'none'; };

// ----------------------------------------------------
// AI MATCH EXECUTION
// ----------------------------------------------------
async function fetchGeminiData(promptText) {
    if (!supabaseClient) throw new Error("Database not connected");
    const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', { body: { prompt: promptText } });
    if (error || !data || !data.candidates) throw new Error("API Error");
    
    let rawText = data.candidates[0].content.parts[0].text;
    let startIndex = rawText.indexOf('{'); let endIndex = rawText.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) { return JSON.parse(rawText.substring(startIndex, endIndex + 1)); }
    throw new Error("Invalid format");
}

window.triggerMatch = async function(isSpecificSearch = false) {
    if (!checkDailyLimit()) return;
    
    const loadBox = document.getElementById('loading-box'); 
    const qBox = document.getElementById('questionnaire-box'); 
    const sBox = document.getElementById('search-box');
    const resultBox = document.getElementById('result-box');

    if (resultBox) resultBox.style.display = 'none';
    if (qBox) qBox.style.display = 'none'; 
    if (sBox) sBox.style.display = 'none';
    
    if (loadBox) { 
        loadBox.style.display = 'block'; 
        setTimeout(() => loadBox.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }

    let promptText = "";
    if (isSpecificSearch) {
        const input = document.getElementById('specific-search-input');
        if (!input || !input.value.trim()) { window.location.reload(); return; }
        // EXACT SEARCH PROMPT
        promptText = `Find streaming information strictly for "${input.value.trim()}". You MUST return metadata for this EXACT title, not a recommendation. Output valid JSON ONLY: {"title": "Exact Title Found", "synopsis": "A 2 sentence summary.", "platform": "Primary platform to watch it on", "trailerId": "11-char YouTube ID or null"}`;
    } else {
        let cat = document.getElementById('q-category')?.value || 'any'; 
        let plat = document.getElementById('q-platform')?.value || 'any'; 
        let mood = document.getElementById('q-mood')?.value || 'any'; 
        promptText = `Find a perfect title recommendation based on: Format: ${cat}, Platform: ${plat}, Mood: ${mood}. Output valid JSON ONLY: {"title": "Title", "synopsis": "Summary.", "platform": "Platform", "trailerId": "11-char ID or null"}`;
    }

    const startTime = Date.now();
    const MIN_WAIT_MS = (isVIP) ? 3000 : 13500;
    
    const pBar = document.getElementById('ai-progress-bar');
    if (pBar) pBar.style.width = '0%';
    let timerInterval = setInterval(() => {
        let pct = Math.min(((Date.now() - startTime) / MIN_WAIT_MS) * 95, 95);
        if (pBar) pBar.style.width = pct + '%';
    }, 100);

    let matchResult = null;
    try {
        matchResult = await fetchGeminiData(promptText);
    } catch (err) {
        matchResult = { title: isSpecificSearch ? document.getElementById('specific-search-input').value : "The Bear", synopsis: "Stream this popular title now.", platform: "Web", trailerId: "null" };
    }

    let timeSpent = Date.now() - startTime;
    if (timeSpent < MIN_WAIT_MS) await new Promise(resolve => setTimeout(resolve, MIN_WAIT_MS - timeSpent));

    if (pBar) pBar.style.width = '100%';
    clearInterval(timerInterval);
    
    renderResult(matchResult, isSpecificSearch);
};

// ----------------------------------------------------
// THE RENDER ENGINE (Video & Image Guarantees)
// ----------------------------------------------------
async function renderResult(selected, isSpecificSearch) {
    const loadBox = document.getElementById('loading-box'); const resultBox = document.getElementById('result-box');
    if (loadBox) loadBox.style.display = 'none';
    resultBox.style.display = 'block'; resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    if (typeof confetti !== 'undefined') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

    document.getElementById('res-title').innerText = selected.title; 
    document.getElementById('res-synopsis').innerText = selected.synopsis;
    document.getElementById('res-platform-badge').innerText = selected.platform;

    // IMAGE PROCESSING (Uses CDN Proxy)
    const posterEl = document.getElementById('res-poster-img'); 
    const cssFallback = document.getElementById('res-css-poster');
    
    posterEl.style.display = 'none'; cssFallback.style.display = 'none';
    const realCover = await getRealCoverImage(selected.title);
    
    if (realCover !== 'fallback') {
        posterEl.src = realCover; 
        posterEl.style.display = 'block';
        posterEl.onerror = function() { this.style.display = 'none'; cssFallback.style.display = 'flex'; cssFallback.innerText = selected.title; };
    } else {
        cssFallback.style.display = 'flex'; cssFallback.innerText = selected.title;
    }

    // DIRECT LINK SETUP
    const directBtn = document.getElementById('res-direct-link');
    if (selected.platform.toLowerCase().includes('spotify')) { 
        directBtn.href = `https://open.spotify.com/search/${encodeURIComponent(selected.title)}`; 
        directBtn.innerText = `🎧 Listen on Spotify`;
    } else if (selected.platform.toLowerCase().includes('reelshort')) { 
        directBtn.href = `https://www.reelshort.com/`; 
    } else if (selected.platform.toLowerCase().includes('dramabox')) { 
        directBtn.href = `https://www.dramabox.com/`; 
    } else { 
        directBtn.href = `https://www.google.com/search?q=Watch+${encodeURIComponent(selected.title)}+on+${encodeURIComponent(selected.platform)}`; 
    }

    // VIDEO / TRAILER GUARANTEE
    const trailerContainer = document.getElementById('res-trailer-container');
    const iframe = document.getElementById('res-trailer');
    
    if (isSpecificSearch) {
        // Direct Search doesn't need an embedded video, hide it.
        trailerContainer.style.display = 'none';
    } else {
        // Match Engine ALWAYS shows a video
        trailerContainer.style.display = 'block';
        if (selected.trailerId && selected.trailerId !== 'null' && selected.trailerId.length === 11) {
            iframe.src = `https://www.youtube-nocookie.com/embed/${selected.trailerId}?rel=0`;
        } else {
            // FALLBACK: Use YouTube Search Embed to guarantee something plays
            iframe.src = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(selected.title + " trailer")}`;
        }
    }
}
