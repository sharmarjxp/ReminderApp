
// PiReminder Service Worker
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Handle push notifications sent from the server (web-push)
self.addEventListener('push', (event) => {
    let data = { title: 'PiReminder', message: 'You have a reminder!' };
    try {
        if (event.data) data = event.data.json();
    } catch (e) {
        console.error('[SW] Failed to parse push payload:', e);
    }

    const options = {
        body: data.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        requireInteraction: false,
        tag: data.id,
        renotify: true,
        data: { url: '/' },
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Tap on notification → open/focus the app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            return clients.openWindow('/');
        })
    );
});
