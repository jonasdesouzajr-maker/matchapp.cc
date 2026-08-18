// 1. INITIALIZE SUPABASE
let supabase = null;
try {
    const supabaseUrl = 'https://zkymvqrmbabngsqblyye.supabase.co';
    const supabaseKey = 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU';
    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    }
} catch (e) {
    console.warn("Supabase initialization warning.");
}

// TOAST HELPER
function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast-message ${type === 'success' ? 'toast-success' : 'toast-error'}`;
    toast.innerText = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// HANDLE REGISTRATION SUBMISSION
document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('submit-register-btn');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        if (!supabase) {
            showToast("Database connection offline. Please check network.", "error");
            return;
        }

        const name = document.getElementById('reg-name')?.value.trim();
        const age = document.getElementById('reg-age')?.value.trim();
        const email = document.getElementById('reg-email')?.value.trim();
        const password = document.getElementById('reg-password')?.value;
        const country = document.getElementById('reg-country')?.value.trim();
        const city = document.getElementById('reg-city')?.value.trim() || "";
        const orientation = document.getElementById('reg-orientation')?.value;
        const viewingStyle = document.getElementById('reg-viewing-style')?.value;
        const history = document.getElementById('reg-history')?.value.trim() || "";
        
        const genreSelect = document.getElementById('reg-genres');
        const selectedGenres = genreSelect ? Array.from(genreSelect.selectedOptions).map(opt => opt.value) : [];

        // VALIDATION
        if (!name || !age || !email || !password || !country) {
            showToast("Please fill in all required fields marked with *.", "error");
            return;
        }

        if (password.length < 6) {
            showToast("Password must be at least 6 characters long.", "error");
            return;
        }

        submitBtn.innerText = "Creating VIP Profile...";

        try {
            const { data, error } = await supabase.auth.signUp({ 
                email, 
                password,
                options: {
                    data: {
                        first_name: name,
                        age: parseInt(age),
                        country: country,
                        city: city,
                        sexual_orientation: orientation,
                        viewing_style: viewingStyle,
                        favorite_genres: selectedGenres,
                        watch_history: history
                    }
                }
            });

            if (error) throw error;

            showToast("🎉 VIP Profile successfully created! Redirecting...", "success");
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);

        } catch (err) {
            showToast(`Registration Failed: ${err.message}`, "error");
            submitBtn.innerText = "Complete VIP Registration & Login";
        }
    });
});
