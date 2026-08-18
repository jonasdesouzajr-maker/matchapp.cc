console.log("REGISTER.JS LOADED");

let supabase = null;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(
            'https://zkymvqrmbabngsqblyye.supabase.co',
            'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'
        );
        console.log("Supabase connected on register page.");
    }
} catch (e) {
    console.warn("Supabase init error:", e);
}

function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast-message ${type === 'success' ? 'toast-success' : 'toast-error'}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('submit-register-btn');
    if (!submitBtn) {
        console.error("submit-register-btn not found!");
        return;
    }

    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log("Register button clicked.");

        if (!supabase) {
            showToast("Database connection offline. Check ad blockers.", "error");
            return;
        }

        const name = document.getElementById('reg-name')?.value.trim();
        const age = parseInt(document.getElementById('reg-age')?.value) || 0;
        const email = document.getElementById('reg-email')?.value.trim();
        const password = document.getElementById('reg-password')?.value;
        const country = document.getElementById('reg-country')?.value.trim();
        const city = document.getElementById('reg-city')?.value.trim() || "";
        const orientation = document.getElementById('reg-orientation')?.value;
        const viewingStyle = document.getElementById('reg-viewing-style')?.value;
        const history = document.getElementById('reg-history')?.value.trim() || "";
        
        const genreSelect = document.getElementById('reg-genres');
        const selectedGenres = genreSelect ? Array.from(genreSelect.selectedOptions).map(opt => opt.value) : [];

        if (!name || !age || !email || !password || !country) {
            showToast("Please fill in all required fields marked with *.", "error");
            return;
        }

        if (age < 16) {
            showToast("⚠️ You must be at least 16 years old to register.", "error");
            return;
        }

        if (password.length < 6) {
            showToast("Password must be at least 6 characters long.", "error");
            return;
        }

        submitBtn.innerText = "Creating VIP Profile...";

        try {
            const { error } = await supabase.auth.signUp({ 
                email, 
                password,
                options: {
                    data: {
                        first_name: name,
                        age: age,
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
            setTimeout(() => { window.location.href = 'index.html'; }, 2000);

        } catch (err) {
            console.error("Registration error:", err);
            showToast(`Registration Failed: ${err.message}`, "error");
            submitBtn.innerText = "Complete VIP Registration & Login";
        }
    });
});
