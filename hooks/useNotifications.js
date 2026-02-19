
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

    const triggerNotification = useCallback(({ title, message }) => {
        if (typeof window === 'undefined') return;

        // Play Sound
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }

        // Show Notification
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/favicon.ico', // Default icon
            });
        } else {
            // Fallback alert
            alert(`REMINDER: ${title}\n${message}`);
        }
    }, []);

    return { permission, requestPermission, triggerNotification };
}
