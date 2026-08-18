// 1. INITIALIZE SUPABASE
const supabaseUrl = 'https://zkymvqrmbabngsqblyye.supabase.co';
const supabaseKey = 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. ENRICHED GLOBAL CATALOG
const contentCatalog = [
    // --- TELENOVELAS ---
    { title: "Avenida Brasil", format: "telenovela", mood: "drama", era: "modern", minAge: 14, length: "179 Episodes", imdb: "8.3/10", streamingOn: ["Globoplay"], poster: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80", description: "A gripping story of revenge, family secrets, and intense drama set in Rio de Janeiro." },
    { title: "O Clone", format: "telenovela", mood: "drama", era: "classic", minAge: 12, length: "221 Episodes", imdb: "8.1/10", streamingOn: ["Globoplay"], poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80", description: "A classic tale of forbidden love, cloning, and cultural clashes between Brazil and Morocco." },
    { title: "Cheias de Charme", format: "telenovela", mood: "comedy", era: "modern", minAge: 10, length: "161 Episodes", imdb: "7.5/10", streamingOn: ["Globoplay"], poster: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80", description: "Three domestic workers rise to pop stardom in this hilarious musical journey." },
    { title: "Yo soy Betty, la fea", format: "telenovela", mood: "comedy", era: "classic", minAge: 10, length: "335 Episodes", imdb: "8.2/10", streamingOn: ["Prime Video"], poster: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80", description: "The iconic Colombian comedy about a brilliant but socially awkward secretary." },
    { title: "Sen Çal Kapımı (Love is in the Air)", format: "telenovela", mood: "romance", era: "modern", minAge: 12, length: "2 Seasons", imdb: "7.4/10", streamingOn: ["Max", "Prime Video"], poster: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80", description: "A global Turkish romantic comedy hit about a fake engagement that turns real." },
    
    // --- MOVIES ---
    { title: "Tropa de Elite", format: "movie", mood: "action", era: "classic", minAge: 18, length: "1h 55m", imdb: "8.0/10", streamingOn: ["Globoplay", "Apple TV+"], poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80", description: "An intense, gritty look at special police forces navigating corruption in Rio de Janeiro." },
    { title: "Parasite", format: "movie", mood: "drama", era: "modern", minAge: 16, length: "2h 12m", imdb: "8.5/10", streamingOn: ["Max"], poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80", description: "A South Korean masterpiece exploring class discrimination with dark humor and suspense." },
    { title: "The Matrix", format: "movie", mood: "scifi", era: "classic", minAge: 14, length: "2h 16m", imdb: "8.7/10", streamingOn: ["Max", "Prime Video"], poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80", description: "A hacker discovers the shocking truth about reality and his role in the war against its controllers." },
    { title: "Crazy Stupid Love", format: "movie", mood: "romance", era: "modern", minAge: 14, length: "1h 58m", imdb: "7.4/10", streamingOn: ["Prime Video", "Apple TV+"], poster: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80", description: "A middle-aged husband's life changes dramatically when his wife asks for a divorce." },
    
    // --- SERIES ---
    { title: "Breaking Bad", format: "series", mood: "drama", era: "modern", minAge: 18, length: "5 Seasons", imdb: "9.5/10", streamingOn: ["Netflix"], poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80", description: "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine." },
    { title: "The Office (US)", format: "series", mood: "comedy", era: "classic", minAge: 12, length: "9 Seasons", imdb: "9.0/10", streamingOn: ["Netflix", "Peacock"], poster: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80", description: "A mockumentary on a group of typical office workers where workday ego clashes and boredom mix." },
    { title: "The Boys", format: "series", mood: "action", era: "modern", minAge: 18, length: "4 Seasons", imdb: "8.7/10", streamingOn: ["Prime Video"], poster: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80", description: "A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers." },
    { title: "Stranger Things", format: "series", mood: "scifi", era: "modern", minAge: 14, length: "5 Seasons", imdb: "8.7/10", streamingOn: ["Netflix"], poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80", description: "A small town uncovers a mystery involving secret government experiments and supernatural forces." }
];

let currentUser = null;
let currentMatchTitle = "";

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('match-form');
    const authSection = document.getElementById('auth-section');
    const userInfoSection = document.getElementById('user-info-section');
    const resultModal = document.getElementById('result-modal');

    // DEV TRICK: Click the Logo to clear test limits
    document.getElementById('dev-reset-btn').addEventListener('click', () => {
        localStorage.removeItem('hasUsedFreeMatch');
        alert("🔧 DEV MODE: Free match limit reset! You can test again.");
    });

    // Check session
    async function checkSession() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                currentUser = session.user;
                authSection.classList.add('hidden');
                userInfoSection.classList.remove('hidden');
                document.getElementById('register-prompt').classList.add('hidden');
                document.querySelector('.rule-banner').classList.add('hidden');
                document.getElementById('user-info').innerText = `✨ Welcome, ${currentUser.email}! (24h Pass Active)`;
            }
        } catch (e) {
            console.warn("Supabase session check skipped/failed.", e);
        }
    }
    checkSession();

    // Close modal handlers
    function closeModal() {
        resultModal.classList.add('hidden');
        document.getElementById('questionnaire-screen').classList.remove('hidden');
    }
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('modal-search-again-btn').addEventListener('click', closeModal);

    // Social Sharing Event Handlers
    document.getElementById('share-whatsapp').addEventListener('click', () => {
        const text = encodeURIComponent(`I just found my perfect match on MatchApp: *${currentMatchTitle}*! Check it out: https://matchapp.cc`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    });

    document.getElementById('share-twitter').addEventListener('click', () => {
        const text = encodeURIComponent(`I just found my perfect watch match: ${currentMatchTitle}! Find yours on MatchApp: https://matchapp.cc`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    });

    document.getElementById('share-facebook').addEventListener('click', () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=https://matchapp.cc`, '_blank');
    });

    document.getElementById('share-native').addEventListener('click', async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'MatchApp Recommendation',
                    text: `Check out my match: ${currentMatchTitle}!`,
                    url: 'https://matchapp.cc',
                });
            } catch (err) { console.log('Share canceled'); }
        } else {
            alert('Sharing link copied to clipboard!');
            navigator.clipboard.writeText('https://matchapp.cc');
        }
    });

    // Matchmaking Logic
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check Freemium Limits (Custom detailed alert)
        if (!currentUser) {
            if (localStorage.getItem('hasUsedFreeMatch') === 'true') {
                alert("🔒 You have already used your free match!\n\nPlease register or log in (at the top of the page) to unlock your daily matches.");
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return; 
            }
        } else {
            try {
                const { data } = await supabase.from('user_matches').select('last_match_timestamp').eq('id', currentUser.id).single();
                if (data && data.last_match_timestamp) {
                    const diffHours = Math.abs(new Date() - new Date(data.last_match_timestamp)) / 36e5;
                    if (diffHours < 24) {
                        alert(`⏳ You must wait ${Math.ceil(24 - diffHours)} hours for your next free match.`);
                        return; 
                    }
                }
            } catch (e) {
                console.warn("DB check skipped.");
            }
        }

        // --- GATHER & FILTER DATA ---
        try {
            const userAge = parseInt(document.getElementById('age').value) || 18;
            const userCountry = document.getElementById('country').value || "Global";
            const format = document.getElementById('format').value;
            const mood = document.getElementById('mood').value;
            const era = document.getElementById('era').value;
            const lang = document.getElementById('langpref').value;
            const platform = document.getElementById('platform').value;
            
            let results = contentCatalog.filter(item => 
                userAge >= item.minAge && item.format === format && item.mood === mood &&
                (era === 'any' || item.era === era) && (platform === 'any' || item.streamingOn.includes(platform))
            );

            if (results.length === 0) results = contentCatalog.filter(item => userAge >= item.minAge && item.format === format && item.mood === mood);
            if (results.length === 0) results = contentCatalog;

            let finalMatch = results[Math.floor(Math.random() * results.length)];
            currentMatchTitle = finalMatch.title;

            // Transition
            document.getElementById('questionnaire-screen').classList.add('hidden');
            document.getElementById('loading-screen').classList.remove('hidden');

            setTimeout(async () => {
                document.getElementById('loading-screen').classList.add('hidden');
                
                // Populate Modal Content
                document.getElementById('modal-poster').src = finalMatch.poster;
                document.getElementById('modal-title').innerText = finalMatch.title;
                document.getElementById('modal-imdb').innerText = `⭐ ${finalMatch.imdb} IMDb`;
                document.getElementById('modal-length').innerText = `⏱️ ${finalMatch.length}`;
                document.getElementById('modal-age').innerText = `🔞 Rated ${finalMatch.minAge}+`;
                document.getElementById('modal-description').innerText = finalMatch.description;
                document.getElementById('modal-user-country').innerText = userCountry;
                document.getElementById('modal-streaming').innerText = finalMatch.streamingOn.join(" • ");
                document.getElementById('modal-audio-pref').innerText = `Preference: ${lang.toUpperCase()}`;

                resultModal.classList.remove('hidden');

                // Save usage
                if (!currentUser) {
                    localStorage.setItem('hasUsedFreeMatch', 'true');
                } else {
                    await supabase.from('user_matches').upsert({ id: currentUser.id, last_match_timestamp: new Date().toISOString() });
                }
            }, 1800); 

        } catch (error) {
            console.error(error);
            alert("Something went wrong calculating your match. Please try again!");
            location.reload();
        }
    });
});
