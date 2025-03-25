const CACHE_NAME = 'rms-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/statistics.js',
  './manifest.json',
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
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Önbellekte varsa oradan döndür
        if (response) {
          return response;
        }
        
        // Değilse ağdan getir ve önbelleğe ekle
        return fetch(event.request).then(
          (response) => {
            // Geçersiz yanıt veya opaque yanıtları (CORS hatası olanlar) önbelleğe ekleme
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }

            // Önbelleğe eklemek için yanıtın bir kopyasını oluştur
            // (Yanıtlar stream olduğu için sadece bir kez kullanılabilir)
            let responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
      .catch(() => {
        // Ağ bağlantısı yoksa veya istek başarısızsa
        // Offline sayfasına yönlendir veya varsayılan bir sayfa göster
        if (event.request.url.includes('.html')) {
          return caches.match('/index.html');
        }
      })
  );
}); 