document.addEventListener('DOMContentLoaded', () => {
    // Check if Google Name exists and auto-fill if empty
    const googleName = localStorage.getItem('match_googleName');
    const nameInput = document.getElementById('profile-name');
    if (googleName && nameInput && !nameInput.value) {
        nameInput.value = googleName;
    }
});

// Update the saveProfileData function to trigger Confetti and Audio
window.saveProfileData = async function() {
    // 1. Fire FX
    if (typeof window.playPremiumSound === 'function') window.playPremiumSound();
    if (typeof window.fireConfetti === 'function') window.fireConfetti();
    
    // 2. Extract Data
    const name = document.getElementById('profile-name')?.value || '';
    const country = document.getElementById('profile-country')?.value || '';
    const dob = document.getElementById('profile-dob')?.value || '';
    const starsign = document.getElementById('profile-starsign')?.value || '';
    const orientation = document.getElementById('profile-orientation')?.value || '';
    
    const prefService = document.getElementById('pref-service')?.value || '';
    const prefGenre = document.getElementById('pref-genre')?.value || '';
    const prefDecade = document.getElementById('pref-decade')?.value || '';
    
    // 3. Save to Supabase (if available)
    if (window.supabaseClient && window.isUserLoggedIn) {
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
    
    alert("Profile Successfully Locked & Tuned!");
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
        await window.supabaseClient.from('banned_emails').insert([{ email: user.email }]);
        await window.supabaseClient.from('profiles').delete().eq('id', user.id);
        await window.supabaseClient.auth.signOut();
        localStorage.clear();
        alert("Account permanently deleted.");
        window.location.href = '/index.html';
    } catch (err) { alert("Error deleting account. Contact support."); }
}
