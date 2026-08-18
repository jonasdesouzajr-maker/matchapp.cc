console.log("Mastercode: App Engine Initialized");

let globalMatchTitle = "Match App";
let supabaseClient = null;
let isUserLoggedIn = false;

// 1. SUPABASE INIT & SESSION CHECK
try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU');
    }
} catch (e) { console.warn("Supabase init warning."); }

window.addEventListener('DOMContentLoaded', async () => {
    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            isUserLoggedIn = true;
            const profile = session.user.user_metadata || {};
            const name = profile.first_name || session.user.email.split('@')[0];
            
            document.getElementById('nav-reg-btn').style.display = 'none';
            document.getElementById('freemium-banner').style.display = 'none';
            
            const authArea = document.getElementById('header-auth-area');
            const welcomeTag = document.createElement('div');
            welcomeTag.style.color = '#D4AF37';
            welcomeTag.style.fontSize = '12px';
            welcomeTag.style.fontWeight = 'bold';
            welcomeTag.innerText = `⭐ VIP: ${name}`;
            authArea.appendChild(welcomeTag);
        }
    }
});

// 2. THE EXPANDED CATALOG
const masterCatalog = [
    { title: "Parasite", category: "movie", mood: "intense", era: "modern", tone: "dark", streaming: "Max", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80", desc: "A masterpiece exploring class discrimination with dark humor." },
    { title: "The Matrix", category: "movie", mood: "mindbending", era: "classic", tone: "dark", streaming: "Max / Prime Video", poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80", desc: "A hacker discovers the shocking truth about his reality." },
    { title: "Interstellar", category: "movie", mood: "mindbending", era: "modern", tone: "surreal", streaming: "Max / Prime Video", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80", desc: "Explorers travel through a wormhole to save humanity." },
    { title: "Superbad", category: "movie", mood: "laugh", era: "classic", tone: "light", streaming: "Netflix", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80", desc: "Two co-dependent high school seniors deal with separation anxiety." },
    { title: "Breaking Bad", category: "series", mood: "intense", era: "classic", tone: "dark", streaming: "Netflix", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80", desc: "A chemistry teacher turns to manufacturing methamphetamine." },
    { title: "The Office (US)", category: "series", mood: "laugh", era: "modern", tone: "light", streaming: "Peacock / Netflix", poster: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80", desc: "A mockumentary on a group of typical office workers." },
    { title: "Stranger Things", category: "series", mood: "mindbending", era: "modern", tone: "dark", streaming: "Netflix", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80", desc: "A small town uncovers supernatural forces and secret experiments." },
    { title: "Avenida Brasil", category: "telenovela", mood: "intense", era: "classic", tone: "dramatic", streaming: "Globoplay", poster: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80", desc: "A gripping story of revenge and intense drama set in Rio de Janeiro." },
    { title: "O Clone", category: "telenovela", mood: "romantic", era: "retro", tone: "dramatic", streaming: "Globoplay", poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80", desc: "A classic tale of forbidden love, cloning, and cultural clashes." },
    { title: "Late Night Cinematic", category: "spotify", mood: "relax", era: "modern", tone: "surreal", streaming: "Spotify Playlist", poster: "", desc: "Ambient soundscapes to wind down your evening.", spotifyEmbed: "https://open.spotify.com/embed/playlist/37i9dQZF1DX3Ogo9pFvBkY" },
    { title: "Epic Movie Soundtracks", category: "spotify", mood: "mindbending", era: "any", tone: "dramatic", streaming: "Spotify Playlist", poster: "", desc: "The greatest orchestral scores from blockbuster films.", spotifyEmbed: "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM" }
];

// 3. MATCH EXECUTION WITH LOADING ANIMATION
window.triggerMatch = function() {
    const ageInput = document.getElementById('q-age').value;
    if (!ageInput || parseInt(ageInput) < 16) {
        alert("⚠️ You must be at least 16 years old.");
        return;
    }

    if (!isUserLoggedIn && localStorage.getItem('hasUsedFreeMatch') === 'true') {
        document.getElementById('questionnaire-box').style.display = 'none';
        document.getElementById('freemium-banner').style.display = 'none';
        document.getElementById('blocked-box').style.display = 'block';
        return;
    }

    const category = document.getElementById('q-category').value;
    const mood = document.getElementById('q-mood').value;

    let pool = category !== 'any' ? masterCatalog.filter(i => i.category === category) : masterCatalog;
    let matches = pool.filter(i => i.mood === mood);
    if (matches.length === 0) matches = pool;
    if (matches.length === 0) matches = masterCatalog;

    const selected = matches[Math.floor(Math.random() * matches.length)];
    globalMatchTitle = selected.title; 

    // TRIGGER ANIMATION
    document.getElementById('questionnaire-box').style.display = 'none';
    if(document.getElementById('freemium-banner')) document.getElementById('freemium-banner').style.display = 'none';
    document.getElementById('loading-box').style.display = 'block';

    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('loading-text');
    let width = 0;

    setTimeout(() => { if (text) text.innerText = "Analyzing preferences..."; }, 800);
    setTimeout(() => { if (text) text.innerText = "Locating streaming rights..."; }, 1600);

    let interval = setInterval(() => {
        width += 4;
        if (bar) bar.style.width = width + '%';
        
        if (width >= 100) {
            clearInterval(interval);
            
            // SHOW RESULT
            document.getElementById('loading-box').style.display = 'none';
            document.getElementById('result-box').style.display = 'block';

            document.getElementById('res-title').innerText = selected.title;
            document.getElementById('res-desc').innerText = selected.desc;
            document.getElementById('res-platform').innerText = selected.streaming;

            if (selected.category === 'spotify' && selected.spotifyEmbed) {
                document.getElementById('poster-container').style.display = 'none';
                document.getElementById('spotify-container').style.display = 'block';
                document.getElementById('spotify-iframe').src = selected.spotifyEmbed;
            } else {
                document.getElementById('spotify-container').style.display = 'none';
                document.getElementById('poster-container').style.display = 'block';
                document.getElementById('res-poster').src = selected.poster;
            }

            if (!isUserLoggedIn) localStorage.setItem('hasUsedFreeMatch', 'true');
        }
    }, 40);
};

window.handleSearchAgain = function() {
    if (!isUserLoggedIn && localStorage.getItem('hasUsedFreeMatch') === 'true') {
        document.getElementById('result-box').style.display = 'none';
        document.getElementById('blocked-box').style.display = 'block';
    } else {
        location.reload();
    }
};

// 4. SOCIAL SHARE SUITE
window.shareWA = () => window.open(`https://api.whatsapp.com/send?text=I got matched with ${encodeURIComponent(globalMatchTitle)} on Match App! Curate your own night at https://matchapp.cc`, '_blank');
window.shareX = () => window.open(`https://twitter.com/intent/tweet?text=I got matched with ${encodeURIComponent(globalMatchTitle)} on Match App! Curate your own night at https://matchapp.cc`, '_blank');
window.shareFB = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=https://matchapp.cc`, '_blank');
window.shareMore = async () => {
    if (navigator.share) {
        await navigator.share({ title: 'Match App', text: `My tailored match is: ${globalMatchTitle}`, url: 'https://matchapp.cc' });
    } else {
        navigator.clipboard.writeText('https://matchapp.cc');
        alert("Link Copied to clipboard!");
    }
};
