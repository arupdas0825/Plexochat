const CACHE_NAME = "plexochat-v2";

const STATIC_ASSETS = [
  "/",
  "/home",
  "/chats",
  "/manifest.json",
  "/logo.png",
  "/icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>PlexoChat — Offline</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #090a0f;
      color: #f3f4f8;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 1.5rem;
      box-sizing: border-box;
    }
    .card {
      max-width: 360px;
      padding: 2rem;
      background: #12131a;
      border: 1px solid #222433;
      border-radius: 1.5rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 1.25rem;
      border-radius: 1rem;
      background: rgba(99, 102, 241, 0.15);
      color: #6366f1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
    }
    h1 {
      font-size: 1.25rem;
      margin: 0 0 0.5rem;
      font-weight: 700;
    }
    p {
      font-size: 0.875rem;
      color: #8a8d9f;
      line-height: 1.5;
      margin: 0 0 1.5rem;
    }
    button {
      background: #6366f1;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
    }
    button:active {
      transform: scale(0.97);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚡</div>
    <h1>You're Offline</h1>
    <p>PlexoChat requires an active internet connection for real-time E2EE messaging and instant translation.</p>
    <button onclick="window.location.reload()">Retry Connection</button>
  </div>
</body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET" || !request.url.startsWith("http")) return;

  // Real-time Firebase / WSS calls: pass through to network
  if (
    request.url.includes("firestore.googleapis.com") ||
    request.url.includes("firebase") ||
    request.url.includes("/api/")
  ) {
    return;
  }

  // Navigation: Fast network with cached app shell fallback for instant boot
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve(null), 1200);
        });

        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => null);

        const fastResponse = await Promise.race([networkPromise, timeoutPromise]);
        if (fastResponse) {
          return fastResponse;
        }

        // If network took longer than 1.2s, immediately return cached page or app shell
        const cached = await caches.match(request);
        if (cached) return cached;

        const shell = (await caches.match("/home")) || (await caches.match("/"));
        if (shell) return shell;

        // If not cached, await the ongoing network request
        const fallbackResponse = await networkPromise;
        if (fallbackResponse) return fallbackResponse;

        return new Response(OFFLINE_HTML, {
          headers: { "Content-Type": "text/html" },
        });
      })()
    );
    return;
  }

  // Static assets: Cache-first
  if (
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.url.match(/\.(png|jpg|jpeg|svg|ico|woff2|woff|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
