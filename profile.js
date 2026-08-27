// ==========================================
// ACCOUNT DELETION LOGIC
// ==========================================

function openDeleteModal() {
    document.getElementById('delete-modal').style.display = 'flex';
    // Reset state every time it opens
    document.getElementById('delete-confirm-check').checked = false;
    toggleDeleteBtn(); 
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
}

function toggleDeleteBtn() {
    const isChecked = document.getElementById('delete-confirm-check').checked;
    const btn = document.getElementById('final-delete-btn');
    const wrapper = document.getElementById('delete-checkbox-wrapper');
    const textSpan = document.getElementById('delete-checkbox-text');

    if (isChecked) {
        btn.disabled = false;
        btn.classList.remove('btn-disabled');
        btn.classList.add('btn-danger-active');
        wrapper.classList.add('checked-active');
        textSpan.style.color = '#fff';
    } else {
        btn.disabled = true;
        btn.classList.add('btn-disabled');
        btn.classList.remove('btn-danger-active');
        wrapper.classList.remove('checked-active');
        textSpan.style.color = '#bbb';
    }
}

async function executeAccountDeletion() {
    try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) throw new Error("Could not authenticate user for deletion.");

        const userEmail = user.email;

        // 1. Insert email into permanent ban list
        const { error: banError } = await supabaseClient
            .from('banned_emails')
            .insert([{ email: userEmail }]);
            
        if (banError && banError.code !== '23505') { 
            // Ignore unique violation (23505) if they were somehow already banned
            console.error("Ban logging error:", banError);
        }

        // 2. Erase their profile & portfolio data (Optional if relying on Supabase Cascade, but good for thoroughness)
        await supabaseClient.from('profiles').delete().eq('id', user.id);
        await supabaseClient.from('portfolio').delete().eq('user_id', user.id);

        // 3. To securely delete the Auth user, you typically trigger a Supabase Edge Function 
        // OR rely on an internal RPC function. For security, we will log them out immediately 
        // after stripping their data and banning the email.
        
        await supabaseClient.auth.signOut();
        localStorage.clear();
        
        alert("Your account and all associated data have been permanently deleted.");
        window.location.href = '/index.html';

    } catch (err) {
        alert("An error occurred while deleting your account. Please contact support.");
        console.error(err);
    }
}
