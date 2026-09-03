/* ============================================================
   © 2026 MatchApp.cc — All Rights Reserved.
   Proprietary source code. Not licensed for reproduction, scraping,
   or reuse in competing products. See /terms.html Section 4.
   ============================================================ */

/* ============================================================
   MatchApp — SOCIAL SHARE & REWARD ENGINE
   Renders a branded share card on <canvas> from the user's match,
   opens the native share sheet (or per-network intents), and grants
   a bonus match — capped at 3 rewards per rolling 6 hours.
   ============================================================ */

const SHARE_WINDOW_MS = 6 * 60 * 60 * 1000;  // 6 hours
const SHARE_MAX_REWARDS = 3;
const SHARE_TAGS = '#MatchApp #WhatToWatch #StreamingAI #AIConcierge #MovieNight';
const SHARE_URL = 'https://matchapp.cc/';

/* ---------- Reward accounting ---------- */
function getShareLog() {
    try {
        const raw = JSON.parse(localStorage.getItem('match_shareLog') || '[]');
        const cutoff = Date.now() - SHARE_WINDOW_MS;
        return raw.filter(ts => ts > cutoff);
    } catch (e) { return []; }
}
function shareRewardsLeft() { return Math.max(0, SHARE_MAX_REWARDS - getShareLog().length); }
window.shareRewardsLeft = shareRewardsLeft;

function nextRewardResetText() {
    const log = getShareLog();
    if (log.length < SHARE_MAX_REWARDS) return '';
    const oldest = Math.min(...log);
    const mins = Math.max(1, Math.ceil((oldest + SHARE_WINDOW_MS - Date.now()) / 60000));
    const h = Math.floor(mins / 60), m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Server-enforced when signed in (claim_share_reward RPC), local otherwise.
async function grantShareReward() {
    if (window.isUserLoggedIn && window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient.rpc('claim_share_reward');
            if (error) throw error;
            if (data && data.granted) {
                if (window.refreshQuotaStatus) window.refreshQuotaStatus();
                return { ok: true, left: data.remaining_rewards };
            }
            return { ok: false, left: 0, resetIn: (data && data.reset_in_seconds) || 0 };
        } catch (e) {
            console.warn('Share reward RPC unavailable, using local grant:', e.message || e);
        }
    }
    // Anonymous / offline path
    if (shareRewardsLeft() <= 0) return { ok: false, left: 0 };
    const log = getShareLog();
    log.push(Date.now());
    localStorage.setItem('match_shareLog', JSON.stringify(log));
    const current = parseInt(localStorage.getItem('match_dailyCount') || '0');
    localStorage.setItem('match_dailyCount', Math.max(0, current - 1).toString());
    return { ok: true, left: shareRewardsLeft() };
}

/* ---------- Share card renderer ---------- */
function loadImage(src) {
    return new Promise(resolve => {
        if (!src) return resolve(null);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

function wrapText(ctx, text, maxWidth) {
    const words = String(text).split(' ');
    const lines = []; let line = '';
    for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
        else line = test;
    }
    if (line) lines.push(line);
    return lines;
}

window.buildShareCard = async function(title, posterUrl, platform, synopsis) {
    const W = 1080, H = 1350;               // 4:5 — the best-performing feed ratio
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    // Brand background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#14131A'); bg.addColorStop(0.55, '#2A1A47'); bg.addColorStop(1, '#130734');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.75, H * 0.18, 40, W * 0.75, H * 0.18, 620);
    glow.addColorStop(0, 'rgba(229,193,88,0.28)'); glow.addColorStop(1, 'rgba(229,193,88,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    // Gold frame
    ctx.strokeStyle = '#E5C158'; ctx.lineWidth = 7;
    ctx.strokeRect(26, 26, W - 52, H - 52);

    // Header
    ctx.fillStyle = '#E5C158';
    ctx.font = '900 40px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MATCHAPP.CC', 68, 108);
    ctx.fillStyle = '#A376B6';
    ctx.font = '600 25px "Segoe UI", Arial, sans-serif';
    ctx.fillText('AI STREAMING CONCIERGE', 68, 148);

    // Poster
    const posterW = 500, posterH = 720, px = (W - posterW) / 2, py = 200;
    const img = await loadImage(posterUrl);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 46; ctx.shadowOffsetY = 16;
    ctx.fillStyle = '#0d0620';
    ctx.fillRect(px, py, posterW, posterH);
    ctx.restore();
    if (img) {
        // Cover-fit without distorting the artwork
        const scale = Math.max(posterW / img.width, posterH / img.height);
        const dw = img.width * scale, dh = img.height * scale;
        ctx.save();
        ctx.beginPath(); ctx.rect(px, py, posterW, posterH); ctx.clip();
        ctx.drawImage(img, px + (posterW - dw) / 2, py + (posterH - dh) / 2, dw, dh);
        ctx.restore();
    } else {
        ctx.fillStyle = '#E5C158';
        ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        wrapText(ctx, title, posterW - 70).slice(0, 4).forEach((ln, i) =>
            ctx.fillText(ln, W / 2, py + posterH / 2 - 40 + i * 56));
    }
    ctx.strokeStyle = '#E5C158'; ctx.lineWidth = 5;
    ctx.strokeRect(px, py, posterW, posterH);

    // "MY MATCH" ribbon
    ctx.fillStyle = '#E5C158';
    ctx.fillRect(px - 16, py + 44, 210, 62);
    ctx.fillStyle = '#14131A';
    ctx.font = '900 31px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MY MATCH', px + 89, py + 86);

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 60px "Segoe UI", Arial, sans-serif';
    const titleLines = wrapText(ctx, title, W - 190).slice(0, 2);
    titleLines.forEach((ln, i) => ctx.fillText(ln, W / 2, 1010 + i * 68));

    let y = 1010 + titleLines.length * 68 + 18;
    if (platform && platform !== 'any') {
        ctx.fillStyle = '#A376B6';
        ctx.font = '700 31px "Segoe UI", Arial, sans-serif';
        ctx.fillText('Now streaming on ' + platform, W / 2, y);
        y += 48;
    }
    if (synopsis) {
        ctx.fillStyle = '#C9C1DA';
        ctx.font = '400 27px "Segoe UI", Arial, sans-serif';
        wrapText(ctx, synopsis, W - 210).slice(0, 2).forEach((ln, i) => ctx.fillText(ln, W / 2, y + i * 36));
    }

    // Footer CTA
    ctx.fillStyle = '#E5C158';
    ctx.font = '900 33px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Find YOUR perfect match free →  matchapp.cc', W / 2, H - 74);

    return c;
};

function canvasToBlob(canvas) {
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
}

/* ---------- Share flow ---------- */
window.openShareSheet = async function() {
    const title = window.globalMatchTitle;
    if (!title) { if (window.showToast) showToast('Get a match first, then share it!', true); return; }

    const modal = document.getElementById('share-modal');
    const preview = document.getElementById('share-preview');
    const statusEl = document.getElementById('share-reward-status');
    if (modal) modal.style.display = 'flex';
    if (preview) preview.innerHTML = '<div class="share-spinner"></div>';

    const canvas = await window.buildShareCard(
        title, window.globalMatchPoster, window.globalPlatform,
        (document.getElementById('res-synopsis') || {}).innerText || ''
    );
    window._shareCanvas = canvas;
    if (preview) {
        preview.innerHTML = '';
        canvas.style.width = '100%';
        canvas.style.borderRadius = '14px';
        canvas.style.border = '1px solid rgba(229,193,88,0.5)';
        preview.appendChild(canvas);
    }

    let left = shareRewardsLeft();
    if (window.refreshQuotaStatus) {
        const st = await window.refreshQuotaStatus();
        if (st && typeof st.share_rewards_left === 'number') left = st.share_rewards_left;
    }
    if (statusEl) {
        statusEl.innerHTML = left > 0
            ? `🎁 Share this and earn <strong>+1 bonus match</strong> — <strong>${left}</strong> of ${SHARE_MAX_REWARDS} bonus matches left this 6-hour window.`
            : `⏳ You've claimed all ${SHARE_MAX_REWARDS} bonus matches for now. Next one unlocks in <strong>${nextRewardResetText()}</strong>. You can still share!`;
    }
};

window.closeShareSheet = function() {
    const modal = document.getElementById('share-modal');
    if (modal) modal.style.display = 'none';
};

function shareText() {
    const title = window.globalMatchTitle || 'my match';
    const plat = window.globalPlatform && window.globalPlatform !== 'any' ? ` on ${window.globalPlatform}` : '';
    return `MatchApp's AI just matched me with "${title}"${plat} 🍿 Find what YOU should watch tonight — free AI streaming concierge.\n\n${SHARE_TAGS}`;
}

// Native share sheet (mobile) — attaches the generated image when supported.
window.shareNative = async function() {
    const canvas = window._shareCanvas;
    const text = shareText();
    try {
        if (canvas && navigator.canShare) {
            const blob = await canvasToBlob(canvas);
            const file = new File([blob], 'matchapp-match.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], text, title: 'My MatchApp pick' });
                return afterShare('native');
            }
        }
        if (navigator.share) {
            await navigator.share({ title: 'My MatchApp pick', text, url: SHARE_URL });
            return afterShare('native');
        }
        window.downloadShareCard();
        if (window.showToast) showToast('Image saved — attach it to your post!');
    } catch (e) { /* user dismissed the sheet */ }
};

window.downloadShareCard = function() {
    const canvas = window._shareCanvas;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `matchapp-${(window.globalMatchTitle || 'match').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    afterShare('download');
};

window.copyShareText = async function() {
    try {
        await navigator.clipboard.writeText(shareText() + '\n' + SHARE_URL);
        if (window.showToast) showToast('📋 Caption + link copied!');
        afterShare('copy');
    } catch (e) { if (window.showToast) showToast('Could not copy — select the text manually.', true); }
};

// Per-network intents. Image-first networks get the card downloaded automatically.
window.shareTo = function(network) {
    const text = encodeURIComponent(shareText());
    const url = encodeURIComponent(SHARE_URL);
    const map = {
        whatsapp: `https://api.whatsapp.com/send?text=${text}%20${url}`,
        x:        `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
        telegram: `https://t.me/share/url?url=${url}&text=${text}`,
        reddit:   `https://www.reddit.com/submit?url=${url}&title=${encodeURIComponent('MatchApp AI matched me with ' + (window.globalMatchTitle || ''))}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        pinterest:`https://pinterest.com/pin/create/button/?url=${url}&description=${text}`
    };
    // Instagram and TikTok have no web share intent — give the user the asset instead.
    if (network === 'instagram' || network === 'tiktok') {
        window.downloadShareCard();
        window.copyShareText();
        if (window.showToast) showToast(`📸 Card saved + caption copied — paste it into ${network === 'instagram' ? 'Instagram' : 'TikTok'}!`);
        return;
    }
    if (map[network]) {
        window.open(map[network], '_blank', 'noopener,width=640,height=620');
        afterShare(network);
    }
};

let _rewardedThisCard = false;
async function afterShare(network) {
    if (typeof gtag === 'function') gtag('event', 'share', { method: network, content_type: 'match', item_id: window.globalMatchTitle || '' });
    if (_rewardedThisCard) return;

    const result = await grantShareReward();
    const statusEl = document.getElementById('share-reward-status');
    if (result.ok) {
        _rewardedThisCard = true;
        if (statusEl) statusEl.innerHTML = `🎉 <strong>Bonus match unlocked!</strong> ${result.left} of ${SHARE_MAX_REWARDS} left this window.`;
        if (window.showToast) showToast('🎁 Thanks for sharing! +1 bonus match unlocked.');
        if (typeof confetti === 'function') confetti({ particleCount: 130, spread: 88, origin: { y: 0.65 }, colors: ['#E5C158', '#FFF3A3', '#A376B6', '#ffffff'] });
        const note = document.getElementById('share-claim-note');
        if (note) note.style.display = 'block';
    } else if (statusEl) {
        const mins = result.resetIn ? Math.ceil(result.resetIn / 60) : null;
        const when = mins ? (mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins}m`) : nextRewardResetText();
        statusEl.innerHTML = `⏳ All ${SHARE_MAX_REWARDS} bonus matches claimed. Next unlocks in <strong>${when}</strong>. Thanks for sharing!`;
    }
}

// A fresh match makes the next share rewardable again.
document.addEventListener('matchapp:newmatch', () => { _rewardedThisCard = false; });