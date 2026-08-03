// LifeAgent Service Worker - Self-destroying to clear stale caches
// This SW immediately takes control and clears all old caches

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

// No fetch interception - let all requests go to network directly
