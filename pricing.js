console.log("Mastercode 24.0: Secure PIX Engine Initialized");

let supabaseClient = null;
let currentUser = null;
let currentPixString = ""; // Stores the code securely in memory

// ⚠️ UPDATE YOUR WHATSAPP NUMBER HERE (Country Code 55 + DDD + Number)
const MY_WHATSAPP_NUMBER = "5521999999999"; 

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

    // PAYPAL INITIALIZATION
    paypal.Buttons({
        style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'pay' },
        createOrder: function(data, actions) { return actions.order.create({ purchase_units: [{ amount: { value: '1.99' }, description: 'Match App - 5 Matches' }] }); },
        onApprove: function(data, actions) { return actions.order.capture().then(function(details) { grantMatches(5, false); }); }
    }).render('#paypal-button-5');

    paypal.Buttons({
        style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'pay' },
        createOrder: function(data, actions) { return actions.order.create({ purchase_units: [{ amount: { value: '9.99' }, description: 'Match App - 20 Matches' }] }); },
        onApprove: function(data, actions) { return actions.order.capture().then(function(details) { grantMatches(20, false); }); }
    }).render('#paypal-button-20');

    paypal.Buttons({
        style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'pay' },
        createOrder: function(data, actions) { return actions.order.create({ purchase_units: [{ amount: { value: '19.99' }, description: 'Match App - 30 Days VIP' }] }); },
        onApprove: function(data, actions) { return actions.order.capture().then(function(details) { grantMatches(0, true); }); }
    }).render('#paypal-button-vip');
});

// AUTOMATED DATABASE UPDATE (FOR PAYPAL)
async function grantMatches(amountToAdd, isUnlimited) {
    let currentMatches = currentUser.user_metadata?.matches_left || 0;
    let updatePayload = isUnlimited ? { is_vip: true } : { matches_left: currentMatches + amountToAdd };

    try {
        const { error } = await supabaseClient.auth.updateUser({ data: updatePayload });
        if (error) throw error;
        alert(`🎉 Payment Successful! Thank you. Your account has been upgraded.`);
        window.location.href = 'index.html';
    } catch (err) { alert("❌ Error updating account: " + err.message); }
}


// ==========================================
// 🇧🇷 SECURE DYNAMIC PIX ENGINE
// ==========================================

function buildPixString(key, name, city, amount) {
    let payload = '000201';
    
    let gui = '0014br.gov.bcb.pix';
    let pixKey = '01' + key.length.toString().padStart(2, '0') + key;
    let merchantAccount = gui + pixKey;
    payload += '26' + merchantAccount.length.toString().padStart(2, '0') + merchantAccount;
    
    payload += '52040000'; // MCC
    payload += '5303986';  // BRL Currency
    payload += '54' + amount.toFixed(2).length.toString().padStart(2, '0') + amount.toFixed(2); // Amount
    payload += '5802BR';   // Country
    payload += '59' + name.length.toString().padStart(2, '0') + name; // Name
    payload += '60' + city.length.toString().padStart(2, '0') + city; // City
    payload += '62070503***'; // TXID
    payload += '6304';     // CRC16 prefix
    
    // Complex CRC16 CCITT Algorithm Required by Bacen
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) { crc = (crc << 1) ^ 0x1021; } 
            else { crc = crc << 1; }
        }
    }
    let crcHex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    return payload + crcHex;
}

window.openPixModal = function(tierName, amount) {
    const pixKey = "11759207705"; // Hardcoded in JS only, never written to HTML
    const merchantName = "Jonas de Souza"; 
    const merchantCity = "Rio de Janeiro"; 
    
    // Generate valid Pix Copia e Cola String securely in memory
    currentPixString = buildPixString(pixKey, merchantName, merchantCity, amount);

    // Show Modal and Inject QR Code Data
    document.getElementById('pix-modal').style.display = 'flex';
    document.getElementById('pix-qr-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentPixString)}`;

    // Set WhatsApp confirmation action
    document.getElementById('pix-confirm-btn').onclick = function() {
        const userEmail = currentUser ? currentUser.email : "Unknown";
        const msg = `Hello! I just paid R$ ${amount.toFixed(2)} via PIX for the ${tierName} on Match App.\n\nMy email is: ${userEmail}\n\nHere is my receipt:`;
        window.open(`https://api.whatsapp.com/send?phone=${MY_WHATSAPP_NUMBER}&text=${encodeURIComponent(msg)}`, '_blank');
        closePixModal();
    };
}

window.closePixModal = function() {
    document.getElementById('pix-modal').style.display = 'none';
}

// SECURE COPY FUNCTION (Copies string without it being on screen)
window.copyPixCode = function() {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(currentPixString).then(() => {
            alert("Pix 'Copia e Cola' code successfully copied to clipboard!");
        });
    } else {
        // Fallback for older browsers / non-HTTPS
        const el = document.createElement('textarea');
        el.value = currentPixString;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        alert("Pix 'Copia e Cola' code successfully copied to clipboard!");
    }
}
