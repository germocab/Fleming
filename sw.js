// ── Service Worker — Congregación Fleming ────────────────────────────────────
// Maneja notificaciones push entrantes y clicks en ellas.

self.addEventListener('push', event => {
  let data = {
    title: 'Congregación Fleming',
    body: 'Nueva actualización',
    url: '/'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/android-chrome-192x192.png',
    badge: '/icons/favicon-32x32.png',
    vibrate: [200, 100, 200],
    tag: 'fleming-push',          // reemplaza notificaciones previas del mismo tipo
    renotify: true,               // aun así vibra/suena si el tag ya existe
    requireInteraction: false,
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Si la app ya está abierta, enfócala
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no está abierta, ábrela
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Activación inmediata — evita que versiones viejas del SW retengan el control
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});
