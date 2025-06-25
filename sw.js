// sw.js - Versão com correção para APIs externas
const CACHE_NAME = 'pedido-caminhao-cache-v6'; // Versão do cache incrementada para forçar atualização

const urlsToCache = [
  '/',
  './',
  'index.html',
  'manifest.json',
  'favicon.ico',
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
      .then(() => self.skipWaiting())
      .catch(error => console.error('[Service Worker] Falha ao cachear arquivos durante a instalação.', error))
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

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // CORREÇÃO: Não intercepta chamadas para APIs externas.
  // O navegador irá lidar com elas normalmente (acessando a rede).
  if (requestUrl.hostname === 'script.google.com' || requestUrl.hostname === 'viacep.com.br') {
    return; // Deixa a requisição passar direto para a rede
  }

  // Para todas as outras requisições (arquivos locais do app), usa a estratégia "Cache-First".
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Se a resposta estiver no cache, retorna ela.
        if (cachedResponse) {
          return cachedResponse;
        }

        // Se não, busca na rede.
        return fetch(event.request).catch(error => {
          console.log('[Service Worker] Fetch falhou; o usuário provavelmente está offline.', error);
          // Você pode retornar uma página offline padrão aqui se quiser
        });
      })
  );
});
