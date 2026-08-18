document.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(localStorage.getItem('currentMatch'));
    if (!data) {
        window.location.href = 'index.html';
        return;
    }

    const { match, country, lang } = data;

    document.getElementById('result-poster').src = match.poster;
    document.getElementById('result-title').innerText = match.title;
    document.getElementById('result-imdb').innerText = `⭐ ${match.imdb}`;
    document.getElementById('result-length').innerText = `⏱️ ${match.length}`;
    document.getElementById('result-age').innerText = `🔞 ${match.minAge}+`;
    document.getElementById('result-desc').innerText = match.description;
    document.getElementById('result-country').innerText = country;
    document.getElementById('result-platform').innerText = match.streamingOn.join(" • ");
    document.getElementById('result-audio').innerText = `Audio: ${lang.toUpperCase()}`;

    // Social shares
    document.getElementById('share-wa').addEventListener('click', () => window.open(`https://api.whatsapp.com/send?text=I got ${match.title} on MatchApp! https://matchapp.cc`, '_blank'));
    document.getElementById('share-x').addEventListener('click', () => window.open(`https://twitter.com/intent/tweet?text=I got ${match.title} on MatchApp! https://matchapp.cc`, '_blank'));
    document.getElementById('share-fb').addEventListener('click', () => window.open(`https://www.facebook.com/sharer/sharer.php?u=https://matchapp.cc`, '_blank'));
    document.getElementById('share-more').addEventListener('click', async () => {
        if (navigator.share) await navigator.share({ title: 'MatchApp', text: `My match: ${match.title}`, url: 'https://matchapp.cc' });
        else { navigator.clipboard.writeText('https://matchapp.cc'); alert("Link Copied!"); }
    });
});
