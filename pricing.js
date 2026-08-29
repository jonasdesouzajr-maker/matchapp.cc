console.log("Pricing/Monetization Engine Active: Stripe Link Checkout Engine");

// ==========================================
// CONFIGURABLE STRIPE PAYMENT LINKS
// ==========================================
// Replace these URLs with your live Stripe Payment Links created in your Stripe Dashboard.
const STRIPE_AD_FREE_LINK = "https://buy.stripe.com/YOUR_AD_FREE_LINK_HERE";
const STRIPE_VIP_LINK     = "https://buy.stripe.com/YOUR_VIP_MONTHLY_LINK_HERE";

window.processCheckout = async function(planType) {
    const client = window.supabaseClient || (window.supabase ? window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpreW12cXJtYmFibmdzcWJseXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDUyNDIsImV4cCI6MjEwMjM4MTI0Mn0._yEVFMfwVU6GBqQ8m3ljfOgA0HSLEDiKMOfYae6ZD8Q') : null);

    if (!client) {
        alert("Database connection error. Please refresh or contact support@matchapp.cc");
        return;
    }

    const { data: { user }, error } = await client.auth.getUser();
    
    if (error || !user) {
        alert("You must be signed in to upgrade your account! Redirecting to login...");
        window.location.href = '/index.html';
        return;
    }

    if (typeof gtag === 'function') {
        gtag('event', 'begin_checkout', {
            item_list_name: planType,
            currency: 'USD',
            value: planType === 'vip_monthly' ? 4.99 : 1.99
        });
    }

    let targetLink = (planType === 'vip_monthly') ? STRIPE_VIP_LINK : STRIPE_AD_FREE_LINK;

    // If active Stripe links are configured, redirect to Stripe
    if (!targetLink.includes("YOUR_")) {
        const returnUrl = encodeURIComponent(`${window.location.origin}/index.html?payment=success&plan=${planType}`);
        window.location.href = `${targetLink}?prefilled_email=${encodeURIComponent(user.email)}&redirect_url=${returnUrl}`;
    } else {
        // Fallback test simulation mode
        if (confirm(`[TEST CHECKOUT SIMULATION]\n\nAccount: ${user.email}\nSelected Plan: ${planType.toUpperCase()}\n\nWould you like to simulate a successful payment to unlock VIP features right now?`)) {
            window.location.href = `/index.html?payment=success&plan=${planType}`;
        }
    }
};
