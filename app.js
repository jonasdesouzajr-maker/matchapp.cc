console.log("app.js loaded successfully.");

// MASSIVE EXPANDED CATALOG (Movies, Series, Telenovelas, Spotify Playlists)
const masterCatalog = [
    // MOVIES
    { title: "Parasite", category: "movie", mood: "intense", era: "modern", pacing: "slow", tone: "dark", streaming: "Max", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80", desc: "A South Korean masterpiece exploring class discrimination with dark humor." },
    { title: "The Matrix", category: "movie", mood: "mindbending", era: "classic", pacing: "fast", tone: "dark", streaming: "Max / Prime Video", poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80", desc: "A computer hacker learns about the true nature of reality and his role in the war." },
    { title: "Interstellar", category: "movie", mood: "mindbending", era: "modern", pacing: "epic", tone: "surreal", streaming: "Max / Prime Video", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80", desc: "A team of explorers travel through a wormhole in space to ensure survival." },
    { title: "Superbad", category: "movie", mood: "laugh", era: "classic", pacing: "episodic", tone: "light", streaming: "Netflix", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80", desc: "Two co-dependent high school seniors deal with separation anxiety before a party." },
    { title: "Inception", category: "movie", mood: "mindbending", era: "modern", pacing: "fast", tone: "surreal", streaming: "Max", poster: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80", desc: "A thief who steals corporate secrets through the use of dream-sharing technology." },
    { title: "Pulp Fiction", category: "movie", mood: "intense", era: "retro", pacing: "fast", tone: "dark", streaming: "Paramount+", poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=800&q=80", desc: "The lives of two mob hitmen, a boxer, and a pair of diner bandits intertwine." },
    { title: "La La Land", category: "movie", mood: "romantic", era: "modern", pacing: "slow", tone: "dramatic", streaming: "Netflix / Prime Video", poster: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80", desc: "While navigating their careers in Los Angeles, a pianist and an actress fall in love." },

    // SERIES
    { title: "Breaking Bad", category: "series", mood: "intense", era: "classic", pacing: "slow", tone: "dark", streaming: "Netflix", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80", desc: "A chemistry teacher turns to manufacturing and selling methamphetamine." },
    { title: "The Office (US)", category: "series", mood: "laugh", era: "modern", pacing: "episodic", tone: "light", streaming: "Netflix / Peacock", poster: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80", desc: "A mockumentary on a group of typical office workers and their eccentric boss." },
    { title: "Stranger Things", category: "series", mood: "mindbending", era: "modern", pacing: "epic", tone: "dark", streaming: "Netflix", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80", desc: "A small town uncovers a mystery involving secret experiments and supernatural forces." },
    { title: "Succession", category: "series", mood: "intense", era: "modern", pacing: "slow", tone: "dramatic", streaming: "Max", poster: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80", desc: "The Roy family is known for controlling the biggest media and entertainment company in the world." },
    { title: "Ted Lasso", category: "series", mood: "laugh", era: "modern", pacing: "episodic", tone: "light", streaming: "Apple TV+", poster: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80", desc: "An American football coach is hired to manage a British soccer team." },

    // TELENOVELAS
    { title: "Avenida Brasil", category: "telenovela", mood: "intense", era: "classic", pacing: "fast", tone: "dramatic", streaming: "Globoplay", poster: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80", desc: "A gripping story of revenge, family secrets, and intense drama set in Rio de Janeiro." },
    { title: "O Clone", category: "telenovela", mood: "romantic", era: "retro", pacing: "epic", tone: "dramatic", streaming: "Globoplay", poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80", desc: "A classic tale of forbidden love, cloning, and cultural clashes between Brazil and Morocco." },
    { title: "Yo soy Betty, la fea", category: "telenovela", mood: "laugh", era: "classic", pacing: "episodic", tone: "light", streaming: "Prime Video", poster: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80", desc: "The iconic Colombian comedy about a brilliant but socially awkward secretary." },

    // SPOTIFY PLAYLISTS
    { title: "Late Night Cinematic Chill", category: "spotify", mood: "relax", era: "modern", pacing: "slow", tone: "surreal", streaming: "Spotify Playlist", poster: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80", desc: "Ambient soundscapes and cinematic scores to wind down your evening.", spotifyEmbed: "https://open.spotify.com/embed/playlist/37i9dQZF1DX3Ogo9pFvBkY" },
    { title: "Epic Movie Soundtracks", category: "spotify", mood: "mindbending", era: "modern", pacing: "epic", tone: "surreal", streaming: "Spotify Playlist", poster: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80", desc: "The greatest orchestral scores and epic themes from blockbuster films.", spotifyEmbed: "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM" },
    { title: "Feel Good Cinematic Hits", category: "spotify", mood: "laugh", era: "modern", pacing: "fast", tone: "light", streaming: "Spotify Playlist", poster: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80", desc: "Upbeat pop and feel-good tracks inspired by your favorite comedy scenes.", spotifyEmbed: "https://open.spotify.com/embed/playlist/37i9dQZF1DXdPec7aLTmlC" }
];

// Check Supabase session on load
let supabaseClient = null;
let isUserLoggedIn = false;

window.addEventListener('DOMContentLoaded', async () => {
    try {
        if (window.supabase) {
            supabaseClient = window.supabase.createClient(
                'https://zkymvqrmbabngsqblyye.supabase.co',
                'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'
            );
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                isUserLoggedIn = true;
                document.getElementById('header-auth-area').innerHTML = `<span style="color: #D4AF37; font-weight: bold; font-size: 13px;">⭐ VIP Member</span>`;
                document.getElementById('freemium-banner').style.display = 'none';
            }
        }
    } catch (e) {
        console.warn("Session check warning:", e);
    }
});

window.triggerMatch = function() {
    // FREEMIUM LOCK CHECK: If user is not logged in and has already used their free match
    if (!isUserLoggedIn && localStorage.getItem('hasUsedFreeMatch') === 'true') {
        document.getElementById('questionnaire-box').style.display = 'none';
        document.getElementById('freemium-banner').style.display = 'none';
        document.getElementById('blocked-box').style.display = 'block';
        return;
    }

    const category = document.getElementById('q-category').value;
    const mood = document.getElementById('q-mood').value;
    const era = document.getElementById('q-era').value;
    const pacing = document.getElementById('q-pacing').value;
    const tone = document.getElementById('q-tone').value;

    // Filter catalog based on 5 parameters
    let pool = masterCatalog;
    if (category !== 'any') {
        pool = masterCatalog.filter(item => item.category === category);
    }

    // Score and match items based on the answers
    let scoredMatches = pool.map(item => {
        let score = 0;
        if (item.mood === mood) score += 3;
        if (item.era === era || era === 'any') score += 2;
        if (item.pacing === pacing) score += 2;
        if (item.tone === tone) score += 2;
        return { item, score };
    });

    // Sort by highest score to ensure accuracy, then randomize among top ties
    scoredMatches.sort((a, b) => b.score - a.score);
    let topScore = scoredMatches[0]?.score || 0;
    let bestMatches = scoredMatches.filter(m => m.score === topScore).map(m => m.item);

    if (bestMatches.length === 0) bestMatches = masterCatalog;
    const selected = bestMatches[Math.floor(Math.random() * bestMatches.length)];

    // Mark free match as used if not logged in
    if (!isUserLoggedIn) {
        localStorage.setItem('hasUsedFreeMatch', 'true');
    }

    // Display result
    document.getElementById('questionnaire-box').style.display = 'none';
    document.getElementById('freemium-banner').style.display = 'none';
    document.getElementById('result-box').style.display = 'block';

    document.getElementById('res-title').innerText = selected.title;
    document.getElementById('res-desc').innerText = selected.desc;
    document.getElementById('res-platform').innerText = selected.streaming;

    if (selected.category === 'spotify' && selected.spotifyEmbed) {
        document.getElementById('poster-container').style.display = 'none';
        document.getElementById('spotify-container').style.display = 'block';
        document.getElementById('spotify-iframe').src = selected.spotifyEmbed;
        document.getElementById('res-badge').innerText = "🎧 Curated Spotify Playlist Match";
    } else {
        document.getElementById('spotify-container').style.display = 'none';
        document.getElementById('poster-container').style.display = 'block';
        document.getElementById('res-poster').src = selected.poster;
        document.getElementById('res-badge').innerText = "✨ Curated Match Found";
    }
};

window.handleSearchAgain = function() {
    if (!isUserLoggedIn && localStorage.getItem('hasUsedFreeMatch') === 'true') {
        document.getElementById('result-box').style.display = 'none';
        document.getElementById('blocked-box').style.display = 'block';
    } else {
        location.reload();
    }
};
