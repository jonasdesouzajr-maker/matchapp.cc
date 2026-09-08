/* ============================================================
   MatchApp — Service Worker

   WHY THIS IS DELIBERATELY MINIMAL:

   Chrome's beforeinstallprompt (the event that makes "Install" actually work)
   only fires once a page has a valid manifest AND a registered service worker
   with a fetch handler — that's the technical requirement, independent of
   whether the worker actually caches anything. So this file's only real job
   is to exist and register.

   It does NOT cache app.js, i18n.js, index.html, or anything else that
   changes. This codebase pushes updates constantly — cache-bust version
   numbers on every script tag exist specifically to defeat stale caching.
   A service worker that cached those files would fight that convention
   directly: someone could install the app, and then sit on a stale build
   for days because the SW kept serving an old cached copy instead of letting
   fresh requests through. That failure mode is worse than not having offline
   support at all, so this worker is intentionally a pure pass-through.

   If real offline support is wanted later, it needs a proper cache-versioning
   strategy (cache name tied to a build number, cleared on activate) — a
   separate, deliberate piece of work, not a default to fall into by accident.
   ============================================================ */

self.addEventListener('install', () => {
    // Activate immediately rather than waiting for old tabs to close.
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Pure network pass-through — no caching, no interception logic.
    // This handler existing at all is what satisfies installability.
    event.respondWith(fetch(event.request));
});
