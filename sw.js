const CACHE = 'fleming-v1';
const SHELL = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
];

// Install: cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', e => {
  // Skip non-GET and Supabase API calls (always need fresh data)
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful responses for the app shell
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});






self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icons/apple-touch-icon.png',
      badge: '/icons/favicon-32x32.png',
      vibrate: [200, 100, 200]
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') // Abre la webapp al hacer clic
  );
});

// ── Service Worker — Congregación Fleming ────────────────────────────────────
// Maneja notificaciones push recibidas desde el servidor (Edge Function de Supabase).

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

// ── Recibir un push del servidor ─────────────────────────────────────────────
self.addEventListener('push', event => {
  let data = { title: 'Congregación Fleming', body: 'Hay una actualización nueva.' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || '',
    icon: '/android-chrome-192x192.png',
    badge: '/icons/favicon-32x32.png',
    vibrate: [150, 50, 150],
    data: { url: data.url || '/' },
    // Agrupa notificaciones de la misma fuente para no inundar
    tag: 'fleming-notif',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Congregación Fleming', options)
  );
});

// ── Al tocar la notificación: abrir/enfocar la app ───────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventana, abrir una nueva
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
