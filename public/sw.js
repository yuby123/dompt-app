// Service Worker for Dompt. PWA
const CACHE_NAME = 'dompt-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icons/dompt-logo.svg',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Precache warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

const SHARED_SS_CACHE = 'dompt-shared-ss-v1';
const SHARED_SS_KEY = '/__dompt_shared_screenshot_latest__';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept Android PWA Web Share Target POST locally on device for instant (<10ms) screenshot handoff
  if (event.request.method === 'POST' && url.pathname.startsWith('/share-target')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.clone().formData();
          let file = null;
          const candidateKeys = ['files', 'screenshot', 'file', 'image', 'photos', 'media'];
          for (const key of candidateKeys) {
            const candidate = formData.get(key);
            if (candidate && typeof candidate.arrayBuffer === 'function' && candidate.size > 0) {
              file = candidate;
              break;
            }
          }
          if (!file) {
            for (const [, val] of formData.entries()) {
              if (val && typeof val.arrayBuffer === 'function' && val.size > 0) {
                file = val;
                break;
              }
            }
          }

          if (file) {
            const cache = await caches.open(SHARED_SS_CACHE);
            const headers = new Headers({
              'Content-Type': file.type || 'image/jpeg',
              'X-Dompt-Timestamp': String(Date.now()),
            });
            await cache.put(SHARED_SS_KEY, new Response(file, { headers }));

            const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            for (const client of clientList) {
              client.postMessage({ type: 'DOMPT_SHARED_SCREENSHOT', timestamp: Date.now() });
            }

            return Response.redirect('/?scan=auto&shared=sw&t=' + Date.now(), 303);
          }
        } catch (err) {
          console.warn('SW share-target local intercept fallback to network:', err);
        }
        return fetch(event.request);
      })()
    );
    return;
  }

  // Skip API routes, chrome-extension, and non-GET requests
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/share-target')
  ) {
    return;
  }

  // Network-first strategy with cache fallback for pages and assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
