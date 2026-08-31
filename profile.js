console.log("Profile Engine 94.0: Bulletproof CSS Portfolio Grids Active");

document.addEventListener('DOMContentLoaded', () => {
    const dobInput = document.getElementById('profile-dob');
    if(dobInput) {
        dobInput.addEventListener('input', function(e) {
            if (e.inputType === 'deleteContentBackward') return;
            let v = this.value.replace(/\D/g, ''); 
            if (v.length >= 3 && v.length <= 4) { this.value = v.slice(0,2) + '/' + v.slice(2); } 
            else if (v.length >= 5) { this.value = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4,8); }
        });
    }

    const isLocked = localStorage.getItem('match_profile_locked') === 'true';
    if (isLocked) {
        document.getElementById('profile-name').disabled = true;
        document.getElementById('profile-country').disabled = true;
        document.getElementById('profile-dob').disabled = true;
        document.getElementById('profile-starsign').disabled = true;
        
        const saveBtn = document.getElementById('save-profile-btn');
        if(saveBtn) {
            saveBtn.innerText = "🔒 Profile Locked";
            saveBtn.style.background = "#555";
            saveBtn.style.borderColor = "#555";
            saveBtn.onclick = () => alert("Core identity fields are permanently locked for security and AI consistency.");
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
    const confirmLock = confirm("⚠️ WARNING:\n\nSaving your Core Identity will lock these fields permanently. Are you sure you want to save?");
    if(!confirmLock) return;

    localStorage.setItem('match_profile_locked', 'true');
    alert("✅ Profile successfully saved and locked!");
    window.location.reload();
};

window.renderProfileGrids = function() {
    const portGrid = document.getElementById('portfolio-grid');
    let sList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
    
    if(portGrid) {
        portGrid.innerHTML = '';
        if(sList.length === 0) {
            portGrid.innerHTML = '<p style="color:#aaa; font-size: 13px;">Your portfolio is empty. Go match!</p>';
        } else {
            sList.forEach(item => {
                let title = typeof item === 'string' ? item : item.title;
                let poster = typeof item === 'string' ? '' : item.posterUrl;
                
                if (!poster || poster.includes('placeholder.com') || poster.includes('placehold.co') || poster === 'fallback') {
                    poster = "invalid-image";
                }
                
                // Pure HTML/CSS injection so grids never break
                portGrid.innerHTML += `
                    <div class="poster-card" style="position: relative; width: 100%; height: 195px; border-radius: 8px; overflow: hidden; border: 1px solid var(--gold); box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                        <img src="${poster}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        
                        <div class="css-poster-fallback" style="display:none; background: linear-gradient(135deg, #1a0f0f, #3a2200); width: 100%; height: 100%; align-items: center; justify-content: center; text-align: center; padding: 10px; box-sizing: border-box; color: var(--gold); font-weight: 900; font-size: 14px; text-shadow: 0 2px 5px rgba(0,0,0,0.8); box-shadow: inset 0 0 20px rgba(0,0,0,0.8);">
                            ${title}
                        </div>
                        
                        <div class="poster-title" style="position: absolute; bottom: 0; width: 100%; background: rgba(0,0,0,0.85); color: #fff; font-size: 11px; padding: 6px; text-align: center; font-weight: bold; border-top: 1px solid var(--gold);">${title}</div>
                    </div>
                `;
            });
        }
    }
};
