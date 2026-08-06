/* Service worker for Quest Log — offline app-shell caching. */

// IMPORTANT: Bump this cache version on every deploy that changes the app
// shell or behavior. The install handler deletes all older caches, so old
// app shells are purged and the new bundle is fetched from the network.
const CACHE_NAME = "quest-log-v2";

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

// NETWORK-FIRST for HTML navigations:
//  1. Fetch fresh HTML from the network on every navigation.
//  2. On success, re-cache it (so the cache always holds the latest shell).
//  3. Fall back to the cached shell ONLY when offline.
// This guarantees users always get the latest deployed app when online,
// instead of being stuck on a stale cached app shell forever.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!isCacheable(request)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response?.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch(() => caches.match("/")),
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
