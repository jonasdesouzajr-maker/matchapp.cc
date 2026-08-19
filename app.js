console.log("Mastercode 13.1: Advanced Algorithmic Engine Initialized");

let globalMatchTitle = "Match App";
let globalSearchQuery = "";
let supabaseClient = null;
let isUserLoggedIn = false;

try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU');
    }
} catch (e) { console.warn("Supabase init warning."); }

// SESSION CHECK & UI TOGGLE
window.addEventListener('DOMContentLoaded', async () => {
    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            isUserLoggedIn = true;
            
            // Hide Register/Login & Freemium Banner
            document.getElementById('nav-reg-btn').style.display = 'none';
            if(document.getElementById('freemium-banner')) document.getElementById('freemium-banner').style.display = 'none';
            
            // Show VIP Greeting & Logout Button
            const greeting = document.getElementById('user-greeting');
            if (greeting) {
                greeting.innerText = `⭐ VIP: ${session.user.user_metadata?.first_name || 'Member'}`;
                greeting.style.display = 'block';
            }
            const logoutBtn = document.getElementById('nav-logout-btn');
            if (logoutBtn) logoutBtn.style.display = 'block';
        }
    }
});

// LOGOUT FUNCTION
window.doLogout = async function() {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
        window.location.reload(); // Refresh the page to reset the state
    }
};

// MASSIVE EXPANDED CATALOG WITH METRICS FOR SCORING
const masterCatalog = [
    { title: "Parasite", category: "movie", mood: "intense", era: "modern", tone: "dark", pacing: "standard", idealCompany: ["solo", "partner", "friends"], streaming: "Max", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80", desc: "A masterpiece exploring class discrimination with dark humor." },
    { title: "The Matrix", category: "movie", mood: "mindbending", era: "classic", tone: "dark", pacing: "standard", idealCompany: ["solo", "partner", "friends"], streaming: "Max / Prime Video", poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80", desc: "A hacker discovers the shocking truth about his reality." },
    { title: "Superbad", category: "movie", mood: "laugh", era: "classic", tone: "light", pacing: "standard", idealCompany: ["friends", "partner"], streaming: "Netflix", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80", desc: "Two co-dependent high school seniors deal with separation anxiety." },
    { title: "Breaking Bad", category: "series", mood: "intense", era: "classic", tone: "dark", pacing: "epic", idealCompany: ["solo", "partner"], streaming: "Netflix", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80", desc: "A chemistry teacher turns to manufacturing methamphetamine." },
    { title: "The Office (US)", category: "series", mood: "laugh", era: "modern", tone: "light", pacing: "fast", idealCompany: ["solo", "partner", "family", "friends"], streaming: "Peacock / Netflix", poster: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80", desc: "A mockumentary on a group of typical office workers." },
    { title: "Avenida Brasil", category: "telenovela", mood: "intense", era: "classic", tone: "dramatic", pacing: "epic", idealCompany: ["solo", "partner", "family"], streaming: "Globoplay", poster: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80", desc: "A gripping story of revenge and intense drama set in Rio de Janeiro." },
    
    // YOUTUBE MEDIA
    { title: "Kurzgesagt: Optimistic Nihilism", category: "youtube", mood: "mindbending", era: "modern", tone: "surreal", pacing: "fast", idealCompany: ["solo", "friends"], streaming: "YouTube", poster: "", desc: "A beautiful, animated exploration of existence and finding meaning.", embed: "https://www.youtube.com/embed/MBRqu0YOH14" },
    { title: "Hot Ones", category: "youtube", mood: "laugh", era: "modern", tone: "light", pacing: "fast", idealCompany: ["solo", "friends", "partner"], streaming: "YouTube", poster: "", desc: "Celebrities answering hot questions while eating even hotter wings.", embed: "https://www.youtube.com/embed/nJS04R80oWE" },
    { title: "Lofi Girl Radio", category: "youtube", mood: "relax", era: "any", tone: "light", pacing: "epic", idealCompany: ["solo", "partner"], streaming: "YouTube Live", poster: "", desc: "Endless beats to relax, study, or chill to.", embed: "https://www.youtube.com/embed/jfKfPfyJRdk" },

    // SPOTIFY MEDIA
    { title: "Late Night Cinematic", category: "spotify", mood: "relax", era: "modern", tone: "surreal", pacing: "epic", idealCompany: ["solo", "partner"], streaming: "Spotify", poster: "", desc: "Ambient soundscapes to wind down your evening.", embed: "https://open.spotify.com/embed/playlist/37i9dQZF1DX3Ogo9pFvBkY" },
    { title: "Epic Movie Soundtracks", category: "spotify", mood: "mindbending", era: "any", tone: "dramatic", pacing: "epic", idealCompany: ["solo", "friends", "partner"], streaming: "Spotify", poster: "", desc: "The greatest orchestral scores from blockbuster films.", embed: "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM" }
];

window.triggerMatch = function() {
    const ageInput = document.getElementById('q-age').value;
    if (!ageInput || parseInt(ageInput) < 16) return alert("⚠️ You must be at least 16 years old.");

    if (!isUserLoggedIn && localStorage.getItem('hasUsedFreeMatch') === 'true') {
        document.getElementById('questionnaire-box').style.display = 'none';
        if(document.getElementById('freemium-banner')) document.getElementById('freemium-banner').style.display = 'none';
        document.getElementById('blocked-box').style.display = 'block';
        return;
    }

    const category = document.getElementById('q-category').value;
    const mood = document.getElementById('q-mood').value;
    const era = document.getElementById('q-era').value;
    const tone = document.getElementById('q-tone').value;
    const pacing = document.getElementById('q-pacing').value;
    const company = document.getElementById('q-company').value;

    // SCORING ALGORITHM
    let pool = category !== 'any' ? masterCatalog.filter(i => i.category === category) : masterCatalog;
    
    let scoredMatches = pool.map(item => {
        let score = 0;
        if (item.mood === mood) score += 5;
        if (era === 'any' || item.era === era) score += 3;
        if (item.tone === tone) score += 3;
        if (item.pacing === pacing) score += 2;
        if (item.idealCompany && item.idealCompany.includes(company)) score += 2;
        return { item, score };
    });

    scoredMatches.sort((a, b) => b.score - a.score);
    let topScore = scoredMatches[0]?.score || 0;
    let matches = scoredMatches.filter(m => m.score === topScore).map(m => m.item);

    if (matches.length === 0) matches = pool;

    const selected = matches[Math.floor(Math.random() * matches.length)];
    globalMatchTitle = selected.title; 
    
    // Create the live search query string
    globalSearchQuery = `Where to watch ${selected.title} ${selected.category} online stream`;

    // DRAMATIC LOADING SEQUENCE
    document.getElementById('questionnaire-box').style.display = 'none';
    if(document.getElementById('freemium-banner')) document.getElementById('freemium-banner').style.display = 'none';
    document.getElementById('loading-box').style.display = 'block';

    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('loading-text');
    const subtext = document.getElementById('loading-subtext');
    let width = 0;

    setTimeout(() => { text.innerText = "Querying Google Search Indices..."; subtext.innerText = "Scraping global streaming availability..."; }, 1000);
    setTimeout(() => { text.innerText = "Cross-referencing databases..."; subtext.innerText = "Matching mood, tone, and pacing metrics..."; }, 2500);
    setTimeout(() => { text.innerText = "Extracting perfect match..."; subtext.innerText = "Finalizing results..."; }, 4000);

    let interval = setInterval(() => {
        width += 2; 
        if (bar) bar.style.width = width + '%';
        
        if (width >= 100) {
            clearInterval(interval);
            
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

            if (!isUserLoggedIn) localStorage.setItem('hasUsedFreeMatch', 'true');
        }
    }, 100);
};

window.openLiveGoogleSearch = function() {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(globalSearchQuery)}`, '_blank');
};

window.shareWA = () => window.open(`https://api.whatsapp.com/send?text=I got matched with ${encodeURIComponent(globalMatchTitle)} on Match App! Curate your own night at https://matchapp.cc`, '_blank');
window.shareX = () => window.open(`https://twitter.com/intent/tweet?text=I got matched with ${encodeURIComponent(globalMatchTitle)} on Match App! Curate your own night at https://matchapp.cc`, '_blank');
window.shareFB = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=https://matchapp.cc`, '_blank');
window.shareMore = async () => {
    if (navigator.share) { await navigator.share({ title: 'Match App', text: `My tailored match is: ${globalMatchTitle}`, url: 'https://matchapp.cc' }); }
    else { navigator.clipboard.writeText('https://matchapp.cc'); alert("Link Copied to clipboard!"); }
};
