// sw.js - Versão final com lista de cache completa
const CACHE_NAME = 'pedido-caminhao-cache-v7'; // INCREMENTE A VERSÃO PARA FORÇAR A ATUALIZAÇÃO

const urlsToCache = [
  './', // Acessa a raiz
  'index.html',
  'manifest.json',
  'favicon.ico', // GARANTE QUE O FAVICON ESTÁ NA LISTA
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'icons/icon-maskable-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto, adicionando App Shell.');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch(error => {
        // Este log vai nos dizer se algum arquivo ainda está faltando
        console.error('[SW] Falha ao adicionar arquivos ao cache:', error);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (!cacheWhitelist.includes(cacheName)) {
          console.log('[SW] Deletando cache antigo:', cacheName);
          return caches.delete(cacheName);
        }
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Deixa as APIs passarem direto para a rede, sem interferência.
  if (
    event.request.url.includes('script.google.com') ||
    event.request.url.includes('viacep.com.br') ||
    event.request.url.includes('googleapis.com')
  ) {
    return;
  }
  
  // Para arquivos locais, usa a estratégia Cache-First.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Se encontrar no cache, retorna. Senão, busca na rede.
        return cachedResponse || fetch(event.request);
      })
  );
});
