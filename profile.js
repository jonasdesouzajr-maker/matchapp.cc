console.log("Profile Engine 91.1: Root Path Confirmed, Locked Fields & Bulletproof Cover Grids Active");

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auto-formatting for Date of Birth (DD/MM/YYYY)
    const dobInput = document.getElementById('profile-dob');
    if(dobInput) {
        dobInput.addEventListener('input', function(e) {
            // Prevent interference if user is trying to delete characters
            if (e.inputType === 'deleteContentBackward') return;
            let v = this.value.replace(/\D/g, ''); 
            if (v.length >= 3 && v.length <= 4) {
                this.value = v.slice(0,2) + '/' + v.slice(2);
            } else if (v.length >= 5) {
                this.value = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4,8);
            }
        });
    }

    // 2. Lock Core Identity if already saved
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

    // 3. Render the Watch Later Portfolio
    renderProfileGrids();
});

window.saveProfileData = function() {
    const isLocked = localStorage.getItem('match_profile_locked') === 'true';
    if(isLocked) return;

    const name = document.getElementById('profile-name').value;
    const country = document.getElementById('profile-country').value;
    const dob = document.getElementById('profile-dob').value;
    const sign = document.getElementById('profile-starsign').value;

    if(!name || !country || !dob || !sign) {
        alert("Please fill out all identity fields before saving.");
        return;
    }

    const confirmLock = confirm("⚠️ WARNING:\n\nSaving your Core Identity will lock these fields permanently to ensure profile security and AI consistency. Are you sure you want to save?");
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
                // Support legacy arrays where items were just strings
                let title = typeof item === 'string' ? item : item.title;
                let rawPoster = typeof item === 'string' ? '' : item.posterUrl;
                
                // DATA CLEANUP & REPAIR: Replace old broken via.placeholder.com links dynamically
                let poster = rawPoster;
                if (!poster || poster.includes('via.placeholder.com')) {
                    poster = `https://placehold.co/500x750/0a0505/D4AF37/png?text=${encodeURIComponent(title)}`;
                }
                
                // Indestructible HTML fallback if TMDB ever goes down
                const fallbackImage = `https://placehold.co/500x750/0a0505/D4AF37/png?text=${encodeURIComponent(title)}`;
                
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
