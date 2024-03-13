
const cacheName = 'face-detection-pwa-v1';
const filesToCache = [
  '/facepwa/',
  '/facepwa/index.html',
  '/facepwa/scripts/face-api.min.js',
  '/facepwa/scripts/script.js',
  '/facepwa/styles/style.css'
];
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request).then((fetchResponse) => {
        if (e.request.url.startsWith('https://your-faceapi-models-url')) {
          // Cache the faceapi models dynamically
          return caches.open(cacheName).then((cache) => {
            cache.put(e.request.url, fetchResponse.clone());
            return fetchResponse;
          });
        } else {
          return fetchResponse;
        }
      });
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((thisCacheName) => {
          if (thisCacheName !== cacheName) {
            return caches.delete(thisCacheName);
          }
        })
      );
    })
  );
});
