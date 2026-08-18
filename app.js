let supabase = null;
try {
    const supabaseUrl = 'https://zkymvqrmbabngsqblyye.supabase.co';
    const supabaseKey = 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU';
    if (window.supabase) supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
} catch (e) { console.warn("Supabase init warning."); }

function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast-message ${type === 'success' ? 'toast-success' : 'toast-error'}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
    const devResetBtn = document.getElementById('dev-reset-btn');
    if (devResetBtn) {
        devResetBtn.addEventListener('click', () => {
            localStorage.removeItem('hasUsedFreeMatch');
            showToast("🔧 Limit Reset! You can test again.", "success");
        });
    }

    // Session check
    async function checkSession() {
        if (!supabase) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const user = session.user;
                const profile = user.user_metadata || {};
                const name = profile.first_name || user.email.split('@')[0];
                document.getElementById('auth-section')?.classList.add('hidden');
                document.getElementById('user-info-section')?.classList.remove('hidden');
                document.getElementById('rule-banner')?.classList.add('hidden');
                document.getElementById('user-greeting').innerText = `✨ Welcome back, ${name}!`;
                document.getElementById('user-profile-meta').innerText = `📍 ${profile.city || 'VIP Member'}`;
            }
        } catch (e) {}
    }
    checkSession();

    document.getElementById('login-btn')?.addEventListener('click', async () => {
        const email = document.getElementById('login-email')?.value.trim();
        const password = document.getElementById('login-password')?.value;
        if (!email || !password) return showToast("Please enter email and password.", "error");
        
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            showToast("Login successful!", "success");
            setTimeout(() => location.reload(), 1000);
        } catch (err) {
            showToast(`Login Error: ${err.message}`, "error");
        }
    });

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        if (supabase) await supabase.auth.signOut();
        location.reload();
    });

    // MATCHMAKING SUBMISSION -> REDIRECTS TO LOADING PAGE
    const submitBtn = document.getElementById('submit-match-btn');
    const ageErrorBanner = document.getElementById('age-error-banner');

    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (ageErrorBanner) ageErrorBanner.classList.add('hidden');

            const age = parseInt(document.getElementById('age')?.value) || 0;
            
            // STRICT MINIMUM AGE 16 CHECK
            if (age < 16) {
                if (ageErrorBanner) ageErrorBanner.classList.remove('hidden');
                showToast("⚠️ You must be at least 16 years old to use MatchApp.", "error");
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const formData = {
                age: age,
                country: document.getElementById('country')?.value.trim() || "Global",
                format: document.getElementById('format')?.value || "movie",
                mood: document.getElementById('mood')?.value || "drama",
                era: document.getElementById('era')?.value || "any",
                lang: document.getElementById('langpref')?.value || "subtitled",
                platform: document.getElementById('platform')?.value || "any"
            };

            // Save form parameters to localStorage and navigate to loading page
            localStorage.setItem('matchQuery', JSON.stringify(formData));
            window.location.href = 'loading.html';
        });
    }
});
