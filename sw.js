const CACHE = 'wa-protocols-v1';
const PRECACHE = ['./index.html', './manifest.json', './icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const isHTML = e.request.destination === 'document' ||
                 e.request.url.endsWith('.html');

  if (isHTML) {
    // Network-first for HTML: always fetch fresh when online,
    // fall back to cache when offline. No manual version bump needed.
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first for all other assets (icon, manifest)
    e.respondWith(
      caches.match(e.request)
        .then(r => r || fetch(e.request).then(res => {
          if (res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        }))
    );
  }
});
