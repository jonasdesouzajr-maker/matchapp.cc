/* ============================================================
   © 2026 MatchApp.cc — All Rights Reserved.
   Proprietary source code. Not licensed for reproduction, scraping,
   or reuse in competing products. See /terms.html Section 4.
   ============================================================ */

console.log("Master Auth Engine Active");

let supabaseClient = null;

try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpreW12cXJtYmFibmdzcWJseXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDUyNDIsImV4cCI6MjEwMjM4MTI0Mn0._yEVFMfwVU6GBqQ8m3ljfOgA0HSLEDiKMOfYae6ZD8Q');
        window.supabaseClient = supabaseClient;
    }
} catch (e) {
    console.warn("Supabase initialization error in auth.js");
}

// 🔵 GOOGLE OAUTH
window.loginWithGoogle = async function() {
    if (!supabaseClient) {
        alert("Supabase client not loaded. Check internet connection.");
        return;
    }
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/index.html'
        }
    });
    if (error) {
        const msgBox = document.getElementById('auth-message');
        if (msgBox) {
            msgBox.style.color = '#ff5252';
            msgBox.innerText = "Google Login Error: " + error.message;
        }
    }
};

// ✉️ EMAIL REGISTRATION
window.signUpEmail = async function() {
    if (!supabaseClient) return;
    
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    const msgBox = document.getElementById('auth-message');

    if (!email || !password) {
        msgBox.style.color = '#ff5252';
        msgBox.innerText = "Please enter both email and password.";
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                matches_left: 1,
                is_vip: false,
                seen_list: [],
                saved_list: [],
                disliked_list: [],
                user_ratings: {}
            }
        }
    });

    if (error) {
        msgBox.style.color = '#ff5252';
        msgBox.innerText = "Sign Up Error: " + error.message;
    } else {
        msgBox.style.color = '#25D366';
        msgBox.innerText = "🎉 Account created successfully! Redirecting...";
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
};

// ✉️ EMAIL LOGIN
window.signInEmail = async function() {
    if (!supabaseClient) return;
    
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    const msgBox = document.getElementById('auth-message');

    if (!email || !password) {
        msgBox.style.color = '#ff5252';
        msgBox.innerText = "Please enter both email and password.";
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        msgBox.style.color = '#ff5252';
        msgBox.innerText = "Login Error: " + error.message;
    } else {
        msgBox.style.color = '#25D366';
        msgBox.innerText = "✅ Login successful! Redirecting...";
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
};