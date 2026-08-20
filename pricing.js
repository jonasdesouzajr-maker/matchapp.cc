console.log("Mastercode 18.0: Live PayPal Gateway Initialized");

let supabaseClient = null;
let currentUser = null;

try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient('https://zkymvqrmbabngsqblyye.supabase.co', 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU');
    }
} catch (e) { console.warn("Supabase init error"); }

window.addEventListener('DOMContentLoaded', async () => {
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        alert("You must be logged in to purchase matches.");
        window.location.href = 'register.html';
        return;
    }
    currentUser = session.user;

    // RENDER 5 MATCHES BUTTON (R$ 1.99)
    paypal.Buttons({
        style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'pay' },
        createOrder: function(data, actions) {
            return actions.order.create({ purchase_units: [{ amount: { value: '1.99' }, description: 'Match App - 5 Matches' }] });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                grantMatches(5, false);
            });
        }
    }).render('#paypal-button-5');

    // RENDER 20 MATCHES BUTTON (R$ 9.99)
    paypal.Buttons({
        style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'pay' },
        createOrder: function(data, actions) {
            return actions.order.create({ purchase_units: [{ amount: { value: '9.99' }, description: 'Match App - 20 Matches' }] });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                grantMatches(20, false);
            });
        }
    }).render('#paypal-button-20');

    // RENDER MONTHLY VIP BUTTON (R$ 19.99)
    paypal.Buttons({
        style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'pay' },
        createOrder: function(data, actions) {
            return actions.order.create({ purchase_units: [{ amount: { value: '19.99' }, description: 'Match App - 30 Days Unlimited VIP' }] });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                grantMatches(0, true);
            });
        }
    }).render('#paypal-button-vip');
});

// Database update function after successful payment
async function grantMatches(amountToAdd, isUnlimited) {
    let currentMatches = currentUser.user_metadata?.matches_left || 0;
    
    let updatePayload = {};
    if (isUnlimited) {
        updatePayload = { is_vip: true };
    } else {
        updatePayload = { matches_left: currentMatches + amountToAdd };
    }

    try {
        const { error } = await supabaseClient.auth.updateUser({ data: updatePayload });
        if (error) throw error;
        alert(`🎉 Payment Successful! Thank you. Your account has been upgraded.`);
        window.location.href = 'index.html';
    } catch (err) {
        alert("❌ Error updating account: " + err.message + ". Please contact support.");
    }
}
