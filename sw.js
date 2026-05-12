/* ================================================
   BANSEK Pure Water — Service Worker
   Handles background push notifications
   ================================================ */

const CACHE_NAME = 'bansek-v1';

// ── Install ──────────────────────────────────────
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

// ── Push event (for future server-push support) ──
self.addEventListener('push', (e) => {
  let data = { title: 'BANSEK Pure Water', body: 'You have a new notification.' };
  try { data = e.data.json(); } catch (_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/favicon.ico',
      badge:   '/favicon.ico',
      tag:     data.tag || 'bansek-notif',
      data:    data.url ? { url: data.url } : {},
      vibrate: [200, 100, 200],
      requireInteraction: data.requireInteraction || false
    })
  );
});

// ── Notification click ────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Message from page → show notification ────────
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, url, requireInteraction } = e.data;
    self.registration.showNotification(title || 'BANSEK Pure Water', {
      body:    body || '',
      icon:    '/favicon.ico',
      badge:   '/favicon.ico',
      tag:     tag || 'bansek-notif',
      data:    { url: url || '/' },
      vibrate: [200, 100, 200],
      requireInteraction: requireInteraction || false
    });
  }
});
