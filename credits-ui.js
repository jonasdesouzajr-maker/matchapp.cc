/* ============================================================
   MATCHAPP — CREDITS UI

   Renders the credit pack grid, keeps the balance visible, and puts a "buy
   credits" route in front of the one person who wants it: someone who just
   ran out of matches.

   The pack list itself lives in pricing.js, with the reasoning behind the
   prices. This file only draws it — the numbers must not be duplicated here,
   because the webhook identifies a purchase by its amount and a third copy of
   the price is a third place to get it wrong.
   ============================================================ */

(function () {
    'use strict';

    function packs() { return window.CREDIT_PACKS || []; }

    // Shown in cents, not dollars. "$0.12 / $0.093 / $0.075 / $0.06" is four
    // different decimal lengths in a row that the eye has to normalise before
    // it can compare them; "12c / 9.3c / 7.5c / 6c" reads as a descending
    // ladder at a glance, which is the entire point of showing a unit price.
    function centsEach(p) {
        const c = p.priceCents / p.credits;
        return (c >= 10 ? c.toFixed(0) : c.toFixed(1).replace(/\.0$/, '')) + '\u00A2';
    }

    function tr(key, fallback) {
        if (typeof window.t !== 'function') return fallback;
        const v = window.t(key);
        return (v && v !== key) ? v : fallback;
    }

    function renderGrid() {
        const host = document.getElementById('credits-grid');
        if (!host || !packs().length) return;
        host.innerHTML = packs().map(p => `
            <article class="credit-pack${p.badge ? ' is-featured' : ''}">
                ${p.badge ? `<span class="credit-pack-badge">${p.badge}</span>` : ''}
                <span class="credit-pack-amount">${p.credits}</span>
                <span class="credit-pack-unit">${tr('credits.creditsWord', 'credits')}</span>
                <span class="credit-pack-price">${p.price}</span>
                <span class="credit-pack-each">${centsEach(p)} ${tr('credits.each', 'each')}</span>
                <button type="button" class="credit-pack-btn" data-pack="${p.key}">
                    ${tr('credits.buy', 'Buy')} ${p.credits}
                </button>
            </article>`).join('');

        host.onclick = (ev) => {
            const btn = ev.target.closest('[data-pack]');
            if (btn && typeof window.buyCredits === 'function') window.buyCredits(btn.dataset.pack);
        };
    }

    /* ---------- balance ---------- */

    let lastKnown = null;

    // The header pill. Rendered only when there is actually a balance — a
    // permanent "0 credits" badge is an advert, not information, and the page
    // already has somewhere to sell them.
    window.renderCreditBadge = function (credits) {
        if (typeof credits === 'number') lastKnown = credits;
        const value = lastKnown;

        const line = document.getElementById('credit-balance-line');
        if (line) {
            const v = document.getElementById('credit-balance-value');
            if (v) v.textContent = value == null ? '0' : value;
            line.style.display = (value && value > 0) ? 'inline-flex' : 'none';
        }

        let pill = document.getElementById('credit-badge');
        if (!value || value <= 0) { if (pill) pill.style.display = 'none'; return; }

        if (!pill) {
            const nav = document.querySelector('.app-header nav') || document.querySelector('.app-header');
            if (!nav) return;
            pill = document.createElement('a');
            pill.id = 'credit-badge';
            pill.className = 'credit-badge';
            pill.href = '/pricing/pricing.html#credits';
            pill.title = 'Your credit balance — tap to top up';
            const quota = document.getElementById('quota-badge');
            if (quota && quota.parentNode === nav) nav.insertBefore(pill, quota.nextSibling);
            else nav.insertBefore(pill, nav.firstChild);
        }
        pill.innerHTML = `🎟️ <strong>${value}</strong>`;
        pill.style.display = 'inline-flex';
    };

    async function refreshBalance() {
        if (!window.isUserLoggedIn || !window.supabaseClient) { window.renderCreditBadge(0); return; }
        try {
            const { data, error } = await window.supabaseClient.rpc('match_credits');
            if (error || !data) return;
            window.renderCreditBadge(data.credits || 0);
        } catch (e) { /* a missing balance is not worth an error message */ }
    }
    window.refreshCreditBalance = refreshBalance;

    /* ---------- the out-of-matches route ---------- */

    // Appends a credits option to the "you're out of matches" panel that
    // app.js renders. Buying is most attractive at exactly this moment, and
    // burying it on the pricing page means the person who wanted it never
    // sees it.
    function injectOutOfMatchesCTA() {
        const host = document.getElementById('quota-message') || document.getElementById('limit-box');
        if (!host || host.querySelector('.credits-inline-cta')) return;

        const wrap = document.createElement('div');
        wrap.className = 'credits-inline-cta';
        wrap.innerHTML =
            `<p class="cic-lede">${tr('credits.outLede', 'Out of matches for today? Top up and keep going — credits never expire.')}</p>` +
            `<div class="cic-row">` +
            packs().slice(0, 3).map(p =>
                `<button type="button" class="cic-pack" data-pack="${p.key}">` +
                `<strong>${p.credits}</strong><span>${p.price}</span></button>`).join('') +
            `</div>` +
            `<a class="cic-sub" href="/pricing/pricing.html">${tr('credits.orVip', 'Or go VIP — about 5× cheaper per match →')}</a>`;

        wrap.addEventListener('click', (ev) => {
            const btn = ev.target.closest('[data-pack]');
            if (btn && typeof window.buyCredits === 'function') window.buyCredits(btn.dataset.pack);
        });
        host.appendChild(wrap);
    }
    window.injectCreditsCTA = injectOutOfMatchesCTA;

    function init() {
        renderGrid();
        refreshBalance();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    document.addEventListener('matchapp:authchange', refreshBalance);
    document.addEventListener('matchapp:langchange', renderGrid);
})();
