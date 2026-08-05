/* Service worker for Quest Log — offline app-shell caching. */

const CACHE_NAME = "quest-log-v1";

// Assets to pre-cache on install. The index and built assets are
// hashed by Vite, so caching "/" covers navigation; runtime caching
// handles the actual versioned JS/CSS chunks.
const PRECACHE_URLS = ["/", "/manifest.webmanifest", "/icons/icon.svg"];

// Only cache same-origin GET requests (skip dev server HMR sockets,
// external font requests, and non-GET methods).
function isCacheable(request) {
  const url = new URL(request.url);
  return (
    request.method === "GET" &&
    url.origin === self.location.origin &&
    !url.pathname.includes("/@") &&
    !url.pathname.includes("/node_modules/")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Cache-first for the app shell, network-first fallback for other
// same-origin GET requests so fresh content wins when online.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!isCacheable(request)) {
    return;
  }

  // HTML navigations: try cache first for instant offline loads,
  // then fall back to the network and re-cache.
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("/").then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response?.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // Assets (JS/CSS/images): cache-first with network fallback and
  // background re-cache.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (response?.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
