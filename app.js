console.log("APP.JS LOADED");

// Safe Supabase initialization
let supabase = null;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(
            'https://zkymvqrmbabngsqblyye.supabase.co',
            'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'
        );
        console.log("Supabase connected successfully.");
    }
} catch (e) {
    console.warn("Supabase initialization failed, running in local mode:", e);
}

// Toast helper
function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast-message ${type === 'success' ? 'toast-success' : 'toast-error'}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

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
    console.log("DOM loaded, attaching listeners.");

    const devResetBtn = document.getElementById('dev-reset-btn');
    if (devResetBtn) {
        devResetBtn.addEventListener('click', () => {
            localStorage.removeItem('hasUsedFreeMatch');
            showToast("🔧 Limit Reset! You can test again.", "success");
        });
    }

    // Session check
    async function checkSession() {
        if (!supabase) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                currentUser = session.user;
                const profile = currentUser.user_metadata || {};
                const name = profile.first_name || currentUser.email.split('@')[0];
                document.getElementById('auth-section')?.classList.add('hidden');
                document.getElementById('user-info-section')?.classList.remove('hidden');
                document.getElementById('rule-banner')?.classList.add('hidden');
                document.getElementById('user-greeting').innerText = `✨ Welcome back, ${name}!`;
                document.getElementById('user-profile-meta').innerText = `📍 ${profile.city || 'VIP Member'}`;
            }
        } catch (e) {
            console.warn("Session check error:", e);
        }
    }
    checkSession();

    // Login handler
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            if (!supabase) return showToast("Database offline.", "error");
            const email = document.getElementById('login-email')?.value.trim();
            const password = document.getElementById('login-password')?.value;
            if (!email || !password) return showToast("Please enter email and password.", "error");

            try {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                showToast("Login successful!", "success");
                setTimeout(() => location.reload(), 1000);
            } catch (err) {
                showToast(`Login Error: ${err.message}`, "error");
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (supabase) await supabase.auth.signOut();
            location.reload();
        });
    }

    // Close result bubble
    const closeBubbleBtn = document.getElementById('close-bubble-btn');
    if (closeBubbleBtn) {
        closeBubbleBtn.addEventListener('click', () => {
            document.getElementById('result-screen').classList.add('hidden');
            document.getElementById('questionnaire-screen').classList.remove('hidden');
        });
    }

    // Matchmaking Engine (Stays on same page, zero 404 risks)
    const submitBtn = document.getElementById('submit-match-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log("Curate Match button clicked.");

            const age = parseInt(document.getElementById('age')?.value) || 0;
            
            // STRICT MINIMUM AGE 16 CHECK
            if (age < 16) {
                showToast("⚠️ You must be at least 16 years old to use MatchApp.", "error");
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const country = document.getElementById('country')?.value.trim() || "Global";
            const format = document.getElementById('format')?.value || "movie";
            const mood = document.getElementById('mood')?.value || "drama";
            const era = document.getElementById('era')?.value || "any";
            const lang = document.getElementById('langpref')?.value || "subtitled";
            const platform = document.getElementById('platform')?.value || "any";

            submitBtn.innerText = "Curating...";

            try {
                let results = contentCatalog.filter(i => 
                    age >= i.minAge && i.format === format && i.mood === mood &&
                    (era === 'any' || i.era === era) && (platform === 'any' || i.streamingOn.includes(platform))
                );

                if (results.length === 0) results = contentCatalog.filter(i => age >= i.minAge && i.format === format && i.mood === mood);
                if (results.length === 0) results = contentCatalog;

                let match = results[Math.floor(Math.random() * results.length)];
                currentMatchTitle = match.title;

                // Show loading screen
                document.getElementById('questionnaire-screen').classList.add('hidden');
                document.getElementById('loading-screen').classList.remove('hidden');

                const bar = document.getElementById('progress-bar');
                const text = document.getElementById('loading-text');
                let width = 0;

                setTimeout(() => { if (text) text.innerText = "Scanning global catalogs..."; }, 800);
                setTimeout(() => { if (text) text.innerText = "Locating streaming rights..."; }, 1600);

                let interval = setInterval(() => {
                    width += 5;
                    if (bar) bar.style.width = width + '%';
                    if (width >= 100) {
                        clearInterval(interval);
                        
                        document.getElementById('loading-screen').classList.add('hidden');
                        document.getElementById('result-screen').classList.remove('hidden');

                        document.getElementById('result-poster').src = match.poster;
                        document.getElementById('result-title').innerText = match.title;
                        document.getElementById('result-imdb').innerText = `⭐ ${match.imdb}`;
                        document.getElementById('result-length').innerText = `⏱️ ${match.length}`;
                        document.getElementById('result-age').innerText = `🔞 ${match.minAge}+`;
                        document.getElementById('result-desc').innerText = match.description;
                        document.getElementById('result-country').innerText = country;
                        document.getElementById('result-platform').innerText = match.streamingOn.join(" • ");
                        document.getElementById('result-audio').innerText = `Audio: ${lang.toUpperCase()}`;

                        submitBtn.innerText = "Curate My Match";
                    }
                }, 40);

            } catch (err) {
                console.error("Match error:", err);
                showToast("⚠️ An error occurred during curation.", "error");
                submitBtn.innerText = "Curate My Match";
                document.getElementById('loading-screen').classList.add('hidden');
                document.getElementById('questionnaire-screen').classList.remove('hidden');
            }
        });
    }

    // Social shares
    document.getElementById('share-wa')?.addEventListener('click', () => window.open(`https://api.whatsapp.com/send?text=I got ${currentMatchTitle} on MatchApp! https://matchapp.cc`, '_blank'));
    document.getElementById('share-x')?.addEventListener('click', () => window.open(`https://twitter.com/intent/tweet?text=I got ${currentMatchTitle} on MatchApp! https://matchapp.cc`, '_blank'));
    document.getElementById('share-fb')?.addEventListener('click', () => window.open(`https://www.facebook.com/sharer/sharer.php?u=https://matchapp.cc`, '_blank'));
    document.getElementById('share-more')?.addEventListener('click', async () => {
        if (navigator.share) await navigator.share({ title: 'MatchApp', text: `My match: ${currentMatchTitle}`, url: 'https://matchapp.cc' });
        else { navigator.clipboard.writeText('https://matchapp.cc'); showToast("Link Copied!", "success"); }
    });
});
