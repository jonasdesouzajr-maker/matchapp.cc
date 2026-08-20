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

    // Load Default Preferences
    if (meta.pref_category) document.getElementById('pref-category').value = meta.pref_category;
    if (meta.pref_mood) document.getElementById('pref-mood').value = meta.pref_mood;
    if (meta.pref_era) document.getElementById('pref-era').value = meta.pref_era;
    if (meta.pref_company) document.getElementById('pref-company').value = meta.pref_company;
});

window.saveProfile = async function() {
    const ageInput = document.getElementById('prof-age');
    const zodiacInput = document.getElementById('prof-zodiac');
    
    let updateData = {
        pref_category: document.getElementById('pref-category').value,
        pref_mood: document.getElementById('pref-mood').value,
        pref_era: document.getElementById('pref-era').value,
        pref_company: document.getElementById('pref-company').value
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
