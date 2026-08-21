console.log("Profile Engine Initialized");
let supabaseClient = null;

try { if (window.supabase) supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU'); } catch(e){}

window.addEventListener('DOMContentLoaded', async () => {
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { window.location.href = 'register.html'; return; }

    const meta = session.user.user_metadata || {};

    // Load & Lock Immutable Data
    if (meta.age) {
        document.getElementById('prof-age').value = meta.age;
        document.getElementById('prof-age').disabled = true;
    }
    if (meta.star_sign) {
        document.getElementById('prof-zodiac').value = meta.star_sign;
        document.getElementById('prof-zodiac').disabled = true;
    }

    // Load Default Preferences (Includes Platform & Aesthetic)
    if (meta.pref_category) document.getElementById('pref-category').value = meta.pref_category;
    if (meta.pref_platform) document.getElementById('pref-platform').value = meta.pref_platform;
    if (meta.pref_mood) document.getElementById('pref-mood').value = meta.pref_mood;
    if (meta.pref_aesthetic) document.getElementById('pref-aesthetic').value = meta.pref_aesthetic;
});

window.saveProfile = async function() {
    const ageInput = document.getElementById('prof-age');
    const zodiacInput = document.getElementById('prof-zodiac');
    
    let updateData = {
        pref_category: document.getElementById('pref-category').value,
        pref_platform: document.getElementById('pref-platform').value,
        pref_mood: document.getElementById('pref-mood').value,
        pref_aesthetic: document.getElementById('pref-aesthetic').value
    };

    // Only save Age/Zodiac if they aren't disabled yet
    if (!ageInput.disabled && ageInput.value) updateData.age = parseInt(ageInput.value);
    if (!zodiacInput.disabled && zodiacInput.value) updateData.star_sign = zodiacInput.value;

    try {
        const { error } = await supabaseClient.auth.updateUser({ data: updateData });
        if (error) throw error;
        alert("✅ Profile settings saved successfully! Your defaults are updated.");
        window.location.href = 'index.html';
    } catch (err) { alert("❌ Error saving profile: " + err.message); }
};

window.doLogout = async function() {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    }
};
