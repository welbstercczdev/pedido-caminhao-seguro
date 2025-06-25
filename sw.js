// sw.js - VERSÃO FINAL E CORRIGIDA
const CACHE_NAME = 'pedido-caminhao-cache-v8'; // Versão incrementada para forçar a atualização

// Lista de arquivos essenciais para o App Shell.
// Garanta que todos esses arquivos existem nos caminhos corretos.
const urlsToCache = [
  './',
  'index.html',
  'manifest.json',
  'favicon.ico',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
];

// Evento de instalação: baixa e armazena os assets do App Shell.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache aberto, adicionando App Shell.');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Força o novo SW a se tornar ativo imediatamente.
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
    )).then(() => self.clients.claim()) // Torna-se o SW controlador para todas as abas abertas.
  );
});

// Evento de fetch: intercepta requisições de rede.
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // CORREÇÃO CRÍTICA: Verifica a string da URL de forma segura.
  // Se a URL for para uma das nossas APIs, ignora o cache e vai direto para a rede.
  if (url.startsWith('https://script.google.com/') || url.startsWith('https://viacep.com.br/')) {
    // Não faz nada, deixa o navegador lidar com a requisição de rede normalmente.
    return;
  }

  // Para todas as outras requisições, usa a estratégia "Cache-First".
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Se a resposta estiver no cache, retorna ela.
        if (cachedResponse) {
          return cachedResponse;
        }
        // Se não estiver no cache, busca na rede.
        return fetch(event.request);
      })
  );
});
