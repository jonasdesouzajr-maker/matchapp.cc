console.log("Profile Engine 98.0: Dual Auth Prefill & Locked View Active");

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
            document.getElementById('lock-val-name').innerText = savedName || "User";
            document.getElementById('lock-val-country').innerText = savedCountry || "N/A";
            document.getElementById('lock-val-dob').innerText = savedDob || "N/A";
            document.getElementById('lock-val-sign').innerText = savedSign || "N/A";
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

window.renderProfileGrids = function() {
    const portGrid = document.getElementById('portfolio-grid');
    let sList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
    
    if(portGrid) {
        portGrid.innerHTML = '';
        if(sList.length === 0) {
            portGrid.innerHTML = '<p style="color:#aaa; font-size: 15px; font-style: italic;">Your portfolio is empty. Go match!</p>';
        } else {
            sList.forEach(item => {
                let title = typeof item === 'string' ? item : item.title;
                let poster = typeof item === 'string' ? '' : item.posterUrl;
                
                if (!poster || poster.includes('placeholder.com') || poster.includes('placehold.co') || poster === 'fallback') {
                    poster = "invalid-image";
                }
                
                portGrid.innerHTML += `
                    <div class="poster-card" style="position: relative; width: 100%; height: 230px; border-radius: 12px; overflow: hidden; border: 1px solid var(--gold); box-shadow: 0 5px 20px rgba(0,0,0,0.9);">
                        <img src="${poster}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        
                        <div class="css-poster-fallback" style="display:none; background: linear-gradient(135deg, #1a0505, #4a2b00); width: 100%; height: 100%; align-items: center; justify-content: center; text-align: center; padding: 10px; box-sizing: border-box; color: var(--gold); font-weight: 900; font-size: 16px; text-transform: uppercase; text-shadow: 0 2px 8px rgba(0,0,0,0.9); box-shadow: inset 0 0 30px rgba(0,0,0,0.9);">
                            ${title}
                        </div>
                        
                        <div class="poster-title" style="position: absolute; bottom: 0; width: 100%; background: linear-gradient(transparent, rgba(0,0,0,0.95)); color: #fff; font-size: 12px; padding: 10px 4px 4px 4px; text-align: center; font-weight: bold; border-top: 1px solid var(--gold);">${title}</div>
                    </div>
                `;
            });
        }
    }
};
