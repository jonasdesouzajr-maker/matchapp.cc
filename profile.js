console.log("Profile Engine 87.0: Locked Fields & Cover Art Grids Active");

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check if Identity is Locked
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

    const confirmLock = confirm("⚠️ WARNING:\n\nSaving your Core Identity will lock these fields permanently to ensure profile security and AI consistency. Are you sure you want to save?");
    if(!confirmLock) return;

    localStorage.setItem('match_profile_locked', 'true');
    alert("✅ Profile successfully saved and locked!");
    window.location.reload();
};

window.renderProfileGrids = function() {
    const portGrid = document.getElementById('portfolio-grid');
    const histGrid = document.getElementById('history-grid');

    const sList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
    
    if(portGrid) {
        portGrid.innerHTML = '';
        if(sList.length === 0) {
            portGrid.innerHTML = '<p style="color:#aaa; font-size: 13px;">Your portfolio is empty. Go match!</p>';
        } else {
            sList.forEach(item => {
                // Support legacy string arrays or new object arrays
                let title = typeof item === 'string' ? item : item.title;
                let poster = typeof item === 'string' ? 'https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=400&q=80' : item.posterUrl;
                
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
