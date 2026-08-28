// At the top of your existing profile.js file, ensure you read the googleName
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
    const name = document.getElementById('profile-name').value;
    const country = document.getElementById('profile-country').value;
    const dob = document.getElementById('profile-dob').value;
    
    // (Rest of your existing save logic continues exactly as it was...)
    alert("Profile Successfully Locked & Tuned!");
};

// ==========================================
// ACCOUNT DELETION LOGIC (PREVIOUSLY ADDED)
// ==========================================
function openDeleteModal() { document.getElementById('delete-modal').style.display = 'flex'; document.getElementById('delete-confirm-check').checked = false; toggleDeleteBtn(); }
function closeDeleteModal() { document.getElementById('delete-modal').style.display = 'none'; }
function toggleDeleteBtn() {
    const isChecked = document.getElementById('delete-confirm-check').checked;
    const btn = document.getElementById('final-delete-btn');
    if (isChecked) { btn.disabled = false; btn.classList.remove('btn-disabled'); btn.classList.add('btn-danger-active'); } 
    else { btn.disabled = true; btn.classList.add('btn-disabled'); btn.classList.remove('btn-danger-active'); }
}

async function executeAccountDeletion() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;
        await supabaseClient.from('banned_emails').insert([{ email: user.email }]);
        await supabaseClient.from('profiles').delete().eq('id', user.id);
        await supabaseClient.auth.signOut();
        localStorage.clear();
        alert("Account permanently deleted.");
        window.location.href = '/index.html';
    } catch (err) { alert("Error deleting account. Contact support."); }
}
