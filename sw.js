// sw.js - Versão com correção de cache e tratamento de APIs externas
const CACHE_NAME = 'pedido-caminhao-cache-v7'; // Versão incrementada para forçar a atualização

// Lista de arquivos essenciais para o App Shell.
// Garanta que todos esses arquivos existem nos caminhos corretos no seu repositório.
const urlsToCache = [
  './', // Representa o index.html no diretório atual
  'index.html',
  'manifest.json',
  'favicon.ico',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
  // Removido 'icon-maskable' se não existir, para evitar erro. Adicione de volta se o arquivo existir.
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache aberto, adicionando App Shell.');
        // fetch() cada recurso e adiciona ao cache um por um para melhor depuração
        const promises = urlsToCache.map(url => {
          return fetch(url)
            .then(response => {
              if (!response.ok) {
                throw new TypeError(`[Service Worker] Falha ao buscar ${url}: ${response.statusText}`);
              }
              return cache.put(url, response);
            })
            .catch(err => {
              console.error(`[Service Worker] Não foi possível cachear ${url}.`, err);
            });
        });
        return Promise.all(promises);
      })
      .then(() => self.skipWaiting())
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

  // Não intercepta chamadas para APIs externas.
  if (requestUrl.hostname === 'script.google.com' || requestUrl.hostname === 'viacep.com.br') {
    return; // Deixa a requisição passar direto para a rede
  }

  // Estratégia "Cache-First" para os arquivos do próprio app
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        return cachedResponse || fetch(event.request);
      })
  );
});
