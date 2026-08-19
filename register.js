console.log("Mastercode 12.0: Auth Controller Initialized");

let supabaseClient = null;
try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU');
    }
} catch (e) { console.warn("Supabase init error"); }

window.switchTab = function(target) {
    const sReg = document.getElementById('sec-reg');
    const sLog = document.getElementById('sec-log');
    const bReg = document.getElementById('tab-reg');
    const bLog = document.getElementById('tab-log');

    if (target === 'reg') {
        sReg.style.display = 'block';
        sLog.style.display = 'none';
        bReg.className = 'gold-btn';
        bLog.className = 'secondary-btn';
        bLog.style.background = 'rgba(20,20,35,0.8)';
        bLog.style.border = 'none';
    } else {
        sReg.style.display = 'none';
        sLog.style.display = 'block';
        bLog.className = 'gold-btn';
        bLog.style.border = 'none';
        bReg.className = 'secondary-btn';
        bReg.style.background = 'rgba(20,20,35,0.8)';
        bReg.style.border = 'none';
    }
};

window.loginWithProvider = async function(providerName) {
    if (!supabaseClient) return alert("❌ Database is offline. Check ad-blocker.");
    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: providerName,
            options: { redirectTo: window.location.origin + '/index.html' }
        });
        if (error) throw error;
    } catch (err) {
        alert(`❌ ${providerName} Login Failed: ` + err.message);
    }
};

window.doRegister = async function() {
    const name = document.getElementById('reg-name').value.trim();
    const age = parseInt(document.getElementById('reg-age').value) || 0;
    const country = document.getElementById('reg-country').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const snack = document.getElementById('reg-snack').value;
    const viewing = document.getElementById('reg-viewing').value;

    if (!name || !email || !password || !country) return alert("⚠️ Please fill in all required fields (*).");
    if (age < 16) return alert("⚠️ You must be at least 16 years old to register.");
    if (password.length < 6) return alert("⚠️ Password must be at least 6 characters long.");
    if (!supabaseClient) return alert("❌ Database is offline. Check your ad-blocker.");

    try {
        const { error } = await supabaseClient.auth.signUp({
            email, password,
            options: { data: { first_name: name, age: age, country: country, snack_preference: snack, viewing_style: viewing } }
        });
        if (error) throw error;
        alert("🎉 VIP Profile registered successfully! You can now log in.");
        window.switchTab('log');
    } catch (err) {
        alert("❌ Registration Failed: " + err.message);
    }
};

window.doLogin = async function() {
    const email = document.getElementById('log-email').value.trim();
    const password = document.getElementById('log-password').value;

    if (!email || !password) return alert("⚠️ Please enter email and password.");
    if (!supabaseClient) return alert("❌ Database is offline.");

    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        alert("🎉 Logged in successfully! Redirecting...");
        window.location.href = 'index.html';
    } catch (err) {
        alert("❌ Login Failed: " + err.message);
    }
};
