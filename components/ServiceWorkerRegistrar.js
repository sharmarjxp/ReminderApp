'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            const register = () => {
                navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                        console.log('[SW] Registered with scope:', registration.scope);
                    },
                    (err) => {
                        console.error('[SW] Registration failed:', err);
                    }
                );
            };

            // Handle case where the page has already loaded
            if (document.readyState === 'complete') {
                register();
            } else {
                window.addEventListener('load', register);
            }
        }
    }, []);

    return null; // renders nothing
}
