// sw.js - Versão com correção para APIs externas
// INCREMENTE A VERSÃO DO CACHE PARA FORÇAR A ATUALIZAÇÃO
// sw.js - Versão 6, com config.js
const CACHE_NAME = 'pedido-caminhao-cache-v6'; 

const urlsToCache = [
  '/',
  './',
  'index.html',
  'manifest.json',
  'favicon.ico',
  'config.js', // <-- ARQUIVO ADICIONADO AO CACHE
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'icons/icon-maskable-512x512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache aberto, adicionando App Shell.');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Todos os arquivos foram cacheados com sucesso.');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Falha ao adicionar arquivos ao cache durante a instalação.', error);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (!cacheWhitelist.includes(cacheName)) {
          console.log('[Service Worker] Deletando cache antigo:', cacheName);
          return caches.delete(cacheName);
        }
      })
    )).then(() => {
      console.log('[Service Worker] Cache antigo limpo, ativando novo Service Worker.');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  // --- CORREÇÃO CRÍTICA ABAIXO ---

  // Se a requisição for para uma API externa, o Service Worker não deve interferir.
  // A chamada 'return;' faz com que o navegador lide com a requisição normalmente.
  if (event.request.url.includes('script.google.com') || event.request.url.includes('viacep.com.br')) {
    // Não use 'event.respondWith()'. Apenas saia e deixe a rede acontecer.
    return;
  }

  // Para todas as outras requisições (nossos arquivos locais), use a estratégia "Cache-First".
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Se a resposta estiver no cache, retorna ela.
        if (cachedResponse) {
          return cachedResponse;
        }

        // Se não, busca na rede.
        return fetch(event.request).then(networkResponse => {
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
