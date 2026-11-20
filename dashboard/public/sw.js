self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
// No cache: dashboard tetap selalu mengambil data terbaru.
self.addEventListener('fetch', () => {});
