// sw.js - VERSÃO v9 - ATUALIZADO PARA NOTIFICAÇÃO
const CACHE_NAME = 'pedido-caminhao-cache-v9'; // Versão incrementada

const urlsToCache = [
  './',
  'index.html',
  'manifest.json',
  'favicon.ico',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
];

// Evento de instalação: baixa e armazena os assets.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache aberto, adicionando App Shell.');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Falha ao cachear arquivos durante a instalação:', error);
      })
  );
});

// Evento de ativação: limpa caches antigos.
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

// NOVO: Ouve mensagens da página principal.
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Evento de fetch: intercepta requisições de rede.
self.addEventListener('fetch', event => {
  const url = event.request.url;

  if (url.startsWith('https://script.google.com/') || url.startsWith('https://viacep.com.br/')) {
    return; // Vai direto para a rede.
  }

  // Estratégia "Cache-First" para os outros assets.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        return cachedResponse || fetch(event.request);
      })
  );
});
