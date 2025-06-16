// Define um nome e versão para o cache
const CACHE_NAME = 'pedido-caminhao-cache-v1';

// Lista de arquivos que devem ser cacheados para o app funcionar offline (o "App Shell")
const urlsToCache = [
  '/', // Acessa a raiz do site
  'index.html',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
  // Como seu CSS e JS estão dentro do index.html, não precisamos listá-los aqui.
];

// Evento de instalação: é disparado quando o Service Worker é instalado pela primeira vez.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        // Adiciona todos os arquivos do App Shell ao cache
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de ativação: limpa caches antigos se uma nova versão do Service Worker for ativada.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Deleta os caches que não estão na whitelist
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento de fetch: intercepta todas as requisições de rede da página.
self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET (ex: POST para o Google Apps Script)
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignora requisições para as APIs do Google para evitar problemas de cache com elas
  if (event.request.url.includes('script.google.com')) {
    return; // Deixa a requisição passar direto para a rede
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se a resposta for encontrada no cache, retorna ela
        if (response) {
          return response;
        }

        // Se não, busca na rede, e se a resposta for válida, clona, armazena em cache e retorna.
        return fetch(event.request).then(
          networkResponse => {
            // Verifica se recebemos uma resposta válida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clona a resposta. Uma resposta é um 'Stream' e só pode ser consumida uma vez.
            // Precisamos de uma cópia para o navegador e outra para o cache.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
      .catch(() => {
        // Se a busca na rede falhar (offline) e não tivermos no cache, podemos retornar uma página de fallback.
        // Neste caso, não faremos nada, o navegador mostrará o erro padrão de offline.
      })
  );
});