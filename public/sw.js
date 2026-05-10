const CACHE_NAME = "ikigai-static-v1";

// Only cache true static assets — never HTML pages or authenticated routes
const STATIC_ASSETS = [
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // Do NOT skipWaiting — let the SW activate on the next navigation
  // so it never takes control of a page mid-session and confuses the router
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  // Do NOT clients.claim() — avoids intercepting pages that are already loaded
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never intercept navigation requests — let Next.js handle all HTML pages
  if (event.request.mode === "navigate") return;

  // Only serve from cache for same-origin static assets
  if (url.origin !== self.location.origin) return;

  // Cache-first for known static assets; network-only for everything else
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached ?? fetch(event.request))
    );
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Ikigai", {
      body: data.body ?? "",
      icon: data.icon ?? "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [100, 50, 100],
      data: { url: data.url ?? "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((wins) => {
        const existing = wins.find((w) => w.url.includes(target));
        if (existing) return existing.focus();
        return clients.openWindow(target);
      })
  );
});
