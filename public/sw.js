// Bump this whenever the app shell changes so installed PWAs do not keep stale CSS/JS.
const CACHE = "maem-shell-v2";
const SHELL = ["/", "/auth", "/recipes", "/manifest.webmanifest", "/maem-icon.svg", "/maem-icon-192.png", "/maem-icon-512.png"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  const request = event.request;
  const url = new URL(request.url);
  const isStaticAsset = url.pathname.startsWith("/assets/") || ["script", "style", "font", "image"].includes(request.destination);
  if (isStaticAsset) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
      return response;
    })));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || caches.match("/"))));
  }
});
