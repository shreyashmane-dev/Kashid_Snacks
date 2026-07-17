const CACHE_NAME = 'kashid-snacks-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

// Install: Cache core static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('SW: Clearing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first falling back to cache, dynamic caching for images
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Focus on GET requests
  if (event.request.method !== 'GET') return;

  // Handle image caching (Unsplash & Cloudinary)
  if (
    requestUrl.hostname.includes('unsplash.com') ||
    requestUrl.hostname.includes('cloudinary.com') ||
    event.request.destination === 'image'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Fetch fresh image in background to update cache
            fetch(event.request).then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
            }).catch(() => {/* Ignore network fail in background */});
            return cachedResponse;
          }

          // Not in cache, fetch from network and cache it
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Offline fallback for images (optional, return empty image stub if desired)
            return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#ffe5db"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#a13c46" font-family="sans-serif">Offline</text></svg>', {
              headers: { 'Content-Type': 'image/svg+xml' }
            });
          });
        });
      })
    );
    return;
  }

  // Handle SPA routing & navigation requests:
  // Network first, fallback to cached '/' index.html shell so React Router takes over offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/') || caches.match('/index.html');
      })
    );
    return;
  }

  // General assets (JS, CSS, fonts, api requests)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Only cache valid standard responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Fallback for API or direct resources if failed
        return new Response(JSON.stringify({ error: "Offline mode active" }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      });
    })
  );
});
