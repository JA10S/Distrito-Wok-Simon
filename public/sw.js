/* Service Worker de Distrito Wok Simón (manual, sin Workbox).
 * Estrategias:
 *  - Navegaciones: network-first con fallback al shell (SPA offline)
 *  - /static/* (assets hasheados): cache-first
 *  - Google Fonts: CSS stale-while-revalidate / woff2 cache-first
 *  - Firestore, auth y todo lo demás: SIN interceptar (siempre red)
 */
const VERSION = 'v1';
const SHELL_CACHE = `dw-shell-${VERSION}`;
const STATIC_CACHE = `dw-static-${VERSION}`;
const FONTS_CACHE = `dw-fonts-${VERSION}`;
const ALLOWED_CACHES = [SHELL_CACHE, STATIC_CACHE, FONTS_CACHE];

const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icons/logo.svg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('dw-') && !ALLOWED_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

const isFontHost = (url) =>
  url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      // El shell de la SPA es el mismo HTML para toda ruta → una sola copia
      const key = request.mode === 'navigate' ? '/index.html' : request;
      cache.put(key, response.clone());
    }
    return response;
  } catch (err) {
    const cached =
      request.mode === 'navigate'
        ? (await caches.match('/index.html')) || (await caches.match('/'))
        : await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Navegaciones de la SPA → network-first con shell offline
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL_CACHE));
    return;
  }

  const sameOrigin = url.origin === self.location.origin;

  // Assets con hash del build → cache-first
  if (sameOrigin && url.pathname.startsWith('/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Google Fonts → cache (inmutables) o stale
  if (isFontHost(url)) {
    if (url.hostname === 'fonts.gstatic.com') {
      event.respondWith(cacheFirst(request, FONTS_CACHE));
    } else {
      event.respondWith(staleWhileRevalidate(request, FONTS_CACHE));
    }
    return;
  }

  // Imágenes/iconos locales → stale-while-revalidate (permiten actualizarse)
  if (sameOrigin && /\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Firestore, identitytoolkit, CartoDB, webchannel, etc. → sin interceptar.
  // El navegador los maneja directo (siempre red, datos en vivo).
});
