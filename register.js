console.log("register.js loaded successfully.");

let supabaseClient = null;
try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(
            'https://zkymvqrmbabngsqblyye.supabase.co',
            'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'
        );
        console.log("Supabase connected on registration page.");
    }
} catch (e) {
    console.warn("Supabase init error:", e);
}

window.triggerRegister = async function() {
    const name = document.getElementById('reg-name').value.trim();
    const age = parseInt(document.getElementById('reg-age').value) || 0;
    const country = document.getElementById('reg-country').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const orientation = document.getElementById('reg-orientation').value;
    const viewing = document.getElementById('reg-viewing').value;
    const history = document.getElementById('reg-history').value.trim();

    if (!name || !email || !password || !country) {
        alert("⚠️ Please fill in all required fields marked with *.");
        return;
    }

    if (age < 16) {
        alert("⚠️ You must be at least 16 years old to register.");
        return;
    }

    if (password.length < 6) {
        alert("⚠️ Password must be at least 6 characters long.");
        return;
    }

    if (!supabaseClient) {
        alert("❌ Database client is offline. Check your connection or ad-blocker.");
        return;
    }

    try {
        const { error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: name,
                    age: age,
                    country: country,
                    sexual_orientation: orientation,
                    viewing_style: viewing,
                    watch_history: history
                }
            }
        });

        if (error) throw error;

        alert("🎉 VIP Profile registered successfully! You can now log in.");
        window.location.href = 'index.html';

    } catch (err) {
        alert("❌ Registration Failed: " + err.message);
    }
};
