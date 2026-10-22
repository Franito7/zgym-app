// ==============================================================================
// ZGYM PWA SERVICE WORKER (v2) - NETWORK FIRST PARA NAVEGACIÓN Y CERO INTERCEPTACIÓN DE APIS
// ==============================================================================
const CACHE_NAME = 'zgym-cache-v2';

self.addEventListener('install', () => {
  // Forzar activación inmediata del nuevo service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Limpiar todas las versiones anteriores de caché para evitar servir bundles viejos
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NUNCA interceptar peticiones externas (como Supabase, CDNs o Auth)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 2. Solo peticiones GET de la propia aplicación
  if (event.request.method !== 'GET') {
    return;
  }

  // 3. Estrategia Network First para navegación HTML:
  // Garantiza que el usuario siempre reciba el index.html y los scripts más recientes de Vercel.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match('/index.html');
        return cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      })
    );
    return;
  }
});
