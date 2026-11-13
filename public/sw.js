/* StreetLens service worker — cache the shell so the app can open offline. Live data still prefers the network. */
const CACHE = 'streetlens-v19';
const PRECACHE = [
  './',
  './index.html',
  './style.css?v=19',
  './app.js?v=19',
  './method.html',
  './favicon.svg',
  './manifest.webmanifest',
  './data/summary.json',
  './data/prices.json'
];
self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isData = url.pathname.includes('/data/');
  ev.respondWith((async () => {
    if (isData) {
      try {
        const fresh = await fetch(req);
        const copy = fresh.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return fresh;
      } catch (e) {
        const hit = await caches.match(req);
        if (hit) return hit;
        throw e;
      }
    }
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const fresh = await fetch(req);
      if (fresh.ok) {
        const copy = fresh.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return fresh;
    } catch (e) {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
      throw e;
    }
  })());
});
