const cacheName = 'face-detection-pwa-v1';
const filesToCache = [
  '/',
  '/index.html',
  '/scripts/face-api.min.js',
  '/scripts/script.js',
  '/styles/style.css'
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
      return response || fetch(e.request);
    })
  );
});
