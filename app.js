// 1. INITIALIZE SUPABASE
const supabaseUrl = 'https://zkymvqrmbabngsqblyye.supabase.co';
const supabaseKey = 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. THE DATABASE
const contentCatalog = [
    { title: "Avenida Brasil", format: "telenovela", mood: "drama", description: "A gripping story of revenge, family secrets, and intense drama." },
    { title: "Cheias de Charme", format: "telenovela", mood: "comedy", description: "Three domestic workers rise to pop stardom in this hilarious musical journey." },
    { title: "Tropa de Elite", format: "movie", mood: "action", description: "An intense, gritty look at special police forces." },
    { title: "The Office", format: "series", mood: "comedy", description: "A mockumentary on a group of typical office workers." },
    { title: "O Clone", format: "telenovela", mood: "drama", description: "A tale of forbidden love, cloning, and cultural clashes." },
    { title: "A Regra do Jogo", format: "telenovela", mood: "action", description: "A suspenseful thriller blurring the lines between the police and the criminal underworld." }
];

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('match-form');
    const authSection = document.getElementById('auth-section');
    const userInfoSection = document.getElementById('user-info-section');
    const authMessage = document.getElementById('auth-message');
    const registerPrompt = document.getElementById('register-prompt');

    // Check if user is already logged in on page load
    async function checkSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            authSection.classList.add('hidden');
            userInfoSection.classList.remove('hidden');
            registerPrompt.classList.add('hidden'); // Hide prompt if already registered
            document.getElementById('user-info').innerText = `Welcome, ${currentUser.email}!`;
        }
    }
    checkSession();

    // Authentication Event Listeners
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
        else location.reload(); // Reload to update UI
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        location.reload();
    });

    // The Matchmaking Logic
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // RULE 1: Unregistered Users (Local Storage Check)
        if (!currentUser) {
            const hasUsedFree = localStorage.getItem('hasUsedFreeMatch');
            if (hasUsedFree) {
                alert("You have used your free match! Please register or log in to get another one.");
                return; 
            }
        } 
        // RULE 2: Registered Users (Supabase 24h Check)
        else {
            const { data, error } = await supabase
                .from('user_matches')
                .select('last_match_timestamp')
                .eq('id', currentUser.id)
                .single();

            if (data && data.last_match_timestamp) {
                const lastMatch = new Date(data.last_match_timestamp);
                const now = new Date();
                const diffHours = Math.abs(now - lastMatch) / 36e5; // Convert ms to hours

                if (diffHours < 24) {
                    const hoursLeft = Math.ceil(24 - diffHours);
                    alert(`You must wait ${hoursLeft} hours for your next free match.`);
                    return; 
                }
            }
        }

        // --- IF RULES PASS, PROCEED WITH ALGORITHM ---
        
        const selectedFormat = document.getElementById('format').value;
        const selectedMood = document.getElementById('mood').value;
        
        const matchingResults = contentCatalog.filter(item => 
            item.format === selectedFormat && item.mood === selectedMood
        );

        let finalMatch = matchingResults.length > 0 
            ? matchingResults[Math.floor(Math.random() * matchingResults.length)]
            : { title: "No perfect match found", description: "Try changing your answers!" };

        document.getElementById('questionnaire-screen').classList.add('hidden');
        document.getElementById('loading-screen').classList.remove('hidden');

        // Delay for 6 seconds to show the ad
        setTimeout(async () => {
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('result-screen').classList.remove('hidden');
            document.getElementById('match-title').innerText = finalMatch.title;
            document.getElementById('match-description').innerText = finalMatch.description;

            // SAVE THE TIMESTAMP
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