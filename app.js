console.log("Mastercode 102: OS-Level DeepLinks, Never-Fail Covers, & Premium FX Active");

const SUPABASE_URL = 'https://zkymvqrmbabngsqblyye.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpreW12cXJtYmFibmdzcWJseXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDUyNDIsImV4cCI6MjEwMjM4MTI0Mn0._yEVFMfwVU6GBqQ8m3ljfOgA0HSLEDiKMOfYae6ZD8Q';

let supabaseClient = null;
try { if (window.supabase) supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch (e) {}
window.supabaseClient = supabaseClient;

let globalMatchTitle = ""; let globalMatchPoster = ""; let globalPlatform = ""; let isUserLoggedIn = false;
let isVIP = localStorage.getItem('match_isVIP') === 'true';

// ----------------------------------------------------
// PORTFOLIO LISTS (Watch Later / Seen It / Disliked)
// ----------------------------------------------------
let seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
let savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
let dislikedList = JSON.parse(localStorage.getItem('match_dislikedList') || '[]');
let userRatings = JSON.parse(localStorage.getItem('match_userRatings') || '{}');
// Titles shown recently, so the same result never repeats back-to-back.
let recentTitles = JSON.parse(localStorage.getItem('match_recentTitles') || '[]');

// ----------------------------------------------------
// THE LIMIT LOGIC (3 Free, 5 Registered, 10 VIP)
// ----------------------------------------------------
function checkDailyLimit() {
    const todayStr = new Date().toLocaleDateString(); 
    let lastDate = localStorage.getItem('match_lastDate'); 
    let dailyCount = parseInt(localStorage.getItem('match_dailyCount') || '0');
    
    if (lastDate !== todayStr) { dailyCount = 0; localStorage.setItem('match_lastDate', todayStr); }
    
    let maxLimit = 3; 
    if (isUserLoggedIn && !isVIP) maxLimit = 5; 
    if (isVIP) maxLimit = 10; 
    
    if (dailyCount >= maxLimit) {
        if (!isUserLoggedIn) {
            alert("🔒 You've used your 3 free searches today!\n\nRegister for FREE to unlock 5 daily searches."); 
            window.openAuthModal();
        } else if (!isVIP) {
            alert("🔒 You've used your 5 registered searches today!\n\nUpgrade to VIP for 10 daily searches."); 
            window.location.href = '/pricing/pricing.html';
        } else {
            alert("💎 VIP Limit Reached! You've used your 10 daily searches.");
        }
        return false;
    }
    
    dailyCount++; 
    localStorage.setItem('match_dailyCount', dailyCount.toString()); 
    return true;
}

// ----------------------------------------------------
// AUDIO & FX ENGINE
// ----------------------------------------------------
window.playPremiumSound = function() {
    try { 
        const ctx = new (window.AudioContext || window.webkitAudioContext)(); 
        const osc = ctx.createOscillator(); 
        const gain = ctx.createGain(); 
        osc.connect(gain); gain.connect(ctx.destination); 
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(600, ctx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); 
        gain.gain.setValueAtTime(0.3, ctx.currentTime); 
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2); 
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2); 
    } catch (e) { console.log("Audio FX skipped"); }
};

// ----------------------------------------------------
// "NEVER-FAIL" COVER DICTIONARY & GENERATOR
// ----------------------------------------------------
// NOTE: Only verified-live TMDB paths belong here. Several previous entries were
// invalid poster hashes that 404'd, which is why covers fell back to text placeholders.
const OFFLINE_COVERS = {
    "The Bear": "https://image.tmdb.org/t/p/w500/q2gJGrH0aGZ1X1qP440xQzKqOee.jpg",
    "Shogun": "https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WwSCSOOOQ.jpg",
    "House of the Dragon": "https://image.tmdb.org/t/p/w500/t9XkeE7HzOsdQcOGaTOFdZCEYnF.jpg",
    "Deadpool & Wolverine": "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    "Dune: Part Two": "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGjjc9CW.jpg",
    "Jujutsu Kaisen": "https://image.tmdb.org/t/p/w500/hFWP5HkbVEe40hrptlzSyDpFBqw.jpg"
};

// In-memory cache so the same title never re-hits the network twice per session.
const COVER_CACHE = {};

function generatedCover(title) {
    return `https://placehold.co/600x900/1a0505/E5C158?text=${encodeURIComponent((title || 'MatchApp').replace(/ /g, '+'))}`;
}

function upgradeArtwork(url) {
    if (!url) return null;
    return url.replace('100x100bb', '600x900bb').replace('/100x100', '/600x900');
}

async function itunesLookup(title, media) {
    const rich = await itunesRichLookup(title, media);
    return rich ? rich.artwork : null;
}

// ----------------------------------------------------
// RICH METADATA ENGINE (keyless iTunes Search API)
// One call returns artwork, an actual trailer/preview clip, and the store link.
// Apple's API terms require previews be displayed alongside a store link, so
// every preview we render also renders its trackViewUrl badge.
// ----------------------------------------------------
const META_CACHE = {};

async function itunesRichLookup(title, media) {
    if (!title) return null;
    const cacheKey = `${title}::${media}`;
    if (META_CACHE[cacheKey] !== undefined) return META_CACHE[cacheKey];
    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(title)}&media=${media}&limit=1`);
        if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const r = data.results[0];
                if (r.artworkUrl100 || r.previewUrl) {
                    const meta = {
                        title: r.trackName || r.collectionName || title,
                        artwork: upgradeArtwork(r.artworkUrl100),
                        preview: r.previewUrl || null,
                        storeUrl: r.trackViewUrl || r.collectionViewUrl || null,
                        kind: r.kind || media,
                        year: r.releaseDate ? String(r.releaseDate).substring(0, 4) : null,
                        description: r.longDescription || r.shortDescription || null
                    };
                    META_CACHE[cacheKey] = meta;
                    return meta;
                }
            }
        }
    } catch (e) {}
    META_CACHE[cacheKey] = null;
    return null;
}

// Tries each media type until one returns usable art/preview for this title.
// Media kinds that carry an actual moving-picture preview.
const VIDEO_MEDIA = ['movie', 'tvShow', 'shortFilm', 'musicVideo'];
function isVideoPreview(meta) {
    if (!meta || !meta.preview) return false;
    // Apple serves video previews as .m4v/.mp4/.mov; audio as .m4a/.mp3.
    if (/\.(m4v|mp4|mov)(\?|$)/i.test(meta.preview)) return true;
    if (/\.(m4a|mp3|aac|wav)(\?|$)/i.test(meta.preview)) return false;
    // Fall back on the iTunes `kind` when the extension is inconclusive.
    return /movie|tv|video|short/i.test(meta.kind || '');
}

async function getRichMetadata(title, categoryHint) {
    const hint = (categoryHint || '').toLowerCase();
    const wantsAudio = /podcast|playlist|music|single|album|audiobook|spotify/.test(hint);

    let order;
    if (wantsAudio) {
        // Audio request: audio sources first, and a video preview is fine too.
        if (hint.includes('podcast')) order = ['podcast', 'audiobook', 'musicTrack', 'album'];
        else if (hint.includes('audiobook')) order = ['audiobook', 'podcast', 'musicTrack'];
        else order = ['musicTrack', 'album', 'musicVideo', 'podcast'];
    } else {
        // Visual request: ONLY search visual catalogs. Searching podcast/audiobook
        // here is what caused a film to come back as a spoken-word narration.
        order = ['movie', 'tvShow', 'shortFilm', 'musicVideo'];
    }

    let bestArtworkOnly = null;
    for (const media of order) {
        const meta = await itunesRichLookup(title, media);
        if (!meta) continue;
        if (wantsAudio) { if (meta.artwork || meta.preview) return meta; }
        else {
            // For visual picks, only accept a preview that is genuinely video.
            if (isVideoPreview(meta)) return meta;
            // Otherwise keep the artwork but drop the (audio) preview.
            if (meta.artwork && !bestArtworkOnly) bestArtworkOnly = { ...meta, preview: null };
        }
    }
    return bestArtworkOnly;
}

async function getRealCoverImage(title) {
    if (!title) return generatedCover(title);
    if (COVER_CACHE[title]) return COVER_CACHE[title];

    const cacheAndReturn = (url) => { COVER_CACHE[title] = url; return url; };

    // 1. Offline Dictionary (fast path for known hero titles)
    const matchKey = Object.keys(OFFLINE_COVERS).find(k => title.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(title.toLowerCase()));
    if (matchKey) return cacheAndReturn(OFFLINE_COVERS[matchKey]);

    // 2. iTunes across several media types (movies, TV, podcasts, music).
    //    Podcast/music included so Spotify + podcast matches also get real art.
    for (const media of ['movie', 'tvShow', 'podcast', 'music']) {
        const art = await itunesLookup(title, media);
        if (art) return cacheAndReturn(art);
    }

    // 3. TVMaze (strong for international + K-drama series)
    try {
        const tvRes = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(title)}`);
        if (tvRes.ok) {
            const tvData = await tvRes.json();
            if (tvData && tvData.image && (tvData.image.original || tvData.image.medium)) {
                return cacheAndReturn(tvData.image.original || tvData.image.medium);
            }
        }
    } catch(e) {}

    // 4. ABSOLUTE FALLBACK: Dynamic Text Image Generator (Impossible to fail)
    return cacheAndReturn(generatedCover(title));
}

// LOCAL (NO-NETWORK) POSTER — guaranteed to render even if placehold.co is blocked too.
function generateLocalPosterSVG(title) {
    const safeTitle = (title || 'MatchApp').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
        <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#130734"/><stop offset="100%" stop-color="#6B3FA0"/>
        </linearGradient></defs>
        <rect width="600" height="900" fill="url(#g)"/>
        <rect x="20" y="20" width="560" height="860" fill="none" stroke="#E5C158" stroke-width="4"/>
        <text x="300" y="440" font-family="Arial, sans-serif" font-size="40" font-weight="900" fill="#E5C158" text-anchor="middle">${safeTitle.length > 26 ? safeTitle.substring(0, 24) + '…' : safeTitle}</text>
        <text x="300" y="500" font-family="Arial, sans-serif" font-size="20" fill="#FFF0B3" text-anchor="middle">MatchApp.cc</text>
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// ----------------------------------------------------
// MARQUEE COVER HYDRATION
// Replaces any placeholder/broken marquee art with real covers on page load.
// ----------------------------------------------------
async function hydrateMarqueeCovers() {
    const imgs = document.querySelectorAll('.marquee-item img');

    // Paint an instant local placeholder so a cover is visible on first frame —
    // previously the hardcoded TMDB URLs were dead, the inline onerror nulled
    // itself out, and the tile ended up blank with only the title showing.
    imgs.forEach(img => {
        const title = img.getAttribute('data-title') || img.getAttribute('alt') || '';
        if (!img.getAttribute('src')) img.src = generateLocalPosterSVG(title);
    });

    // Then hydrate every tile in parallel so the strip fills quickly.
    await Promise.all(Array.from(imgs).map(async img => {
        const title = img.getAttribute('data-title') || img.getAttribute('alt');
        if (!title) return;
        try {
            const meta = await getRichMetadata(title, 'series');
            const real = (meta && meta.artwork) ? meta.artwork : await getRealCoverImage(title);
            if (real) {
                img.onerror = function() { this.onerror = null; this.src = generateLocalPosterSVG(title); };
                img.src = real;
            }
        } catch (e) { /* placeholder already showing */ }
    }));
}
document.addEventListener('DOMContentLoaded', hydrateMarqueeCovers);

window.selectMarqueeItem = function(titleName) {
    const searchInput = document.getElementById('specific-search-input');
    const searchBox = document.getElementById('search-box');
    if (searchInput && searchBox) { 
        searchInput.value = titleName; 
        searchBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
        searchInput.focus(); 
    }
};

window.openAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'flex'; };
window.closeAuthModal = function() { document.getElementById('main-auth-modal').style.display = 'none'; };
window.switchAuthTab = function(tab) {
    ['login', 'signup'].forEach(t => { document.getElementById(`tab-${t}`)?.classList.remove('active'); document.getElementById(`form-${t}`)?.classList.remove('active'); });
    document.getElementById(`tab-${tab}`)?.classList.add('active'); document.getElementById(`form-${tab}`)?.classList.add('active');
};

// ----------------------------------------------------
// AUTH LOGIC
// ----------------------------------------------------
window.handleEmailSignup = async function() {
    const email = document.getElementById('reg-email').value.trim(); 
    const password = document.getElementById('reg-password').value; 
    const msgEl = document.getElementById('auth-message');
    
    if (!supabaseClient) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = "Database connection offline."; return; }
    if(!email || !password) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = "Please provide an email and password."; return; }
    
    msgEl.style.display = 'block'; msgEl.style.color = '#fff'; msgEl.style.background = 'rgba(229,193,88,0.2)'; msgEl.innerText = "Creating account...";
    
    try {
        const { error } = await supabaseClient.auth.signUp({ email, password });
        if(error) { 
            msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = error.message; 
        } else { 
            msgEl.style.color = '#25D366'; msgEl.style.background = 'rgba(37,211,102,0.1)'; msgEl.innerText = "Account created! Routing to Profile Hub..."; 
            setTimeout(() => { window.location.href = '/profile/profile.html'; }, 1500); 
        }
    } catch(err) {
        msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = "Critical registration error.";
    }
};

window.handleEmailLogin = async function() {
    const email = document.getElementById('login-email').value.trim(); 
    const password = document.getElementById('login-password').value; 
    const msgEl = document.getElementById('auth-message');
    
    if (!supabaseClient) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = "Database connection offline."; return; }
    if(!email || !password) { msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = "Please enter email and password."; return; }
    
    msgEl.style.display = 'block'; msgEl.style.color = '#fff'; msgEl.style.background = 'rgba(229,193,88,0.2)'; msgEl.innerText = "Authenticating...";
    
    try {
        const { error, data } = await supabaseClient.auth.signInWithPassword({ email, password });
        if(error) { 
            msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = error.message; 
        } else if (data.user) { 
            msgEl.style.color = '#25D366'; msgEl.style.background = 'rgba(37,211,102,0.1)'; msgEl.innerText = "Welcome back! Routing to Home..."; 
            setTimeout(() => { window.location.reload(); }, 1000); 
        }
    } catch(err) {
        msgEl.style.color = '#ff5252'; msgEl.style.background = 'rgba(255,0,0,0.1)'; msgEl.innerText = "Critical authentication error.";
    }
};

window.doLogout = async function() { if (supabaseClient) { await supabaseClient.auth.signOut(); } localStorage.clear(); window.location.href = '/index.html'; };

if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
            isUserLoggedIn = true;
            document.getElementById('nav-reg-btn').style.display = 'none'; 
            document.getElementById('nav-logout-btn').style.display = 'inline-block';
            document.getElementById('profile-link-tab').style.display = 'inline-flex';
        }
    });
}

// ----------------------------------------------------
// AI MATCH EXECUTION
// ----------------------------------------------------
async function fetchGeminiData(promptText) {
    if (!supabaseClient) throw new Error("Database not connected");
    const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', { body: { prompt: promptText } });
    if (error || !data || !data.candidates) throw new Error("API Error");
    
    let rawText = data.candidates[0].content.parts[0].text;
    let startIndex = rawText.indexOf('{'); let endIndex = rawText.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) { return JSON.parse(rawText.substring(startIndex, endIndex + 1)); }
    throw new Error("Invalid format");
}

// ----------------------------------------------------
// CLIENT-SIDE MATCHMAKING CATALOG
// Used whenever the Gemini proxy is unavailable, so users NEVER see the
// same hardcoded title twice in a row. Real, well-known titles across
// every category/platform offered in the questionnaire.
// ----------------------------------------------------
const CONTENT_CATALOG = [
    { title: "The Bear", synopsis: "A young chef returns home to run his family's Chicago sandwich shop after a family tragedy.", platform: "Hulu", cats: ["series"], moods: ["intense and thrilling","dark and gritty"], vibes: ["fast-paced binge-worthy","prestige and critically acclaimed"], ratings: ["teen PG-13","mature adults only R rated","any"] },
    { title: "Shogun", synopsis: "A political thriller set in feudal Japan following a shipwrecked English sailor caught in a power struggle.", platform: "Hulu", cats: ["series","limited series"], moods: ["intense and thrilling","epic and adventurous"], vibes: ["prestige and critically acclaimed","slow burn"], ratings: ["teen PG-13","mature adults only R rated","any"] },
    { title: "Dune: Part Two", synopsis: "Paul Atreides unites with the Fremen to seek revenge against the conspirators who destroyed his family.", platform: "Max", cats: ["movie"], moods: ["epic and adventurous","intense and thrilling"], vibes: ["prestige and critically acclaimed","fast-paced binge-worthy"], ratings: ["teen PG-13","any"] },
    { title: "Deadpool & Wolverine", synopsis: "A fast, foul-mouthed superhero team-up across the Marvel multiverse.", platform: "Disney+", cats: ["movie"], moods: ["funny","intense and thrilling"], vibes: ["fast-paced binge-worthy","guilty pleasure"], ratings: ["mature adults only R rated","any"] },
    { title: "House of the Dragon", synopsis: "Two centuries before Game of Thrones, the Targaryen dynasty tears itself apart in civil war.", platform: "Max", cats: ["series"], moods: ["dark and gritty","epic and adventurous"], vibes: ["prestige and critically acclaimed","long running series"], ratings: ["mature adults only R rated","any"] },
    { title: "Queen of Tears", synopsis: "A K-drama about a wealthy heiress and her husband navigating love, betrayal and a terminal illness twist.", platform: "Viki", cats: ["K-drama","series"], moods: ["romantic","heartbreaking"], vibes: ["slow burn","long running series"], ratings: ["teen PG-13","any"] },
    { title: "Crash Landing on You", synopsis: "A South Korean heiress paraglides into North Korea and falls for the officer who hides her.", platform: "Netflix", cats: ["K-drama","series"], moods: ["romantic","light and feel-good"], vibes: ["slow burn","fast-paced binge-worthy"], ratings: ["teen PG-13","any"] },
    { title: "Jujutsu Kaisen", synopsis: "A boy swallows a cursed talisman and joins a secret school to battle supernatural threats.", platform: "Crunchyroll", cats: ["anime"], moods: ["intense and thrilling","dark and gritty"], vibes: ["fast-paced binge-worthy","long running series"], ratings: ["teen PG-13","any"] },
    { title: "Frieren: Beyond Journey's End", synopsis: "An elven mage reflects on mortality and friendship long after her adventuring party has aged and passed.", platform: "Crunchyroll", cats: ["anime"], moods: ["cozy comfort watch","heartbreaking"], vibes: ["slow burn","award winning"], ratings: ["all ages family friendly","any"] },
    { title: "A Vida Secreta do Meu Marido Bilionário", synopsis: "A Brazilian vertical novela about a woman who discovers her husband is secretly a billionaire tycoon.", platform: "ReelShort", cats: ["vertical micro-drama","novela brasileira"], moods: ["romantic","intense and thrilling"], vibes: ["guilty pleasure","one sitting short watch"], ratings: ["teen PG-13","any"] },
    { title: "CEO's Contract Bride", synopsis: "A gripping vertical micro-drama romance between a ruthless CEO and the woman forced into a marriage of convenience.", platform: "DramaBox", cats: ["vertical micro-drama"], moods: ["romantic","guilty pleasure"], vibes: ["one sitting short watch","fast-paced binge-worthy"], ratings: ["teen PG-13","any"] },
    { title: "Vale Tudo", synopsis: "A classic Brazilian telenovela about family rivalry, ambition and moral compromise in Rio de Janeiro.", platform: "Globoplay", cats: ["novela brasileira","telenovela"], moods: ["dark and gritty","intense and thrilling"], vibes: ["long running series","award winning"], ratings: ["mature adults only R rated","any"] },
    { title: "The Joe Rogan Experience", synopsis: "Long-form conversations spanning comedy, science, MMA and culture.", platform: "Spotify", cats: ["podcast"], moods: ["funny","inspiring"], vibes: ["easy background watch","long running series"], ratings: ["mature adults only R rated","any"] },
    { title: "SmartLess", synopsis: "Three friends surprise each other with a mystery guest for freewheeling, funny conversation.", platform: "Spotify", cats: ["podcast"], moods: ["funny","light and feel-good"], vibes: ["easy background watch"], ratings: ["all ages family friendly","any"] },
    { title: "Baby Reindeer", synopsis: "A darkly comic true story about a struggling comedian stalked by a woman he shows a moment of kindness.", platform: "Netflix", cats: ["limited series","series"], moods: ["dark and gritty","heartbreaking"], vibes: ["award winning","prestige and critically acclaimed"], ratings: ["mature adults only R rated","any"] },
    { title: "Fallout", synopsis: "Generations after a nuclear apocalypse, surface dwellers and vault dwellers collide in a darkly funny wasteland.", platform: "Prime Video", cats: ["series"], moods: ["dark and gritty","funny"], vibes: ["fast-paced binge-worthy","award winning"], ratings: ["mature adults only R rated","any"] },
    { title: "Bluey", synopsis: "An imaginative six-year-old Blue Heeler pup and her family turn everyday life into playful adventure.", platform: "Disney+", cats: ["kids","series"], moods: ["light and feel-good","cozy comfort watch"], vibes: ["easy background watch","award winning"], ratings: ["all ages family friendly","kids","any"] },
    { title: "Moana 2", synopsis: "Moana sets sail on a new ocean adventure alongside Maui to reconnect with scattered island peoples.", platform: "Disney+", cats: ["movie","kids"], moods: ["epic and adventurous","inspiring"], vibes: ["fast-paced binge-worthy"], ratings: ["all ages family friendly","kids","any"] },
    { title: "Nimona", synopsis: "A knight framed for a crime teams up with a shapeshifting teen to clear his name in a sci-fi/medieval kingdom.", platform: "Netflix", cats: ["movie","kids","anime"], moods: ["funny","inspiring"], vibes: ["fast-paced binge-worthy"], ratings: ["all ages family friendly","teen PG-13","any"] },
    { title: "Cosmos: Possible Worlds", synopsis: "A documentary journey through space, time and the origins of scientific discovery.", platform: "Netflix", cats: ["documentary"], moods: ["inspiring","mind-bending"], vibes: ["easy background watch","award winning"], ratings: ["all ages family friendly","any"] },
    { title: "Chef's Table", synopsis: "An intimate documentary series profiling the world's most creative chefs and their craft.", platform: "Netflix", cats: ["documentary"], moods: ["inspiring","cozy comfort watch"], vibes: ["easy background watch","hidden gem underrated"], ratings: ["all ages family friendly","any"] },
    { title: "John Mulaney: Baby J", synopsis: "A stand-up special turning the comedian's very public struggles into sharp, self-deprecating comedy.", platform: "Netflix", cats: ["stand-up comedy special"], moods: ["funny"], vibes: ["one sitting short watch","award winning"], ratings: ["mature adults only R rated","any"] },
    { title: "Love Is Blind", synopsis: "Singles date and get engaged sight unseen, meeting face-to-face only after saying yes.", platform: "Netflix", cats: ["reality show"], moods: ["romantic","funny"], vibes: ["guilty pleasure","fast-paced binge-worthy"], ratings: ["teen PG-13","any"] },
    { title: "Alcarràs", synopsis: "A Catalan farming family faces their final harvest as their land is sold for solar panels.", platform: "MUBI", cats: ["European cinema","movie"], moods: ["heartbreaking","nostalgic"], vibes: ["slow burn","hidden gem underrated"], ratings: ["all ages family friendly","any"] },
    { title: "RRR", synopsis: "Two revolutionaries in colonial India form an epic, action-packed friendship in this Tollywood blockbuster.", platform: "Netflix", cats: ["Bollywood","movie"], moods: ["epic and adventurous","intense and thrilling"], vibes: ["fast-paced binge-worthy","award winning"], ratings: ["teen PG-13","any"] },
    { title: "Business Proposal", synopsis: "A woman goes on a blind date pretending to be someone else — and it turns out to be her own CEO.", platform: "Viki", cats: ["K-drama","series"], moods: ["light and feel-good","romantic"], vibes: ["fast-paced binge-worthy","guilty pleasure"], ratings: ["teen PG-13","any"] },
    { title: "Rebel Moon", synopsis: "A peaceful colony on the edge of the galaxy sends a warrior to recruit fighters against a tyrannical regime.", platform: "Netflix", cats: ["movie"], moods: ["epic and adventurous","intense and thrilling"], vibes: ["fast-paced binge-worthy","guilty pleasure"], ratings: ["mature adults only R rated","any"] },
    { title: "Midnight Diner", synopsis: "A quiet late-night Tokyo diner serves comfort food and even more comforting stories to its regulars.", platform: "Netflix", cats: ["J-drama","series"], moods: ["cozy comfort watch","nostalgic"], vibes: ["easy background watch","hidden gem underrated"], ratings: ["all ages family friendly","any"] },
    { title: "Kingdom", synopsis: "A Korean crown prince investigates a mysterious plague that turns the dead into the undead.", platform: "Netflix", cats: ["K-drama","series"], moods: ["scary","dark and gritty"], vibes: ["fast-paced binge-worthy","hidden gem underrated"], ratings: ["mature adults only R rated","any"] },
    { title: "Emilia Pérez", synopsis: "A Mexican cartel leader seeks a secret gender transition, told as a genre-defying musical thriller.", platform: "Netflix", cats: ["movie","European cinema"], moods: ["mind-bending","intense and thrilling"], vibes: ["prestige and critically acclaimed","award winning"], ratings: ["mature adults only R rated","any"] }
];

// ----------------------------------------------------
// PLATFORM INTELLIGENCE CATALOG
// Single source of truth powering: cascading dropdowns (only show platforms
// that actually carry the chosen format), country-aware filtering for
// registered users, audio-vs-video routing, and footer backlinks.
//   cats     : formats this platform actually carries
//   countries: ISO-ish country names it serves; ['*'] = worldwide
//   audio    : true = music/spoken audio service (drives Listen Later wording)
// ----------------------------------------------------
const PLATFORMS = {
    "Netflix":        { group: "Global Giants", audio: false, countries: ['*'], cats: ["movie","series","limited series","documentary","stand-up comedy special","reality show","K-drama","anime","kids","short film","Bollywood","European cinema","telenovela","C-drama","J-drama","Turkish dizi"], url: "https://www.netflix.com", search: t => `https://www.netflix.com/search?q=${encodeURIComponent(t)}` },
    "Prime Video":    { group: "Global Giants", audio: false, countries: ['*'], cats: ["movie","series","limited series","documentary","stand-up comedy special","reality show","anime","kids","Bollywood","European cinema","Nollywood"], url: "https://www.primevideo.com", search: t => `https://www.primevideo.com/search?phrase=${encodeURIComponent(t)}` },
    "Disney+":        { group: "Global Giants", audio: false, countries: ['*'], cats: ["movie","series","limited series","documentary","kids","anime"], url: "https://www.disneyplus.com", search: t => `https://www.disneyplus.com/search?q=${encodeURIComponent(t)}` },
    "Max":            { group: "Global Giants", audio: false, countries: ['*'], cats: ["movie","series","limited series","documentary","stand-up comedy special","reality show","kids","anime"], url: "https://www.max.com", search: t => `https://www.max.com/search?q=${encodeURIComponent(t)}` },
    "Apple TV+":      { group: "Global Giants", audio: false, countries: ['*'], cats: ["movie","series","limited series","documentary","kids","short film"], url: "https://tv.apple.com", search: t => `https://tv.apple.com/search?term=${encodeURIComponent(t)}` },
    "Paramount+":     { group: "Global Giants", audio: false, countries: ['*'], cats: ["movie","series","limited series","documentary","reality show","kids","telenovela"], url: "https://www.paramountplus.com", search: t => `https://www.paramountplus.com/search/?q=${encodeURIComponent(t)}` },
    "Hulu":           { group: "Global Giants", audio: false, countries: ['United States'], cats: ["movie","series","limited series","documentary","reality show","anime","stand-up comedy special"], url: "https://www.hulu.com", search: t => `https://www.hulu.com/search?q=${encodeURIComponent(t)}` },
    "Peacock":        { group: "Global Giants", audio: false, countries: ['United States'], cats: ["movie","series","limited series","documentary","reality show","kids"], url: "https://www.peacocktv.com", search: t => `https://www.peacocktv.com/search?q=${encodeURIComponent(t)}` },

    "ReelShort":      { group: "Vertical Micro-Drama Apps", audio: false, countries: ['*'], cats: ["vertical micro-drama","short film"], url: "https://www.reelshort.com", search: t => `https://www.reelshort.com/search?keyword=${encodeURIComponent(t)}` },
    "DramaBox":       { group: "Vertical Micro-Drama Apps", audio: false, countries: ['*'], cats: ["vertical micro-drama","short film"], url: "https://www.dramaboxapp.com", search: t => `https://www.dramaboxapp.com/search?q=${encodeURIComponent(t)}` },
    "ShortMax":       { group: "Vertical Micro-Drama Apps", audio: false, countries: ['*'], cats: ["vertical micro-drama","short film"], url: "https://www.shortmax.com", search: t => `https://www.shortmax.com` },
    "GoodShort":      { group: "Vertical Micro-Drama Apps", audio: false, countries: ['*'], cats: ["vertical micro-drama","short film"], url: "https://www.goodshort.com", search: t => `https://www.goodshort.com` },
    "FlexTV":         { group: "Vertical Micro-Drama Apps", audio: false, countries: ['*'], cats: ["vertical micro-drama","short film"], url: "https://www.flextv.cc", search: t => `https://www.flextv.cc` },

    "Globoplay":      { group: "Brazil", audio: false, countries: ['Brazil','Brasil','Portugal'], cats: ["novela brasileira","telenovela","series","movie","documentary","reality show","kids"], url: "https://globoplay.globo.com", search: t => `https://globoplay.globo.com/busca/?q=${encodeURIComponent(t)}` },
    "Viki":           { group: "Regional & Local", audio: false, countries: ['*'], cats: ["K-drama","C-drama","J-drama","series","movie","Turkish dizi"], url: "https://www.viki.com", search: t => `https://www.viki.com/search?q=${encodeURIComponent(t)}` },
    "Crunchyroll":    { group: "Regional & Local", audio: false, countries: ['*'], cats: ["anime","movie","series"], url: "https://www.crunchyroll.com", search: t => `https://www.crunchyroll.com/search?q=${encodeURIComponent(t)}` },
    "Hotstar":        { group: "Regional & Local", audio: false, countries: ['India'], cats: ["Bollywood","movie","series","documentary","reality show","kids"], url: "https://www.hotstar.com", search: t => `https://www.hotstar.com/in/search?q=${encodeURIComponent(t)}` },
    "iQIYI":          { group: "Regional & Local", audio: false, countries: ['*'], cats: ["C-drama","K-drama","anime","movie","series"], url: "https://www.iq.com", search: t => `https://www.iq.com/search?query=${encodeURIComponent(t)}` },
    "WeTV":           { group: "Regional & Local", audio: false, countries: ['*'], cats: ["C-drama","K-drama","Thai drama","movie","series"], url: "https://wetv.vip", search: t => `https://wetv.vip/search?q=${encodeURIComponent(t)}` },
    "Viu":            { group: "Regional & Local", audio: false, countries: ['*'], cats: ["K-drama","C-drama","Turkish dizi","movie","series"], url: "https://www.viu.com", search: t => `https://www.viu.com/ott/search?q=${encodeURIComponent(t)}` },
    "MUBI":           { group: "Regional & Local", audio: false, countries: ['*'], cats: ["movie","European cinema","short film","documentary"], url: "https://mubi.com", search: t => `https://mubi.com/search/${encodeURIComponent(t)}` },

    "Spotify":        { group: "Audio", audio: true, countries: ['*'], cats: ["podcast","Spotify playlist","Spotify single","music album","audiobook"], url: "https://open.spotify.com", search: t => `https://open.spotify.com/search/${encodeURIComponent(t)}` },
    "Apple Music":    { group: "Audio", audio: true, countries: ['*'], cats: ["Spotify single","music album","Spotify playlist"], url: "https://music.apple.com", search: t => `https://music.apple.com/search?term=${encodeURIComponent(t)}` },
    "Apple Podcasts": { group: "Audio", audio: true, countries: ['*'], cats: ["podcast","audiobook"], url: "https://podcasts.apple.com", search: t => `https://podcasts.apple.com/search?term=${encodeURIComponent(t)}` },
    "YouTube Music":  { group: "Audio", audio: true, countries: ['*'], cats: ["Spotify playlist","Spotify single","music album"], url: "https://music.youtube.com", search: t => `https://music.youtube.com/search?q=${encodeURIComponent(t)}` },
    "Audible":        { group: "Audio", audio: true, countries: ['*'], cats: ["audiobook","podcast"], url: "https://www.audible.com", search: t => `https://www.audible.com/search?keywords=${encodeURIComponent(t)}` },

    "YouTube":        { group: "Free / Ad-Supported", audio: false, countries: ['*'], cats: ["movie","series","documentary","short film","stand-up comedy special","kids","YouTube Shorts","podcast"], url: "https://www.youtube.com", search: t => `https://www.youtube.com/results?search_query=${encodeURIComponent(t)}` },
    "Tubi":           { group: "Free / Ad-Supported", audio: false, countries: ['United States','Canada','Mexico','Brazil','Brasil'], cats: ["movie","series","documentary","anime","kids","Nollywood"], url: "https://tubitv.com", search: t => `https://tubitv.com/search/${encodeURIComponent(t)}` },
    "Pluto TV":       { group: "Free / Ad-Supported", audio: false, countries: ['*'], cats: ["movie","series","documentary","reality show","kids","telenovela"], url: "https://pluto.tv", search: t => `https://pluto.tv/en/search/details?q=${encodeURIComponent(t)}` },
    "Roku Channel":   { group: "Free / Ad-Supported", audio: false, countries: ['United States','Canada','United Kingdom'], cats: ["movie","series","documentary","reality show","kids"], url: "https://therokuchannel.roku.com", search: t => `https://therokuchannel.roku.com/search/${encodeURIComponent(t)}` }
};

const AUDIO_CATEGORIES = ["podcast","Spotify playlist","Spotify single","music album","audiobook"];
function isAudioCategory(cat) { return AUDIO_CATEGORIES.includes(cat); }

// Country the user locked into their profile; drives availability filtering.
function getUserCountry() {
    const c = (localStorage.getItem('match_user_country') || '').trim();
    return c || null;
}

function platformServesCountry(pf, country) {
    if (!country) return true;
    if (pf.countries.includes('*')) return true;
    const norm = country.toLowerCase();
    return pf.countries.some(c => c.toLowerCase() === norm);
}

// Platforms valid for a given format, filtered by the user's country when known.
function platformsFor(cat, country) {
    return Object.entries(PLATFORMS).filter(([name, pf]) => {
        if (!platformServesCountry(pf, country)) return false;
        if (!cat || cat === 'any') return true;
        return pf.cats.includes(cat);
    });
}

function platformSearchUrl(platformName, title) {
    const pf = PLATFORMS[platformName];
    if (pf && typeof pf.search === 'function') return pf.search(title);
    return `https://www.justwatch.com/us/search?q=${encodeURIComponent(title)}`;
}

// ----------------------------------------------------
// CASCADING QUESTIONNAIRE
// Choosing a format narrows every downstream field to only complementary
// options: platforms that actually carry that format, in the user's country.
// "Surprise Me" reopens everything.
// ----------------------------------------------------
window.onCategoryChange = function() {
    const catEl = document.getElementById('q-category');
    const platEl = document.getElementById('q-platform');
    if (!catEl || !platEl) return;

    const cat = catEl.value;
    const country = getUserCountry();
    const previous = platEl.value;
    const matches = platformsFor(cat === 'any' ? null : cat, country);

    platEl.innerHTML = '';
    const anyOpt = document.createElement('option');
    anyOpt.value = 'any';
    anyOpt.textContent = cat === 'any' ? 'Any Platform' : 'Any Platform That Has It';
    platEl.appendChild(anyOpt);

    const groups = {};
    matches.forEach(([name, pf]) => {
        if (!groups[pf.group]) groups[pf.group] = [];
        groups[pf.group].push(name);
    });
    Object.keys(groups).forEach(groupName => {
        const og = document.createElement('optgroup');
        og.label = groupName;
        groups[groupName].forEach(name => {
            const o = document.createElement('option');
            o.value = name; o.textContent = name;
            og.appendChild(o);
        });
        platEl.appendChild(og);
    });

    // Keep the previous pick when it's still valid for the new format.
    if (previous && previous !== 'any' && matches.some(([n]) => n === previous)) platEl.value = previous;
    else platEl.value = 'any';

    applyAudioModeLabels(isAudioCategory(cat));

    const hint = document.getElementById('platform-country-hint');
    if (hint) {
        if (country) {
            hint.textContent = cat === 'any'
                ? `🌍 Personalized for ${country}.`
                : `🌍 Showing only platforms available in ${country}.`;
            hint.style.display = 'block';
        } else { hint.style.display = 'none'; }
    }
};

// Swaps Watch Later / Seen It wording for audio picks.
function applyAudioModeLabels(isAudio) {
    const saveBtn = document.getElementById('btn-watch-later');
    const seenBtn = document.getElementById('btn-seen-it');
    if (saveBtn) saveBtn.innerHTML = isAudio ? '🎧 Listen Later' : '⭐ Watch Later';
    if (seenBtn) seenBtn.innerHTML = isAudio ? '🎼 Have Heard It' : "👁️ I've Seen It";
}

document.addEventListener('DOMContentLoaded', () => {
    const catEl = document.getElementById('q-category');
    if (catEl) { catEl.addEventListener('change', window.onCategoryChange); window.onCategoryChange(); }
});

// ----------------------------------------------------
// LIVE DISCOVERY ENGINE
// Rather than a fixed hardcoded list, this queries the keyless iTunes catalog
// with terms built from the user's own selections. That catalog spans the
// entire commercial back catalogue (silent era through current releases), so
// results are real titles with real covers and real preview clips — and the
// pool is effectively unlimited instead of ~30 baked-in entries.
// ----------------------------------------------------
const CATEGORY_TERMS = {
    'movie': 'movie', 'series': 'tv series', 'limited series': 'miniseries',
    'documentary': 'documentary', 'stand-up comedy special': 'stand up comedy',
    'reality show': 'reality tv', 'vertical micro-drama': 'short drama',
    'short film': 'short film', 'K-drama': 'korean drama', 'anime': 'anime',
    'novela brasileira': 'novela', 'telenovela': 'telenovela', 'C-drama': 'chinese drama',
    'J-drama': 'japanese drama', 'Turkish dizi': 'turkish drama', 'Bollywood': 'bollywood',
    'Nollywood': 'nigerian film', 'European cinema': 'european film',
    'podcast': 'podcast', 'Spotify playlist': 'playlist', 'Spotify single': 'single',
    'audiobook': 'audiobook', 'music album': 'album'
};

const MOOD_TERMS = {
    'intense and thrilling': 'thriller', 'light and feel-good': 'feel good',
    'romantic': 'romance', 'heartbreaking': 'drama', 'funny': 'comedy',
    'scary': 'horror', 'mind-bending': 'sci-fi mystery', 'inspiring': 'inspirational',
    'cozy comfort watch': 'comfort', 'dark and gritty': 'crime drama',
    'epic and adventurous': 'adventure epic', 'nostalgic': 'classic'
};

// Decade → iTunes-friendly era phrasing, so users can reach back to the silent era.
const DECADE_TERMS = {
    '1920s': 'classic 1920s silent', '1930s': 'classic 1930s', '1940s': 'classic 1940s',
    '1950s': 'classic 1950s', '1960s': 'classic 1960s', '1970s': 'classic 1970s',
    '1980s': '1980s', '1990s': '1990s', '2000s': '2000s', '2010s': '2010s', '2020s': 'new release'
};

function mediaForCategory(cat) {
    const c = (cat || '').toLowerCase();
    if (c.includes('podcast')) return 'podcast';
    if (c.includes('playlist') || c.includes('single') || c.includes('album') || c.includes('music')) return 'music';
    if (c.includes('audiobook')) return 'audiobook';
    if (c.includes('short film')) return 'shortFilm';
    if (c === 'movie' || c.includes('bollywood') || c.includes('nollywood') || c.includes('cinema')) return 'movie';
    if (c === 'any') return 'all';
    return 'tvShow';
}

async function discoverFromITunes(cat, mood, vibe, decade, rating) {
    const parts = [];
    if (decade && decade !== 'any' && DECADE_TERMS[decade]) parts.push(DECADE_TERMS[decade]);
    if (mood && mood !== 'any' && MOOD_TERMS[mood]) parts.push(MOOD_TERMS[mood]);
    if (cat && cat !== 'any' && CATEGORY_TERMS[cat]) parts.push(CATEGORY_TERMS[cat]);
    if (rating === 'kids' || rating === 'all ages family friendly') parts.push('family');
    if (parts.length === 0) parts.push('popular');

    const term = parts.join(' ');
    const media = mediaForCategory(cat);
    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=${media}&limit=40`);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.results || data.results.length === 0) return null;

        const excluded = new Set([...seenList, ...dislikedList].map(i => i.title || i));
        const seenRecently = new Set(recentTitles);

        // Only keep entries that actually have artwork, so covers never come back blank.
        let pool = data.results.filter(r => r.artworkUrl100 && (r.trackName || r.collectionName));
        pool = pool.filter(r => !excluded.has(r.trackName || r.collectionName));
        const fresh = pool.filter(r => !seenRecently.has(r.trackName || r.collectionName));
        if (fresh.length) pool = fresh;
        if (!pool.length) return null;

        const r = pool[Math.floor(Math.random() * pool.length)];
        const name = r.trackName || r.collectionName;
        const year = r.releaseDate ? String(r.releaseDate).substring(0, 4) : '';

        // Attach a platform that actually carries this format in the user's country,
        // so the Stream Now button lands somewhere real rather than a generic search.
        const country = getUserCountry();
        const candidates = platformsFor(cat === 'any' ? null : cat, country);
        const chosenPlatform = candidates.length
            ? candidates[Math.floor(Math.random() * candidates.length)][0]
            : 'any';

        return {
            title: name,
            synopsis: r.longDescription || r.shortDescription ||
                `${year ? year + ' — ' : ''}${r.primaryGenreName || 'A great pick'}${r.artistName ? ', from ' + r.artistName : ''}.`,
            platform: chosenPlatform,
            _meta: {
                artwork: upgradeArtwork(r.artworkUrl100),
                preview: r.previewUrl || null,
                storeUrl: r.trackViewUrl || r.collectionViewUrl || null,
                year: year
            }
        };
    } catch (e) { return null; }
}

function rememberShownTitle(title) {
    recentTitles.unshift(title);
    recentTitles = recentTitles.slice(0, 6);
    localStorage.setItem('match_recentTitles', JSON.stringify(recentTitles));
}

function pickFromCatalog(cat, plat, mood, vibe, rating) {
    const excluded = new Set([...seenList, ...dislikedList].map(i => i.title || i));
    const seenRecently = new Set(recentTitles);

    // Tiered relaxation: try a full match first, then progressively relax filters
    // rather than ever falling back to one hardcoded title.
    const tiers = [
        (e) => (cat === 'any' || e.cats.includes(cat)) && (plat === 'any' || e.platform === plat) && (mood === 'any' || e.moods.includes(mood)) && (rating === 'any' || e.ratings.includes(rating)),
        (e) => (cat === 'any' || e.cats.includes(cat)) && (mood === 'any' || e.moods.includes(mood)) && (rating === 'any' || e.ratings.includes(rating)),
        (e) => (cat === 'any' || e.cats.includes(cat)) && (rating === 'any' || e.ratings.includes(rating)),
        (e) => (rating === 'any' || e.ratings.includes(rating)),
        () => true
    ];

    for (const tierFilter of tiers) {
        let pool = CONTENT_CATALOG.filter(e => tierFilter(e) && !excluded.has(e.title));
        let freshPool = pool.filter(e => !seenRecently.has(e.title));
        if (freshPool.length > 0) pool = freshPool;
        if (pool.length > 0) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            return { title: pick.title, synopsis: pick.synopsis, platform: plat !== 'any' ? plat : pick.platform };
        }
    }
    // Absolute last resort: any catalog title not shown in the last 6 results.
    const anyFresh = CONTENT_CATALOG.filter(e => !seenRecently.has(e.title));
    const pick = (anyFresh.length ? anyFresh : CONTENT_CATALOG)[Math.floor(Math.random() * (anyFresh.length ? anyFresh.length : CONTENT_CATALOG.length))];
    return { title: pick.title, synopsis: pick.synopsis, platform: pick.platform };
}

window.triggerMatch = async function(isSpecificSearch = false) {
    if (!checkDailyLimit()) return;
    
    const loadBox = document.getElementById('loading-box'); 
    const qBox = document.getElementById('questionnaire-box'); 
    const sBox = document.getElementById('search-box');
    const resultBox = document.getElementById('result-box');

    if (resultBox) resultBox.style.display = 'none';
    if (qBox) qBox.style.display = 'none'; 
    if (sBox) sBox.style.display = 'none';
    
    if (loadBox) { 
        loadBox.style.display = 'block'; 
        setTimeout(() => loadBox.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }

    let promptText = "";
    if (isSpecificSearch) {
        const input = document.getElementById('specific-search-input');
        if (!input || !input.value.trim()) { window.location.reload(); return; }
        promptText = `Find streaming information strictly for "${input.value.trim()}". Output valid JSON ONLY: {"title": "Exact Title Found", "synopsis": "A 2 sentence summary.", "platform": "Primary platform to watch it on"}`;
    } else {
        let cat = document.getElementById('q-category')?.value || 'any'; 
        let plat = document.getElementById('q-platform')?.value || 'any'; 
        let mood = document.getElementById('q-mood')?.value || 'any'; 
        let vibe = document.getElementById('q-vibe')?.value || 'any';
        let rating = document.getElementById('q-rating')?.value || 'any';
        let decade = document.getElementById('q-decade')?.value || 'any';

        // Personalization pulled from the locked Core Identity profile.
        const uCountry = localStorage.getItem('match_user_country') || '';
        const uAge = localStorage.getItem('match_user_age') || '';
        const uSign = localStorage.getItem('match_user_sign') || '';

        let personalization = '';
        if (uCountry) personalization += ` Viewer is in ${uCountry}, so prefer titles legally streamable there and include local-language content where relevant.`;
        if (uAge) personalization += ` Viewer is ${uAge} years old, so keep the recommendation age-appropriate.`;
        if (uSign) personalization += ` Viewer's star sign is ${uSign}; subtly favor themes matching that sign's personality.`;

        // Never recommend something already seen or disliked.
        const exclusions = [...seenList, ...dislikedList].map(i => i.title || i).filter(Boolean);
        const exclusionText = exclusions.length
            ? ` Do NOT recommend any of these already-watched or rejected titles: ${exclusions.join(', ')}.`
            : '';

        const eraText = (decade && decade !== 'any') ? ` Released in the ${decade}.` : ' Any era from the 1920s to today is fine.';
        promptText = `Find a perfect title recommendation based on: Format: ${cat}, Platform: ${plat}, Mood: ${mood}, Vibe: ${vibe}, Age rating: ${rating}.${eraText}${personalization}${exclusionText} Output valid JSON ONLY: {"title": "Title", "synopsis": "Summary.", "platform": "Platform"}`;
    }

    const startTime = Date.now();
    const MIN_WAIT_MS = (isVIP) ? 3000 : 13500;
    
    const pBar = document.getElementById('ai-progress-bar');
    if (pBar) pBar.style.width = '0%';
    let timerInterval = setInterval(() => {
        let pct = Math.min(((Date.now() - startTime) / MIN_WAIT_MS) * 95, 95);
        if (pBar) pBar.style.width = pct + '%';
    }, 100);

    let matchResult = null;
    try {
        matchResult = await fetchGeminiData(promptText);
        if (!matchResult || !matchResult.title) throw new Error("Empty AI result");
    } catch (err) {
        if (isSpecificSearch) {
            const input = document.getElementById('specific-search-input');
            matchResult = { title: input.value.trim(), synopsis: "Here's your title — tap Stream Now to find it on your platform of choice.", platform: "Web" };
        } else {
            let cat = document.getElementById('q-category')?.value || 'any';
            let plat = document.getElementById('q-platform')?.value || 'any';
            let mood = document.getElementById('q-mood')?.value || 'any';
            let vibe = document.getElementById('q-vibe')?.value || 'any';
            let rating = document.getElementById('q-rating')?.value || 'any';
            let decade = document.getElementById('q-decade')?.value || 'any';

            // Tier 2: live discovery across the full iTunes catalogue (1920s → today).
            matchResult = await discoverFromITunes(cat, mood, vibe, decade, rating);
            // Tier 3: curated offline catalog, so a match is always returned even offline.
            if (!matchResult) matchResult = pickFromCatalog(cat, plat, mood, vibe, rating);
            if (plat && plat !== 'any') matchResult.platform = plat;
        }
    }
    rememberShownTitle(matchResult.title);

    let timeSpent = Date.now() - startTime;
    if (timeSpent < MIN_WAIT_MS) await new Promise(resolve => setTimeout(resolve, MIN_WAIT_MS - timeSpent));

    if (pBar) pBar.style.width = '100%';
    clearInterval(timerInterval);
    
    renderResult(matchResult, isSpecificSearch);
};

// ----------------------------------------------------
// THE RENDER ENGINE (Bulletproof Image Swap & YouTube Box)
// ----------------------------------------------------
async function renderResult(selected, isSpecificSearch) {
    const loadBox = document.getElementById('loading-box'); const resultBox = document.getElementById('result-box');
    if (loadBox) loadBox.style.display = 'none';
    resultBox.style.display = 'block'; resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // TRIGGER PREMIUM FX
    window.playPremiumSound();
    if (typeof confetti !== 'undefined') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#E5C158', '#FFF', '#8A2BE2', '#E50914'] });

    document.getElementById('res-title').innerText = selected.title; 
    document.getElementById('res-synopsis').innerText = selected.synopsis;
    document.getElementById('res-platform-badge').innerText = selected.platform;

    // "NEVER FAIL" COVER PULL + TRAILER METADATA (single lookup, cached)
    const posterEl = document.getElementById('res-poster-img');
    const categoryHint = document.getElementById('q-category')?.value || '';

    // The discovery engine already carries artwork/preview/store data — reuse it
    // instead of making a second network round-trip for the same title.
    let meta = selected._meta || null;
    if (!meta) meta = await getRichMetadata(selected.title, categoryHint);

    let realCover = (meta && meta.artwork) ? meta.artwork : await getRealCoverImage(selected.title);
    if (!realCover) realCover = generatedCover(selected.title);

    // Track the current match globally so Watch Later / Seen It can record it.
    globalMatchTitle = selected.title;
    globalMatchPoster = realCover;
    globalPlatform = selected.platform;

    posterEl.style.display = 'block';
    posterEl.classList.remove('fade-in'); void posterEl.offsetWidth; posterEl.classList.add('fade-in');
    
    // In case somehow the browser blocks the valid URL, it falls back to the dynamic generator,
    // then to a pure local (no-network) SVG so a cover is ALWAYS visible no matter what's blocked.
    posterEl.onerror = function() { 
        this.onerror = function() { this.onerror = null; this.src = generateLocalPosterSVG(selected.title); };
        this.src = `https://placehold.co/600x900/1a0505/E5C158?text=${encodeURIComponent(selected.title.replace(/ /g, '+'))}`; 
    };
    posterEl.src = realCover; 

    // DIRECT LINK SETUP — routed through the platform catalog so every service
    // gets a real deep link into that service.
    const directBtn = document.getElementById('res-direct-link');
    const catIsAudio = isAudioCategory(categoryHint);
    const pfEntry = PLATFORMS[selected.platform];
    const audioPick = catIsAudio || (pfEntry && pfEntry.audio);

    if (selected.platform && selected.platform !== 'any' && pfEntry) {
        directBtn.href = platformSearchUrl(selected.platform, selected.title);
    } else if (audioPick) {
        directBtn.href = `https://open.spotify.com/search/${encodeURIComponent(selected.title)}`;
    } else {
        directBtn.href = `https://www.justwatch.com/us/search?q=${encodeURIComponent(selected.title)}`;
    }

    if (audioPick) directBtn.innerText = '🎧 Listen Now';
    else if (selected.platform && selected.platform !== 'any' && pfEntry) directBtn.innerText = `▶ Watch on ${selected.platform}`;
    else directBtn.innerText = '▶ Find Where To Stream';

    // Keep the save/seen buttons worded for the medium being shown.
    applyAudioModeLabels(audioPick);

    // ----------------------------------------------------
    // TRAILER / PREVIEW
    // NOTE: YouTube removed the `listType=search` embed (it 404s since Nov 2020),
    // which is why trailers previously rendered "unavailable". Getting a real
    // YouTube video ID requires the paid YouTube Data API, so instead we play the
    // keyless iTunes preview clip when one exists, and otherwise show a clean
    // link card rather than a broken player.
    // ----------------------------------------------------
    const trailerContainer = document.getElementById('res-trailer-container');
    const previewVideo = document.getElementById('res-preview-video');
    const previewAudio = document.getElementById('res-preview-audio');
    const previewFallback = document.getElementById('res-preview-fallback');
    const storeBadge = document.getElementById('res-store-badge');
    const ytLink = document.getElementById('yt-trailer-link');

    trailerContainer.style.display = 'block';
    previewVideo.style.display = 'none';
    previewAudio.style.display = 'none';
    previewFallback.style.display = 'none';
    storeBadge.style.display = 'none';
    previewVideo.removeAttribute('src');
    previewAudio.removeAttribute('src');

    // A visual match must never render a spoken-audio preview — if no true video
    // preview exists we show the YouTube trailer card instead.
    const wantsAudio = isAudioCategory(categoryHint);
    const hasVideo = isVideoPreview(meta);

    if (hasVideo) {
        previewVideo.src = meta.preview;
        previewVideo.poster = realCover;
        previewVideo.style.display = 'block';
    } else if (wantsAudio && meta && meta.preview) {
        previewAudio.src = meta.preview;
        previewAudio.style.display = 'block';
    } else {
        previewFallback.style.display = 'block';
    }

    // Apple's API terms require previews to sit alongside a link to the store item.
    if (meta && meta.storeUrl && meta.preview) {
        storeBadge.href = meta.storeUrl;
        storeBadge.style.display = 'inline-block';
    }

    const ytQuery = `https://www.youtube.com/results?search_query=${encodeURIComponent(selected.title + " official trailer")}`;
    ytLink.href = ytQuery;
    const ytLinkAlt = document.getElementById('yt-trailer-link-alt');
    if (ytLinkAlt) ytLinkAlt.href = ytQuery;

    updateActionButtonStates();
}

// ----------------------------------------------------
// WATCH LATER / SEEN IT ENGINE
// ----------------------------------------------------
const inList = (list, title) => list.some(i => (i.title || i) === title);

function updateActionButtonStates() {
    const saveBtn = document.getElementById('btn-watch-later');
    const seenBtn = document.getElementById('btn-seen-it');

    if (saveBtn) {
        const already = inList(savedList, globalMatchTitle);
        saveBtn.innerText = already ? '⭐ Saved to Watch Later' : '⭐ Watch Later';
        saveBtn.style.opacity = already ? '0.65' : '1';
    }
    if (seenBtn) {
        const already = inList(seenList, globalMatchTitle);
        seenBtn.innerText = already ? '👁️ Marked as Seen' : "👁️ I've Seen It";
        seenBtn.style.opacity = already ? '0.65' : '1';
    }
}

window.recordAction = function(type) {
    if (!globalMatchTitle) return;
    if (!isUserLoggedIn) {
        alert("💎 Join for FREE!\n\nTo save titles to your Portfolio, please create a free account.");
        window.openAuthModal();
        return;
    }

    // Store the resolved stream/listen link and audio flag so the profile can
    // deep-link straight to where the title actually plays.
    const catNow = document.getElementById('q-category')?.value || '';
    const itemObj = {
        title: globalMatchTitle,
        posterUrl: globalMatchPoster,
        platform: globalPlatform,
        streamUrl: (document.getElementById('res-direct-link') || {}).href || platformSearchUrl(globalPlatform, globalMatchTitle),
        isAudio: isAudioCategory(catNow) || (PLATFORMS[globalPlatform] && PLATFORMS[globalPlatform].audio) || false,
        addedAt: Date.now()
    };

    if (type === 'save') {
        if (!inList(savedList, globalMatchTitle)) {
            savedList.push(itemObj);
            showToast(`${itemObj.isAudio ? "🎧 Saved to Listen Later" : "⭐ Saved to Watch Later"}: "${globalMatchTitle}"`);
        } else {
            showToast(`"${globalMatchTitle}" is already saved.`);
        }
    } else if (type === 'seen') {
        if (!inList(seenList, globalMatchTitle)) {
            seenList.push(itemObj);
            showToast(`${itemObj.isAudio ? "🎼 Marked as heard" : "👁️ Marked as seen"}: "${globalMatchTitle}"`);
        } else {
            showToast(`"${globalMatchTitle}" is already marked.`);
        }
    } else if (type === 'like') {
        userRatings[globalMatchTitle] = 5;
        if (!inList(seenList, globalMatchTitle)) seenList.push(itemObj);
        window.playPremiumSound && window.playPremiumSound();
        if (typeof confetti === 'function') confetti({ particleCount: 90, spread: 75, origin: { y: 0.7 }, colors: ['#E5C158','#FFF0B3','#ffffff'] });
        showToast(`❤️ Loved it! We'll find you more like "${globalMatchTitle}".`);
    } else if (type === 'dislike') {
        userRatings[globalMatchTitle] = 1;
        if (!inList(dislikedList, globalMatchTitle)) dislikedList.push(itemObj);
        // Drop it from Watch Later too — they don't want to see it again anywhere.
        savedList = savedList.filter(i => (i.title || i) !== globalMatchTitle);
        syncListsToDatabase();
        openRematchPrompt(globalMatchTitle);
        return;
    }

    syncListsToDatabase();
    updateActionButtonStates();
};

async function syncListsToDatabase() {
    localStorage.setItem('match_seenList', JSON.stringify(seenList));
    localStorage.setItem('match_savedList', JSON.stringify(savedList));
    localStorage.setItem('match_dislikedList', JSON.stringify(dislikedList));
    localStorage.setItem('match_userRatings', JSON.stringify(userRatings));

    if (isUserLoggedIn && supabaseClient) {
        try {
            await supabaseClient.auth.updateUser({
                data: {
                    seen_list: seenList,
                    saved_list: savedList,
                    disliked_list: dislikedList,
                    user_ratings: userRatings
                }
            });
        } catch (e) { console.warn("Portfolio sync deferred:", e); }
    }
}

// ----------------------------------------------------
// PREMIUM TOAST (non-blocking replacement for alert popups)
// ----------------------------------------------------
window.showToast = function(message, isError) {
    let host = document.getElementById('toast-host');
    if (!host) {
        host = document.createElement('div');
        host.id = 'toast-host';
        document.body.appendChild(host);
    }
    const t = document.createElement('div');
    t.className = 'match-toast' + (isError ? ' toast-error' : '');
    t.textContent = message;
    host.appendChild(t);
    setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 500); }, 3600);
};

// ----------------------------------------------------
// "NOT FOR ME" RE-MATCH FLOW
// The disliked title is blacklisted permanently, then the user chooses to
// either re-roll on the same parameters or go back and change them.
// ----------------------------------------------------
window.openRematchPrompt = function(deadTitle) {
    const modal = document.getElementById('rematch-modal');
    const msg = document.getElementById('rematch-message');
    if (!modal) return;
    if (msg) msg.innerHTML = `Got it — <strong style="color:var(--gold)">${deadTitle}</strong> won't be suggested to you again.<br><br>Want another match with the same choices, or would you like to change them first?`;
    modal.style.display = 'flex';
};

window.closeRematchPrompt = function() {
    const modal = document.getElementById('rematch-modal');
    if (modal) modal.style.display = 'none';
};

// Re-roll immediately on the identical parameters.
window.rematchSameParams = function() {
    window.closeRematchPrompt();
    const resultBox = document.getElementById('result-box');
    if (resultBox) resultBox.style.display = 'none';
    // Re-roll on the identical questionnaire selections (not a direct search).
    if (typeof window.triggerMatch === 'function') window.triggerMatch(false);
};

// Send them back up to the questionnaire with a smooth scroll.
window.changeParamsAndRematch = function() {
    window.closeRematchPrompt();
    const resultBox = document.getElementById('result-box');
    if (resultBox) resultBox.style.display = 'none';
    const form = document.getElementById('questionnaire-box') || document.getElementById('q-category');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const catEl = document.getElementById('q-category');
        if (catEl) setTimeout(() => catEl.focus(), 600);
    }
};
