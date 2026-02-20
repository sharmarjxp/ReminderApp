
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Helper: convert base64 VAPID public key to Uint8Array for the browser
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function useNotifications() {
    const [permission, setPermission] = useState('default');
    const audioRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPermission(Notification.permission);
            audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        }
    }, []);

    // Subscribe this device to Web Push and send the subscription to the server
    const subscribeToPush = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('[Push] PushManager not supported on this browser.');
            return;
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
            console.error('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set.');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Reuse existing subscription if already subscribed
            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey),
                });
            }

            const sub = subscription.toJSON();

            // Get current session token to authenticate the request
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    endpoint: sub.endpoint,
                    p256dh: sub.keys?.p256dh,
                    auth: sub.keys?.auth,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                }),
            });

            console.log('[Push] Subscribed and saved to server.');
        } catch (err) {
            console.error('[Push] Subscribe error:', err);
        }
    }, []);

    const requestPermission = useCallback(async () => {
        if (typeof window === 'undefined') return;
        const res = await Notification.requestPermission();
        setPermission(res);

        // If granted, subscribe this device for Web Push
        if (res === 'granted') {
            await subscribeToPush();
        }

        return res;
    }, [subscribeToPush]);

    // Also try to re-subscribe on mount if permission was already granted
    useEffect(() => {
        if (typeof window !== 'undefined' && Notification.permission === 'granted') {
            subscribeToPush();
        }
    }, [subscribeToPush]);

    const triggerNotification = useCallback(async ({ title, message }) => {
        if (typeof window === 'undefined') return;

        // Play Sound (for foreground notifications)
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }

        // Show local notification (for when app is foreground/tab is open)
        if (Notification.permission === 'granted') {
            const options = {
                body: message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                vibrate: [100, 50, 100],
            };

            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                registration.showNotification(title, options);
            } else {
                new Notification(title, options);
            }
        } else {
            alert(`REMINDER: ${title}\n${message}`);
        }
    }, []);

    return { permission, requestPermission, triggerNotification };
}
