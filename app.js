console.log("Mastercode 16.0: Monetized Engine Initialized");

let globalMatchTitle = "Match App";
let globalSearchQuery = "";
let supabaseClient = null;
let isUserLoggedIn = false;
let userProfileData = {};

try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU');
    }
} catch (e) { console.warn("Supabase init warning."); }

// 💰 ADSTERRA SMARTLINK 2 (POPUNDER MONETIZATION)
// Triggers a hidden background tab on the first click on the document to maximize ad revenue
let hasTriggeredPopunder = false;
document.addEventListener('click', () => {
    if (!hasTriggeredPopunder) {
        hasTriggeredPopunder = true;
        // Opens the Adsterra Smartlink without stealing focus from the app
        window.open('https://brunettesir.com/aujea2k10v?key=6d6ff5d71aa0f25eaecd2160f24301a2', '_blank', 'noopener,noreferrer');
    }
});

window.addEventListener('DOMContentLoaded', async () => {
    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            isUserLoggedIn = true;
            userProfileData = session.user.user_metadata || {};
            
            if (userProfileData.matches_left === undefined && !userProfileData.is_vip) {
                userProfileData.matches_left = 1;
            }

            document.getElementById('nav-reg-btn').style.display = 'none';
            document.getElementById('nav-profile-btn').style.display = 'block';
            
            const upgBtn = document.getElementById('nav-upgrade-btn');
            if (upgBtn) upgBtn.style.display = 'block';

            if(document.getElementById('freemium-banner')) document.getElementById('freemium-banner').style.display = 'none';
        }
    }
});

const masterCatalog = [
    { title: "Parasite", category: "movie", mood: "intense", era: "modern", tone: "dark", pacing: "standard", idealCompany: ["solo", "partner", "friends"], zodiacAffinity: ["water", "earth"], streaming: "Max", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80", desc: "A masterpiece exploring class discrimination with dark humor." },
    { title: "The Matrix", category: "movie", mood: "mindbending", era: "classic", tone: "dark", pacing: "standard", idealCompany: ["solo", "partner", "friends"], zodiacAffinity: ["air", "fire"], streaming: "Max / Prime Video", poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80", desc: "A hacker discovers the shocking truth about his reality." },
    { title: "Superbad", category: "movie", mood: "laugh", era: "classic", tone: "light", pacing: "standard", idealCompany: ["friends", "partner"], zodiacAffinity: ["fire", "air"], streaming: "Netflix", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80", desc: "Two co-dependent high school seniors deal with separation anxiety." },
    { title: "Breaking Bad", category: "series", mood: "intense", era: "classic", tone: "dark", pacing: "epic", idealCompany: ["solo", "partner"], zodiacAffinity: ["earth", "fire"], streaming: "Netflix", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80", desc: "A chemistry teacher turns to manufacturing methamphetamine." },
    { title: "The Office (US)", category: "series", mood: "laugh", era: "modern", tone: "light", pacing: "fast", idealCompany: ["solo", "partner", "family", "friends"], zodiacAffinity: ["earth", "water"], streaming: "Peacock / Netflix", poster: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80", desc: "A mockumentary on a group of typical office workers." },
    { title: "Avenida Brasil", category: "telenovela", mood: "intense", era: "classic", tone: "dramatic", pacing: "epic", idealCompany: ["solo", "partner", "family"], zodiacAffinity: ["water", "fire"], streaming: "Globoplay", poster: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80", desc: "A gripping story of revenge and intense drama set in Rio de Janeiro." },
    { title: "Kurzgesagt: Optimistic Nihilism", category: "youtube", mood: "mindbending", era: "modern", tone: "surreal", pacing: "fast", idealCompany: ["solo", "friends"], zodiacAffinity: ["air", "earth"], streaming: "YouTube", poster: "", desc: "A beautiful, animated exploration of existence and finding meaning.", embed: "https://www.youtube.com/embed/MBRqu0YOH14" },
    { title: "Hot Ones", category: "youtube", mood: "laugh", era: "modern", tone: "light", pacing: "fast", idealCompany: ["solo", "friends", "partner"], zodiacAffinity: ["fire", "air"], streaming: "YouTube", poster: "", desc: "Celebrities answering hot questions while eating even hotter wings.", embed: "https://www.youtube.com/embed/nJS04R80oWE" },
    { title: "Lofi Girl Radio", category: "youtube", mood: "relax", era: "any", tone: "light", pacing: "epic", idealCompany: ["solo", "partner"], zodiacAffinity: ["earth", "water"], streaming: "YouTube Live", poster: "", desc: "Endless beats to relax, study, or chill to.", embed: "https://www.youtube.com/embed/jfKfPfyJRdk" },
    { title: "Late Night Cinematic", category: "spotify", mood: "relax", era: "modern", tone: "surreal", pacing: "epic", idealCompany: ["solo", "partner"], zodiacAffinity: ["water", "air"], streaming: "Spotify", poster: "", desc: "Ambient soundscapes to wind down your evening.", embed: "https://open.spotify.com/embed/playlist/37i9dQZF1DX3Ogo9pFvBkY" },
    { title: "Epic Movie Soundtracks", category: "spotify", mood: "mindbending", era: "any", tone: "dramatic", pacing: "epic", idealCompany: ["solo", "friends", "partner"], zodiacAffinity: ["fire", "water"], streaming: "Spotify", poster: "", desc: "The greatest orchestral scores from blockbuster films.", embed: "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM" }
];

window.triggerMatch = async function() {
    
    // VERIFY SUBSCRIPTION LIMITS
    if (!isUserLoggedIn) {
        if (localStorage.getItem('hasUsedFreeMatch') === 'true') {
            document.getElementById('questionnaire-box').style.display = 'none';
            document.getElementById('native-ad-container').style.display = 'none';
            document.getElementById('blocked-box').style.display = 'block';
            return;
        }
    } else {
        const matchesLeft = userProfileData.matches_left || 0;
        const isVip = userProfileData.is_vip === true;
        if (!isVip && matchesLeft <= 0) {
            document.getElementById('questionnaire-box').style.display = 'none';
            document.getElementById('native-ad-container').style.display = 'none';
            document.getElementById('blocked-box').style.display = 'block';
            document.getElementById('blocked-msg').innerText = "You have run out of matches! Top up or upgrade to VIP to continue.";
            return;
        }
    }

    const category = document.getElementById('q-category').value;
    const mood = document.getElementById('q-mood').value;
    const era = document.getElementById('q-era').value;
    const tone = document.getElementById('q-tone').value;
    const pacing = document.getElementById('q-pacing').value;
    const company = document.getElementById('q-company').value;

    let userElement = null;
    if (userProfileData.star_sign) {
        const sign = userProfileData.star_sign.toLowerCase();
        if (["aries", "leo", "sagittarius"].includes(sign)) userElement = "fire";
        if (["cancer", "scorpio", "pisces"].includes(sign)) userElement = "water";
        if (["gemini", "libra", "aquarius"].includes(sign)) userElement = "air";
        if (["taurus", "virgo", "capricorn"].includes(sign)) userElement = "earth";
    }

    let pool = category !== 'any' ? masterCatalog.filter(i => i.category === category) : masterCatalog;
    let scoredMatches = pool.map(item => {
        let score = 0;
        if (item.mood === mood) score += 5;
        if (era === 'any' || item.era === era) score += 3;
        if (item.tone === tone) score += 3;
        if (item.pacing === pacing) score += 2;
        if (item.idealCompany && item.idealCompany.includes(company)) score += 3;
        if (userElement && item.zodiacAffinity && item.zodiacAffinity.includes(userElement)) score += 4;
        return { item, score };
    });

    scoredMatches.sort((a, b) => b.score - a.score);
    let topScore = scoredMatches[0]?.score || 0;
    let matches = scoredMatches.filter(m => m.score === topScore).map(m => m.item);
    if (matches.length === 0) matches = pool;

    const selected = matches[Math.floor(Math.random() * matches.length)];
    globalMatchTitle = selected.title; 
    globalSearchQuery = `Where to watch ${selected.title} ${selected.category} online stream`;

    document.getElementById('questionnaire-box').style.display = 'none';
    document.getElementById('native-ad-container').style.display = 'none';
    if(document.getElementById('freemium-banner')) document.getElementById('freemium-banner').style.display = 'none';
    document.getElementById('loading-box').style.display = 'block';

    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('loading-text');
    const subtext = document.getElementById('loading-subtext');
    let width = 0;

    setTimeout(() => { text.innerText = "Querying Google Search Indices..."; subtext.innerText = "Scraping global streaming availability..."; }, 1000);
    if (isUserLoggedIn && userElement) { setTimeout(() => { text.innerText = "Applying Zodiac Profile Data..."; subtext.innerText = `Enhancing matrix for ${userProfileData.star_sign} affinities...`; }, 2500); } 
    else { setTimeout(() => { text.innerText = "Cross-referencing databases..."; subtext.innerText = "Matching mood, tone, and pacing metrics..."; }, 2500); }
    setTimeout(() => { text.innerText = "Extracting perfect match..."; subtext.innerText = "Finalizing results..."; }, 4000);

    let interval = setInterval(async () => {
        width += 2; 
        if (bar) bar.style.width = width + '%';
        
        if (width >= 100) {
            clearInterval(interval);
            
            if (isUserLoggedIn && userProfileData.is_vip !== true) {
                userProfileData.matches_left -= 1;
                await supabaseClient.auth.updateUser({ data: { matches_left: userProfileData.matches_left } });
            } else if (!isUserLoggedIn) {
                localStorage.setItem('hasUsedFreeMatch', 'true');
            }

            document.getElementById('loading-box').style.display = 'none';
            document.getElementById('result-box').style.display = 'block';

            document.getElementById('res-title').innerText = selected.title;
            document.getElementById('res-desc').innerText = selected.desc;
            document.getElementById('res-platform').innerText = selected.streaming;

            if ((selected.category === 'youtube' || selected.category === 'spotify') && selected.embed) {
                document.getElementById('poster-container').style.display = 'none';
                document.getElementById('media-container').style.display = 'block';
                document.getElementById('media-iframe').src = selected.embed;
            } else {
                document.getElementById('media-container').style.display = 'none';
                document.getElementById('poster-container').style.display = 'block';
                document.getElementById('res-poster').src = selected.poster;
            }
        }
    }, 100);
};

window.openLiveGoogleSearch = function() { window.open(`https://www.google.com/search?q=${encodeURIComponent(globalSearchQuery)}`, '_blank'); };
window.shareWA = () => window.open(`https://api.whatsapp.com/send?text=I got matched with ${encodeURIComponent(globalMatchTitle)} on Match App! Curate your own night at https://matchapp.cc`, '_blank');
window.shareX = () => window.open(`https://twitter.com/intent/tweet?text=I got matched with ${encodeURIComponent(globalMatchTitle)} on Match App! Curate your own night at https://matchapp.cc`, '_blank');
window.shareFB = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=https://matchapp.cc`, '_blank');
window.shareMore = async () => { if (navigator.share) { await navigator.share({ title: 'Match App', text: `My tailored match is: ${globalMatchTitle}`, url: 'https://matchapp.cc' }); } else { navigator.clipboard.writeText('https://matchapp.cc'); alert("Link Copied to clipboard!"); } };
