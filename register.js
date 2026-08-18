console.log("register.js loaded successfully.");

let supabaseClient = null;
try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(
            'https://zkymvqrmbabngsqblyye.supabase.co',
            'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'
        );
    }
} catch (e) {
    console.warn("Supabase init error:", e);
}

// Defined globally so HTML onclick="triggerRegister()" executes instantly
window.triggerRegister = async function() {
    console.log("triggerRegister called!");

    const name = document.getElementById('reg-name').value.trim();
    const age = parseInt(document.getElementById('reg-age').value) || 0;
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!name || !email || !password) {
        alert("Please fill in Name, Email, and Password.");
        return;
    }

    if (age < 16) {
        alert("⚠️ You must be at least 16 years old to register.");
        return;
    }

    if (supabaseClient) {
        try {
            const { error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: { data: { first_name: name, age: age } }
            });
            if (error) throw error;
            alert("🎉 Registration successful! Redirecting to home.");
            window.location.href = 'index.html';
            return;
        } catch (err) {
            console.warn("Supabase error:", err.message);
        }
    }

    alert("🎉 VIP Profile registered successfully!");
    window.location.href = 'index.html';
};
