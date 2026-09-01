console.log("Profile Engine 96.0: Cinematic Watch Later Portfolio Grid Active");

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

    const isLocked = localStorage.getItem('match_profile_locked') === 'true';
    if (isLocked) {
        document.getElementById('profile-name').disabled = true;
        document.getElementById('profile-country').disabled = true;
        document.getElementById('profile-dob').disabled = true;
        document.getElementById('profile-starsign').disabled = true;
        
        document.getElementById('profile-name').value = localStorage.getItem('match_user_name') || "";
        document.getElementById('profile-country').value = localStorage.getItem('match_user_country') || "";
        document.getElementById('profile-dob').value = localStorage.getItem('match_user_dob') || "";
        document.getElementById('profile-starsign').value = localStorage.getItem('match_user_sign') || "";
        
        const saveBtn = document.getElementById('save-profile-btn');
        if(saveBtn) {
            saveBtn.innerText = "🔒 Identity Locked for AI Matching";
            saveBtn.style.background = "#555";
            saveBtn.style.borderColor = "#555";
            saveBtn.style.boxShadow = "none";
            saveBtn.onclick = () => alert("Core identity fields are permanently locked. Your Age, Country, and Zodiac are now actively shaping your AI Matches!");
        }
    }
    renderProfileGrids();
});

window.saveProfileData = function() {
    const isLocked = localStorage.getItem('match_profile_locked') === 'true';
    if(isLocked) return;
    const name = document.getElementById('profile-name').value;
    const country = document.getElementById('profile-country').value;
    const dob = document.getElementById('profile-dob').value;
    const sign = document.getElementById('profile-starsign').value;

    if(!name || !country || !dob || !sign) { alert("Please fill out all identity fields before saving."); return; }
    
    let age = calculateAgeFromDOB(dob);
    if (!age) { alert("Please enter a valid Birthdate (DD/MM/YYYY)."); return; }

    const confirmLock = confirm(`⚠️ WARNING:\n\nYou are locking in your profile as a ${age}-year-old from ${country}.\n\nThis data will be permanently injected into the AI's brain to customize your matches. Are you sure you want to lock this in?`);
    if(!confirmLock) return;

    localStorage.setItem('match_user_name', name);
    localStorage.setItem('match_user_country', country);
    localStorage.setItem('match_user_dob', dob);
    localStorage.setItem('match_user_sign', sign);
    localStorage.setItem('match_user_age', age);
    
    localStorage.setItem('match_profile_locked', 'true');
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
