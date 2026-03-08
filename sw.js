/**
 * MDO-Nexus-OODA Service Worker
 * Offline caching strategy: Cache-First for static, Network-First for data
 */

const CACHE_NAME = 'mdo-nexus-ooda-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/ooda-viz.js',
  '/js/cybernetics-viz.js',
  '/js/synergy-viz.js',
  '/js/domain-viz.js',
  '/js/feedback-viz.js',
  '/js/ddd-sdd-tdd-viz.js',
  '/manifest.json'
];

const DATA_ASSETS = [
  '/data/domains.json',
  '/data/synergy-matrix.json',
  '/data/ooda-state.json',
  '/data/cybernetics-state.json',
  '/data/health.json',
  '/data/test-results.json'
];

// Install: cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS.concat(DATA_ASSETS));
    }).catch(function(err) {
      console.warn('[SW] Cache install failed:', err);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
             .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first for data, Cache-first for static
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Data files: network-first
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
