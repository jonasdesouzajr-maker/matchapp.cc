console.log("Mastercode 87.0: Live Stripe Payments Engine Initialized");

// ==========================================
// 💳 INSERT YOUR ACTUAL STRIPE PAYMENT LINKS HERE
// ==========================================
const STRIPE_LINK_AD_FREE = "https://buy.stripe.com/test_123456789"; 
const STRIPE_LINK_VIP_MONTHLY = "https://buy.stripe.com/test_987654321"; 

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
