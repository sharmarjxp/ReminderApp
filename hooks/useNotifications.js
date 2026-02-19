
import { useState, useCallback, useEffect, useRef } from 'react';

export default function useNotifications() {
    const [permission, setPermission] = useState('default');
    const audioRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPermission(Notification.permission);
            // Initialize audio
            audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        }
    }, []);

    const requestPermission = useCallback(async () => {
        if (typeof window === 'undefined') return;
        const res = await Notification.requestPermission();
        setPermission(res);
        return res;
    }, []);

    const triggerNotification = useCallback(async ({ title, message }) => {
        if (typeof window === 'undefined') return;

        // Play Sound
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }

        if (Notification.permission === 'granted') {
            const options = {
                body: message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                vibrate: [100, 50, 100],
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: 1
                }
            };

            // Preferred: Use Service Worker for better background support
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                registration.showNotification(title, options);
            } else {
                // Fallback for Safari/others not fully supporting SW notifications
                new Notification(title, options);
            }
        } else {
            // Fallback alert
            alert(`REMINDER: ${title}\n${message}`);
        }
    }, []);

    return { permission, requestPermission, triggerNotification };
}
