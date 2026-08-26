console.log("Mastercode 54.0: Perfected Auto-Slash, Dynamic Age Calculator & Profile Lock Active");

let globalMatchTitle = "Match App";
let supabaseClient = null;
let isUserLoggedIn = false;
let userProfileData = {};

let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let dislikedList = JSON.parse(localStorage.getItem('match_dislikedList') || '[]');

let isAdFree = localStorage.getItem('match_adFree') === 'true'; 
let isVIP = localStorage.getItem('match_isVIP') === 'true';
let adblockEnabled = false;

const STRIPE_LINKS = {
    'ad_free': 'https://buy.stripe.com/fZu4gz6nEaDHbpY7k0gEg01',
    'vip_monthly': 'https://buy.stripe.com/fZu3cvbHY13779I47OgEg03',
    'vip_annual': 'https://buy.stripe.com/7sY28reUa137dy65bSgEg02'
};

try { if (window.supabase) supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'); } catch(e) {}

function updateClock() {
    const clock = document.getElementById('real-time-clock');
    if (clock) {
        const now = new Date();
        const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        clock.innerHTML = `${dateStr} | ${timeStr}`;
    }
}
setInterval(updateClock, 1000);

/* 👤 PERFECTED PROFILE ENGINE (Auto-Slash & Dynamic Age) */
window.calculateAge = function(dobStr) {
    if (!dobStr || !dobStr.includes('/')) return 0;
    const parts = dobStr.split('/');
    if (parts.length !== 3) return 0;
    const day = parseInt(parts[0], 10), month = parseInt(parts[1], 10) - 1, year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1920 || year > new Date().getFullYear()) return 0;
    
    // Dynamically calculate age based on TODAY'S Date
    const dob = new Date(year, month, day), today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age < 0 ? 0 : age;
};

window.saveProfileData = async function() {
    const dobInput = document.getElementById('profile-dob').value.trim();
    const starSignSelect = document.getElementById('profile-starsign').value;
    const orientationSelect = document.getElementById('profile-orientation').value;
    const nameInput = document.getElementById('profile-name').value.trim();

    if (!dobInput || dobInput.length < 10 || !starSignSelect || !orientationSelect) {
        alert("Please complete all required fields (Birthdate, Star Sign, Sexual Orientation) to calibrate your AI matrix."); return;
    }

    if (window.calculateAge(dobInput) === 0) { alert("Invalid birthdate entered. Please check the day, month, and year."); return; }

    const confirmLock = confirm("⚠️ PERMANENT SECURITY LOCK:\n\nOnce confirmed, your Birthdate, Star Sign, and Orientation CANNOT be changed. This ensures the integrity of your AI recommendations.\n\nProceed?");
    if (!confirmLock) return;

    const newMetadata = { 
        ...userProfileData, full_name: nameInput, birthdate: dobInput, 
        starsign: starSignSelect, sexual_orientation: orientationSelect, profile_locked: true 
    };
    
    if (supabaseClient && isUserLoggedIn) await supabaseClient.auth.updateUser({ data: newMetadata });
    localStorage.setItem('match_userProfile', JSON.stringify(newMetadata));
    alert("✨ Profile locked and permanently saved! Your personalized AI matrix is ready."); 
    window.location.reload();
};

window.handleProfilePic = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (document.getElementById('profile-pic-preview')) document.getElementById('profile-pic-preview').src = e.target.result;
            localStorage.setItem('match_userAvatar', e.target.result);
        };
        reader.readAsDataURL(file);
    }
};

window.addEventListener('DOMContentLoaded', async () => {
    updateClock();
    
    // 🔧 FLAWLESS AUTO-SLASH EVENT LISTENER
    const dobInput = document.getElementById('profile-dob');
    const ageDisp = document.getElementById('profile-age-display');
    
    if (dobInput) {
        dobInput.addEventListener('input', function(e) {
            if (userProfileData && userProfileData.profile_locked) return;
            
            // Allow backspace without re-formatting interference
            if (e.inputType === 'deleteContentBackward') {
                if (this.value.length < 10 && ageDisp) ageDisp.value = "";
                return;
            }
            
            let v = this.value.replace(/\D/g, ''); // Strip all non-numbers
            if (v.length > 8) v = v.substring(0, 8);
            
            // Auto-insert slashes
            if (v.length >= 5) {
                this.value = `${v.substring(0,2)}/${v.substring(2,4)}/${v.substring(4)}`;
            } else if (v.length >= 3) {
                this.value = `${v.substring(0,2)}/${v.substring(2)}`;
            } else {
                this.value = v;
            }

            // Auto-calculate age ONLY when exactly 10 chars (DD/MM/YYYY)
            if (this.value.length === 10) {
                const age = window.calculateAge(this.value);
                if (ageDisp) ageDisp.value = age > 0 ? `${age} years old` : "Invalid Date";
            } else {
                if (ageDisp) ageDisp.value = "";
            }
        });
    }

    const savedAvatar = localStorage.getItem('match_userAvatar');
    if (savedAvatar && document.getElementById('profile-pic-preview')) document.getElementById('profile-pic-preview').src = savedAvatar;

    if (isAdFree || isVIP) document.body.classList.add('ad-free-mode');

    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            isUserLoggedIn = true; userProfileData = session.user.user_metadata || {};
            
            if (session.user.user_metadata?.avatar_url && !localStorage.getItem('match_userAvatar')) {
                localStorage.setItem('match_userAvatar', session.user.user_metadata.avatar_url);
                if (document.getElementById('profile-pic-preview')) document.getElementById('profile-pic-preview').src = session.user.user_metadata.avatar_url;
            }

            if (userProfileData.ad_free || userProfileData.vip_tier) { isAdFree = true; document.body.classList.add('ad-free-mode'); }
            if (userProfileData.vip_tier) isVIP = true;
            if (userProfileData.seen_list) seenList = userProfileData.seen_list;
            if (userProfileData.saved_list) savedList = userProfileData.saved_list;
            if (userProfileData.disliked_list) dislikedList = userProfileData.disliked_list;

            if(document.getElementById('nav-reg-btn')) document.getElementById('nav-reg-btn').style.display = 'none';
            if(document.getElementById('profile-link-tab')) document.getElementById('profile-link-tab').style.display = 'inline-block';
            if(document.getElementById('profile-pic-container')) document.getElementById('profile-pic-container').style.display = 'block';
            
            if (isVIP && document.getElementById('nav-upgrade-btn')) document.getElementById('nav-upgrade-btn').style.display = 'none';
            else if (!isAdFree && document.getElementById('nav-upgrade-btn')) document.getElementById('nav-upgrade-btn').style.display = 'block';
            if(document.getElementById('nav-logout-btn')) document.getElementById('nav-logout-btn').style.display = 'block';
        }
    }
});

window.doLogout = async function() { if (supabaseClient) { await supabaseClient.auth.signOut(); localStorage.clear(); window.location.reload(); } };

async function syncListsToDatabase() {
    localStorage.setItem('match_seenList', JSON.stringify(seenList)); 
    localStorage.setItem('match_savedList', JSON.stringify(savedList));
    localStorage.setItem('match_dislikedList', JSON.stringify(dislikedList));
    if (isUserLoggedIn && supabaseClient) { await supabaseClient.auth.updateUser({ data: { seen_list: seenList, saved_list: savedList, disliked_list: dislikedList } }); }
}

/* 🎬 EXPANDED MULTI-FORMAT MASTER CATALOG */
const masterCatalog = [
    { title: "Superbad", category: "movie", platform: "Netflix", mood: "laugh", aesthetic: "colorful", trailerId: "MNpoTxeydiI", url: "https://www.netflix.com/title/70075482", synopsis: "High school seniors Seth and Evan attempt to buy booze for a wild house party, spiraling into an unforgettable night of hilarious chaos.", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1000&q=80" },
    { title: "Crash Landing on You", category: "vertical_drama", platform: "Netflix", mood: "romantic", aesthetic: "bright", trailerId: "eXMjTXL221g", url: "https://www.netflix.com/title/81159258", synopsis: "A South Korean heiress accidentally paraglides into North Korea and into the life of an army officer.", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80" },
    { title: "Todas as Flores", category: "vertical_drama", platform: "Globoplay", mood: "intense", aesthetic: "dramatic", trailerId: "y10p-M08A_A", url: "https://globoplay.globo.com", synopsis: "A thrilling Brazilian novela about passion, vengeance, and family secrets in the fashion universe.", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1000&q=80" },
    { title: "Cinematic Chillout", category: "spotify_playlist", platform: "Spotify", mood: "chill", aesthetic: "atmospheric", spotifyId: "37i9dQZF1DX4sWSpwq3LiO", spotifyType: "playlist", url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO", synopsis: "Curated ambient soundscapes and iconic acoustic film themes for relaxation.", poster: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80" }
];

/* 🚀 MATCH ENGINE (BROADENING & NON-EMPTY GUARANTEE) */
window.triggerMatch = async function() {
    if (adblockEnabled) { document.getElementById('adblock-modal').style.display = 'flex'; return; }
    
    const selCategory = document.getElementById('q-category')?.value || 'any';
    const selPlatform = document.getElementById('q-platform')?.value || 'any';
    const selMood = document.getElementById('q-mood')?.value || 'any';

    let pool = masterCatalog.filter(item => !seenList.includes(item.title) && !savedList.includes(item.title) && !dislikedList.includes(item.title));
    let targetedPool = pool;
    if (selCategory !== 'any') targetedPool = targetedPool.filter(i => i.category === selCategory);
    if (selPlatform !== 'any') targetedPool = targetedPool.filter(i => i.platform === selPlatform);
    if (selMood !== 'any') targetedPool = targetedPool.filter(i => i.mood === selMood);

    // Broaden fallback if pool is empty
    if (targetedPool.length === 0) {
        if (selCategory !== 'any') targetedPool = pool.filter(i => i.category === selCategory);
        else targetedPool = pool;
    }

    if (targetedPool.length === 0) {
        alert("✨ You have reviewed every title in our database! Clearing temporary view cache so you can rediscover matches...");
        seenList = []; syncListsToDatabase(); targetedPool = masterCatalog;
    }

    const selected = targetedPool[Math.floor(Math.random() * targetedPool.length)];
    globalMatchTitle = selected.title; 

    if (document.getElementById('questionnaire-box')) document.getElementById('questionnaire-box').style.display = 'none';
    if (document.getElementById('result-box')) document.getElementById('result-box').style.display = 'none';
    document.getElementById('loading-box').style.display = 'block';

    setTimeout(() => {
        document.getElementById('loading-box').style.display = 'none';
        const resultBox = document.getElementById('result-box');
        resultBox.style.display = 'block';

        const posterImg = document.getElementById('res-poster-img');
        if (posterImg && selected.poster) { posterImg.src = selected.poster; posterImg.alt = selected.title; }

        document.getElementById('res-title').innerText = selected.title;
        document.getElementById('res-synopsis').innerText = selected.synopsis;

        const badge = document.getElementById('res-platform-badge');
        badge.innerText = selected.platform;
        if (selected.platform === 'Netflix') badge.style.background = 'var(--netflix-red)';
        else if (selected.platform === 'Max') badge.style.background = 'var(--max-purple)';
        else if (selected.platform === 'Prime') badge.style.background = 'var(--prime-blue)';
        else if (selected.platform === 'Spotify') badge.style.background = 'var(--spotify-green)';
        else if (selected.platform === 'Globoplay') badge.style.background = 'var(--globoplay-orange)';
        else badge.style.background = 'var(--gold)';
        badge.style.color = '#fff';

        const directBtn = document.getElementById('res-direct-link');
        directBtn.href = selected.url;
        directBtn.innerText = selected.category.includes('spotify') ? `▶ Listen on ${selected.platform}` : `▶ Stream on ${selected.platform}`;

        const trailerBox = document.getElementById('res-trailer-container');
        const spotifyBox = document.getElementById('res-spotify-container');

        if (selected.category.includes('spotify') && selected.spotifyId) {
            if (trailerBox) trailerBox.style.display = 'none';
            if (spotifyBox) {
                spotifyBox.style.display = 'block';
                const type = selected.spotifyType || 'track';
                spotifyBox.innerHTML = `<iframe src="https://open.spotify.com/embed/${type}/${selected.spotifyId}?utm_source=generator&theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
            }
        } else {
            if (spotifyBox) spotifyBox.style.display = 'none';
            if (trailerBox) {
                trailerBox.style.display = 'block';
                const iframe = document.getElementById('res-trailer');
                if (iframe) iframe.src = `https://www.youtube-nocookie.com/embed/${selected.trailerId}?autoplay=0&rel=0`;
            }
        }

        resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 1200);
};

window.openPortfolioModal = function(title) {
    const item = masterCatalog.find(m => m.title === title);
    if (item) {
        document.getElementById('port-modal-title').innerText = item.title;
        document.getElementById('port-modal-synopsis').innerText = item.synopsis;
        document.getElementById('port-modal-plat').innerText = item.platform;
        document.getElementById('port-modal-bg').style.backgroundImage = `url('${item.poster}')`;
        document.getElementById('port-modal-link').onclick = function() { window.open(item.url, '_blank'); };
        document.getElementById('portfolio-modal').style.display = 'flex';
    }
};
