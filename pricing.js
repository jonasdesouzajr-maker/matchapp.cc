/* ============================================================
   © 2026 MatchApp.cc — All Rights Reserved.
   Proprietary source code. Not licensed for reproduction, scraping,
   or reuse in competing products. See /terms.html Section 4.
   ============================================================ */

console.log("Mastercode 87.0: Live Stripe Payments Engine Initialized");

// ==========================================
// 💳 LIVE STRIPE PAYMENT LINKS
// ==========================================
const STRIPE_LINK_AD_FREE = "https://buy.stripe.com/fZu4gz6nEaDHbpY7k0gEg01";
const STRIPE_LINK_VIP_MONTHLY = "https://buy.stripe.com/fZu3cvbHY13779I47OgEg03";
const STRIPE_LINK_VIP_ANNUAL = "https://buy.stripe.com/7sY28reUa137dy65bSgEg02";

// Business plan — $49/mo, 50 AI sessions daily, up to 5 seats.
// The email fallback below still guards against a blanked-out or broken link,
// so the button can never dead-end on a checkout page that doesn't exist.
const STRIPE_LINK_BUSINESS = "https://buy.stripe.com/eVqcN5dQ66nr51AgUAgEg04";

window.processCheckout = async function(planType) {
    if (!isUserLoggedIn || !supabaseClient) {
        alert("💎 Please create a free account or log in first so we can securely link this VIP pass to your profile!");
        if (typeof window.openAuthModal === 'function') window.openAuthModal();
        return;
    }

    const btnId = `btn-${planType}`;
    const btn = document.getElementById(btnId);
    const originalText = btn ? btn.innerText : 'Processing...';
    
    if (btn) {
        btn.innerText = "Securely redirecting to Stripe...";
        btn.disabled = true;
        btn.style.opacity = "0.7";
    }

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (user) {
            const userId = user.id;
            
            // Build the checkout URL and dynamically append the user ID so you can track it in Stripe webhooks
            let checkoutUrl = "";
            if (planType === 'ad_free') {
                checkoutUrl = `${STRIPE_LINK_AD_FREE}?client_reference_id=${userId}`;
            } else if (planType === 'vip_monthly') {
                checkoutUrl = `${STRIPE_LINK_VIP_MONTHLY}?client_reference_id=${userId}`;
            } else if (planType === 'vip_annual') {
                checkoutUrl = `${STRIPE_LINK_VIP_ANNUAL}?client_reference_id=${userId}`;
            } else if (planType === 'business') {
                // Graceful behaviour before the Stripe link exists: send them to
                // sales instead of a broken checkout.
                if (!STRIPE_LINK_BUSINESS || STRIPE_LINK_BUSINESS.startsWith('PASTE_')) {
                    window.location.href = 'mailto:support@matchapp.cc?subject=' +
                        encodeURIComponent('MatchApp Business plan enquiry') +
                        '&body=' + encodeURIComponent("Hi MatchApp team,\n\nI'd like to know more about the Business plan.\n\nCompany:\nExpected monthly volume:\n\nThanks!");
                    if (btn) { btn.innerText = originalText; btn.disabled = false; btn.style.opacity = "1"; }
                    return;
                }
                checkoutUrl = `${STRIPE_LINK_BUSINESS}?client_reference_id=${userId}`;
            }

            // Route user directly to Stripe Checkout
            window.location.href = checkoutUrl;
            
        } else {
            alert("Session expired. Please log in again to purchase.");
            if (btn) { btn.innerText = originalText; btn.disabled = false; btn.style.opacity = "1"; }
        }
    } catch (error) {
        console.error("Checkout routing error:", error);
        alert("Payment routing failed. Please check your connection and try again.");
        if (btn) { btn.innerText = originalText; btn.disabled = false; btn.style.opacity = "1"; }
    }
};