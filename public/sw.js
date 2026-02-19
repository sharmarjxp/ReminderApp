
// Minimal Service Worker to enable PWA installation
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Handle push notifications (placeholder for future Web Push integration)
self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};
    const title = data.title || 'PiReminder';
    const options = {
        body: data.message || 'Notification received.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Optionally handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});
