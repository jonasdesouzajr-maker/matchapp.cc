// --- ADD THIS HELPER FUNCTION ANYWHERE IN APP.JS ---
async function checkIfBanned(email) {
    if (!email) return false;
    const { data, error } = await supabaseClient
        .from('banned_emails')
        .select('email')
        .eq('email', email)
        .single();
    
    if (data) return true; // Email found in banned list
    return false;
}

// --- UPDATE YOUR AUTH STATE CHANGE LISTENER IN APP.JS ---
// Usually looks like: supabaseClient.auth.onAuthStateChange(...)
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (session && session.user) {
        // Enforce the permanent ban on fresh logins (catches Google OAuth too)
        const isBanned = await checkIfBanned(session.user.email);
        if (isBanned) {
            alert("⚠️ This email address has been permanently deleted and cannot be used to access or create a new account.");
            await supabaseClient.auth.signOut();
            localStorage.clear();
            window.location.href = '/index.html';
            return;
        }
        
        isUserLoggedIn = true;
        // ... (rest of your normal login UI updates: hide reg buttons, show profile tab, etc.)
    } else {
        isUserLoggedIn = false;
        // ... (rest of your normal logout UI updates)
    }
});

// --- UPDATE YOUR handleEmailSignup() FUNCTION IN APP.JS ---
window.handleEmailSignup = async function() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const msgEl = document.getElementById('auth-message');
    
    if(!email || !password) {
        msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = "Please fill both fields."; return;
    }

    // 1. Check if email is permanently deleted/banned BEFORE creating the account
    const isBanned = await checkIfBanned(email);
    if (isBanned) {
        msgEl.style.display = 'block'; 
        msgEl.style.color = '#ff5252'; 
        msgEl.innerText = "This email address has been permanently deleted and cannot be used to create a new account."; 
        return; // Stop signup process
    }

    // 2. Proceed with normal signup
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if(error) {
        msgEl.style.display = 'block'; msgEl.style.color = '#ff5252'; msgEl.innerText = error.message;
    } else {
        msgEl.style.display = 'block'; msgEl.style.color = '#25D366'; msgEl.innerText = "Registration successful! You are now signed in.";
        setTimeout(closeAuthModal, 1500);
    }
};
