// Define um nome e versão para o cache. Incremente este número sempre que atualizar os arquivos cacheados.
const CACHE_NAME = 'pedido-caminhao-cache-v3';

// Lista completa de arquivos que formam o "App Shell" e devem ser cacheados.
// Isso inclui a página principal, o manifesto, e todos os ícones necessários.
const urlsToCache = [
  '.', // Representa a raiz do diretório do projeto (geralmente mapeado para index.html)
  'index.html',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'icons/icon-maskable-512x512.png' // Ícone mascarável, importante para Android
];

/**
 * Evento 'install': Disparado quando o service worker é instalado pela primeira vez.
 * Ele abre o cache e adiciona todos os arquivos do App Shell a ele.
 */
self.addEventListener('install', event => {
  // O waitUntil() garante que o service worker não será considerado 'instalado' até que este código termine.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Abrindo cache e adicionando o App Shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Falha ao adicionar arquivos ao cache durante a instalação.', error);
      })
  );
});

/**
 * Evento 'activate': Disparado após a instalação e quando uma nova versão do service worker assume o controle.
 * A principal função aqui é limpar caches antigos que não são mais necessários.
 */
self.addEventListener('activate', event => {
  // Lista de caches que queremos manter. Neste caso, apenas o cache atual.
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se o nome do cache não estiver na nossa whitelist, ele será deletado.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

/**
 * Evento 'fetch': Intercepta todas as requisições de rede feitas pela página.
 * Isso nos permite servir arquivos diretamente do cache para um carregamento rápido e offline.
 */
self.addEventListener('fetch', event => {
  // 1. Ignora requisições que não são do tipo GET, como POSTs para a API.
  // Isso é crucial para que o envio de formulários funcione corretamente.
  if (event.request.method !== 'GET') {
    return;
  }

  // 2. Ignora requisições para APIs externas para evitar problemas de cache com elas.
  // Deixa a requisição passar direto para a rede.
  if (event.request.url.includes('script.google.com') || event.request.url.includes('viacep.com.br')) {
    return; 
  }
  
  // 3. Estratégia "Cache-First": Tenta responder a partir do cache primeiro.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Se a resposta for encontrada no cache, retorna ela.
        if (cachedResponse) {
          // console.log('Service Worker: Servindo do cache:', event.request.url);
          return cachedResponse;
        }

        // Se não estiver no cache, busca na rede.
        // console.log('Service Worker: Buscando na rede:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Se a busca na rede falhar, a promessa será rejeitada e o .catch() abaixo será acionado.
            // Se a busca for bem-sucedida, clonamos a resposta para poder guardá-la no cache.
            // Uma resposta só pode ser lida uma vez ('stream').
            
            // Verifica se recebemos uma resposta válida antes de cachear
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Armazena a nova resposta no cache para a próxima vez.
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
      .catch(error => {
        // Opcional: Se tanto o cache quanto a rede falharem, podemos retornar uma página de fallback.
        // Por exemplo: return caches.match('/offline.html');
        // Para este app, deixaremos o navegador mostrar a página de erro padrão de "sem conexão".
        console.warn('Service Worker: Falha ao buscar recurso, e não está no cache.', error);
      })
  );
});
