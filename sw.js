// Life OS Service Worker - v1.1.0
const CACHE_NAME = 'life-os-v1.1.0';
const STATIC_CACHE = 'life-os-static-v1.1.0';
const DYNAMIC_CACHE = 'life-os-dynamic-v1.1.0';

// Arquivos essenciais para cache
const STATIC_FILES = [
  '/',
  '/index.html',
  '/style.css', 
  '/script.js',
  '/manifest.json',
  // Fontes
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
  'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
  // Ícones básicos (serão criados)
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

// Recursos dinâmicos que podem ser cached
const DYNAMIC_FILES = [
  // Fontes externas que podem ser baixadas dinamicamente
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
  /unpkg\.com\/boxicons/
];

// === INSTALAÇÃO DO SERVICE WORKER ===
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache estático
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Fazendo cache dos arquivos estáticos...');
        return cache.addAll(STATIC_FILES.filter(file => !file.startsWith('http')));
      }),
      // Cache de recursos externos (com tratamento de erro)
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('[SW] Fazendo cache dos recursos externos...');
        const externalResources = STATIC_FILES.filter(file => file.startsWith('http'));
        return Promise.allSettled(
          externalResources.map(url => 
            cache.add(url).catch(err => console.warn(`[SW] Falha ao cachear ${url}:`, err))
          )
        );
      })
    ]).then(() => {
      console.log('[SW] Instalação concluída');
      // Força a ativação imediata
      return self.skipWaiting();
    })
  );
});

// === ATIVAÇÃO DO SERVICE WORKER ===
self.addEventListener('activate', event => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Limpa caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Assume controle imediato
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Ativação concluída');
    })
  );
});

// === INTERCEPTAÇÃO DE REQUESTS ===
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Ignora requests não-GET
  if (request.method !== 'GET') return;
  
  // Ignora requests de extensões do browser
  if (request.url.startsWith('chrome-extension://') || 
      request.url.startsWith('moz-extension://')) return;

  event.respondWith(
    handleRequest(request)
  );
});

// === ESTRATÉGIAS DE CACHE ===
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 1. ARQUIVOS ESTÁTICOS (Cache First)
    if (isStaticFile(url)) {
      return await cacheFirst(request);
    }
    
    // 2. RECURSOS EXTERNOS (Network First)
    if (isExternalResource(url)) {
      return await networkFirst(request);
    }
    
    // 3. NAVEGAÇÃO (Network First com fallback)
    if (isNavigation(request)) {
      return await networkFirstWithFallback(request);
    }
    
    // 4. OUTROS (Network Only)
    return await fetch(request);
    
  } catch (error) {
    console.warn('[SW] Erro ao processar request:', error);
    
    // Fallback para navegação
    if (isNavigation(request)) {
      const cache = await caches.open(STATIC_CACHE);
      return await cache.match('/') || new Response('Offline - Life OS indisponível', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    throw error;
  }
}

// === ESTRATÉGIA: CACHE FIRST ===
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }
  
  console.log('[SW] Cache miss, buscando na rede:', request.url);
  const response = await fetch(request);
  
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  
  return response;
}

// === ESTRATÉGIA: NETWORK FIRST ===
async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network falhou, tentando cache:', request.url);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

// === ESTRATÉGIA: NETWORK FIRST COM FALLBACK ===
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[SW] Network falhou para navegação, usando cache:', request.url);
    const cache = await caches.open(STATIC_CACHE);
    return await cache.match('/') || await cache.match('/index.html');
  }
}

// === HELPERS ===
function isStaticFile(url) {
  const pathname = url.pathname;
  return pathname.endsWith('.css') || 
         pathname.endsWith('.js') || 
         pathname.endsWith('.png') || 
         pathname.endsWith('.jpg') || 
         pathname.endsWith('.svg') ||
         pathname.endsWith('.ico') ||
         pathname === '/' ||
         pathname === '/index.html' ||
         pathname === '/manifest.json';
}

function isExternalResource(url) {
  return url.hostname !== self.location.hostname &&
         DYNAMIC_FILES.some(pattern => pattern.test(url.href));
}

function isNavigation(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// === MENSAGENS DO CLIENTE ===
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then(status => {
      event.ports[0].postMessage(status);
    });
  }
});

// === STATUS DO CACHE ===
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return status;
}

// === NOTIFICAÇÕES DE ATUALIZAÇÃO ===
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync executado');
    // Aqui podemos sincronizar dados offline quando a conexão voltar
  }
});

console.log('[SW] Service Worker carregado - Life OS v1.1.0 - Teste de Atualização');