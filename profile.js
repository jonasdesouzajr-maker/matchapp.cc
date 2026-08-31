console.log("Profile Engine 93.0: Canvas Repair & Grid Lock Active");

// NATIVE CANVAS GENERATOR (For repairing broken profile grids)
function generateFallbackImage(title) {
    const canvas = document.createElement('canvas');
    canvas.width = 500; canvas.height = 750;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0505'; ctx.fillRect(0, 0, 500, 750);
    ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 15; ctx.strokeRect(0, 0, 500, 750);
    ctx.fillStyle = '#D4AF37'; ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let words = title.split(' '); let y = 375;
    if(words.length > 3) {
        ctx.fillText(words.slice(0, Math.ceil(words.length/2)).join(' '), 250, y - 25);
        ctx.fillText(words.slice(Math.ceil(words.length/2)).join(' '), 250, y + 25);
    } else { ctx.fillText(title, 250, y); }
    return canvas.toDataURL(); 
}

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
                let rawPoster = typeof item === 'string' ? '' : item.posterUrl;
                
                // REPAIR LOGIC: Overwrite old broken images dynamically with the Canvas generator
                let poster = rawPoster;
                if (!poster || poster.includes('placeholder.com') || poster.includes('placehold.co')) {
                    poster = generateFallbackImage(title);
                }
                
                const fallbackImage = generateFallbackImage(title);
                
                portGrid.innerHTML += `
                    <div class="poster-card">
                        <img src="${poster}" alt="${title}" onerror="this.onerror=null; this.src='${fallbackImage}';">
                        <div class="poster-title">${title}</div>
                    </div>
                `;
            });
        }
    }
};
