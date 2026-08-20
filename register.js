<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Match App | Register VIP</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
    <div class="luxury-bg"><div class="floating-orb orb-1"></div></div>

    <div class="container" style="max-width: 500px;">
        
        <!-- THE UNIVERSAL APP HEADER -->
        <header class="app-header">
            <a href="index.html" class="logo" style="text-decoration: none;">
                <picture>
                    <source srcset="logo.png" type="image/png"><source srcset="logo.jpg" type="image/jpeg"><source srcset="Logo.jpg" type="image/jpeg">
                    <img src="logo.jpeg" alt="Match App Logo" class="brand-logo" onerror="this.style.display='none'; document.getElementById('logo-text').style.display='block';">
                </picture>
                <span id="logo-text" style="display:none; font-size: 24px; font-weight: 900; color: #fff;">Match<span style="color: var(--gold);">App</span></span>
            </a>
            
            <div id="header-auth-area" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end;">
                <div class="translate-wrapper" id="google_translate_element"></div>
                
                <!-- Navigation -->
                <button id="nav-reg-btn" onclick="window.location.href='index.html'" class="secondary-btn" style="padding: 6px 12px; width: auto; font-size: 12px;">← Dashboard</button>
                
                <!-- Logged In Buttons (Hidden by default, shown if user state changes) -->
                <button id="nav-profile-btn" onclick="window.location.href='profile.html'" style="display: none; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid var(--gold); padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">👤 My Profile</button>
                <button id="nav-upgrade-btn" onclick="window.location.href='pricing.html'" style="display: none; background: linear-gradient(135deg, #BF953F, #FCF6BA); color: #000; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">💎 Upgrade</button>
                <button id="nav-logout-btn" onclick="doLogout()" style="display: none; background: transparent; color: #ff5252; border: 1px solid #ff5252; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">Log Out</button>
            </div>
        </header>

        <div class="premium-card fade-in" style="text-align: center;">
            <h2 style="color: var(--gold); margin-top: 0; font-size: 28px;">VIP Access</h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 25px;">Create your account to save your portfolio, unlock Zodiac precision, and get unlimited daily matches.</p>

            <!-- Social Logins -->
            <div class="social-login-grid">
                <button onclick="loginWithGoogle()" class="btn-google">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" width="18"> Google
                </button>
            </div>

            <div class="divider">OR USE EMAIL</div>

            <!-- Email Form -->
            <div class="input-group">
                <label>Email Address</label>
                <input type="email" id="email-input" placeholder="you@example.com">
            </div>
            <div class="input-group">
                <label>Password</label>
                <input type="password" id="password-input" placeholder="Min 6 characters">
            </div>

            <button onclick="signUpEmail()" class="gold-btn" style="margin-bottom: 10px;">Create VIP Account</button>
            <button onclick="signInEmail()" class="secondary-btn" style="width: 100%;">Log In</button>
            
            <div id="auth-message" style="margin-top: 15px; font-size: 13px; font-weight: bold;"></div>
        </div>
    </div>

    <!-- TRANSLATION SCRIPT -->
    <script type="text/javascript">
        function googleTranslateElementInit() { new google.translate.TranslateElement({ pageLanguage: 'en', includedLanguages: 'pt,en,zh-CN,hi,es,fr,ar,bn,ru,de', layout: google.translate.TranslateElement.InlineLayout.SIMPLE }, 'google_translate_element'); }
    </script>
    <script type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
    
    <script>
        async function doLogout() {
            if (window.supabase) {
                const client = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU');
                await client.auth.signOut();
                window.location.href = 'index.html';
            }
        }
    </script>
    <script src="auth.js"></script>
</body>
</html>
