// ==========================================
// DYNAMIC GRID DELETION & ANIMATION LOGIC
// ==========================================

// Global render helper to inject the X button and Stars when building the grids.
// (Use this inside your fetch functions to build the HTML for the grids)
function buildItemCardHTML(item, listType) {
    // If it's history, check rating. If portfolio (watch later), maybe unrated.
    const starStr = item.rating && item.rating > 0 ? `⭐ ${item.rating}/5` : '⭐ TBD'; 
    
    return `
        <div class="grid-item-card" id="${listType}-item-${item.id}">
            <button class="delete-item-btn" onclick="removeSingleItem('${item.id}', '${listType}', this)" title="Remove item">×</button>
            <div class="item-rating-badge">${starStr}</div>
            <img src="${item.poster || '/placeholder.jpg'}" alt="Poster" loading="lazy">
        </div>
    `;
}

// Function to animate and remove a single item
window.removeSingleItem = async function(itemId, listType, btnElem) {
    // 1. Play CSS animation
    const card = btnElement.closest('.grid-item-card');
    card.classList.add('removing-anim');

    // 2. Wait for animation to finish, then delete
    setTimeout(async () => {
        card.remove(); // Remove from DOM immediately after shrink

        // Delete from LocalStorage fallback
        const localKey = listType === 'portfolio' ? 'match_portfolio' : 'match_history';
        let localList = JSON.parse(localStorage.getItem(localKey) || '[]');
        localList = localList.filter(i => i.id !== itemId);
        localStorage.setItem(localKey, JSON.stringify(localList));

        // Delete from Supabase Database
        if (window.supabaseClient && isUserLoggedIn) {
            try {
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (user) {
                    const tableName = listType === 'portfolio' ? 'portfolio' : 'watch_history';
                    // We delete by movie_id and user_id to lift the match exclusion
                    await supabaseClient.from(tableName).delete().match({ user_id: user.id, movie_id: itemId });
                }
            } catch(e) { console.error("DB Deletion error", e); }
        }

        // Check if list is empty after deletion
        const grid = document.getElementById(listType === 'portfolio' ? 'portfolio-grid' : 'history-grid');
        if (grid.innerHTML.trim() === '') {
            grid.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">List is empty.</p>';
        }
    }, 400); // 400ms matches the shrinkFade CSS animation duration
};

// Function to clear entire lists with animation
window.clearListEntirely = async function(listType) {
    const listName = listType === 'portfolio' ? 'Watch Later' : 'History & Ratings';
    const confirmDelete = confirm(`Are you sure you want to remove ALL items from your ${listName}? \n\nThey will be made available for AI matching again.`);
    if(!confirmDelete) return;

    const grid = document.getElementById(listType === 'portfolio' ? 'portfolio-grid' : 'history-grid');
    
    // Animate all children shrinking
    const cards = grid.querySelectorAll('.grid-item-card');
    cards.forEach(card => card.classList.add('removing-anim'));

    setTimeout(async () => {
        grid.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">List is empty.</p>';

        // Clear LocalStorage
        const localKey = listType === 'portfolio' ? 'match_portfolio' : 'match_history';
        localStorage.setItem(localKey, '[]');

        // Clear Supabase Database
        if (window.supabaseClient && isUserLoggedIn) {
            try {
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (user) {
                    const tableName = listType === 'portfolio' ? 'portfolio' : 'watch_history';
                    await supabaseClient.from(tableName).delete().eq('user_id', user.id);
                }
            } catch(e) { console.error("DB Bulk Deletion error", e); }
        }
    }, 400);
};

// ==========================================
// ACCOUNT DELETION LOGIC (PREVIOUSLY ADDED)
// ==========================================
function openDeleteModal() { document.getElementById('delete-modal').style.display = 'flex'; document.getElementById('delete-confirm-check').checked = false; toggleDeleteBtn(); }
function closeDeleteModal() { document.getElementById('delete-modal').style.display = 'none'; }
function toggleDeleteBtn() {
    const isChecked = document.getElementById('delete-confirm-check').checked;
    const btn = document.getElementById('final-delete-btn');
    const wrapper = document.getElementById('delete-checkbox-wrapper');
    const textSpan = document.getElementById('delete-checkbox-text');
    if (isChecked) {
        btn.disabled = false; btn.classList.remove('btn-disabled'); btn.classList.add('btn-danger-active');
        wrapper.classList.add('checked-active'); textSpan.style.color = '#fff';
    } else {
        btn.disabled = true; btn.classList.add('btn-disabled'); btn.classList.remove('btn-danger-active');
        wrapper.classList.remove('checked-active'); textSpan.style.color = '#bbb';
    }
}
async function executeAccountDeletion() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;
        await supabaseClient.from('banned_emails').insert([{ email: user.email }]);
        await supabaseClient.from('profiles').delete().eq('id', user.id);
        await supabaseClient.from('portfolio').delete().eq('user_id', user.id);
        await supabaseClient.from('watch_history').delete().eq('user_id', user.id);
        await supabaseClient.auth.signOut();
        localStorage.clear();
        alert("Account and data permanently deleted.");
        window.location.href = '/index.html';
    } catch (err) { alert("Error deleting account. Contact support."); }
}
