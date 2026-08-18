// 1. INITIALIZE SUPABASE
const supabaseUrl = 'https://zkymvqrmbabngsqblyye.supabase.co';
const supabaseKey = 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. THE GLOBAL CATALOG (With Era and Streaming Availability)
const contentCatalog = [
    // --- TELENOVELAS ---
    { title: "Avenida Brasil", format: "telenovela", mood: "drama", era: "modern", streamingOn: ["Globoplay"], description: "A gripping story of revenge, family secrets, and intense drama." },
    { title: "O Clone", format: "telenovela", mood: "drama", era: "classic", streamingOn: ["Globoplay"], description: "A classic tale of forbidden love, cloning, and cultural clashes." },
    { title: "Cheias de Charme", format: "telenovela", mood: "comedy", era: "modern", streamingOn: ["Globoplay"], description: "Three domestic workers rise to pop stardom in this hilarious musical journey." },
    { title: "Yo soy Betty, la fea", format: "telenovela", mood: "comedy", era: "classic", streamingOn: ["Prime Video"], description: "The iconic Colombian comedy about a brilliant but socially awkward secretary." },
    { title: "Sen Çal Kapımı (Love is in the Air)", format: "telenovela", mood: "romance", era: "modern", streamingOn: ["Max", "Prime Video"], description: "A global Turkish romantic comedy hit about a fake engagement that turns real." },
    
    // --- MOVIES ---
    { title: "Tropa de Elite", format: "movie", mood: "action", era: "classic", streamingOn: ["Globoplay", "Apple TV+"], description: "An intense, gritty look at special police forces in Rio de Janeiro." },
    { title: "Parasite", format: "movie", mood: "drama", era: "modern", streamingOn: ["Max"], description: "A South Korean masterpiece exploring class discrimination with dark humor and suspense." },
    { title: "The Matrix", format: "movie", mood: "scifi", era: "classic", streamingOn: ["Max", "Prime Video"], description: "A hacker discovers the shocking truth about reality and his role in the war against its controllers." },
    { title: "Dune: Part One", format: "movie", mood: "scifi", era: "modern", streamingOn: ["Max"], description: "A stunning visual epic about a noble family embroiled in a war for control of the galaxy's most valuable asset." },
    { title: "Crazy Stupid Love", format: "movie", mood: "romance", era: "modern", streamingOn: ["Prime Video", "Apple TV+"], description: "A middle-aged husband's life changes dramatically when his wife asks for a divorce." },
    { title: "Superbad", format: "movie", mood: "comedy", era: "classic", streamingOn: ["Netflix"], description: "Two co-dependent high school seniors are forced to deal with separation anxiety after their plan to stage a booze-soaked party goes awry." },

    // --- SERIES ---
    { title: "Breaking Bad", format: "series", mood: "drama", era: "modern", streamingOn: ["Netflix"], description: "A chemistry teacher turns into a ruthless kingpin." },
    { title: "The Office (US)", format: "series", mood: "comedy", era: "classic", streamingOn: ["Netflix", "Peacock"], description: "A mockumentary on a group of typical office workers." },
    { title: "The Boys", format: "series", mood: "action", era: "modern", streamingOn: ["Prime Video"], description: "A group of vigilantes set out to take down corrupt superheroes." },
    { title: "Stranger Things", format: "series", mood: "scifi", era: "modern", streamingOn: ["Netflix"], description: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments and terrifying supernatural forces." },
    { title: "Bridgerton", format: "series", mood: "romance", era: "modern", streamingOn: ["Netflix"], description: "Wealth, lust, and betrayal set against the backdrop of Regency-era England." }
];

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('match-form');
    const authSection = document.getElementById('auth-section');
    const userInfoSection = document.getElementById('user-info-section');
    const authMessage = document.getElementById('auth-message');
    const registerPrompt = document.getElementById('register-prompt');

    // Check session
    async function checkSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            authSection.classList.add('hidden');
            userInfoSection.classList.remove('hidden');
            registerPrompt.classList.add('hidden');
            document.getElementById('user-info').innerText = `Welcome, ${currentUser.email}!`;
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

    // Matchmaking Logic
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check limits
        if (!currentUser) {
            const hasUsedFree = localStorage.getItem('hasUsedFreeMatch');
            if (hasUsedFree) {
                alert("You have used your free match! Please register or log in to get another one.");
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

        // --- NEW ALGORITHM ---
        const selectedFormat = document.getElementById('format').value;
        const selectedMood = document.getElementById('mood').value;
        const selectedEra = document.getElementById('era').value;
        const selectedPlatform = document.getElementById('platform').value;
        
        let matchingResults = contentCatalog.filter(item => {
            // Mandatory match
            const formatMatch = item.format === selectedFormat;
            const moodMatch = item.mood === selectedMood;
            
            // Optional match (if user selected 'any', skip the check)
            const eraMatch = selectedEra === 'any' || item.era === selectedEra;
            const platformMatch = selectedPlatform === 'any' || item.streamingOn.includes(selectedPlatform);

            return formatMatch && moodMatch && eraMatch && platformMatch;
        });

        // Fallback: If the user was too specific and got 0 results, loosen the era/platform restrictions to give them *something*
        if (matchingResults.length === 0) {
            matchingResults = contentCatalog.filter(item => item.format === selectedFormat && item.mood === selectedMood);
        }

        let finalMatch = matchingResults.length > 0 
            ? matchingResults[Math.floor(Math.random() * matchingResults.length)]
            : { 
                title: "No perfect match found", 
                description: "Try changing your answers! You were very specific.", 
                streamingOn: ["Search Online"] 
              };

        // Transition screens
        document.getElementById('questionnaire-screen').classList.add('hidden');
        document.getElementById('loading-screen').classList.remove('hidden');

        // Delay for 6 seconds to show the AdSense ad
        setTimeout(async () => {
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('result-screen').classList.remove('hidden');
            
            document.getElementById('match-title').innerText = finalMatch.title;
            document.getElementById('match-description').innerText = finalMatch.description;
            
            // Format the streaming platforms into a nice string (e.g. "Netflix, Max")
            document.getElementById('match-streaming').innerText = finalMatch.streamingOn.join(" • ");

            // Save timestamp
            if (!currentUser) {
                localStorage.setItem('hasUsedFreeMatch', 'true');
            } else {
                await supabase.from('user_matches').upsert({ 
                    id: currentUser.id, 
                    last_match_timestamp: new Date().toISOString() 
                });
            }
        }, 6000); 
    });
});
