// sw.js - Versão Completa e Correta

const CACHE_NAME = 'pedido-caminhao-cache-v3';

// VERIFIQUE SE TODOS ESSES ARQUIVOS EXISTEM NO SEU REPOSITÓRIO!
const urlsToCache = [
  '.',
  'index.html',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'icons/icon-maskable-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache aberto, adicionando App Shell.');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        // Este log de erro é crucial!
        console.error('Service Worker: Falha ao adicionar arquivos ao cache durante a instalação. Verifique se todos os arquivos em "urlsToCache" existem no repositório.', error);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || 
      event.request.url.includes('script.google.com') || 
      event.request.url.includes('viacep.com.br')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(
          networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});
