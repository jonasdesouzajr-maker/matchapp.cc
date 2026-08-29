console.log("Pricing/Monetization Engine Active");

window.processCheckout = async function(planType) {
    const client = window.supabaseClient || (window.supabase ? window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpreW12cXJtYmFibmdzcWJseXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDUyNDIsImV4cCI6MjEwMjM4MTI0Mn0._yEVFMfwVU6GBqQ8m3ljfOgA0HSLEDiKMOfYae6ZD8Q') : null);

    if (!client) {
        alert("Database connection error. Please refresh or contact support@matchapp.cc");
        return;
    }

    const { data: { user }, error } = await client.auth.getUser();
    
    if (error || !user) {
        alert("You must be signed in to upgrade! Redirecting to login...");
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

    let checkoutUrl = "";
    if (planType === 'ad_free') {
        checkoutUrl = "https://buy.stripe.com/YOUR_AD_FREE_LINK_HERE";
    } else if (planType === 'vip_monthly') {
        checkoutUrl = "https://buy.stripe.com/YOUR_VIP_MONTHLY_LINK_HERE";
    }

    if (checkoutUrl.includes("YOUR_")) {
        alert(`Checkout activated for account: ${user.email}!\n\nFor support or questions, email us at support@matchapp.cc`);
    } else {
        window.location.href = `${checkoutUrl}?prefilled_email=${encodeURIComponent(user.email)}`;
    }
};
