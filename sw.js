const CACHE_NAME = 'rms-cache-v3';
const BASE_PATH = '/sunsetrms/';

const ASSETS_TO_CACHE = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}css/style.css`,
  `${BASE_PATH}js/app.js`,
  `${BASE_PATH}js/statistics.js`,
  `${BASE_PATH}manifest.json`,
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
];

// Service Worker kurulumu
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Önbellek açıldı');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktifleştirme ve eski önbellekleri temizleme
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eski önbellek siliniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// İstekleri yakalama ve önbellekten yanıtlama
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const requestPath = url.pathname;

  // GitHub Pages repository yolunu kontrol et
  if (!requestPath.startsWith(BASE_PATH)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }

            let responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // Ana sayfa için yönlendirme
          if (requestPath === BASE_PATH || requestPath === `${BASE_PATH}index.html`) {
            return caches.match(`${BASE_PATH}index.html`);
          }
          
          // Diğer kaynaklar için 404 döndür
          return new Response('Resource not found', {
            status: 404,
            statusText: 'Not Found'
          });
        });
      })
  );
}); 