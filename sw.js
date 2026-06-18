const VERSION = 'v22';
const CACHE = 'rein-' + VERSION;

// Only cache static assets that never change (icons, manifest)
// JS/CSS are always fetched fresh from network
const STATIC_ASSETS = [
  '/rein/manifest.json',
  '/rein/icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isStatic = url.pathname.endsWith('.svg') || url.pathname.endsWith('manifest.json');

  if (isStatic) {
    // Cache-first for icons/manifest
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
  // JS/CSS/HTML: no interception — browser fetches directly from network
});
