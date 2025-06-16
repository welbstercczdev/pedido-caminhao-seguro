// CORREÇÃO: Defina o nome do seu repositório aqui.
// Por exemplo, se a URL for https://seu-usuario.github.io/pedido-caminhao/
// o NOME_REPOSITORIO será '/pedido-caminhao/'
const NOME_REPOSITORIO = '/'; // Se estiver na raiz (custom domain)
// const NOME_REPOSITORIO = '/nome-do-seu-repositorio/'; // Descomente e ajuste se estiver no GitHub Pages

// Define um nome e versão para o cache
const CACHE_NAME = 'pedido-caminhao-cache-v2'; // Mude a versão para forçar a atualização

// CORREÇÃO: Ajuste os caminhos para serem relativos
const urlsToCache = [
  '.', // O diretório raiz do projeto
  'index.html',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
];

// Evento de instalação: é disparado quando o Service Worker é instalado pela primeira vez.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// O resto do seu arquivo sw.js pode continuar igual...

// Evento de ativação: limpa caches antigos
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

// Evento de fetch...
self.addEventListener('fetch', event => {
  // ... (o restante do código de fetch continua o mesmo)
  if (event.request.method !== 'GET') {
    return;
  }
  if (event.request.url.includes('script.google.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
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
