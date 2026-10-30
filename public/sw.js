// Guarda la app para que abra al instante y sin cobertura. Los datos siempre se piden a la red.
const VERSION = '%VERSION%';
const CACHE = `porradakar-${VERSION}`;
const SHELL = ['./', './index.html', '%APP_JS%', '%APP_CSS%', './manifest.webmanifest', './icon.svg', './icon-192.png',
  './fonts/fonts.css', './fonts/stencil-800.woff2', './fonts/stencil-600.woff2', './fonts/barlow-400.woff2', './fonts/barlow-600.woff2', './fonts/barlowc-700.woff2', './fonts/mono-500.woff2'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('porradakar-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
