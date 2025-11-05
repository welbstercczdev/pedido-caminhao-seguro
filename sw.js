// sw.js - VERSÃO v11 - ESTRATÉGIA NETWORK-FIRST PARA A PÁGINA
const CACHE_NAME = 'pedido-caminhao-cache-v12'; // << INCREMENTE A VERSÃO!

const urlsToCache = [
  './',
  'index.html',
  'manifest.json',
  'favicon.ico',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache aberto, adicionando App Shell.');
        return cache.addAll(urlsToCache);
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
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// MUDANÇA CRÍTICA AQUI: NOVA LÓGICA DE FETCH
self.addEventListener('fetch', event => {
  // Ignora APIs externas, como antes
  if (event.request.url.startsWith('https://script.google.com/') || event.request.url.startsWith('https://viacep.com.br/')) {
    return;
  }

  // ESTRATÉGIA "NETWORK-FIRST" para a navegação principal (para o index.html)
  // Isso garante que o usuário sempre receba o HTML mais recente se estiver online.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Se a rede funcionar, clona a resposta, armazena no cache e retorna.
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Se a rede falhar, busca a página principal do cache.
          return caches.match('index.html');
        })
    );
    return;
  }

  // ESTRATÉGIA "CACHE-FIRST" para todos os outros arquivos (ícones, manifest, etc.)
  // Eles não mudam com frequência, então é mais rápido servir do cache.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        return cachedResponse || fetch(event.request);
      })
  );
});
