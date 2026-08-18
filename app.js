console.log("App script running.");

const catalog = [
    { title: "Avenida Brasil", format: "telenovela", mood: "drama", minAge: 14, streaming: ["Globoplay"], poster: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80", desc: "A gripping story of revenge and family secrets in Rio de Janeiro." },
    { title: "Parasite", format: "movie", mood: "drama", minAge: 16, streaming: ["Max"], poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80", desc: "A South Korean masterpiece exploring class discrimination." },
    { title: "The Matrix", format: "movie", mood: "scifi", minAge: 14, streaming: ["Max", "Prime Video"], poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80", desc: "A hacker discovers the shocking truth about reality." },
    { title: "Breaking Bad", format: "series", mood: "drama", minAge: 18, streaming: ["Netflix"], poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80", desc: "A chemistry teacher turns to manufacturing methamphetamine." }
];

window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-generate');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const age = parseInt(document.getElementById('input-age').value) || 18;
        const format = document.getElementById('input-format').value;
        const mood = document.getElementById('input-mood').value;

        if (age < 16) {
            alert("⚠️ You must be at least 16 years old.");
            return;
        }

        // Filter catalog
        let matches = catalog.filter(item => age >= item.minAge && item.format === format && item.mood === mood);
        if (matches.length === 0) matches = catalog;

        const selected = matches[Math.floor(Math.random() * matches.length)];

        // Direct DOM unhide (Guaranteed to show result)
        document.getElementById('questionnaire-box').style.display = 'none';
        document.getElementById('result-box').style.display = 'block';

        document.getElementById('res-title').innerText = selected.title;
        document.getElementById('res-poster').src = selected.poster;
        document.getElementById('res-desc').innerText = selected.desc;
        document.getElementById('res-platform').innerText = selected.streaming.join(" • ");
    });
});
