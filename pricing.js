/* ============================================================
   © 2026 MatchApp.cc — All Rights Reserved.
   Proprietary source code. Not licensed for reproduction, scraping,
   or reuse in competing products. See /terms.html Section 4.
   ============================================================ */

console.log("Mastercode 87.0: Live Stripe Payments Engine Initialized");

// ==========================================
// 💳 LIVE STRIPE PAYMENT LINKS
// ==========================================
const STRIPE_LINK_AD_FREE = "https://buy.stripe.com/bJe8wP94lfRQfsycspcfK07";
const STRIPE_LINK_VIP_MONTHLY = "https://buy.stripe.com/bJe7sL6WdfRQ94adwtcfK08";
const STRIPE_LINK_VIP_ANNUAL = "https://buy.stripe.com/8x29ATdkB5dcgwCdwtcfK09";

// Business plan — $49/mo, 50 AI sessions daily, up to 5 seats.
// The email fallback below still guards against a blanked-out or broken link,
// so the button can never dead-end on a checkout page that doesn't exist.
const STRIPE_LINK_BUSINESS = "https://buy.stripe.com/4gM00ja8peNMdkq641cfK0e";

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
// ============================================================
// 🎟️ CREDIT PACKS — one-time top-ups
//
// WHAT A CREDIT IS: one AI action beyond the free daily allowance. A match
// and an Ask AI question cost the same, deliberately — a two-currency system
// ("3 match tokens, 1 AI token") feels clever on a pricing page and generates
// support email forever.
//
// HOW THESE ARE PRICED, AND WHY
//
// VIP is $4.99/month for 10 matches a day: roughly 300 a month, about
// $0.017 each. Credits are priced at 3.5x to 7x that. That gap is the whole
// point and is not an accident:
//
//   * Credits are for the person who hit today's limit and wants to keep
//     going RIGHT NOW. That is an impulse purchase, and impulse purchases
//     are priced on the moment, not on the unit.
//   * If credits were priced near the subscription rate they would
//     cannibalise it — someone would buy 300 credits for $5 instead of
//     subscribing, and MatchApp would lose the recurring revenue AND the
//     retention that comes with it.
//   * Because the gap is large and visible, the pricing page can say
//     honestly that subscribing is five times cheaper per match. The packs
//     therefore convert people INTO VIP rather than away from it, which is
//     the correct job for a one-time SKU sitting next to a subscription.
//
// Volume discount runs from $0.120/credit down to $0.060 — enough to make
// the bigger packs feel like a deal, not so much that the top pack
// undercuts the subscription.
//
// THE AMOUNTS ARE LOAD-BEARING. supabase/functions/stripe-webhook/index.ts
// identifies a pack by the amount paid, because Stripe Payment Links carry no
// product key we can trust on the session. Change a price in Stripe and you
// MUST change CREDIT_PACKS there in the same commit, or the purchase will
// complete and grant nothing.
// ============================================================

const CREDIT_PACKS = [
    { key: 'credits_25',  credits: 25,  priceCents: 299,  price: '$2.99',  link: '' },
    { key: 'credits_75',  credits: 75,  priceCents: 699,  price: '$6.99',  link: '', badge: 'Most popular' },
    { key: 'credits_200', credits: 200, priceCents: 1499, price: '$14.99', link: '' },
    { key: 'credits_500', credits: 500, priceCents: 2999, price: '$29.99', link: '', badge: 'Best value' }
];
window.CREDIT_PACKS = CREDIT_PACKS;

// Paste the four Payment Link URLs here once they exist in Stripe. Until
// then buyCredits() routes to sales rather than to a broken checkout — the
// same guard the Business plan already uses, for the same reason: a dead
// checkout button costs more than a missing one.
const STRIPE_LINK_CREDITS = {
    credits_25:  "https://buy.stripe.com/14A9ATdkB8po4NU641cfK0a",
    credits_75:  "https://buy.stripe.com/aFaeVdeoF9ts4NU9gdcfK0b",
    credits_200: "https://buy.stripe.com/8x2aEXgwN5dc4NUakhcfK0c",
    credits_500: "https://buy.stripe.com/5kQcN50xP35494afEBcfK0d"
};

window.buyCredits = async function (packKey) {
    const pack = CREDIT_PACKS.find(p => p.key === packKey);
    if (!pack) return;

    if (!window.isUserLoggedIn || !window.supabaseClient) {
        // Credits are granted to an account by the webhook via
        // client_reference_id. Without a signed-in user there is nothing to
        // grant them TO, so this has to be a hard stop rather than a nudge.
        if (window.showToast) showToast('Create a free account first — credits are tied to your profile so they are never lost.');
        if (typeof window.openAuthModal === 'function') window.openAuthModal();
        return;
    }

    const link = STRIPE_LINK_CREDITS[packKey];
    if (!link || link.startsWith('PASTE_')) {
        window.location.href = 'mailto:support@matchapp.cc?subject=' +
            encodeURIComponent(`MatchApp credits — ${pack.credits} pack`) +
            '&body=' + encodeURIComponent(
                `Hi MatchApp team,\n\nI'd like to buy the ${pack.credits}-credit pack (${pack.price}).\n\nThanks!`);
        return;
    }

    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            if (window.showToast) showToast('Session expired — please sign in again.', true);
            return;
        }
        // client_reference_id is how the webhook knows whose balance to top
        // up. Without it the payment succeeds and the credits go nowhere.
        window.location.href = `${link}?client_reference_id=${user.id}`;
    } catch (e) {
        if (window.showToast) showToast('Could not start checkout — check your connection and try again.', true);
    }
};
