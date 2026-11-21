const CACHE_NAME = 'life-level-shell-v69';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];
const CDN_CACHE = 'life-level-cdn-v1';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('life-level-') && ![CACHE_NAME, CDN_CACHE].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
    );
    return;
  }
  // Cache the Supabase browser library after its first successful download.
  if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/@supabase/supabase-js@')) {
    event.respondWith(
      fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CDN_CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then(hit => hit || Response.error()))
    );
  }
});
