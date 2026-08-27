console.log("Mastercode 66.0: 20s Ad Screen, IMDb, & Animated Deletion Active");

let globalMatchTitle = "MatchApp";
let supabaseClient = null;
let isUserLoggedIn = false;
let userProfileData = {};

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let dislikedList = JSON.parse(localStorage.getItem('match_dislikedList') || '[]');
let userRatings = JSON.parse(localStorage.getItem('match_userRatings') || '{}');

let isAdFree = localStorage.getItem('match_adFree') === 'true'; 
let isVIP = localStorage.getItem('match_isVIP') === 'true';

/* Expand catalog with IMDb data */
const masterCatalog = [
    { title: "The Wizard of Oz", category: "movie", platform: "Max", mood: "chill", aesthetic: "colorful", pacing: "steady", imdb: "8.1", trailerId: "H_3T4uScwTc", url: "https://play.max.com/movie/the-wizard-of-oz", synopsis: "A tornado transports a young Kansas girl to a magical land...", poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80" },
    { title: "The Shawshank Redemption", category: "movie", platform: "Max", mood: "intense", aesthetic: "dark", pacing: "slow", imdb: "9.3", trailerId: "PLl99DlL6b4", url: "https://play.max.com/movie/the-shawshank-redemption", synopsis: "Two imprisoned men bond over a number of years, finding solace...", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1000&q=80" },
    { title: "Stranger Things", category: "series", platform: "Netflix", mood: "intense", aesthetic: "retro", pacing: "steady", imdb: "8.7", trailerId: "b9EkMc79ZSU", url: "https://www.netflix.com/title/80057281", synopsis: "When a young boy vanishes, a small town uncovers a mystery involving supernatural forces...", poster: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=1000&q=80" },
    { title: "Spider-Man: Into the Spider-Verse", category: "movie", platform: "Netflix", mood: "laugh", aesthetic: "colorful", pacing: "fast", imdb: "8.4", trailerId: "tg52up16eq0", url: "https://www.netflix.com/title/81002747", synopsis: "Teen Miles Morales becomes the Spider-Man of his universe...", poster: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=1000&q=80" }
    // Add rest of your movies ensuring imdb: "8.0" is attached to each
];

// Helper functions (clock, Adblock)
function updateClock() { const clock = document.getElementById('real-time-clock'); if (clock) { const now = new Date(); clock.innerHTML = `${now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} | ${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`; } }
setInterval(updateClock, 1000);

function checkDailyLimit() {
    if (isVIP || isAdFree) return true; 
    const todayStr = new Date().toLocaleDateString(); let lastDate = localStorage.getItem('match_lastDate'); let dailyCount = parseInt(localStorage.getItem('match_dailyCount') || '0');
    if (lastDate !== todayStr) { dailyCount = 0; localStorage.setItem('match_lastDate', todayStr); }
    if (!isUserLoggedIn && dailyCount >= 5) { alert("🔒 You've used your 5 free guest matches today!\n\nPlease register to unlock your next daily allowance!"); window.openAuthModal(); return false; }
    if (isUserLoggedIn && dailyCount >= 5) { window.location.href = '/pricing/pricing.html'; return false; }
    dailyCount++; localStorage.setItem('match_dailyCount', dailyCount.toString()); return true;
}

// MATCH TRIGGER WITH 20s LOADING AD-SCREEN
window.triggerMatch = async function() {
    if (window.checkAdBlocker && window.adblockEnabled) return; 
    if (!checkDailyLimit()) return;

    let pool = masterCatalog.filter(item => !seenList.includes(item.title) && !savedList.includes(item.title) && !dislikedList.includes(item.title) && userRatings[item.title] !== 1);
    if (pool.length === 0) { seenList = []; syncListsToDatabase(); pool = masterCatalog; } // Reset if empty
    
    // Sort logic 
    pool.sort(() => 0.5 - Math.random());
    const selected = pool[0];
    globalMatchTitle = selected.title; 

    // Hide Q-box, show 20s Loading box
    if (document.getElementById('questionnaire-box')) document.getElementById('questionnaire-box').style.display = 'none';
    if (document.getElementById('result-box')) document.getElementById('result-box').style.display = 'none';
    
    const loadBox = document.getElementById('loading-box');
    loadBox.style.display = 'block';

    let timeLeft = isVIP || isAdFree ? 2 : 20; // 2s for VIPs, 20s ad wait for Free
    loadBox.innerHTML = `
        <div style="font-size: 50px; margin-bottom: 15px; animation: pulse 1.5s infinite;">🔮</div>
        <h3 style="color: var(--gold-glow); font-size: 20px; margin: 0;">Consulting AI Concierge...</h3>
        ${!isVIP && !isAdFree ? `<p style="color: #aaa; margin-top: 15px; font-size: 13px;">Sponsor break: Searching for the perfect match in <strong id="ad-timer-sim" style="color:#fff; font-size: 16px;">${timeLeft}</strong>s</p>
        <div class="ad-placement" style="margin-top:20px; background:transparent;">
            <script>atOptions = { 'key' : 'a993f73724a261dce748b6f9319072d5', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };</script><script src="https://www.highperformanceformat.com/a993f73724a261dce748b6f9319072d5/invoke.js"></script>
        </div>` : `<p style="color: var(--gold); margin-top: 10px;">VIP Fast-Track Active</p>`}
    `;

    const simInterval = setInterval(() => {
        timeLeft--;
        const timerEl = document.getElementById('ad-timer-sim');
        if (timerEl) timerEl.innerText = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(simInterval);
            renderResult(selected);
        }
    }, 1000);
};

// Render final result
function renderResult(selected) {
    document.getElementById('loading-box').style.display = 'none';
    const resultBox = document.getElementById('result-box');
    resultBox.style.display = 'block';

    // Reset Stars
    document.querySelectorAll('.star-rating-container .star').forEach(s => s.classList.remove('selected'));

    const posterImg = document.getElementById('res-poster-img'); if (posterImg && selected.poster) posterImg.src = selected.poster;
    document.getElementById('res-title').innerText = selected.title;
    document.getElementById('res-synopsis').innerText = selected.synopsis;

    // Badges
    const badge = document.getElementById('res-platform-badge');
    badge.innerText = selected.platform;
    if (selected.platform === 'Netflix') badge.style.background = '#E50914';
    else if (selected.platform === 'Max') badge.style.background = '#8A2BE2';
    else if (selected.platform === 'Prime') badge.style.background = '#00A8E1';
    else badge.style.background = 'var(--gold)';
    badge.style.color = '#fff';

    const imdbBadge = document.getElementById('res-imdb-badge');
    if(imdbBadge) imdbBadge.innerText = `IMDb: ${selected.imdb || 'N/A'}`;

    const directBtn = document.getElementById('res-direct-link');
    directBtn.href = selected.url;
    directBtn.innerText = `▶ Stream on ${selected.platform}`;

    // Trailer / Spotify
    const trailerBox = document.getElementById('res-trailer-container');
    if (trailerBox) {
        trailerBox.style.display = 'block';
        const iframe = document.getElementById('res-trailer');
        if (iframe) iframe.src = `https://www.youtube-nocookie.com/embed/${selected.trailerId}?autoplay=0&rel=0`;
    }
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Action Grid Event Functions
window.saveToList = function() { if (globalMatchTitle && !savedList.includes(globalMatchTitle)) { savedList.push(globalMatchTitle); syncListsToDatabase(); alert(`⭐ "${globalMatchTitle}" saved to your Watch Later Portfolio!`); renderProfileGrids(); } document.getElementById('result-box').style.display = 'none'; triggerMatch(); };
window.markAsSeen = function() { if (globalMatchTitle && !seenList.includes(globalMatchTitle)) { seenList.push(globalMatchTitle); syncListsToDatabase(); renderProfileGrids(); } document.getElementById('result-box').style.display = 'none'; triggerMatch(); };
window.markAsLiked = function() { if (globalMatchTitle) { userRatings[globalMatchTitle] = 5; if (!seenList.includes(globalMatchTitle)) seenList.push(globalMatchTitle); syncListsToDatabase(); renderProfileGrids(); } document.getElementById('result-box').style.display = 'none'; triggerMatch(); };
window.markAsDisliked = function() { if (globalMatchTitle && !dislikedList.includes(globalMatchTitle)) { dislikedList.push(globalMatchTitle); userRatings[globalMatchTitle] = 1; syncListsToDatabase(); } document.getElementById('result-box').style.display = 'none'; triggerMatch(); };

// Star Rating Listener
document.addEventListener('click', function (event) {
    if (!event.target.classList.contains('star')) return;
    const star = event.target; const rating = parseInt(star.getAttribute('data-value'));
    const container = star.closest('.star-rating-container');
    container.querySelectorAll('.star').forEach(s => s.classList.remove('selected')); star.classList.add('selected');
    if (globalMatchTitle) { userRatings[globalMatchTitle] = rating; if (!seenList.includes(globalMatchTitle)) seenList.push(globalMatchTitle); syncListsToDatabase(); renderProfileGrids(); }
});

// Profile Render Grids (With Animations & X buttons & Stars)
window.renderProfileGrids = function() {
    const pGrid = document.getElementById('portfolio-grid');
    const hGrid = document.getElementById('history-grid');
    if (!pGrid || !hGrid) return; 

    if (savedList.length > 0) {
        pGrid.innerHTML = '<div style="display: flex; flex-wrap: wrap; gap: 5px;">' + savedList.map(title => {
            const item = masterCatalog.find(m => m.title === title) || { title, poster: '/placeholder.jpg' };
            const safeTitle = title.replace(/'/g, "\\'");
            return `
            <div class="grid-item-card" id="port-item-${safeTitle}">
                <button class="delete-item-btn" onclick="removeSingleItem('${safeTitle}', 'portfolio', this)">×</button>
                <div class="item-rating-badge">⭐ TBD</div>
                <img src="${item.poster}" alt="Poster" onclick="openPortfolioModal('${safeTitle}')">
                <div class="item-title-overlay">${title}</div>
            </div>`;
        }).join('') + '</div>';
    } else { pGrid.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 0;">No saved titles yet.</p>`; }

    if (seenList.length > 0) {
        hGrid.innerHTML = '<div style="display: flex; flex-wrap: wrap; gap: 5px;">' + seenList.map(title => {
            const item = masterCatalog.find(m => m.title === title) || { title, poster: '/placeholder.jpg' };
            const safeTitle = title.replace(/'/g, "\\'");
            const rating = userRatings[title] || 'N/A';
            return `
            <div class="grid-item-card" id="hist-item-${safeTitle}">
                <button class="delete-item-btn" onclick="removeSingleItem('${safeTitle}', 'history', this)">×</button>
                <div class="item-rating-badge">⭐ ${rating}</div>
                <img src="${item.poster}" alt="Poster" onclick="openPortfolioModal('${safeTitle}')">
                <div class="item-title-overlay">${title}</div>
            </div>`;
        }).join('') + '</div>';
    } else { hGrid.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 0;">Watch history is empty.</p>`; }
};

window.removeSingleItem = function(title, listType, btnElem) {
    const card = btnElem.closest('.grid-item-card');
    card.classList.add('removing-anim'); // CSS shrink animation
    
    setTimeout(() => {
        card.remove();
        if (listType === 'portfolio') {
            savedList = savedList.filter(t => t !== title);
            if(savedList.length === 0) document.getElementById('portfolio-grid').innerHTML = '<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 0;">No saved titles yet.</p>';
        } else {
            seenList = seenList.filter(t => t !== title);
            delete userRatings[title];
            if(seenList.length === 0) document.getElementById('history-grid').innerHTML = '<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 0;">Watch history is empty.</p>';
        }
        syncListsToDatabase();
    }, 400); // Wait for animation
};

window.clearListEntirely = function(listType) {
    const listName = listType === 'portfolio' ? 'Watch Later' : 'History & Ratings';
    if(!confirm(`Delete ALL items from ${listName}?\nThis will allow the AI to match them to you again.`)) return;
    
    const grid = document.getElementById(listType === 'portfolio' ? 'portfolio-grid' : 'history-grid');
    grid.querySelectorAll('.grid-item-card').forEach(card => card.classList.add('removing-anim'));
    
    setTimeout(() => {
        if (listType === 'portfolio') { savedList = []; grid.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 0;">No saved titles yet.</p>'; } 
        else { seenList = []; userRatings = {}; grid.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 0;">Watch history is empty.</p>'; }
        syncListsToDatabase();
    }, 400);
};

window.openPortfolioModal = function(title) { const item = masterCatalog.find(m => m.title === title); if (item) { document.getElementById('port-modal-title').innerText = item.title; document.getElementById('port-modal-synopsis').innerText = item.synopsis; document.getElementById('port-modal-plat').innerText = item.platform; document.getElementById('port-modal-bg').style.backgroundImage = `url('${item.poster}')`; document.getElementById('port-modal-link').onclick = function() { window.open(item.url, '_blank'); }; document.getElementById('portfolio-modal').style.display = 'flex'; } };
async function syncListsToDatabase() { localStorage.setItem('match_seenList', JSON.stringify(seenList)); localStorage.setItem('match_savedList', JSON.stringify(savedList)); localStorage.setItem('match_dislikedList', JSON.stringify(dislikedList)); localStorage.setItem('match_userRatings', JSON.stringify(userRatings)); if (isUserLoggedIn && supabaseClient) { await supabaseClient.auth.updateUser({ data: { seen_list: seenList, saved_list: savedList, disliked_list: dislikedList, user_ratings: userRatings } }); } }
window.doLogout = async function() { if (supabaseClient) { await supabaseClient.auth.signOut(); localStorage.clear(); window.location.href = '/index.html'; } };

window.addEventListener('DOMContentLoaded', async () => { renderProfileGrids(); /* Existing Supabase init logic stays identical here... */ });
