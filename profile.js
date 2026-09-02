console.log("Profile Engine 100.0: Identity Showcase, Email Sync & Dual Portfolios Active");

// ----------------------------------------------------
// STAR SIGN PERSONALITY → MATCHING HINTS
// ----------------------------------------------------
const STAR_SIGN_TRAITS = {
    "Aries": "Bold, fast-paced action and competitive stories",
    "Taurus": "Comfort watches, food, romance and beautiful worlds",
    "Gemini": "Witty dialogue, twists and clever ensemble stories",
    "Cancer": "Emotional family sagas and heartfelt dramas",
    "Leo": "Big, glamorous, star-driven blockbusters",
    "Virgo": "Smart procedurals, mysteries and detailed docs",
    "Libra": "Romance, beauty and balanced feel-good stories",
    "Scorpio": "Dark thrillers, secrets and psychological intensity",
    "Sagittarius": "Adventure, travel and world cinema",
    "Capricorn": "Ambition, power struggles and prestige drama",
    "Aquarius": "Sci-fi, dystopia and unconventional storytelling",
    "Pisces": "Dreamy, artistic and emotionally sweeping films"
};

const SIGN_SYMBOLS = {
    "Aries":"♈","Taurus":"♉","Gemini":"♊","Cancer":"♋","Leo":"♌","Virgo":"♍",
    "Libra":"♎","Scorpio":"♏","Sagittarius":"♐","Capricorn":"♑","Aquarius":"♒","Pisces":"♓"
};

function formatSign(sign) {
    if (!sign) return "N/A";
    return `${SIGN_SYMBOLS[sign] || ''} ${sign}`.trim();
}

// Pull the account email straight from Supabase Auth.
async function populateEmail() {
    const el = document.getElementById('lock-val-email');
    if (!el) return;
    const cached = localStorage.getItem('match_user_email');
    if (cached) el.innerText = cached;

    if (window.supabaseClient) {
        try {
            const { data } = await window.supabaseClient.auth.getUser();
            if (data && data.user && data.user.email) {
                el.innerText = data.user.email;
                localStorage.setItem('match_user_email', data.user.email);
            } else if (!cached) {
                el.innerText = "Not signed in";
            }
        } catch (e) {
            if (!cached) el.innerText = "Unavailable";
        }
    } else if (!cached) {
        el.innerText = "Not signed in";
    }
}

// ----------------------------------------------------
// PORTFOLIO TAB SWITCHING
// ----------------------------------------------------
window.switchPortfolioTab = function(tab) {
    const tabs = ['watchlater', 'seenit', 'audio'];
    tabs.forEach(t => {
        const panel = document.getElementById('panel-' + t);
        const btn = document.getElementById('tab-' + t);
        if (panel) panel.style.display = (t === tab) ? 'block' : 'none';
        if (btn) btn.classList.toggle('active', t === tab);
    });
};

function calculateAgeFromDOB(dobString) {
    let parts = dobString.split('/');
    if(parts.length !== 3) return null;
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1; 
    let year = parseInt(parts[2], 10);
    
    let dob = new Date(year, month, day);
    if(isNaN(dob.getTime())) return null;

    let diffMs = Date.now() - dob.getTime();
    let ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
}

document.addEventListener('DOMContentLoaded', () => {
    const dobInput = document.getElementById('profile-dob');
    const ageDisplay = document.getElementById('profile-age-display');
    const picPreview = document.getElementById('profile-pic-preview');

    const savedAvatar = localStorage.getItem('match_custom_avatar');
    if (savedAvatar && picPreview) {
        picPreview.src = savedAvatar;
    }
    
    const savedAge = localStorage.getItem('match_user_age');
    if (savedAge && ageDisplay) {
        ageDisplay.style.display = 'inline-block';
        ageDisplay.innerText = `AI Profile: ${savedAge} Years Old`;
    }

    if(dobInput) {
        dobInput.addEventListener('input', function(e) {
            if (e.inputType === 'deleteContentBackward') return;
            let v = this.value.replace(/\D/g, ''); 
            if (v.length >= 3 && v.length <= 4) { this.value = v.slice(0,2) + '/' + v.slice(2); } 
            else if (v.length >= 5) { this.value = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4,8); }
            
            if (this.value.length === 10) {
                let calculatedAge = calculateAgeFromDOB(this.value);
                if (calculatedAge && ageDisplay) {
                    ageDisplay.style.display = 'inline-block';
                    ageDisplay.innerText = `AI Profile: ${calculatedAge} Years Old`;
                }
            }
        });
    }

    checkAndRenderProfileState();
    renderProfileGrids();
});

function checkAndRenderProfileState() {
    const isLocked = localStorage.getItem('match_profile_locked') === 'true';
    const savedName = localStorage.getItem('match_user_name') || "";
    const savedCountry = localStorage.getItem('match_user_country') || "";
    const savedDob = localStorage.getItem('match_user_dob') || "";
    const savedSign = localStorage.getItem('match_user_sign') || "";

    const editableSection = document.getElementById('editable-fields-section');
    const lockedCard = document.getElementById('locked-info-card');
    const saveBtn = document.getElementById('save-profile-btn');
    const instructionsText = document.getElementById('profile-instructions-text');
    const changeBadge = document.getElementById('avatar-change-badge');

    if (isLocked) {
        if (editableSection) editableSection.style.display = 'none';
        if (lockedCard) {
            lockedCard.style.display = 'block';
            const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
            setVal('lock-val-name', savedName || "User");
            setVal('lock-val-country', savedCountry || "N/A");
            setVal('lock-val-dob', savedDob || "N/A");
            setVal('lock-val-sign', formatSign(savedSign));
            setVal('lock-val-age', localStorage.getItem('match_user_age') ? `${localStorage.getItem('match_user_age')} years old` : "N/A");
            setVal('lock-val-sign-trait', STAR_SIGN_TRAITS[savedSign] || "Shapes your recommended themes");
            populateEmail();
        }
        if (instructionsText) instructionsText.innerHTML = "Your core identity is locked and permanently guiding your AI Matches.";
        if (changeBadge) changeBadge.innerText = "Avatar Locked";
        
        if (saveBtn) {
            saveBtn.innerText = "🔒 Identity Locked for AI Matching";
            saveBtn.style.background = "#555";
            saveBtn.style.borderColor = "#555";
            saveBtn.style.boxShadow = "none";
            saveBtn.onclick = () => alert("Core identity fields are permanently locked to maintain consistent AI matching.");
        }
    } else {
        if (savedName) document.getElementById('profile-name').value = savedName;
        if (savedCountry) document.getElementById('profile-country').value = savedCountry;
        if (savedDob) document.getElementById('profile-dob').value = savedDob;
        if (savedSign) document.getElementById('profile-starsign').value = savedSign;
    }
}

window.handleAvatar = function(event) {
    if (localStorage.getItem('match_profile_locked') === 'true') {
        alert("Avatar is locked alongside your profile identity.");
        return;
    }
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        document.getElementById('profile-pic-preview').src = base64;
        localStorage.setItem('match_custom_avatar', base64);
        
        const navImg = document.getElementById('nav-avatar-img');
        if (navImg) { navImg.src = base64; navImg.style.display = 'inline-block'; }

        if (window.supabaseClient) {
            window.supabaseClient.auth.getUser().then(({ data }) => {
                if (data && data.user) {
                    window.supabaseClient.from('profiles').upsert({ id: data.user.id, avatar_url: base64 });
                }
            });
        }
    };
    reader.readAsDataURL(file);
};

window.saveProfileData = function() {
    const isLocked = localStorage.getItem('match_profile_locked') === 'true';
    if(isLocked) return;

    const name = document.getElementById('profile-name').value.trim();
    const country = document.getElementById('profile-country').value.trim();
    const dob = document.getElementById('profile-dob').value.trim();
    const sign = document.getElementById('profile-starsign').value;

    if(!name || !country || !dob || !sign) { 
        alert("Please complete all fields (Full Name, Country, DOB, and Zodiac Sign)."); 
        return; 
    }
    
    let age = calculateAgeFromDOB(dob);
    if (!age) { alert("Please enter a valid Birthdate (DD/MM/YYYY)."); return; }

    const confirmLock = confirm(`⚠️ LOCK IDENTITY CONFIRMATION:\n\nName: ${name}\nCountry: ${country}\nAge: ${age} years old\nSign: ${sign}\n\nThis data will be permanently saved for your AI Concierge. Lock identity now?`);
    if(!confirmLock) return;

    localStorage.setItem('match_user_name', name);
    localStorage.setItem('match_user_country', country);
    localStorage.setItem('match_user_dob', dob);
    localStorage.setItem('match_user_sign', sign);
    localStorage.setItem('match_user_age', age);
    localStorage.setItem('match_profile_locked', 'true');

    if (window.supabaseClient) {
        window.supabaseClient.auth.getUser().then(({ data }) => {
            if (data && data.user) {
                window.supabaseClient.from('profiles').upsert({
                    id: data.user.id,
                    full_name: name,
                    country: country,
                    dob: dob,
                    star_sign: sign,
                    age: age,
                    profile_locked: true
                });
            }
        });
    }

    alert("✅ Core Identity Locked! The AI will now generate hyper-personalized matches for you.");
    window.location.reload();
};

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

function platformFallbackUrl(platform, title) {
    const map = {
        "Netflix": t => `https://www.netflix.com/search?q=${encodeURIComponent(t)}`,
        "Prime Video": t => `https://www.primevideo.com/search?phrase=${encodeURIComponent(t)}`,
        "Disney+": t => `https://www.disneyplus.com/search?q=${encodeURIComponent(t)}`,
        "Max": t => `https://www.max.com/search?q=${encodeURIComponent(t)}`,
        "Apple TV+": t => `https://tv.apple.com/search?term=${encodeURIComponent(t)}`,
        "Globoplay": t => `https://globoplay.globo.com/busca/?q=${encodeURIComponent(t)}`,
        "SBT+": t => `https://www.sbt.com.br/sbtplus/busca?q=${encodeURIComponent(t)}`,
        "Claro tv+": t => `https://www.clarotvmais.com.br/busca?q=${encodeURIComponent(t)}`,
        "NetMovies": t => `https://www.netmovies.com.br/busca?q=${encodeURIComponent(t)}`,
        "Crunchyroll": t => `https://www.crunchyroll.com/search?q=${encodeURIComponent(t)}`,
        "Viki": t => `https://www.viki.com/search?q=${encodeURIComponent(t)}`,
        "Spotify": t => `https://open.spotify.com/search/${encodeURIComponent(t)}`,
        "Apple Music": t => `https://music.apple.com/search?term=${encodeURIComponent(t)}`,
        "Apple Podcasts": t => `https://podcasts.apple.com/search?term=${encodeURIComponent(t)}`,
        "YouTube Music": t => `https://music.youtube.com/search?q=${encodeURIComponent(t)}`,
        "Audible": t => `https://www.audible.com/search?keywords=${encodeURIComponent(t)}`
    };
    if (map[platform]) return map[platform](title);
    return `https://www.justwatch.com/us/search?q=${encodeURIComponent(title)}`;
}

// Cards are clickable: tapping one opens where the title actually plays.
function buildPosterCard(item, accent) {
    const title = typeof item === 'string' ? item : (item.title || 'Untitled');
    let poster = typeof item === 'string' ? '' : (item.posterUrl || '');
    const platform = typeof item === 'string' ? '' : (item.platform || '');
    const isAudio = typeof item === 'object' && item.isAudio;
    const link = (typeof item === 'object' && item.streamUrl) ? item.streamUrl : platformFallbackUrl(platform, title);

    const safeTitle = escapeHtml(title);
    const hasPoster = poster && poster.trim() !== '' && poster !== 'invalid-image' && poster !== 'fallback';
    const imgTag = hasPoster
        ? `<img src="${escapeHtml(poster)}" alt="${safeTitle}" style="width:100%; height:100%; object-fit:contain; background:#0b0303; display:block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
        : '';
    const fallbackDisplay = hasPoster ? 'none' : 'flex';
    const cta = isAudio ? '🎧 Listen Now' : '▶ Stream Now';

    return `
        <a class="poster-card" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" title="Open ${safeTitle}"
           style="position:relative; display:block; width:100%; height:230px; border-radius:12px; overflow:hidden; border:1px solid ${accent}; box-shadow:0 5px 20px rgba(0,0,0,0.9); text-decoration:none; transition:transform 0.3s ease, box-shadow 0.3s ease;"
           onmouseover="this.style.transform='translateY(-6px) scale(1.03)'; this.style.boxShadow='0 14px 34px rgba(0,0,0,0.95)'; this.querySelector('.card-cta').style.opacity='1';"
           onmouseout="this.style.transform='none'; this.style.boxShadow='0 5px 20px rgba(0,0,0,0.9)'; this.querySelector('.card-cta').style.opacity='0';">
            ${imgTag}
            <div class="css-poster-fallback" style="display:${fallbackDisplay}; background:linear-gradient(135deg,#1a0505,#4a2b00); width:100%; height:100%; align-items:center; justify-content:center; text-align:center; padding:10px; box-sizing:border-box; color:var(--gold); font-weight:900; font-size:16px; text-transform:uppercase; text-shadow:0 2px 8px rgba(0,0,0,0.9); box-shadow: inset 0 0 30px rgba(0,0,0,0.9);">
                ${safeTitle}
            </div>
            ${platform ? `<div style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.85); color:${accent}; font-size:9px; font-weight:900; padding:4px 8px; border-radius:6px; text-transform:uppercase; border:1px solid ${accent};">${escapeHtml(platform)}</div>` : ''}
            <div class="card-cta" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.62); color:var(--gold-glow); font-weight:900; font-size:14px; text-transform:uppercase; opacity:0; transition:opacity 0.3s ease;">${cta}</div>
            <div class="poster-title" style="position:absolute; bottom:0; width:100%; background:linear-gradient(transparent, rgba(0,0,0,0.95)); color:#fff; font-size:12px; padding:10px 4px 4px 4px; text-align:center; font-weight:bold; border-top:1px solid ${accent};">${safeTitle}</div>
        </a>
    `;
}

window.renderProfileGrids = function() {
    const savedListData = JSON.parse(localStorage.getItem('match_savedList') || '[]');
    const seenListData = JSON.parse(localStorage.getItem('match_seenList') || '[]');

    const isAudioItem = i => typeof i === 'object' && i.isAudio === true;

    // Audio picks (music, playlists, singles, podcasts, audiobooks) live in their
    // own tab so they don't get mixed into the watch queues.
    const audioItems  = [...savedListData, ...seenListData].filter(isAudioItem);
    const watchLater  = savedListData.filter(i => !isAudioItem(i));
    const seenVisual  = seenListData.filter(i => !isAudioItem(i));

    const fill = (id, data, accent, emptyMsg) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = data.length === 0
            ? `<p style="color:#aaa; font-size:15px; font-style:italic;">${emptyMsg}</p>`
            : data.map(item => buildPosterCard(item, accent)).join('');
    };

    fill('portfolio-grid', watchLater, 'var(--gold)', 'Your Watch Later portfolio is empty. Go match!');
    fill('seen-grid', seenVisual, 'rgba(255,255,255,0.55)', "You haven't marked anything as seen yet.");
    fill('audio-grid', audioItems, '#1DB954', 'No saved music, playlists, singles or podcasts yet.');

    const setCount = (id, n) => { const e = document.getElementById(id); if (e) e.innerText = n; };
    setCount('count-watchlater', watchLater.length);
    setCount('count-seenit', seenVisual.length);
    setCount('count-audio', audioItems.length);
};
