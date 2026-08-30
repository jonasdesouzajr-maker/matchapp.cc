console.log("Profile Engine 88.0: Locked Fields & DOB Auto-Format Active");

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOB Auto-Slash Formatting
    const dobInput = document.getElementById('profile-dob');
    if(dobInput) {
        dobInput.addEventListener('input', function(e) {
            // Prevent masking logic if user is hitting backspace
            if (e.inputType === 'deleteContentBackward') return;
            
            let v = this.value.replace(/\D/g, ''); // Strip all non-numbers
            if (v.length >= 3 && v.length <= 4) {
                this.value = v.slice(0,2) + '/' + v.slice(2);
            } else if (v.length >= 5) {
                this.value = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4,8);
            }
        });
    }

    // 2. Check if Identity is Locked
    const isLocked = localStorage.getItem('match_profile_locked') === 'true';
    if (isLocked) {
        document.getElementById('profile-name').disabled = true;
        document.getElementById('profile-country').disabled = true;
        document.getElementById('profile-dob').disabled = true;
        document.getElementById('profile-starsign').disabled = true;
        document.getElementById('save-profile-btn').innerText = "🔒 Profile Locked";
        document.getElementById('save-profile-btn').style.background = "#555";
        document.getElementById('save-profile-btn').style.borderColor = "#555";
        document.getElementById('save-profile-btn').onclick = () => alert("Core identity fields are permanently locked for security.");
    }

    renderProfileGrids();
});

window.saveProfileData = function() {
    const isLocked = localStorage.getItem('match_profile_locked') === 'true';
    if(isLocked) return;

    // Optional Check: Ensure fields aren't empty before locking
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
    const sList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
    
    if(portGrid) {
        portGrid.innerHTML = '';
        if(sList.length === 0) {
            portGrid.innerHTML = '<p style="color:#aaa; font-size: 13px;">Your portfolio is empty. Go match!</p>';
        } else {
            sList.forEach(item => {
                let title = typeof item === 'string' ? item : item.title;
                let poster = typeof item === 'string' ? 'https://via.placeholder.com/500x750/0a0505/D4AF37?text=' + encodeURIComponent(title) : item.posterUrl;
                
                portGrid.innerHTML += `
                    <div class="poster-card">
                        <img src="${poster}" alt="${title}">
                        <div class="poster-title">${title}</div>
                    </div>
                `;
            });
        }
    }
};
