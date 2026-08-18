// 1. INITIALIZE SUPABASE SAFELY
let supabase = null;
try {
    const supabaseUrl = 'https://zkymvqrmbabngsqblyye.supabase.co';
    const supabaseKey = 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU';
    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    }
} catch (e) {
    console.warn("Supabase initialization skipped. Proceeding in local mode.");
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
    console.log("MatchApp Initialized Successfully");

    // UI ELEMENTS
    const authSection = document.getElementById('auth-section');
    const registerScreen = document.getElementById('register-screen');
    const userInfoSection = document.getElementById('user-info-section');
    
    const qScreen = document.getElementById('questionnaire-screen');
    const lScreen = document.getElementById('loading-screen');
    const rScreen = document.getElementById('result-screen');
    
    const submitBtn = document.getElementById('submit-match-btn');
    const errBox = document.getElementById('form-error');

    // DEV RESET TRICK
    const devResetBtn = document.getElementById('dev-reset-btn');
    if (devResetBtn) {
        devResetBtn.addEventListener('click', () => {
            localStorage.removeItem('hasUsedFreeMatch');
            if (errBox) errBox.classList.add('hidden');
            alert("🔧 Limit Reset! You can test the app again.");
        });
    }

    // --- SESSION CHECK ---
    async function checkSession() {
        if (!supabase) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                currentUser = session.user;
                const profileData = currentUser.user_metadata || {};
                const firstName = profileData.first_name || currentUser.email.split('@')[0];
                const location = profileData.city ? `From ${profileData.city}, ${profileData.country}` : 'VIP Member';

                if (authSection) authSection.classList.add('hidden');
                if (registerScreen) registerScreen.classList.add('hidden');
                if (userInfoSection) userInfoSection.classList.remove('hidden');
                
                const ruleBanner = document.getElementById('rule-banner');
                if (ruleBanner) ruleBanner.classList.add('hidden');
                
                const greeting = document.getElementById('user-greeting');
                if (greeting) greeting.innerText = `✨ Welcome back, ${firstName}!`;
                
                const meta = document.getElementById('user-profile-meta');
                if (meta) meta.innerText = `📍 ${location} | Algorithm Active`;
            }
        } catch (e) { console.warn("Auth check failed.", e); }
    }
    checkSession();

    // --- NAVIGATION & TOGGLES ---
    const showRegBtn = document.getElementById('show-register-btn');
    if (showRegBtn) {
        showRegBtn.addEventListener('click', () => {
            if (authSection) authSection.classList.add('hidden');
            if (registerScreen) registerScreen.classList.remove('hidden');
        });
    }

    const cancelRegBtn = document.getElementById('cancel-register-btn');
    if (cancelRegBtn) {
        cancelRegBtn.addEventListener('click', () => {
            if (registerScreen) registerScreen.classList.add('hidden');
            if (authSection) authSection.classList.remove('hidden');
        });
    }

    // --- VIP REGISTRATION ---
    const submitRegBtn = document.getElementById('submit-register-btn');
    if (submitRegBtn) {
        submitRegBtn.addEventListener('click', async () => {
            if (!supabase) return alert("Database disconnected.");
            
            const emailField = document.getElementById('reg-email');
            const passField = document.getElementById('reg-password');
            const nameField = document.getElementById('reg-name');
            const msgBox = document.getElementById('register-message');

            if (!emailField || !passField || !nameField) return;

            const email = emailField.value;
            const password = passField.value;
            const firstName = nameField.value;
            const country = document.getElementById('reg-country')?.value || "";
            const city = document.getElementById('reg-city')?.value || "";
            const history = document.getElementById('reg-history')?.value || "";
            const genreSelect = document.getElementById('reg-genres');
            const selectedGenres = genreSelect ? Array.from(genreSelect.selectedOptions).map(opt => opt.value) : [];

            if (!email || !password || !firstName) {
                if (msgBox) msgBox.innerText = "Please fill in Name, Email, and Password.";
                return;
            }

            submitRegBtn.innerText = "Creating Profile...";

            const { error } = await supabase.auth.signUp({ 
                email, 
                password,
                options: {
                    data: {
                        first_name: firstName,
                        country: country,
                        city: city,
                        favorite_genres: selectedGenres,
                        watch_history: history
                    }
                }
            });

            if (error) {
                if (msgBox) msgBox.innerText = error.message;
                submitRegBtn.innerText = "Unlock VIP Access";
            } else {
                if (msgBox) {
                    msgBox.innerText = "Success! Please log in now.";
                    msgBox.style.color = "#4cd137";
                }
                setTimeout(() => {
                    if (registerScreen) registerScreen.classList.add('hidden');
                    if (authSection) authSection.classList.remove('hidden');
                }, 2000);
            }
        });
    }

    // --- LOGIN ---
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            if (!supabase) return alert("Database disconnected.");
            const email = document.getElementById('login-email')?.value;
            const password = document.getElementById('login-password')?.value;
            const msgBox = document.getElementById('login-message');

            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error && msgBox) {
                msgBox.innerText = error.message;
            } else {
                location.reload();
            }
        });
    }

    // --- LOGOUT ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (supabase) await supabase.auth.signOut();
            location.reload();
        });
    }

    // --- CLOSE RESULT BUBBLE ---
    const closeBubbleBtn = document.getElementById('close-bubble-btn');
    if (closeBubbleBtn) {
        closeBubbleBtn.addEventListener('click', () => {
            if (rScreen) rScreen.classList.add('hidden');
            if (qScreen) qScreen.classList.remove('hidden');
            if (submitBtn) submitBtn.innerText = "Curate My Match";
        });
    }

    // --- MATCHMAKING ENGINE ---
    if (submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (errBox) errBox.classList.add('hidden');
            submitBtn.innerText = "Processing Request...";

            try {
                // LIMIT CHECK
                if (!currentUser) {
                    if (localStorage.getItem('hasUsedFreeMatch') === 'true') {
                        if (errBox) {
                            errBox.innerText = "🔒 You have already used your free match! Please register above to unlock daily matches.";
                            errBox.classList.remove('hidden');
                        }
                        submitBtn.innerText = "Curate My Match";
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return; 
                    }
                } else if (supabase) {
                    const { data } = await supabase.from('user_matches').select('last_match_timestamp').eq('id', currentUser.id).single();
                    if (data && data.last_match_timestamp) {
                        const diffHours = Math.abs(new Date() - new Date(data.last_match_timestamp)) / 36e5;
                        if (diffHours < 24) {
                            if (errBox) {
                                errBox.innerText = `⏳ Please wait ${Math.ceil(24 - diffHours)} hours for your next match.`;
                                errBox.classList.remove('hidden');
                            }
                            submitBtn.innerText = "Curate My Match";
                            return; 
                        }
                    }
                }

                // GATHER INPUTS
                const age = parseInt(document.getElementById('age')?.value) || 18; 
                const country = document.getElementById('country')?.value || "Global";
                const format = document.getElementById('format')?.value || "movie";
                const mood = document.getElementById('mood')?.value || "drama";
                const era = document.getElementById('era')?.value || "any";
                const lang = document.getElementById('langpref')?.value || "subtitled";
                const platform = document.getElementById('platform')?.value || "any";
                
                let results = contentCatalog.filter(i => 
                    age >= i.minAge && i.format === format && i.mood === mood &&
                    (era === 'any' || i.era === era) && (platform === 'any' || i.streamingOn.includes(platform))
                );

                if (results.length === 0) results = contentCatalog.filter(i => age >= i.minAge && i.format === format && i.mood === mood);
                if (results.length === 0) results = contentCatalog;

                let match = results[Math.floor(Math.random() * results.length)];
                currentMatchTitle = match.title;

                // LOADING ANIMATION
                if (qScreen) qScreen.classList.add('hidden');
                if (lScreen) lScreen.classList.remove('hidden');
                
                const bar = document.getElementById('progress-bar');
                const text = document.getElementById('loading-text');
                let width = 0;
                
                if (text) setTimeout(() => text.innerText = "Scanning global catalogs...", 1000);
                if (text) setTimeout(() => text.innerText = "Locating streaming rights...", 2000);

                let interval = setInterval(async () => {
                    width += 2; 
                    if (bar) bar.style.width = width + '%';
                    
                    if (width >= 100) {
                        clearInterval(interval);
                        
                        // SHOW RESULT
                        if (lScreen) lScreen.classList.add('hidden');
                        if (rScreen) rScreen.classList.remove('hidden');
                        
                        const poster = document.getElementById('result-poster');
                        if (poster) poster.src = match.poster;
                        
                        const titleEl = document.getElementById('result-title');
                        if (titleEl) titleEl.innerText = match.title;
                        
                        const imdbEl = document.getElementById('result-imdb');
                        if (imdbEl) imdbEl.innerText = `⭐ ${match.imdb}`;
                        
                        const lenEl = document.getElementById('result-length');
                        if (lenEl) lenEl.innerText = `⏱️ ${match.length}`;
                        
                        const ageEl = document.getElementById('result-age');
                        if (ageEl) ageEl.innerText = `🔞 ${match.minAge}+`;
                        
                        const descEl = document.getElementById('result-desc');
                        if (descEl) descEl.innerText = match.description;
                        
                        const countryEl = document.getElementById('result-country');
                        if (countryEl) countryEl.innerText = country;
                        
                        const platEl = document.getElementById('result-platform');
                        if (platEl) platEl.innerText = match.streamingOn.join(" • ");
                        
                        const audioEl = document.getElementById('result-audio');
                        if (audioEl) audioEl.innerText = `Audio: ${lang.toUpperCase()}`;

                        // Save usage
                        if (!currentUser) {
                            localStorage.setItem('hasUsedFreeMatch', 'true');
                        } else if (supabase) {
                            await supabase.from('user_matches').upsert({ id: currentUser.id, last_match_timestamp: new Date().toISOString() });
                        }
                    }
                }, 60); 

            } catch (error) {
                console.error("Engine Error:", error);
                if (errBox) {
                    errBox.innerText = "⚠️ An error occurred. Please refresh the page.";
                    errBox.classList.remove('hidden');
                }
                submitBtn.innerText = "Curate My Match";
            }
        });
    }

    // --- SOCIAL SHARES ---
    const waBtn = document.getElementById('share-wa');
    if (waBtn) waBtn.addEventListener('click', () => window.open(`https://api.whatsapp.com/send?text=I got ${currentMatchTitle} on MatchApp! https://matchapp.cc`, '_blank'));
    
    const xBtn = document.getElementById('share-x');
    if (xBtn) xBtn.addEventListener('click', () => window.open(`https://twitter.com/intent/tweet?text=I got ${currentMatchTitle} on MatchApp! https://matchapp.cc`, '_blank'));
    
    const fbBtn = document.getElementById('share-fb');
    if (fbBtn) fbBtn.addEventListener('click', () => window.open(`https://www.facebook.com/sharer/sharer.php?u=https://matchapp.cc`, '_blank'));
    
    const moreBtn = document.getElementById('share-more');
    if (moreBtn) {
        moreBtn.addEventListener('click', async () => {
            if (navigator.share) await navigator.share({ title: 'MatchApp', text: `My match: ${currentMatchTitle}`, url: 'https://matchapp.cc' });
            else { navigator.clipboard.writeText('https://matchapp.cc'); alert("Link Copied!"); }
        });
    }
});
