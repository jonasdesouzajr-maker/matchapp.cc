/* ============================================================
   MATCHAPP — SAVED WATCH CONTACTS + PREFILLED INVITES

   TWO PROBLEMS THIS SOLVES

   1. THE EMAIL INVITE DIDN'T EXIST, AND THE ONES THAT DID WERE HALF-WRITTEN.
      Match Together offered WhatsApp, Telegram and the native share sheet —
      no email at all — and each one handed over a bare link with a six-word
      caption. Email now exists, and every channel sends a complete invite:
      subject written, body written, link embedded. The user types the
      address and nothing else.

   2. YOU HAD TO RETYPE THE PERSON EVERY TIME. The people you watch with are
      the same three or four people forever, and the app made you find their
      number or address again on every single session. Contacts are saved
      with the CHANNEL they were reached on, so "watch with Ana" is one tap
      and goes out the way Ana actually replies.

   WHERE CONTACTS LIVE, AND WHY

   localStorage first, always. It works signed-out, it works offline, it
   works on the first visit, and — the part that matters — someone else's
   phone number and email address never leave the device unless the owner is
   signed in and has somewhere to sync them to.

   When signed in they also mirror to profiles.watch_contacts so a new phone
   doesn't start empty. That column is third-party personal data under GDPR
   and LGPD: it is the account holder's own address book, stored for their
   convenience, never read by anyone else, and deleted with the account. It
   is deliberately NOT used for invitations, suggestions, or any contact
   matching between users — that would turn a convenience feature into a
   social graph nobody agreed to hand over.
   ============================================================ */

(function () {
    'use strict';

    const STORE_KEY = 'match_watch_contacts';
    const MAX = 40;

    /* Every channel a contact can be saved on. `build` returns the URL that
       sends a COMPLETE message on that channel — this is the single place
       invite copy is composed, so no caller can accidentally ship a bare
       link again. */
    const CHANNELS = {
        email: {
            label: 'Email', icon: '✉️', placeholder: 'name@example.com',
            inputType: 'email', colour: '#E5C158',
            build: (value, inv) =>
                'mailto:' + encodeURIComponent(value || '') +
                '?subject=' + encodeURIComponent(inv.subject) +
                '&body=' + encodeURIComponent(inv.body)
        },
        whatsapp: {
            label: 'WhatsApp', icon: '💬', placeholder: '+55 21 99999 9999',
            inputType: 'tel', colour: '#25D366',
            build: (value, inv) => {
                const digits = String(value || '').replace(/[^\d]/g, '');
                return digits
                    ? `https://wa.me/${digits}?text=${encodeURIComponent(inv.text)}`
                    : `https://wa.me/?text=${encodeURIComponent(inv.text)}`;
            }
        },
        sms: {
            label: 'SMS', icon: '📱', placeholder: '+55 21 99999 9999',
            inputType: 'tel', colour: '#5AC8FA',
            // The ?& is not a typo: iOS needs a separator before `body` or it
            // drops the message and opens an empty thread.
            build: (value, inv) => `sms:${String(value || '').replace(/\s/g, '')}?&body=${encodeURIComponent(inv.text)}`
        },
        telegram: {
            label: 'Telegram', icon: '✈️', placeholder: '@username',
            inputType: 'text', colour: '#2AABEE',
            build: (value, inv) => `https://t.me/share/url?url=${encodeURIComponent(inv.link)}&text=${encodeURIComponent(inv.message)}`
        }
    };
    window.MATCH_CHANNELS = CHANNELS;

    /* ---------- storage ---------- */

    function read() {
        try {
            const raw = localStorage.getItem(STORE_KEY);
            const list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list.filter(c => c && c.channel && c.value) : [];
        } catch (e) { return []; }
    }

    function write(list) {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, MAX))); } catch (e) {}
        syncUp(list);
    }

    /* Best-effort mirror to the account. Never blocks the UI and never
       reports a failure to the user: a contact that saved locally IS saved
       as far as they are concerned, and a sync retry costs nothing. */
    async function syncUp(list) {
        if (!window.isUserLoggedIn || !window.supabaseClient) return;
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;
            await window.supabaseClient.from('profiles')
                .update({ watch_contacts: list })
                .eq('id', user.id);
        } catch (e) { /* the local copy is the source of truth */ }
    }

    /* Pulls the account copy on sign-in and merges it into the local one,
       keyed on channel+value. Merge rather than replace: a contact added on
       this device before signing in must not be thrown away by the sync. */
    async function syncDown() {
        if (!window.isUserLoggedIn || !window.supabaseClient) return;
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;
            const { data, error } = await window.supabaseClient
                .from('profiles').select('watch_contacts').eq('id', user.id).single();
            if (error || !data || !Array.isArray(data.watch_contacts)) return;

            const local = read();
            const key = c => c.channel + '|' + String(c.value).toLowerCase().trim();
            const merged = local.slice();
            const have = new Set(local.map(key));
            data.watch_contacts.forEach(c => {
                if (c && c.channel && c.value && !have.has(key(c))) { merged.push(c); have.add(key(c)); }
            });
            try { localStorage.setItem(STORE_KEY, JSON.stringify(merged.slice(0, MAX))); } catch (e) {}
            document.dispatchEvent(new CustomEvent('matchapp:contactschange'));
        } catch (e) { /* offline or column missing — local copy stands */ }
    }

    window.getWatchContacts = read;

    window.saveWatchContact = function (contact) {
        if (!contact || !contact.channel || !contact.value) return null;
        const list = read();
        const key = c => c.channel + '|' + String(c.value).toLowerCase().trim();
        const entry = {
            id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name: String(contact.name || '').trim().slice(0, 40) || String(contact.value).trim().slice(0, 40),
            channel: contact.channel,
            value: String(contact.value).trim().slice(0, 120),
            lastUsed: Date.now()
        };
        const at = list.findIndex(c => key(c) === key(entry));
        if (at >= 0) { list[at].name = entry.name; list[at].lastUsed = Date.now(); }
        else list.unshift(entry);

        // Most recently used first — the person you watched with last night
        // is overwhelmingly the person you are inviting now.
        list.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
        write(list);
        document.dispatchEvent(new CustomEvent('matchapp:contactschange'));
        return entry;
    };

    window.removeWatchContact = function (id) {
        const list = read().filter(c => c.id !== id);
        write(list);
        document.dispatchEvent(new CustomEvent('matchapp:contactschange'));
    };

    window.touchWatchContact = function (id) {
        const list = read();
        const c = list.find(x => x.id === id);
        if (!c) return;
        c.lastUsed = Date.now();
        list.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
        write(list);
    };

    /* ---------- invite copy ---------- */

    /* The whole message, composed once. `subject` and `body` are for email;
       `text` is the single-string form every other channel wants; `message`
       is the body without the link for channels that carry the link
       separately (Telegram passes url and text as distinct parameters, and
       including the link in both makes it appear twice in the chat). */
    window.buildInvite = function (link, opts) {
        opts = opts || {};
        const from = (opts.fromName || '').trim();
        const who = from ? `${from} ` : '';
        const kind = opts.kind || 'together';

        if (kind === 'result') {
            const title = opts.title || 'something good';
            const subject = `${who ? from + ' found ' : 'I found '}something for us to watch: ${title}`;
            const message =
                `${who ? from + ' here — ' : ''}MatchApp matched me with "${title}"` +
                (opts.platform && opts.platform !== 'any' ? ` on ${opts.platform}` : '') + '.\n\n' +
                `Thought you'd like it. You can see the full match here:`;
            return {
                subject,
                message,
                link,
                body: `${message}\n\n${link}\n\n— sent from MatchApp, the free AI streaming concierge\nhttps://matchapp.tv`,
                text: `${message}\n${link}`
            };
        }

        const subject = who ? `${from} wants to find something to watch with you 🍿` : "Let's find something to watch together 🍿";
        const message =
            `${who ? from + ' here! ' : 'Hi! '}I'm using MatchApp to find something we'd BOTH actually want to watch.\n\n` +
            `Open the link below, pick what you're in the mood for, and we'll both get the same answer. ` +
            `It takes about twenty seconds and you don't need an account:`;
        return {
            subject,
            message,
            link,
            body: `${message}\n\n${link}\n\n— sent from MatchApp, the free AI streaming concierge\nhttps://matchapp.tv`,
            text: `${message}\n${link}`
        };
    };

    /* Opens the given channel with the invite already written. Returns the
       URL used, so callers can show it when a popup blocker eats the window. */
    window.sendInvite = function (channel, value, invite) {
        const ch = CHANNELS[channel];
        if (!ch) return null;
        const url = ch.build(value, invite);
        // mailto:/sms: must navigate rather than open a tab — a blank tab is
        // what you get otherwise, with the handler firing behind it.
        if (channel === 'email' || channel === 'sms') window.location.href = url;
        else window.open(url, '_blank', 'noopener');
        return url;
    };

    document.addEventListener('matchapp:authchange', syncDown);
    if (window.isUserLoggedIn) syncDown();
})();
