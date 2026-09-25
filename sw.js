// Service worker — keeps the ship's docs readable offshore with no signal.
//
//   Shell (HTML, CSS, JS)  → stale-while-revalidate, in a cache named for the
//                            deploy, so a new release actually arrives
//   docs/ (Markdown, index) → network-first, cached fallback
//   CDN (marked, DOMPurify) → stale-while-revalidate
//
// Paths resolve against the worker's scope, so the site works at a project
// Pages URL (/mermug-ships-docs/) or at a custom domain root alike.
//
// BUILD_ID is replaced with the commit SHA by the Pages workflow.

const BUILD_ID    = 'dev';
const SHELL_CACHE = `docs-shell-${BUILD_ID}`;
const DATA_CACHE  = 'docs-data-v1';

const SCOPE = new URL(self.registration.scope);
const DOCS_PREFIX = `${SCOPE.pathname}docs/`;

const SHELL_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'assets/styles.css',
  'assets/constants.js',
  'assets/docs.js',
  'assets/icon.svg',
].map((path) => new URL(path, SCOPE).href);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // Individually, so one 404 cannot fail the whole install.
      Promise.all(SHELL_ASSETS.map((asset) => cache.add(asset).catch(() => {}))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.hostname.endsWith('jsdelivr.net')) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Network-first so an edit committed from a phone shows up on the next
  // load; cached so the procedures stay readable with no signal. docs.js
  // prefetches every document to fill this cache.
  if (url.pathname.startsWith(DOCS_PREFIX)) {
    event.respondWith(networkFirstWithCache(request, DATA_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
});

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request, { cacheName });
    if (cached) return cached;
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Answer from cache at once and refresh the entry in the background. The
// lookup ignores the query string so `docs.js?v=2` is answered by the
// precached `docs.js`.
async function staleWhileRevalidate(request, cacheName) {
  const cached =
    (await caches.match(request, { cacheName })) ??
    (await caches.match(request, { cacheName, ignoreSearch: true }));
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => null);
  if (cached) return cached;
  return (await fetchPromise) ?? new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}
