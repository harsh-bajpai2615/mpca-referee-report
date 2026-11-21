const CACHE = 'rr-v5';
const FILES = ['./', 'index.html', 'style.css', 'spec.js', 'app.js', 'signature.js', 'pdf-lib.min.js', 'form.pdf', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'fonts/inter-latin.woff2',
  ...['match', 'acc', 'food', 'teams1', 'teams2', 'practice', 'ground1', 'ground2', 'other', 'admin', 'selectors', 'pitchMD', 'pitchMD-notes', 'pitchLO', 'pitchLO-notes', 'sign'].map(s => `snips/${s}.webp`)];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));

// cached copy first so it works at a ground with no signal, refreshed in the background
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
