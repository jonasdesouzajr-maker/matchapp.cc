// 1. INITIALIZE SUPABASE
const supabaseUrl = 'https://zkymvqrmbabngsqblyye.supabase.co';
const supabaseKey = 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. MASSIVE GLOBAL CATALOG
const contentCatalog = [
    // --- TELENOVELAS ---
    { title: "Avenida Brasil", format: "telenovela", mood: "drama", era: "modern", minAge: 14, streamingOn: ["Globoplay"], description: "A gripping story of revenge, family secrets, and intense drama set in Rio de Janeiro." },
    { title: "O Clone", format: "telenovela", mood: "drama", era: "classic", minAge: 12, streamingOn: ["Globoplay"], description: "A classic tale of forbidden love, cloning, and cultural clashes between Brazil and Morocco." },
    { title: "Cheias de Charme", format: "telenovela", mood: "comedy", era: "modern", minAge: 10, streamingOn: ["Globoplay"], description: "Three domestic workers rise to pop stardom in this hilarious musical journey." },
    { title: "Yo soy Betty, la fea", format: "telenovela", mood: "comedy", era: "classic", minAge: 10, streamingOn: ["Prime Video"], description: "The iconic Colombian comedy about a brilliant but socially awkward secretary." },
    { title: "Sen Çal Kapımı (Love is in the Air)", format: "telenovela", mood: "romance", era: "modern", minAge: 12, streamingOn: ["Max", "Prime Video"], description: "A global Turkish romantic comedy hit about a fake engagement that turns real." },
    { title: "Pantanal", format: "telenovela", mood: "drama", era: "modern", minAge: 14, streamingOn: ["Globoplay"], description: "An epic saga blending magical realism, family rivalries, and the stunning Brazilian wetlands." },
    { title: "La Usurpadora", format: "telenovela", mood: "drama", era: "classic", minAge: 12, streamingOn: ["Prime Video"], description: "The legendary twin swap drama full of deception, scandal, and high emotion." },
    { title: "Rebelde", format: "telenovela", mood: "romance", era: "classic", minAge: 12, streamingOn: ["Globoplay", "Netflix"], description: "Teens at an elite boarding school navigate first loves, music, and dramatic friendships." },

    // --- MOVIES ---
    { title: "Tropa de Elite", format: "movie", mood: "action", era: "classic", minAge: 18, streamingOn: ["Globoplay", "Apple TV+"], description: "An intense, gritty look at special police forces navigating corruption in Rio de Janeiro." },
    { title: "Parasite", format: "movie", mood: "drama", era: "modern", minAge: 16, streamingOn: ["Max"], description: "A South Korean masterpiece exploring class discrimination with dark humor and suspense." },
    { title: "The Matrix", format: "movie", mood: "scifi", era: "classic", minAge: 14, streamingOn: ["Max", "Prime Video"], description: "A hacker discovers the shocking truth about reality and his role in the war against its controllers." },
    { title: "Dune: Part One", format: "movie", mood: "scifi", era: "modern", minAge: 12, streamingOn: ["Max"], description: "A stunning visual epic about a noble family embroiled in a war for control of a desert planet." },
    { title: "Crazy Stupid Love", format: "movie", mood: "romance", era: "modern", minAge: 14, streamingOn: ["Prime Video", "Apple TV+"], description: "A middle-aged husband's life changes dramatically when his wife asks for a divorce." },
    { title: "Superbad", format: "movie", mood: "comedy", era: "classic", minAge: 16, streamingOn: ["Netflix"], description: "Two co-dependent high school seniors deal with separation anxiety before a wild party." },
    { title: "Cidade de Deus (City of God)", format: "movie", mood: "drama", era: "classic", minAge: 18, streamingOn: ["Max", "Globoplay"], description: "The rise of organized crime in the Cidade de Deus neighborhood of Rio de Janeiro." },
    { title: "Interstellar", format: "movie", mood: "scifi", era: "modern", minAge: 12, streamingOn: ["Max", "Prime Video"], description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival." },
    { title: "The Dark Knight", format: "movie", mood: "action", era: "classic", minAge: 14, streamingOn: ["Max", "Prime Video"], description: "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and Harvey Dent." },
    { title: "Spirited Away", format: "movie", mood: "scifi", era: "classic", minAge: 6, streamingOn: ["Netflix"], description: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods and spirits." },
    { title: "Gladiator", format: "movie", mood: "action", era: "classic", minAge: 16, streamingOn: ["Prime Video", "Paramount+"], description: "A former Roman general sets out to exact vengeance against the corrupt emperor who murdered his family." },

    // --- SERIES ---
    { title: "Breaking Bad", format: "series", mood: "drama", era: "modern", minAge: 18, streamingOn: ["Netflix"], description: "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine." },
    { title: "The Office (US)", format: "series", mood: "comedy", era: "classic", minAge: 12, streamingOn: ["Netflix", "Peacock"], description: "A mockumentary on a group of typical office workers where workday ego clashes and boredom mix." },
    { title: "The Boys", format: "series", mood: "action", era: "modern", minAge: 18, streamingOn: ["Prime Video"], description: "A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers." },
    { title: "Stranger Things", format: "series", mood: "scifi", era: "modern", minAge: 14, streamingOn: ["Netflix"], description: "A small town uncovers a mystery involving secret government experiments and supernatural forces." },
    { title: "Bridgerton", format: "series", mood: "romance", era: "modern", minAge: 16, streamingOn: ["Netflix"], description: "Wealth, lust, and betrayal set against the backdrop of Regency-era England." },
    { title: "Succession", format: "series", mood: "drama", era: "modern", minAge: 16, streamingOn: ["Max"], description: "The Roy family is known for controlling the biggest media and entertainment company in the world." },
    { title: "The Last of Us", format: "series", mood: "action", era: "modern", minAge: 16, streamingOn: ["Max"], description: "After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl." },
    { title: "Squid Game", format: "series", mood: "action", era: "modern", minAge: 18, streamingOn: ["Netflix"], description: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games for a tempting prize." },
    { title: "Dark", format: "series", mood: "scifi", era: "modern", minAge: 16, streamingOn: ["Netflix"], description: "A missing child sets four families on a frantic hunt for answers as they unearth a mind-bending time travel conspiracy." },
    { title: "The Witcher", format: "series", mood: "scifi", era: "modern", minAge: 18, streamingOn: ["Netflix"], description: "Geralt of Rivia, a mutated monster hunter, journeys toward his destiny in a turbulent world." }
];

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('match-form');
    const authSection = document.getElementById('auth-section');
    const userInfoSection = document.getElementById('user-info-section');
    const authMessage = document.getElementById('auth-message');
    const registerPrompt = document.getElementById('register-prompt');
    const ruleBanner = document.querySelector('.rule-banner');

    // Check session
    async function checkSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            authSection.classList.add('hidden');
            userInfoSection.classList.remove('hidden');
            registerPrompt.classList.add('hidden');
            ruleBanner.classList.add('hidden');
            document.getElementById('user-info').innerText = `Welcome, ${currentUser.email}! (Unlimited 24h Access Enabled)`;
        }
    }
    checkSession();

    // Auth Listeners
    document.getElementById('register-btn').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) authMessage.innerText = error.message;
        else authMessage.innerText = "Check your email to confirm registration!";
    });

    document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) authMessage.innerText = error.message;
        else location.reload();
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        location.reload();
    });

    // Reset Search button
    document.getElementById('new-search-btn').addEventListener('click', () => {
        document.getElementById('result-screen').classList.add('hidden');
        document.getElementById('questionnaire-screen').classList.remove('hidden');
    });

    // Matchmaking Logic
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check limits for Free vs Registered users
        if (!currentUser) {
            const hasUsedFree = localStorage.getItem('hasUsedFreeMatch');
            if (hasUsedFree) {
                alert("You have already used your 1 free match! Please register or log in above to unlock your next match and get daily access.");
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return; 
            }
        } else {
            const { data, error } = await supabase
                .from('user_matches')
                .select('last_match_timestamp')
                .eq('id', currentUser.id)
                .single();

            if (data && data.last_match_timestamp) {
                const lastMatch = new Date(data.last_match_timestamp);
                const now = new Date();
                const diffHours = Math.abs(now - lastMatch) / 36e5;
                if (diffHours < 24) {
                    const hoursLeft = Math.ceil(24 - diffHours);
                    alert(`You must wait ${hoursLeft} hours for your next free match.`);
                    return; 
                }
            }
        }

        // --- GATHER USER INPUTS ---
        const userAge = parseInt(document.getElementById('age').value) || 18;
        const userCountry = document.getElementById('country').value || "Global";
        const selectedFormat = document.getElementById('format').value;
        const selectedMood = document.getElementById('mood').value;
        const selectedEra = document.getElementById('era').value;
        const selectedLangPref = document.getElementById('langpref').value;
        const selectedPlatform = document.getElementById('platform').value;
        
        // --- 100% FOOLPROOF ALGORITHM WITH MULTI-TIER FALLBACKS ---
        let matchingResults = contentCatalog.filter(item => {
            return userAge >= item.minAge &&
                   item.format === selectedFormat &&
                   item.mood === selectedMood &&
                   (selectedEra === 'any' || item.era === selectedEra) &&
                   (selectedPlatform === 'any' || item.streamingOn.includes(selectedPlatform));
        });

        // Fallback Tier 1: Relax era and platform
        if (matchingResults.length === 0) {
            matchingResults = contentCatalog.filter(item => userAge >= item.minAge && item.format === selectedFormat && item.mood === selectedMood);
        }

        // Fallback Tier 2: Relax age and format if necessary (guarantees a result always appears)
        if (matchingResults.length === 0) {
            matchingResults = contentCatalog;
        }

        let finalMatch = matchingResults[Math.floor(Math.random() * matchingResults.length)];

        // Transition screens (Hides form, shows loading screen)
        document.getElementById('questionnaire-screen').classList.add('hidden');
        document.getElementById('loading-screen').classList.remove('hidden');

        // Snappy 1.5-second transition timer (fast and responsive)
        setTimeout(async () => {
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('result-screen').classList.remove('hidden');
            
            document.getElementById('match-title').innerText = finalMatch.title;
            document.getElementById('match-description').innerText = finalMatch.description;
            document.getElementById('match-streaming').innerText = finalMatch.streamingOn.join(" • ");
            document.getElementById('match-details-meta').innerText = `Recommended for viewer age ${userAge}+ (${userCountry}) • Audio/Format: ${selectedLangPref.toUpperCase()}`;

            // Save usage state
            if (!currentUser) {
                localStorage.setItem('hasUsedFreeMatch', 'true');
            } else {
                await supabase.from('user_matches').upsert({ 
                    id: currentUser.id, 
                    last_match_timestamp: new Date().toISOString() 
                });
            }
        }, 1500); 
    });
});
