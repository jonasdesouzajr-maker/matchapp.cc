// --- REGISTER.JS ---
console.log("REGISTER.JS IS LOADING..."); // <--- CHECK CONSOLE FOR THIS

let supabase = null;
try {
    const supabaseUrl = 'https://zkymvqrmbabngsqblyye.supabase.co';
    const supabaseKey = 'sb_publishable_j3kQUhd_9JHfWdfiV3iWog_RpEltrOU';
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log("Supabase Client Initialized");
} catch (e) {
    console.error("Supabase Init Error:", e);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Fully Loaded - Attaching listeners");
    const submitBtn = document.getElementById('submit-register-btn');
    
    if (!submitBtn) {
        console.error("CRITICAL: submit-register-btn not found in HTML!");
        return;
    }

    submitBtn.addEventListener('click', async (e) => {
        console.log("Register button clicked");
        // ... (rest of your logic)
