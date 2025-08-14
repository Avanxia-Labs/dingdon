// // app/dashboard/contexts/SocketContext.tsx
// 'use client';

// import React, { createContext, useContext, useEffect, useRef, ReactNode, useCallback } from 'react';
// import { io, Socket } from 'socket.io-client';
// import { useSession } from 'next-auth/react';
// import { useNotificationSound } from '@/hooks/useNotificationSound';
// import { useDesktopNotification } from '@/hooks/useDesktopNotification';
// import { useDashboardStore } from '@/stores/useDashboardStore';
// import { Message } from '@/types/chatbot';

// interface ChatRequest {
//     sessionId: string;
//     initialMessage: Message;
// }

// interface SocketContextType {
//     socket: Socket | null;
//     notificationsEnabled: boolean;
//     enableNotifications: () => void;
// }

// const SocketContext = createContext<SocketContextType>({
//     socket: null,
//     notificationsEnabled: false,
//     enableNotifications: () => { },
// });

// export const useSocket = () => {
//     return useContext(SocketContext);
// };

// export const SocketProvider = ({ children }: { children: ReactNode }) => {
//     const { data: session } = useSession();
//     const workspaceId = session?.user?.workspaceId;
//     const socketRef = useRef<Socket | null>(null);

//     // Usar el store persistente en lugar de useState local
//     const {
//         addRequest,
//         removeRequest,
//         addMessageToActiveChat,
//         activeChat,
//         notificationsEnabled,
//         setNotificationsEnabled
//     } = useDashboardStore();

//     // Hooks de notificación
//     const { playSound, requestPermission: requestSoundPermission, isEnabled: isSoundEnabled } = useNotificationSound('/notification.mp3');
//     const { permission: notificationPermission, requestPermission: requestDesktopPermission, showNotification } = useDesktopNotification();

//     // Función para habilitar notificaciones
//     const enableNotifications = useCallback(() => {
//         requestDesktopPermission();
//         requestSoundPermission();
//         setNotificationsEnabled(true);
//     }, [requestDesktopPermission, requestSoundPermission, setNotificationsEnabled]);

//     // Efecto para actualizar el estado de notificaciones
//     useEffect(() => {
//         const enabled = notificationPermission === 'granted' && isSoundEnabled;
//         if (enabled !== notificationsEnabled) {
//             setNotificationsEnabled(enabled);
//         }
//     }, [notificationPermission, isSoundEnabled, notificationsEnabled, setNotificationsEnabled]);

//     // 🔧 NUEVA FUNCIÓN: Configurar listeners del socket
//     const setupSocketListeners = useCallback((socket: Socket) => {
//         console.log('[SocketProvider] Configurando listeners del socket');

//         // Limpiar listeners previos para evitar duplicados
//         socket.removeAllListeners('new_chat_request');
//         socket.removeAllListeners('chat_taken');
//         socket.removeAllListeners('incoming_user_message');
//         socket.removeAllListeners('agent_message');
//         socket.removeAllListeners('agent_message_sent');

//         // Configurar listeners
//         socket.on('new_chat_request', (request: ChatRequest) => {
//             console.log(`[Dashboard] New chat request received:`, request);
//             addRequest(request);
//             playSound();
//             showNotification('New Chat Request', {
//                 body: `Session: ${request.sessionId.slice(-6)}\n"${request.initialMessage.content}"`
//             });
//         });

//         socket.on('chat_taken', ({ sessionId }: { sessionId: string }) => {
//             console.log(`[Dashboard] Chat taken:`, sessionId);
//             removeRequest(sessionId);
//         });

//         socket.on('incoming_user_message', ({ sessionId, message }: { sessionId: string; message: Message }) => {
//             console.log(`[Dashboard] Incoming user message for session ${sessionId}:`, message);
//             if (activeChat?.sessionId === sessionId) {
//                 addMessageToActiveChat(message);
//             }
//         });

//         socket.on('agent_message', (message: Message) => {
//             console.log(`[Dashboard] Agent message received:`, message);
//             if (activeChat?.sessionId) {
//                 addMessageToActiveChat(message);
//             }
//         });

//         socket.on('agent_message_sent', ({ sessionId, message }: { sessionId: string; message: Message }) => {
//             console.log(`[Dashboard] Confirmed message sent to session ${sessionId}:`, message);
//         });

//         // 🔧 NUEVO: Listeners para gestión de conexión
//         socket.on('connect', () => {
//             console.log('[SocketProvider] Socket conectado');
//             if (workspaceId) {
//                 socket.emit('join_agent_dashboard', { workspaceId });
//                 console.log(`[SocketProvider] Re-joined workspace: ${workspaceId}`);
                
//                 // Re-join al chat activo si existe
//                 if (activeChat?.sessionId) {
//                     socket.emit('join_session', activeChat.sessionId);
//                     console.log(`[SocketProvider] Re-joined active chat: ${activeChat.sessionId}`);
//                 }
//             }
//         });

//         socket.on('disconnect', (reason) => {
//             console.log(`[SocketProvider] Socket desconectado. Razón: ${reason}`);
//         });

//         socket.on('reconnect', (attemptNumber) => {
//             console.log(`[SocketProvider] Socket reconectado después de ${attemptNumber} intentos`);
//         });

//         socket.on('reconnect_error', (error) => {
//             console.error('[SocketProvider] Error de reconexión:', error);
//         });

//         socket.on('reconnect_failed', () => {
//             console.error('[SocketProvider] Falló la reconexión');
//         });

//     }, [workspaceId, playSound, showNotification, addRequest, removeRequest, addMessageToActiveChat, activeChat]);

//     // Efecto principal para establecer la conexión
//     useEffect(() => {
//         if (workspaceId && !socketRef.current) {
//             console.log('[SocketProvider] Creando nueva conexión socket');
            
//             const socketInstance = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001', {
//                 // 🔧 CONFIGURACIÓN MEJORADA: Opciones de reconexión
//                 reconnection: true,
//                 reconnectionAttempts: 5,
//                 reconnectionDelay: 1000,
//                 reconnectionDelayMax: 5000,
//                 timeout: 20000,
//                 forceNew: true, // Forzar nueva conexión
//                 transports: ['websocket', 'polling'] // Permitir fallback a polling
//             });

//             socketRef.current = socketInstance;

//             // Configurar listeners
//             setupSocketListeners(socketInstance);

//             // Join inicial al workspace
//             socketInstance.on('connect', () => {
//                 console.log('[SocketProvider] Conexión inicial establecida');
//                 socketInstance.emit('join_agent_dashboard', { workspaceId });
//                 console.log(`[SocketProvider] Joined workspace: ${workspaceId}`);
//             });
//         }

//         return () => {
//             if (socketRef.current) {
//                 console.log("[SocketProvider] Limpiando socket connection");
//                 socketRef.current.removeAllListeners();
//                 socketRef.current.disconnect();
//                 socketRef.current = null;
//             }
//         };
//     }, [workspaceId, setupSocketListeners]);

//     // 🔧 NUEVO: Efecto para reconfigurar listeners cuando cambia el activeChat
//     useEffect(() => {
//         if (socketRef.current && activeChat?.sessionId) {
//             console.log(`[SocketProvider] Active chat changed to: ${activeChat.sessionId}`);
//             socketRef.current.emit('join_session', activeChat.sessionId);
//         }
//     }, [activeChat?.sessionId]);

//     // El valor que se comparte con todos los componentes hijos
//     const contextValue: SocketContextType = {
//         socket: socketRef.current,
//         notificationsEnabled,
//         enableNotifications,
//     };

//     return (
//         <SocketContext.Provider value={contextValue}>
//             {children}
//         </SocketContext.Provider>
//     );
// };


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
        myActiveChats,
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
                console.log(`[SocketProvider] 🏢 WORKSPACE ID: ${workspaceId}`);
                console.log(`[SocketProvider] 👤 USER INFO:`, {
                    id: session?.user?.id,
                    email: session?.user?.email,
                    name: session?.user?.name,
                    workspaceId: session?.user?.workspaceId
                });
                console.log(`[SocketProvider] 🔗 SOCKET ID: ${socketInstance.id}`);
                
                // Registrar información del agente usando session
                if (session?.user?.id) {
                    console.log(`[SocketProvider] 📝 Registering agent info: ${session.user.id} for workspace ${workspaceId}`);
                    socketInstance.emit('agent_info', { 
                        agentId: session.user.id, 
                        agentName: session.user.name || session.user.email,
                        workspaceId 
                    });
                } else {
                    console.warn(`[SocketProvider] ⚠️ No user ID available for agent registration!`);
                }
                
                socketInstance.emit('join_agent_dashboard', { workspaceId });
                console.log('[SocketProvider] DEBUG: Evento join_agent_dashboard emitido');
                
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
        socket.removeAllListeners('chat_removed_from_dashboard');
        socket.removeAllListeners('chat_transferred_to_me');
        
        // 🔧 DEBUG: Verificar que los listeners se configuran correctamente
        console.log(`[SocketProvider] 🔧 Setting up socket listeners...`);
        
        // 🔧 DEBUG: Listener genérico para capturar todos los eventos
        const originalOnAny = socket.onAny;
        socket.onAny((eventName, ...args) => {
            console.log(`[SocketProvider] 🎯 Event received: ${eventName}`, args);
        });
        
        // Configurar listeners
        socket.on('new_chat_request', (request: ChatRequest) => {
            console.log(`[Dashboard] ⚠️ NEW_CHAT_REQUEST received:`, request);
            console.log(`[Dashboard] This should NOT happen for transferred chats!`);
            addRequest(request);
            playSound();
            showNotification('New Chat Request', { body: `Session: ${request.sessionId.slice(-6)}` });
        });

        socket.on('chat_taken', ({ sessionId }: { sessionId: string }) => {
            console.log(`[Dashboard] Chat taken:`, sessionId);
            // Solo remover el request si NO está en mis chats activos
            const { myActiveChats } = useDashboardStore.getState();
            const isMyChat = myActiveChats.some(chat => chat.sessionId === sessionId);
            
            if (!isMyChat) {
                removeRequest(sessionId);
                console.log(`[Dashboard] Removed request ${sessionId} from my list (taken by another agent)`);
            } else {
                console.log(`[Dashboard] Keeping request ${sessionId} - it's my active chat`);
            }
        });

        socket.on('incoming_user_message', ({ sessionId, message }: { sessionId: string; message: Message }) => {
            console.log(`[Dashboard] Incoming user message for session ${sessionId}:`, message);
            if (activeChat?.sessionId === sessionId) {
                addMessageToActiveChat(message);
            }
        });

        // Listener para remover chat cuando se transfiere
        socket.on('chat_removed_from_dashboard', ({ sessionId, message }: { sessionId: string; message: string }) => {
            console.log(`[Dashboard] Chat removed from dashboard:`, sessionId, message);
            
            // Remover de la lista de requests activos
            removeRequest(sessionId);
            
            // 🆕 INMEDIATO: También remover de mis chats activos si está ahí
            const { removeFromMyActiveChats, clearActiveChat } = useDashboardStore.getState();
            removeFromMyActiveChats(sessionId);
            
            // Si es el chat activo, cerrarlo
            if (activeChat?.sessionId === sessionId) {
                clearActiveChat();
            }
            
            // Mostrar notificación de transferencia
            showNotification('Transferencia Exitosa', { body: message });
        });

        // 🆕 NUEVO: Listener para cuando me transfieren un chat
        console.log(`[SocketProvider] 🎯 Configuring chat_transferred_to_me listener for user: ${session?.user?.id}`);
        
        // 🆕 Agregar debugging adicional para el evento
        socket.onAny((eventName, ...args) => {
            if (eventName === 'chat_transferred_to_me') {
                console.log(`[SocketProvider] 📡 RECEIVED EVENT: ${eventName}`, args);
            }
        });
        
        socket.on('chat_transferred_to_me', ({ sessionId, transferredFrom, message }: { 
            sessionId: string; 
            transferredFrom: string; 
            message: string; 
        }) => {
            console.log(`[Dashboard] 🎉 ===== CHAT TRANSFERRED TO ME EVENT RECEIVED =====`);
            console.log(`[Dashboard] 📨 Session ID: ${sessionId}`);
            console.log(`[Dashboard] 👤 Transferred from: ${transferredFrom}`);
            console.log(`[Dashboard] 💬 Message: ${message}`);
            console.log(`[Dashboard] 📋 Current workspaceId: ${workspaceId}`);
            console.log(`[Dashboard] 👤 Current userId: ${session?.user?.id}`);
            console.log(`[Dashboard] 🔌 Socket ID: ${socket.id}`);
            console.log(`[Dashboard] 🔗 Socket connected: ${socket.connected}`);
            console.log(`[Dashboard] 🕐 Timestamp: ${new Date().toISOString()}`);
            
            // IMPORTANTE: Primero remover de requests si existe ahí
            const storeState = useDashboardStore.getState();
            const { removeRequest, loadMyActiveChatsFromDB } = storeState;
            
            console.log(`[Dashboard] 📊 Current store state:`, {
                requestsCount: storeState.requests.length,
                myActiveChatsCount: storeState.myActiveChats.length,
                activeChat: storeState.activeChat?.sessionId
            });
            
            // Remover de Chat Requests si está ahí
            console.log(`[Dashboard] 🗑️ Removing ${sessionId} from Chat Requests (if exists)`);
            removeRequest(sessionId);
            
            // 🆕 INMEDIATO: Recargar desde BD con retraso mínimo para asegurar que se sincronice
            console.log(`[Dashboard] 🔄 Reloading active chats from DB IMMEDIATELY to get transfer info`);
            if (workspaceId && session?.user?.id) {
                // Múltiples intentos con delays progresivos para asegurar sincronización
                const attemptReload = (attemptNumber: number, delay: number) => {
                    setTimeout(() => {
                        console.log(`[Dashboard] 🔄 Attempt ${attemptNumber}: Executing loadMyActiveChatsFromDB...`);
                        loadMyActiveChatsFromDB(workspaceId, session.user.id).then(() => {
                            console.log(`[Dashboard] ✅ Attempt ${attemptNumber}: Active chats reloaded successfully`);
                            const newState = useDashboardStore.getState();
                            console.log(`[Dashboard] 📊 New state after reload:`, {
                                myActiveChatsCount: newState.myActiveChats.length,
                                containsTransferredChat: newState.myActiveChats.some(c => c.sessionId === sessionId)
                            });
                        }).catch((error) => {
                            console.error(`[Dashboard] ❌ Attempt ${attemptNumber} failed:`, error);
                        });
                    }, delay);
                };
                
                // Intentar en 100ms, 500ms y 1000ms
                attemptReload(1, 100);
                attemptReload(2, 500);
                attemptReload(3, 1000);
            } else {
                console.warn(`[Dashboard] ⚠️ Cannot reload chats - missing workspaceId or userId`);
                console.warn(`[Dashboard] workspaceId: ${workspaceId}, userId: ${session?.user?.id}`);
            }
            
            // Mostrar notificación
            showNotification('Chat Transferido', { 
                body: `${transferredFrom} te ha transferido una conversación` 
            });
            playSound();
            
            console.log(`[Dashboard] 🏁 ===== TRANSFER HANDLING COMPLETED =====`);
        });

        // 🆕 FALLBACK: Listener adicional para transferencias por dashboard room
        socket.on('chat_transferred_to_agent', ({ targetAgentId, sessionId, transferredFrom, message }: { 
            targetAgentId: string;
            sessionId: string; 
            transferredFrom: string; 
            message: string; 
        }) => {
            // Solo procesar si soy el agente target
            if (session?.user?.id === targetAgentId) {
                console.log(`[Dashboard] 🎯 ===== FALLBACK TRANSFER EVENT RECEIVED =====`);
                console.log(`[Dashboard] 📨 Session ID: ${sessionId}`);
                console.log(`[Dashboard] 👤 Target Agent ID: ${targetAgentId}`);
                console.log(`[Dashboard] 👤 My User ID: ${session?.user?.id}`);
                
                // Ejecutar la misma lógica que el evento principal
                const storeState = useDashboardStore.getState();
                const { removeRequest, loadMyActiveChatsFromDB } = storeState;
                
                removeRequest(sessionId);
                
                if (workspaceId && session?.user?.id) {
                    const attemptReload = (attemptNumber: number, delay: number) => {
                        setTimeout(() => {
                            console.log(`[Dashboard] 🔄 Fallback Attempt ${attemptNumber}: Executing loadMyActiveChatsFromDB...`);
                            loadMyActiveChatsFromDB(workspaceId, session.user.id).then(() => {
                                console.log(`[Dashboard] ✅ Fallback Attempt ${attemptNumber}: Active chats reloaded successfully`);
                            }).catch((error) => {
                                console.error(`[Dashboard] ❌ Fallback Attempt ${attemptNumber} failed:`, error);
                            });
                        }, delay);
                    };
                    
                    attemptReload(1, 100);
                    attemptReload(2, 500);
                    attemptReload(3, 1000);
                }
                
                showNotification('Chat Transferido (Fallback)', { 
                    body: `${transferredFrom} te ha transferido una conversación` 
                });
                playSound();
                
                console.log(`[Dashboard] 🏁 ===== FALLBACK TRANSFER EVENT PROCESSED =====`);
            } else {
                console.log(`[Dashboard] 🔇 Ignoring fallback transfer - not for me (target: ${targetAgentId}, me: ${session?.user?.id})`);
            }
        });
        
       

    }, [addMessageToActiveChat, addRequest, playSound, removeRequest, showNotification, activeChat?.sessionId, myActiveChats, workspaceId, session?.user?.id]); // Dependencias estables.

    // 🔧 CAMBIO 3: useEffect para gestionar el unirse/salir de las salas de chat.
    // Se ejecuta solo cuando el chat activo cambia.
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !activeChat?.sessionId) return;
        
        const sessionId = activeChat.sessionId;
        console.log(`[SocketProvider] El chat activo ha cambiado. Uniéndose a la sesión: ${sessionId}`);
        socket.emit('join_session', sessionId);

        // Opcional: Salir de la sala anterior si es necesario.
        // return () => {
        //     console.log(`[SocketProvider] Saliendo de la sesión: ${sessionId}`);
        //     socket.emit('leave_session', sessionId);
        // }

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