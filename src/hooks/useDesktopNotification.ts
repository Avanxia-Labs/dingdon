// app/hooks/useDesktopNotification.ts
'use client';
import { useState, useEffect, useCallback } from 'react';

export const useDesktopNotification = () => {
    const [permission, setPermission] = useState('default');

    useEffect(() => {
        if (!('Notification' in window)) {
            console.error("This browser does not support desktop notification");
            return;
        }
        setPermission(Notification.permission);
    }, []);

    const requestPermission = useCallback(() => {
        console.log("Requesting notification permission...");
        if ('Notification' in window) {
            Notification.requestPermission().then(permissionResult => {
                console.log("Permission result:", permissionResult);
                setPermission(permissionResult);
            });
        }
    }, []);

    const showNotification = useCallback((title: string, options?: NotificationOptions) => {
        console.log(`Trying to show notification. Current permission is: ${permission}`);
        if (permission === 'granted') {
            const notification = new Notification(title, options);
            console.log("Notification created:", notification);
        }
    }, [permission]);

    return { permission, requestPermission, showNotification };
};