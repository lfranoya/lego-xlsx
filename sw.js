const CACHE_VERSION = 'v3.00';
const CACHE_NAME = `lego-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/lego-xlsx/',
  '/lego-xlsx/index.html',
  '/lego-xlsx/manifest.json',
  '/lego-xlsx/icons/icon-192.png',
  '/lego-xlsx/icons/icon-512.png',
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Respond to version requests
self.addEventListener('message', event => {
  if (event.data === 'getVersion') {
    event.source.postMessage({ version: CACHE_VERSION });
  }
});

// Fetch strategy:
// - XLSX data file: always network first (get latest), fall back to cache
// - Everything else: cache first, fall back to network
self.addEventListener('fetch', event => {
  const url = event.request.url;

  if (url.includes('LEGO_Dash.xlsx') || url.includes('raw.githubusercontent.com')) {
    // Always fetch fresh data from network
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache first for app shell
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
