// app/dashboard/contexts/SocketContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useRef, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useDesktopNotification } from '@/hooks/useDesktopNotification';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { Message } from '@/types/chatbot';

interface ChatRequest {
    sessionId: string;
    initialMessage: Message;
}

interface SocketContextType {
    socket: Socket | null;
    notificationsEnabled: boolean;
    enableNotifications: () => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    notificationsEnabled: false,
    enableNotifications: () => { },
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const { data: session } = useSession();
    const workspaceId = session?.user?.workspaceId;
    const socketRef = useRef<Socket | null>(null);

    const {
        addRequest,
        removeRequest,
        addMessageToActiveChat,
        activeChat,
        notificationsEnabled,
        setNotificationsEnabled
    } = useDashboardStore();

    const { playSound, requestPermission: requestSoundPermission, isEnabled: isSoundEnabled } = useNotificationSound('/notification.mp3');
    const { permission: notificationPermission, requestPermission: requestDesktopPermission, showNotification } = useDesktopNotification();

    const enableNotifications = useCallback(() => {
        requestDesktopPermission();
        requestSoundPermission();
        setNotificationsEnabled(true);
    }, [requestDesktopPermission, requestSoundPermission, setNotificationsEnabled]);

    useEffect(() => {
        const enabled = notificationPermission === 'granted' && isSoundEnabled;
        if (enabled !== notificationsEnabled) {
            setNotificationsEnabled(enabled);
        }
    }, [notificationPermission, isSoundEnabled, notificationsEnabled, setNotificationsEnabled]);
    
    // 🔧 CAMBIO 1: useEffect para gestionar ÚNICAMENTE la conexión del socket.
    // Se ejecuta solo una vez cuando el workspaceId está disponible.
    useEffect(() => {
        if (workspaceId && !socketRef.current) {
            console.log('[SocketProvider] Creando nueva conexión socket...');
            
            const socketInstance = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001', {
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            socketRef.current = socketInstance;

            socketInstance.on('connect', () => {
                console.log('[SocketProvider] Socket conectado. Uniéndose al dashboard...');
                socketInstance.emit('join_agent_dashboard', { workspaceId });
                
                // Si hay un chat activo durante la reconexión, nos unimos de nuevo.
                const currentActiveChatId = useDashboardStore.getState().activeChat?.sessionId;
                if (currentActiveChatId) {
                    console.log(`[SocketProvider] Re-uniéndose a la sesión activa: ${currentActiveChatId}`);
                    socketInstance.emit('join_session', currentActiveChatId);
                }
            });

            socketInstance.on('disconnect', (reason) => {
                console.log(`[SocketProvider] Socket desconectado. Razón: ${reason}`);
            });
        }

        // La función de limpieza se ejecuta SÓLO cuando el componente se desmonta.
        return () => {
            if (socketRef.current) {
                console.log("[SocketProvider] Desmontando componente. Desconectando socket.");
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [workspaceId]); // Solo depende de workspaceId.

    // 🔧 CAMBIO 2: useEffect para gestionar los LISTENERS de eventos.
    // Se ejecuta cada vez que el socket o las dependencias de los listeners cambian.
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return; // Si no hay socket, no hacemos nada.

        console.log('[SocketProvider] Configurando o actualizando listeners del socket...');

        // Limpiar listeners previos para evitar duplicados en cada re-render.
        socket.removeAllListeners('new_chat_request');
        socket.removeAllListeners('chat_taken');
        socket.removeAllListeners('incoming_user_message');
        
        // Configurar listeners
        socket.on('new_chat_request', (request: ChatRequest) => {
            console.log(`[Dashboard] New chat request received:`, request);
            addRequest(request);
            playSound();
            showNotification('New Chat Request', { body: `Session: ${request.sessionId.slice(-6)}` });
        });

        socket.on('chat_taken', ({ sessionId }: { sessionId: string }) => {
            console.log(`[Dashboard] Chat taken:`, sessionId);
            removeRequest(sessionId);
        });

        socket.on('incoming_user_message', ({ sessionId, message }: { sessionId: string; message: Message }) => {
            console.log(`[Dashboard] Incoming user message for session ${sessionId}:`, message);
            // Usamos getState para obtener el valor más reciente sin añadir 'activeChat' como dependencia aquí.
            if (useDashboardStore.getState().activeChat?.sessionId === sessionId) {
                addMessageToActiveChat(message);
            }
        });
        
       

    }, [addMessageToActiveChat, addRequest, playSound, removeRequest, showNotification]); // Dependencias estables.

    // 🔧 CAMBIO 3: useEffect para gestionar el unirse/salir de las salas de chat.
    // Se ejecuta solo cuando el chat activo cambia.
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !activeChat?.sessionId) return;
        
        const sessionId = activeChat.sessionId;
        console.log(`[SocketProvider] El chat activo ha cambiado. Uniéndose a la sesión: ${sessionId}`);
        socket.emit('join_session', sessionId);

    }, [activeChat?.sessionId]); // Solo depende del ID de la sesión activa.

    const contextValue: SocketContextType = {
        socket: socketRef.current,
        notificationsEnabled,
        enableNotifications,
    };

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
};