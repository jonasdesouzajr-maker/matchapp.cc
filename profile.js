console.log("Profile & Portfolio Engine Loaded");

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Wait briefly for Supabase session to init from app.js
    setTimeout(async () => {
        if (!window.supabaseClient) return;

        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) {
            document.getElementById('user-email-display').innerText = `Logged in as: ${user.email}`;
            
            // 2. Fetch Profile Data from Supabase
            const { data: profile } = await window.supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                if (document.getElementById('profile-name')) document.getElementById('profile-name').value = profile.full_name || '';
                if (document.getElementById('profile-country')) document.getElementById('profile-country').value = profile.country || '';
                if (document.getElementById('profile-dob')) document.getElementById('profile-dob').value = profile.dob || '';
                if (document.getElementById('profile-starsign')) document.getElementById('profile-starsign').value = profile.starsign || '';
                if (document.getElementById('profile-orientation')) document.getElementById('profile-orientation').value = profile.sexual_orientation || '';
                if (document.getElementById('pref-service')) document.getElementById('pref-service').value = profile.pref_service || 'Netflix';
                if (document.getElementById('pref-genre')) document.getElementById('pref-genre').value = profile.pref_genre || 'Thriller';
                if (document.getElementById('pref-decade')) document.getElementById('pref-decade').value = profile.pref_decade || 'New';
            }
        } else {
            document.getElementById('user-email-display').innerText = "Session expired. Please log in.";
        }
        
        // Render Grids
        renderProfileGrids();
    }, 800);
});

// Calculate Dynamic Age
const dobInput = document.getElementById('profile-dob');
if(dobInput) {
    dobInput.addEventListener('input', function(e) {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) val = val.substring(0,2) + '/' + val.substring(2);
        if (val.length > 5) val = val.substring(0,5) + '/' + val.substring(5,9);
        e.target.value = val;
        
        if (val.length === 10) {
            const parts = val.split('/');
            const bDate = new Date(parts[2], parts[1] - 1, parts[0]);
            const ageDifMs = Date.now() - bDate.getTime();
            const ageDate = new Date(ageDifMs);
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            document.getElementById('profile-age-display').value = `${age} years old`;
        }
    });
}

window.saveProfileData = async function() {
    // SFX
    if (typeof window.playPremiumSound === 'function') window.playPremiumSound();
    if (typeof window.fireConfetti === 'function') window.fireConfetti();
    
    // Extract Data
    const name = document.getElementById('profile-name')?.value || '';
    const country = document.getElementById('profile-country')?.value || '';
    const dob = document.getElementById('profile-dob')?.value || '';
    const starsign = document.getElementById('profile-starsign')?.value || '';
    const orientation = document.getElementById('profile-orientation')?.value || '';
    
    const prefService = document.getElementById('pref-service')?.value || '';
    const prefGenre = document.getElementById('pref-genre')?.value || '';
    const prefDecade = document.getElementById('pref-decade')?.value || '';
    
    // Save to Supabase DB
    if (window.supabaseClient) {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user) {
                await window.supabaseClient.from('profiles').upsert({
                    id: user.id,
                    full_name: name,
                    country: country,
                    dob: dob,
                    starsign: starsign,
                    sexual_orientation: orientation,
                    pref_service: prefService,
                    pref_genre: prefGenre,
                    pref_decade: prefDecade
                });
            }
        } catch (e) {
            console.error("Profile save error:", e);
        }
    }
    
    if(typeof gtag === 'function') gtag('event', 'profile_updated');
    alert("Profile Successfully Locked & Tuned!");
};

// Render the grids dynamically from LocalStorage (synced via app.js)
window.renderProfileGrids = function() {
    const savedList = JSON.parse(localStorage.getItem('match_savedList') || '[]');
    const seenList = JSON.parse(localStorage.getItem('match_seenList') || '[]');
    const ratings = JSON.parse(localStorage.getItem('match_userRatings') || '{}');
    
    const pGrid = document.getElementById('portfolio-grid');
    const hGrid = document.getElementById('history-grid');

    if(pGrid) {
        pGrid.innerHTML = savedList.length === 0 ? '<p style="color: #666; font-size: 13px;">Your Watch Later list is empty.</p>' : '';
        savedList.forEach(title => {
            pGrid.innerHTML += `<div class="grid-item-card">
                <button class="delete-item-btn" onclick="removeItem('${title}', 'portfolio')">×</button>
                <div style="height: 160px; background:#222; display:flex; align-items:center; justify-content:center; text-align:center; padding:10px;"><span style="color:var(--gold); font-size:12px; font-weight:bold;">${title}</span></div>
            </div>`;
        });
    }

    if(hGrid) {
        hGrid.innerHTML = seenList.length === 0 ? '<p style="color: #666; font-size: 13px;">You haven\'t rated or marked anything as seen yet.</p>' : '';
        seenList.forEach(title => {
            const star = ratings[title] ? `${ratings[title]} ★` : 'Seen';
            hGrid.innerHTML += `<div class="grid-item-card" style="border-color: rgba(37,211,102,0.3);">
                <button class="delete-item-btn" onclick="removeItem('${title}', 'history')">×</button>
                <div class="item-rating-badge">${star}</div>
                <div style="height: 160px; background:#1a2b22; display:flex; align-items:center; justify-content:center; text-align:center; padding:10px;"><span style="color:#25D366; font-size:12px; font-weight:bold;">${title}</span></div>
            </div>`;
        });
    }
};

window.removeItem = function(title, type) {
    if(type === 'portfolio') {
        let list = JSON.parse(localStorage.getItem('match_savedList') || '[]');
        list = list.filter(t => t !== title);
        localStorage.setItem('match_savedList', JSON.stringify(list));
    } else {
        let list = JSON.parse(localStorage.getItem('match_seenList') || '[]');
        list = list.filter(t => t !== title);
        localStorage.setItem('match_seenList', JSON.stringify(list));
    }
    // Re-render
    renderProfileGrids();
};

window.clearListEntirely = function(type) {
    if (confirm(`Are you sure you want to clear your entire ${type} list?`)) {
        if(type === 'portfolio') localStorage.setItem('match_savedList', '[]');
        if(type === 'history') {
            localStorage.setItem('match_seenList', '[]');
            localStorage.setItem('match_userRatings', '{}');
        }
        renderProfileGrids();
    }
};

// ==========================================
// ACCOUNT DELETION LOGIC
// ==========================================
window.openDeleteModal = function() { 
    document.getElementById('delete-modal').style.display = 'flex'; 
    document.getElementById('delete-confirm-check').checked = false; 
    toggleDeleteBtn(); 
}
window.closeDeleteModal = function() { document.getElementById('delete-modal').style.display = 'none'; }
window.toggleDeleteBtn = function() {
    const isChecked = document.getElementById('delete-confirm-check').checked;
    const btn = document.getElementById('final-delete-btn');
    if (isChecked) { btn.disabled = false; btn.classList.remove('btn-disabled'); btn.classList.add('btn-danger-active'); } 
    else { btn.disabled = true; btn.classList.add('btn-disabled'); btn.classList.remove('btn-danger-active'); }
}

window.executeAccountDeletion = async function() {
    try {
        if (!window.supabaseClient) throw new Error("No database connection");
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;
        
        // Log the deletion request
        await window.supabaseClient.from('profiles').delete().eq('id', user.id);
        
        if(typeof gtag === 'function') gtag('event', 'account_deleted');
        
        await window.supabaseClient.auth.signOut();
        localStorage.clear();
        alert("Account permanently deleted.");
        window.location.href = '/index.html';
    } catch (err) { alert("Error deleting account. Contact support."); }
}
