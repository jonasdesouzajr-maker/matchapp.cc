console.log("Profile Engine Loaded: Google Auto-Fill Active");

document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async () => {
        const client = window.supabaseClient || (window.supabase ? window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpreW12cXJtYmFibmdzcWJseXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDUyNDIsImV4cCI6MjEwMjM4MTI0Mn0._yEVFMfwVU6GBqQ8m3ljfOgA0HSLEDiKMOfYae6ZD8Q') : null);

        if (!client) return;

        const { data: { user } } = await client.auth.getUser();
        if (user) {
            const meta = user.user_metadata || {};
            
            // 1. Email Display
            const emailDisp = document.getElementById('user-email-display');
            if (emailDisp) emailDisp.innerText = `Logged in as: ${user.email}`;

            // 2. Profile Avatar Image from Google
            const avatarUrl = meta.avatar_url || meta.picture;
            const profPic = document.getElementById('profile-pic-preview');
            if (avatarUrl && profPic) profPic.src = avatarUrl;

            // 3. Fetch Stored Profile from Supabase
            const { data: profile } = await client
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // Auto-Fill Form (Prefers saved profile, falls back to Google OAuth metadata)
            const nameField = document.getElementById('profile-name');
            if (nameField) nameField.value = profile?.full_name || meta.full_name || meta.name || '';

            const countryField = document.getElementById('profile-country');
            if (countryField) countryField.value = profile?.country || meta.locale || meta.country || '';

            const dobField = document.getElementById('profile-dob');
            const birthDateVal = profile?.dob || meta.birthday || meta.birthdate || '';
            if (dobField) {
                dobField.value = birthDateVal;
                if (birthDateVal.length === 10) triggerAgeCalc(birthDateVal);
            }

            const starSignSelect = document.getElementById('profile-starsign');
            if (starSignSelect && profile?.starsign) starSignSelect.value = profile.starsign;

            const orientSelect = document.getElementById('profile-orientation');
            if (orientSelect) {
                if (profile?.sexual_orientation) orientSelect.value = profile.sexual_orientation;
                else if (meta.gender) {
                    const g = meta.gender.toLowerCase();
                    if (g.includes('male')) orientSelect.value = 'Straight';
                }
            }

            // AI Preferences
            if (document.getElementById('pref-service')) document.getElementById('pref-service').value = profile?.pref_service || 'Netflix';
            if (document.getElementById('pref-genre')) document.getElementById('pref-genre').value = profile?.pref_genre || 'Thriller';
            if (document.getElementById('pref-decade')) document.getElementById('pref-decade').value = profile?.pref_decade || 'New';

        } else {
            const emailDisp = document.getElementById('user-email-display');
            if (emailDisp) emailDisp.innerText = "Session expired. Please log in.";
        }
        
        renderProfileGrids();
    }, 600);
});

function triggerAgeCalc(dobStr) {
    try {
        const parts = dobStr.split('/');
        if (parts.length === 3) {
            const bDate = new Date(parts[2], parts[1] - 1, parts[0]);
            const ageDifMs = Date.now() - bDate.getTime();
            const ageDate = new Date(ageDifMs);
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            const ageDisp = document.getElementById('profile-age-display');
            if (ageDisp) ageDisp.value = `${age} years old`;
        }
    } catch(e) {}
}

const dobInput = document.getElementById('profile-dob');
if(dobInput) {
    dobInput.addEventListener('input', function(e) {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) val = val.substring(0,2) + '/' + val.substring(2);
        if (val.length > 5) val = val.substring(0,5) + '/' + val.substring(5,9);
        e.target.value = val;
        if (val.length === 10) triggerAgeCalc(val);
    });
}

window.saveProfileData = async function() {
    if (typeof window.playPremiumSound === 'function') window.playPremiumSound();
    if (typeof window.fireConfetti === 'function') window.fireConfetti();
    
    const name = document.getElementById('profile-name')?.value || '';
    const country = document.getElementById('profile-country')?.value || '';
    const dob = document.getElementById('profile-dob')?.value || '';
    const starsign = document.getElementById('profile-starsign')?.value || '';
    const orientation = document.getElementById('profile-orientation')?.value || '';
    
    const prefService = document.getElementById('pref-service')?.value || '';
    const prefGenre = document.getElementById('pref-genre')?.value || '';
    const prefDecade = document.getElementById('pref-decade')?.value || '';
    
    const client = window.supabaseClient;
    if (client) {
        try {
            const { data: { user } } = await client.auth.getUser();
            if (user) {
                await client.from('profiles').upsert({
                    id: user.id,
                    email: user.email,
                    full_name: name,
                    country: country,
                    dob: dob,
                    starsign: starsign,
                    sexual_orientation: orientation,
                    pref_service: prefService,
                    pref_genre: prefGenre,
                    pref_decade: prefDecade,
                    updated_at: new Date().toISOString()
                });
            }
        } catch (e) { console.error("Profile save error:", e); }
    }
    
    if(typeof gtag === 'function') gtag('event', 'profile_updated');
    alert("Profile Successfully Updated!");
};

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

window.openDeleteModal = function() { 
    document.getElementById('delete-modal').style.display = 'flex'; 
    document.getElementById('delete-confirm-check').checked = false; 
    toggleDeleteBtn(); 
};
window.closeDeleteModal = function() { document.getElementById('delete-modal').style.display = 'none'; };
window.toggleDeleteBtn = function() {
    const isChecked = document.getElementById('delete-confirm-check').checked;
    const btn = document.getElementById('final-delete-btn');
    if (isChecked) { btn.disabled = false; btn.classList.remove('btn-disabled'); btn.classList.add('btn-danger-active'); } 
    else { btn.disabled = true; btn.classList.add('btn-disabled'); btn.classList.remove('btn-danger-active'); }
};

window.executeAccountDeletion = async function() {
    try {
        const client = window.supabaseClient;
        if (!client) throw new Error("No database connection");
        const { data: { user } } = await client.auth.getUser();
        if (!user) return;
        
        await client.from('profiles').delete().eq('id', user.id);
        if(typeof gtag === 'function') gtag('event', 'account_deleted');
        
        await client.auth.signOut();
        localStorage.clear();
        alert("Account permanently deleted.");
        window.location.href = '/index.html';
    } catch (err) { alert("Error deleting account. Contact support@matchapp.cc."); }
};
