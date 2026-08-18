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

document.addEventListener('DOMContentLoaded', () => {
    const queryData = JSON.parse(localStorage.getItem('matchQuery')) || { age: 18, country: 'Global', format: 'movie', mood: 'drama', era: 'any', lang: 'subtitled', platform: 'any' };

    let results = contentCatalog.filter(i => 
        queryData.age >= i.minAge && i.format === queryData.format && i.mood === queryData.mood &&
        (queryData.era === 'any' || i.era === queryData.era) && (queryData.platform === 'any' || i.streamingOn.includes(queryData.platform))
    );

    if (results.length === 0) results = contentCatalog.filter(i => queryData.age >= i.minAge && i.format === queryData.format && i.mood === queryData.mood);
    if (results.length === 0) results = contentCatalog;

    let match = results[Math.floor(Math.random() * results.length)];
    localStorage.setItem('currentMatch', JSON.stringify({ match, country: queryData.country, lang: queryData.lang }));

    // Loading Bar Animation
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('loading-text');
    let width = 0;

    setTimeout(() => text.innerText = "Scanning global catalogs...", 800);
    setTimeout(() => text.innerText = "Locating streaming rights...", 1600);

    let interval = setInterval(() => {
        width += 5;
        if (bar) bar.style.width = width + '%';
        if (width >= 100) {
            clearInterval(interval);
            window.location.href = 'result.html';
        }
    }, 50);
});
