console.log("Pricing/Monetization Engine Loaded");

window.processCheckout = async function(planType) {
    // 1. Check if Supabase is connected
    if (!window.supabaseClient) {
        alert("Database connection error. Please try again later.");
        return;
    }

    // 2. Check if user is logged in
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    
    if (!user) {
        alert("You must be logged in to upgrade your account! Redirecting to login...");
        window.location.href = '/index.html';
        return;
    }

    // 3. Fire Analytics Event for Conversions
    if(typeof gtag === 'function') {
        gtag('event', 'begin_checkout', {
            item_list_name: planType,
            currency: 'USD',
            value: planType === 'vip_monthly' ? 4.99 : 1.99
        });
    }

    // 4. Generate Stripe Checkout URL with Prefilled User Email
    // NOTE TO OWNER: Replace these placeholder links with your real Stripe Payment Links
    let checkoutUrl = "";
    
    if (planType === 'ad_free') {
        // Example: https://buy.stripe.com/test_12345
        checkoutUrl = "https://buy.stripe.com/YOUR_AD_FREE_LINK_HERE";
    } else if (planType === 'vip_monthly') {
        // Example: https://buy.stripe.com/test_67890
        checkoutUrl = "https://buy.stripe.com/YOUR_VIP_MONTHLY_LINK_HERE";
    }

    // Redirect to checkout, appending the user's email securely to the URL so Stripe maps it perfectly
    if (checkoutUrl.includes("YOUR_")) {
        alert(`Checkout activated for ${user.email}!\n\n(Note: Stripe links pending configuration in pricing.js)`);
    } else {
        window.location.href = `${checkoutUrl}?prefilled_email=${encodeURIComponent(user.email)}`;
    }
};
