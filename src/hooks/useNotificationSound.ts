// app/hooks/useNotificationSound.ts
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

export const useNotificationSound = (soundUrl: string) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isEnabled, setIsEnabled] = useState(false);
    const [hasPermission, setHasPermission] = useState<'granted' | 'denied' | 'default'>('default');
    const lastInteractionRef = useRef<number>(0);

    // Inicializar el audio
    useEffect(() => {
        if (typeof Audio !== 'undefined') {
            audioRef.current = new Audio(soundUrl);
            // Precargar el audio
            audioRef.current.preload = 'auto';
            
            // Configurar el audio para que no se pause automáticamente
            audioRef.current.addEventListener('ended', () => {
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                }
            });
        }
    }, [soundUrl]);

    // Función para habilitar sonido con interacción del usuario
    const enableSound = useCallback(async () => {
        if (!audioRef.current) return false;

        try {
            // Actualizar timestamp de última interacción
            lastInteractionRef.current = Date.now();

            // Intentar reproducir silenciosamente para desbloquear
            const originalVolume = audioRef.current.volume;
            audioRef.current.volume = 0;
            
            await audioRef.current.play();
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.volume = originalVolume;
            
            setIsEnabled(true);
            console.log('Audio habilitado correctamente');
            return true;
        } catch (error) {
            console.warn('No se pudo habilitar el audio:', error);
            setIsEnabled(false);
            return false;
        }
    }, []);

    // Verificar si la interacción es reciente (menos de 5 segundos)
    const isRecentInteraction = useCallback(() => {
        return Date.now() - lastInteractionRef.current < 5000;
    }, []);

    // Actualizar timestamp en cada interacción
    const updateInteraction = useCallback(() => {
        lastInteractionRef.current = Date.now();
    }, []);

    // Listeners para interacciones del usuario
    useEffect(() => {
        const handleInteraction = () => {
            updateInteraction();
            if (!isEnabled) {
                enableSound();
            }
        };

        // Eventos de interacción
        const events = ['click', 'touchstart', 'keydown', 'mousedown'];
        
        events.forEach(event => {
            document.addEventListener(event, handleInteraction, { passive: true });
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleInteraction);
            });
        };
    }, [isEnabled, enableSound, updateInteraction]);

    // Función principal para reproducir sonido
    const playSound = useCallback(async () => {
        if (!audioRef.current) {
            console.warn('Audio no inicializado');
            return false;
        }

        // Si no tenemos interacción reciente, intentar habilitar primero
        if (!isEnabled || !isRecentInteraction()) {
            const enabled = await enableSound();
            if (!enabled) {
                console.warn(' Necesitas interactuar con la página para reproducir sonidos');
                return false;
            }
        }

        try {
            // Resetear el audio antes de reproducir
            audioRef.current.currentTime = 0;
            await audioRef.current.play();
            console.log('🔊 Sonido reproducido exitosamente');
            return true;
        } catch (error) {
            console.error('Error reproduciendo sonido:', error);
            
            // Si falla, intentar habilitar de nuevo
            if (error instanceof DOMException && error.name === 'NotAllowedError') {
                setIsEnabled(false);
                console.warn('Se perdió el permiso de audio. Requiere nueva interacción del usuario.');
            }
            
            return false;
        }
    }, [isEnabled, isRecentInteraction, enableSound]);

    // Función para solicitar permiso explícitamente (opcional)
    const requestPermission = useCallback(async () => {
        try {
            // En navegadores que soportan la API de notificaciones
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                setHasPermission(permission);
                return permission === 'granted';
            }
            
            // Fallback: intentar habilitar audio directamente
            return await enableSound();
        } catch (error) {
            console.error('Error solicitando permisos:', error);
            return false;
        }
    }, [enableSound]);

    // Función para verificar si se puede reproducir sonido
    const canPlaySound = useCallback(() => {
        return isEnabled && isRecentInteraction();
    }, [isEnabled, isRecentInteraction]);

    return {
        playSound,
        requestPermission,
        canPlaySound,
        isEnabled,
        hasPermission,
        enableSound // Para uso manual si es necesario
    };
};