// 1. INITIALIZE SUPABASE SAFELY
let supabase = null;
try {
    const supabaseUrl = 'https://zkymvqrmbabngsqblyye.supabase.co';
    const supabaseKey = 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU';
    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    }
} catch (e) {
    console.warn("Supabase failed to initialize. Proceeding with LocalStorage mode.");
}

// 2. THE PREMIUM CATALOG
const contentCatalog = [
    { title: "Avenida Brasil", format: "telenovela", mood: "drama", era: "modern", minAge: 14, length: "179 Episodes", imdb: "8.3/10", streamingOn: ["Globoplay"], poster: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80", description: "A gripping story of revenge, family secrets, and intense drama set in Rio de Janeiro." },
    { title: "O Clone", format: "telenovela", mood: "drama", era: "classic", minAge: 12, length: "221 Episodes", imdb: "8.1/10", streamingOn: ["Globoplay"], poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80", description: "A classic tale of forbidden love, cloning, and cultural clashes." },
    { title: "Yo soy Betty, la fea", format: "telenovela", mood: "comedy", era: "classic", minAge: 10, length: "335 Episodes", imdb: "8.2/10", streamingOn: ["Prime Video"], poster: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80", description: "The iconic Colombian comedy about a brilliant but socially awkward secretary." },
    { title: "Parasite", format: "movie", mood: "drama", era: "modern", minAge: 16, length: "2h 12m", imdb: "8.5/10", streamingOn: ["Max"], poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80", description: "A South Korean masterpiece exploring class discrimination with dark humor." },
    { title: "The Matrix", format: "movie", mood: "scifi", era: "classic", minAge: 14, length: "2h 16m", imdb: "8.7/10", streamingOn: ["Max", "Prime Video"], poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80", description: "A hacker discovers the shocking truth about reality." },
    { title: "Crazy Stupid Love", format: "movie", mood: "romance", era: "modern", minAge: 14, length: "1h 58m", imdb: "7.4/10", streamingOn: ["Prime Video", "Apple TV+"], poster: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80", description: "A middle-aged husband's life changes dramatically when his wife asks for a divorce." },
    { title: "Superbad", format: "movie", mood: "comedy", era: "classic", minAge: 16, length: "1h 53m", imdb: "7.6/10", streamingOn: ["Netflix"], poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80", description: "Two high school seniors deal with separation anxiety before a wild party." },
    { title: "Interstellar", format: "movie", mood: "scifi", era: "modern", minAge: 12, length: "2h 49m", imdb: "8.7/10", streamingOn: ["Max", "Prime Video"], poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80", description: "A team of explorers travel through a wormhole in space to save humanity." },
    { title: "Breaking Bad", format: "series", mood: "drama", era: "modern", minAge: 18, length: "5 Seasons", imdb: "9.5/10", streamingOn: ["Netflix"], poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80", description: "A chemistry teacher turns to manufacturing methamphetamine." },
    { title: "The Office", format: "series", mood: "comedy", era: "classic", minAge: 12, length: "9 Seasons", imdb: "9.0/10", streamingOn: ["Netflix", "Peacock"], poster: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80", description: "A mockumentary on a group of typical office workers." },
    { title: "The Boys", format: "series", mood: "action", era: "modern", minAge: 18, length: "4 Seasons", imdb: "8.7/10", streamingOn: ["Prime Video"], poster: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80", description: "Vigilantes set out to take down corrupt superheroes." }
];

let currentUser = null;
let currentMatchTitle = "";

document.addEventListener('DOMContentLoaded', () => {
    // 3. UI ELEMENTS
    const form = document.getElementById('match-form');
    const authSection = document.getElementById('auth-section');
    const userInfoSection = document.getElementById('user-info-section');
    const qScreen = document.getElementById('questionnaire-screen');
    const lScreen = document.getElementById('loading-screen');
    const rScreen = document.getElementById('result-screen');

    // DEV RESET TRICK
    document.getElementById('dev-reset-btn').addEventListener('click', () => {
        localStorage.removeItem('hasUsedFreeMatch');
        alert("🔧 Limit Reset! You can test the app again.");
    });

    // 4. AUTHENTICATION & SESSIONS
    async function checkSession() {
        if (!supabase) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                currentUser = session.user;
                authSection.classList.add('hidden');
                userInfoSection.classList.remove('hidden');
                document.getElementById('rule-banner').classList.add('hidden');
                document.getElementById('user-info').innerText = `✨ VIP Logged in: ${currentUser.email}`;
            }
        } catch (e) { console.warn("Auth check failed."); }
    }
    checkSession();

    document.getElementById('register-btn').addEventListener('click', async () => {
        if (!supabase) return alert("Database disconnected.");
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { error } = await supabase.auth.signUp({ email, password });
        document.getElementById('auth-message').innerText = error ? error.message : "Check your email!";
    });

    document.getElementById('login-btn').addEventListener('click', async () => {
        if (!supabase) return alert("Database disconnected.");
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        error ? (document.getElementById('auth-message').innerText = error.message) : location.reload();
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
        if (supabase) await supabase.auth.signOut();
        location.reload();
    });

    // 5. BUBBLE NAVIGATION (Close Button)
    document.getElementById('close-bubble-btn').addEventListener('click', () => {
        rScreen.classList.add('hidden');
        qScreen.classList.remove('hidden');
    });

    // 6. THE BULLETPROOF MATCH ENGINE
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // STOP PAGE FROM RELOADING INSTANTLY

        try {
            // --- LIMIT CHECK ---
            if (!currentUser) {
                if (localStorage.getItem('hasUsedFreeMatch') === 'true') {
                    alert("🔒 You have already used your free match!\nRegister below to unlock unlimited matches.");
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return; 
                }
            } else if (supabase) {
                const { data } = await supabase.from('user_matches').select('last_match_timestamp').eq('id', currentUser.id).single();
                if (data && data.last_match_timestamp) {
                    const diffHours = Math.abs(new Date() - new Date(data.last_match_timestamp)) / 36e5;
                    if (diffHours < 24) {
                        alert(`⏳ Wait ${Math.ceil(24 - diffHours)} hours for your next match.`);
                        return; 
                    }
                }
            }

            // --- FILTERING ---
            const age = parseInt(document.getElementById('age').value) || 18;
            const country = document.getElementById('country').value || "Global";
            const format = document.getElementById('format').value;
            const mood = document.getElementById('mood').value;
            const era = document.getElementById('era').value;
            const lang = document.getElementById('langpref').value;
            const platform = document.getElementById('platform').value;
            
            let results = contentCatalog.filter(i => 
                age >= i.minAge && i.format === format && i.mood === mood &&
                (era === 'any' || i.era === era) && (platform === 'any' || i.streamingOn.includes(platform))
            );

            if (results.length === 0) results = contentCatalog.filter(i => age >= i.minAge && i.format === format && i.mood === mood);
            if (results.length === 0) results = contentCatalog;

            let match = results[Math.floor(Math.random() * results.length)];
            currentMatchTitle = match.title;

            // --- THE LOADING BAR ANIMATION ---
            qScreen.classList.add('hidden');
            lScreen.classList.remove('hidden');
            
            const bar = document.getElementById('progress-bar');
            const text = document.getElementById('loading-text');
            let width = 0;
            
            // Texts that change as the bar fills
            setTimeout(() => text.innerText = "Scanning global catalogs...", 1000);
            setTimeout(() => text.innerText = "Locating streaming rights...", 2000);

            let interval = setInterval(async () => {
                width += 2; // Fills 2% per tick
                bar.style.width = width + '%';
                
                if (width >= 100) {
                    clearInterval(interval);
                    
                    // --- SHOW INLINE BUBBLE RESULT ---
                    lScreen.classList.add('hidden');
                    rScreen.classList.remove('hidden');
                    
                    document.getElementById('result-poster').src = match.poster;
                    document.getElementById('result-title').innerText = match.title;
                    document.getElementById('result-imdb').innerText = `⭐ ${match.imdb}`;
                    document.getElementById('result-length').innerText = `⏱️ ${match.length}`;
                    document.getElementById('result-age').innerText = `🔞 ${match.minAge}+`;
                    document.getElementById('result-desc').innerText = match.description;
                    document.getElementById('result-country').innerText = country;
                    document.getElementById('result-platform').innerText = match.streamingOn.join(" • ");
                    document.getElementById('result-audio').innerText = `Audio: ${lang.toUpperCase()}`;

                    // Save rule
                    if (!currentUser) {
                        localStorage.setItem('hasUsedFreeMatch', 'true');
                    } else if (supabase) {
                        await supabase.from('user_matches').upsert({ id: currentUser.id, last_match_timestamp: new Date().toISOString() });
                    }
                }
            }, 60); // 60ms * 50 ticks = 3000ms (3 seconds total)

        } catch (error) {
            console.error("Match Engine Error:", error);
            alert("Something went wrong! Please try again.");
            location.reload();
        }
    });

    // 7. SOCIAL SHARES
    document.getElementById('share-wa').addEventListener('click', () => window.open(`https://api.whatsapp.com/send?text=I got ${currentMatchTitle} on MatchApp! https://matchapp.cc`, '_blank'));
    document.getElementById('share-x').addEventListener('click', () => window.open(`https://twitter.com/intent/tweet?text=I got ${currentMatchTitle} on MatchApp! https://matchapp.cc`, '_blank'));
    document.getElementById('share-fb').addEventListener('click', () => window.open(`https://www.facebook.com/sharer/sharer.php?u=https://matchapp.cc`, '_blank'));
    document.getElementById('share-more').addEventListener('click', async () => {
        if (navigator.share) await navigator.share({ title: 'MatchApp', text: `My match: ${currentMatchTitle}`, url: 'https://matchapp.cc' });
        else { navigator.clipboard.writeText('https://matchapp.cc'); alert("Link Copied!"); }
    });
});
