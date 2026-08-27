function checkDailyLimit() {
    if (isVIP || isAdFree) return true; 
    const todayStr = new Date().toLocaleDateString();
    let lastDate = localStorage.getItem('match_lastDate');
    let dailyCount = parseInt(localStorage.getItem('match_dailyCount') || '0');
    if (lastDate !== todayStr) { dailyCount = 0; localStorage.setItem('match_lastDate', todayStr); }
    if (!isUserLoggedIn && dailyCount >= 5) { 
        alert("🔒 You've used your 5 free guest matches today!\n\nPlease register for a FREE account to lock in your identity, save your history, and unlock your next daily allowance!"); 
        openAuthModal(); 
        return false; 
    }
    if (isUserLoggedIn && dailyCount >= 5) { 
        alert("💎 You've reached your daily limit of 5 free matches!\n\nUpgrade to a VIP Pack for unlimited matches, zero ads, and premium AI features!"); 
        // FIXED PRICING REDIRECT PATH
        window.location.href = '/pricing/pricing.html'; 
        return false; 
    }
    dailyCount++; 
    localStorage.setItem('match_dailyCount', dailyCount.toString()); 
    return true;
}

// FIXED LOGOUT REDIRECT PATH
window.doLogout = async function() { 
    if (supabaseClient) { 
        await supabaseClient.auth.signOut(); 
        localStorage.clear(); 
        window.location.href = '/index.html'; 
    } 
};

// FIXED OAUTH REDIRECT PATH (If you use Google Auth in App.js)
window.signInWithGoogle = async function() { 
    if (!supabaseClient) { alert("Server connection failed. Please refresh."); return; } 
    const { error } = await supabaseClient.auth.signInWithOAuth({ 
        provider: 'google', 
        options: { redirectTo: window.location.origin + '/index.html' } 
    }); 
    if (error) alert("Google Login Error: " + error.message); 
};
