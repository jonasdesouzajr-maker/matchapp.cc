console.log("Profile Controller Initialized");

let supabaseClient = null;

try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU');
    }
} catch (e) { console.warn("Supabase init error"); }

window.addEventListener('DOMContentLoaded', async () => {
    if (!supabaseClient) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    
    // Kick user out if they aren't logged in
    if (!session) {
        window.location.href = 'register.html';
        return;
    }

    const user = session.user;
    const meta = user.user_metadata || {};

    // Populate Fields
    document.getElementById('prof-email').value = user.email;
    document.getElementById('prof-name').value = meta.first_name || '';
    document.getElementById('prof-age').value = meta.age || '';
    
    if (meta.star_sign) document.getElementById('prof-zodiac').value = meta.star_sign;
    if (meta.household_size) document.getElementById('prof-household').value = meta.household_size;
});

window.saveProfile = async function() {
    if (!supabaseClient) return alert("❌ Database offline.");

    const name = document.getElementById('prof-name').value.trim();
    const age = parseInt(document.getElementById('prof-age').value);
    const zodiac = document.getElementById('prof-zodiac').value;
    const household = document.getElementById('prof-household').value;
    const newPassword = document.getElementById('prof-password').value;

    const updatePayload = {
        data: {
            first_name: name,
            age: age,
            star_sign: zodiac,
            household_size: household
        }
    };

    try {
        // Update Metadata
        const { error: metaError } = await supabaseClient.auth.updateUser(updatePayload);
        if (metaError) throw metaError;

        // Update Password if typed
        if (newPassword.length > 0) {
            if (newPassword.length < 6) return alert("⚠️ Password must be at least 6 characters.");
            const { error: passError } = await supabaseClient.auth.updateUser({ password: newPassword });
            if (passError) throw passError;
        }

        alert("✅ Profile settings saved successfully! Your matches are now upgraded.");
        window.location.href = 'index.html';

    } catch (err) {
        alert("❌ Error saving profile: " + err.message);
    }
};

window.doLogout = async function() {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    }
};
