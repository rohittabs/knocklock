// Service worker: lets KnockLock open without an internet connection after the first visit.
// Network first, so a new version shows up straight away; the saved copy is used when offline.

const CACHE = 'knocklock-v1';

// Everything the website needs. Keep in sync with the files in the repository
// (tests/files.test.mjs checks that each one exists).
const CORE = [
  './',
  'index.html',
  'about.html',
  'manifest.webmanifest',
  'assets/logo.svg',
  'assets/logo-dark.svg',
  'assets/icons/icon.svg',
  'assets/icons/favicon.svg',
  'assets/icons/favicon-32.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/apple-touch-icon.png',
  'assets/fonts/Inter-400.woff2',
  'assets/fonts/Inter-600.woff2',
  'assets/fonts/Inter-700.woff2',
  'assets/fonts/PlayfairDisplay-700.woff2',
  'assets/examples/poster.png',
  'assets/examples/note-values.png',
  'assets/examples/counting.png',
  'assets/examples/compound.png',
  'assets/examples/seven-eight.png',
  'assets/examples/swing.png',
  'assets/examples/how-to-enter.png',
  'assets/examples/poster-navy-landscape.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('knocklock-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())),
      ),
  );
});
