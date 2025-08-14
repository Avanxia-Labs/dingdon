// // app/dashboard/components/ChatPanel.tsx
// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { Message } from '@/types/chatbot';
// import { useSession } from 'next-auth/react';
// import { useSocket } from '@/providers/SocketContext';
// import { useDashboardStore } from '@/stores/useDashboardStore';
// import { Send, Wifi, WifiOff, RefreshCcw } from 'lucide-react';

// interface ChatRequest {
//     sessionId: string;
//     initialMessage: Message;
// }

// interface ChatPanelProps {
//     workspaceId: string;
// }

// export const ChatPanel: React.FC<ChatPanelProps> = ({ workspaceId }) => {
//     const { data: session } = useSession();
//     const { socket, notificationsEnabled, enableNotifications } = useSocket();

//     // Usar el store persistente
//     const {
//         requests,
//         activeChat,
//         setActiveChat,
//         addMessageToActiveChat,
//         closeActiveChat,
//         removeRequest
//     } = useDashboardStore();

//     // Estados locales
//     const [input, setInput] = useState('');
//     const [isConnected, setIsConnected] = useState(false);
//     const [isReconnecting, setIsReconnecting] = useState(false);
//     const messagesEndRef = useRef<HTMLDivElement>(null);

//     // 🔧 NUEVO: Monitorear estado de conexión
//     useEffect(() => {
//         if (!socket) return;

//         const handleConnect = () => {
//             setIsConnected(true);
//             setIsReconnecting(false);
//             console.log('[ChatPanel] Socket conectado');
//         };

//         const handleDisconnect = () => {
//             setIsConnected(false);
//             console.log('[ChatPanel] Socket desconectado');
//         };

//         const handleReconnecting = () => {
//             setIsReconnecting(true);
//             console.log('[ChatPanel] Intentando reconectar...');
//         };

//         const handleReconnect = () => {
//             setIsConnected(true);
//             setIsReconnecting(false);
//             console.log('[ChatPanel] Socket reconectado');

//             // Re-join al chat activo si existe
//             if (activeChat?.sessionId) {
//                 socket.emit('join_session', activeChat.sessionId);
//             }
//         };

//         const handleHeartbeat = (data: { timestamp: number }) => {
//             console.log(`[ChatPanel] Heartbeat recibido desde el servidor.`);
//             socket.emit('heartbeat_response', data);
//         };

//         setIsConnected(socket.connected);

//         socket.on('connect', handleConnect);
//         socket.on('disconnect', handleDisconnect);
//         socket.on('reconnecting', handleReconnecting);
//         socket.on('reconnect', handleReconnect);
//         socket.on('heartbeat', handleHeartbeat);

//         return () => {
//             socket.off('connect', handleConnect);
//             socket.off('disconnect', handleDisconnect);
//             socket.off('reconnecting', handleReconnecting);
//             socket.off('reconnect', handleReconnect);
//             socket.off('heartbeat', handleHeartbeat);
//         };
//     }, [socket, activeChat?.sessionId]);

//     // Efecto para los listeners específicos del chat
//     useEffect(() => {
//         if (!socket) return;

//         const handleAssignmentSuccess = ({ sessionId, history }: { sessionId: string; history: Message[] }) => {
//             console.log('[ChatPanel] Assignment success for session:', sessionId);
//             setActiveChat(sessionId, history);
//         };

//         const handleAssignmentFailure = ({ message }: { message: string }) => {
//             console.error('[ChatPanel] Assignment failure:', message);
//             alert(message);
//         };

//         socket.on('assignment_success', handleAssignmentSuccess);
//         socket.on('assignment_failure', handleAssignmentFailure);

//         return () => {
//             socket.off('assignment_success', handleAssignmentSuccess);
//             socket.off('assignment_failure', handleAssignmentFailure);
//         };
//     }, [socket, setActiveChat]);

//     // Efecto para el auto-scroll
//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     }, [activeChat?.messages]);

//     // Efecto para unirse a la sala del chat activo
//     useEffect(() => {
//         if (socket && activeChat?.sessionId && isConnected) {
//             console.log(`[ChatPanel] Joining session: ${activeChat.sessionId}`);
//             socket.emit('join_session', activeChat.sessionId);
//         }
//     }, [socket, activeChat?.sessionId, isConnected]);

//     // Manejadores de la UI
//     const handleSelectChat = (request: ChatRequest) => {
//         if (socket && workspaceId && session?.user?.id && isConnected) {
//             console.log(`[ChatPanel] Selecting chat: ${request.sessionId}`);
//             socket.emit('agent_joined', {
//                 workspaceId,
//                 sessionId: request.sessionId,
//                 agentId: session.user.id
//             });
//         } else {
//             console.warn('[ChatPanel] Cannot select chat - socket not connected');
//             alert('Connection lost. Please wait for reconnection or refresh the page.');
//         }
//     };

//     const handleSendMessage = () => {
//         if (!input.trim() || !activeChat?.sessionId || !socket || !workspaceId) {
//             console.warn('[ChatPanel] Cannot send message - missing requirements');
//             return;
//         }

//         // 🔧 MEJORADO: Verificar conexión y mostrar estado
//         if (!isConnected) {
//             console.error('[ChatPanel] Socket not connected, cannot send message');
//             alert('Connection lost. Please wait for reconnection or refresh the page.');
//             return;
//         }

//         const agentMessage: Message = {
//             id: `agent-${Date.now()}`,
//             content: input,
//             role: 'agent',
//             agentName: session?.user?.name || 'Support',
//             timestamp: new Date(),
//         };

//         console.log(`[ChatPanel] Sending message to session ${activeChat.sessionId}:`, agentMessage);

//         // Enviar mensaje al servidor
//         socket.emit('agent_message', {
//             workspaceId,
//             sessionId: activeChat.sessionId,
//             message: agentMessage
//         });

//         // Añadir mensaje localmente
//         addMessageToActiveChat(agentMessage);
//         setInput('');

//         console.log(`[ChatPanel] Message sent and added locally`);
//     };

//     const handleCloseChat = () => {
//         if (!activeChat?.sessionId || !socket || !workspaceId || !isConnected) {
//             console.warn('[ChatPanel] Cannot close chat - missing requirements or not connected');
//             return;
//         }

//         socket.emit('close_chat', {
//             workspaceId,
//             sessionId: activeChat.sessionId
//         });

//         closeActiveChat();
//     };

//     // 🔧 NUEVO: Función para forzar reconexión
//     const forceReconnect = () => {
//         if (socket) {
//             console.log('[ChatPanel] Forcing reconnection');
//             socket.disconnect();
//             socket.connect();
//         }
//     };

//     return (
//         <div className="flex h-full relative">

//             {!notificationsEnabled && (
//                 <div className="absolute top-4 right-4 bg-yellow-100 border-yellow-300 text-yellow-800 p-3 rounded-lg shadow-md z-10">
//                     <p className="font-semibold">Enable Alerts</p>
//                     <p className="text-sm mb-2">Get desktop and sound notifications.</p>
//                     <button onClick={enableNotifications} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">
//                         Enable
//                     </button>
//                 </div>
//             )}

//             <div className="w-1/3 border-r bg-white p-4 flex flex-col lg:w-1/4">

//                 {/* Indicador de conexión compacto */}
//                 <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm mb-2 ${isConnected
//                     ? 'bg-green-100 text-green-800'
//                     : isReconnecting
//                         ? 'bg-yellow-100 text-yellow-800'
//                         : 'bg-red-100 text-red-800'
//                     }`}>
//                     {isConnected ? (
//                         <>
//                             <Wifi size={16} className='mr-2' />
//                             <span>Connected</span>
//                         </>
//                     ) : isReconnecting ? (
//                         <>
//                             <WifiOff size={16} className="animate-pulse mr-2" />
//                             <span>Reconnecting...</span>
//                         </>

//                     ) : (
//                         <div className='flex flex-row items-center justify-between w-full'>

//                             <div className='flex flex-row items-center gap-2'>
//                                 <WifiOff size={16} />
//                                 <span>Disconnected</span>
//                             </div>

//                             <button
//                                 onClick={forceReconnect}
//                                 className="ml-1 px-1 py-0.5  text-red-800 rounded-full text-xs hover:bg-red-300"
//                                 title="Reconnect"
//                             >
//                                 <RefreshCcw size={16} />
//                             </button>
//                         </div>
//                     )}
//                 </div>

//                 <h2 className="text-xl font-bold mb-4">Chat Requests</h2>

//                 <div className="space-y-2 flex-1 overflow-y-auto">
//                     {requests.map(req => (
//                         <div
//                             key={req.sessionId}
//                             onClick={() => handleSelectChat(req)}
//                             className={`p-3 rounded-lg cursor-pointer transition-colors ${activeChat?.sessionId === req.sessionId
//                                 ? 'bg-blue-600 text-white'
//                                 : isConnected
//                                     ? 'bg-gray-100 hover:bg-gray-200'
//                                     : 'bg-gray-50 cursor-not-allowed opacity-50'
//                                 }`}
//                         >
//                             <p className="font-semibold">Session: {req.sessionId.slice(-6)}</p>
//                             <p className="text-sm truncate">{req.initialMessage.content}</p>
//                         </div>
//                     ))}
//                     {requests.length === 0 && (
//                         <p className="text-gray-500 text-sm mt-2">No pending requests.</p>
//                     )}
//                 </div>
//             </div>

//             <div className="flex-1 flex flex-col bg-gray-50">
//                 {activeChat && activeChat.status === 'in_progress' ? (
//                     <>
//                         <div className="p-4 border-b bg-white flex justify-between items-center">
//                             <h3 className="text-lg font-bold">
//                                 Active Chat: {activeChat.sessionId.slice(-6)}
//                             </h3>
//                             <button
//                                 onClick={handleCloseChat}
//                                 disabled={!isConnected}
//                                 className={`px-3 py-1 rounded-lg text-sm ${isConnected
//                                     ? 'bg-red-500 text-white hover:bg-red-600'
//                                     : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                                     }`}
//                             >
//                                 Close Chat
//                             </button>
//                         </div>

//                         <div className="flex-1 p-4 overflow-y-auto space-y-4">
//                             {activeChat.messages.map(msg => {
//                                 const isOutgoing = msg.role === 'agent' || msg.role === 'assistant';
//                                 return (
//                                     <div
//                                         key={msg.id}
//                                         className={`flex items-end gap-2 ${isOutgoing ? 'justify-end' : 'justify-start'
//                                             }`}
//                                     >
//                                         <div className={`max-w-[70%] px-4 py-2 rounded-xl ${isOutgoing
//                                             ? 'bg-blue-500 text-white'
//                                             : 'bg-gray-200 text-gray-800'
//                                             }`}>
//                                             <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                             <div ref={messagesEndRef} />
//                         </div>

//                         <div className="p-4 bg-white border-t">
//                             <div className="flex space-x-2">
//                                 <input
//                                     type="text"
//                                     value={input}
//                                     onChange={e => setInput(e.target.value)}
//                                     onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
//                                     disabled={!isConnected}
//                                     className={`flex-1 p-2 border rounded-lg ${isConnected
//                                         ? 'border-gray-300 focus:border-blue-500'
//                                         : 'border-gray-200 bg-gray-50 cursor-not-allowed'
//                                         }`}
//                                     placeholder={
//                                         isConnected
//                                             ? "Type your response..."
//                                             : "Waiting for connection..."
//                                     }
//                                 />
//                                 <button
//                                     onClick={handleSendMessage}
//                                     disabled={!isConnected || !input.trim()}
//                                     className={`px-4 py-2 rounded-lg ${isConnected && input.trim()
//                                         ? 'bg-blue-600 text-white hover:bg-blue-700'
//                                         : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                                         }`}
//                                 >
//                                     <Send size={18} />
//                                 </button>
//                             </div>
//                         </div>
//                     </>
//                 ) : (
//                     <div className="flex items-center justify-center h-full">
//                         <p className="text-xl text-gray-500">
//                             {activeChat?.status === 'closed'
//                                 ? 'Chat was closed'
//                                 : 'Select a chat to begin'
//                             }
//                         </p>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Message } from "@/types/chatbot";
import { useSession } from "next-auth/react";
import { useSocket } from "@/providers/SocketContext";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { useSyncLanguage } from "@/hooks/useSyncLanguage";
import { Send, Wifi, WifiOff, RefreshCcw, Bot, Pause, Play, FileText, Tag, UserPlus, Info, Users } from "lucide-react";
import { executeBotCommand, ChatSessionInfo } from "@/utils/botCommands";
import { LeadInfoPanel } from "@/components/LeadInfoPanel";

interface ChatRequest {
    sessionId: string;
    initialMessage: Message;
}

interface ChatPanelProps {
    workspaceId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ workspaceId }) => {
    const { t, i18n } = useTranslation();
    const { data: session } = useSession();
    const { socket, notificationsEnabled, enableNotifications } = useSocket();
    
    // SOLUCIÓN DEFINITIVA: Bloquear completamente el widget flotante en dashboard
    React.useEffect(() => {
        // NO remover el widget si estamos en la página de prueba
        if (window.location.pathname.includes('test-widget.html')) {
            console.log('[ChatPanel] ✅ Test page detected - widget removal disabled');
            return;
        }
        
        console.log('[ChatPanel] 🚫 Dashboard detected - starting aggressive widget blocking');
        
        const removeBlockingWidget = () => {
            // Lista completa de elementos del widget
            const elementsToRemove = [
                'chatbot-animated-container',
                'chatbot-head',
                'chatbot-body',
                'chatbot-left-arm',
                'chatbot-right-arm',
                'chatbot-left-hand',
                'chatbot-right-hand',
                'chatbot-left-leg',
                'chatbot-right-leg',
                'chatbot-left-foot',
                'chatbot-right-foot',
                'chatbot-iframe',
                'chatbot-toggle-button'
            ];
            
            let removed = false;
            elementsToRemove.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    console.log(`[ChatPanel] 🗑️ Removing widget element: ${id}`);
                    element.remove();
                    removed = true;
                }
            });
            
            // Remover cualquier elemento con z-index máximo
            document.querySelectorAll('[style*="z-index: 2147483647"]').forEach(element => {
                console.log('[ChatPanel] 🗑️ Removing max z-index element:', element);
                element.remove();
                removed = true;
            });
            
            // Remover cualquier script de loader.js
            document.querySelectorAll('script').forEach(script => {
                if (script.src && script.src.includes('loader.js')) {
                    console.log('[ChatPanel] 🗑️ Removing loader.js script:', script.src);
                    script.remove();
                    removed = true;
                }
            });
            
            // Bloquear que se vuelva a cargar
            if (typeof window !== 'undefined') {
                window.ChatbotLoaded = true;
            }
            
            if (removed) {
                console.log('[ChatPanel] ✅ Widget cleanup complete');
            }
            
            return removed;
        };
        
        // Remover inmediatamente
        removeBlockingWidget();
        
        // Continuar verificando cada 200ms durante 10 segundos
        const interval = setInterval(() => {
            removeBlockingWidget();
        }, 200);
        
        // Crear un MutationObserver para detectar cuando se añaden elementos
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element;
                        if (element.id && (
                            element.id.includes('chatbot') || 
                            element.id.includes('chat-bot')
                        )) {
                            console.log('[ChatPanel] 🚨 Widget element detected via mutation, removing:', element.id);
                            element.remove();
                        }
                    }
                });
            });
        });
        
        // Observar cambios en el body
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Limpiar después de 10 segundos
        const timeout = setTimeout(() => {
            clearInterval(interval);
            observer.disconnect();
            console.log('[ChatPanel] 🏁 Widget blocking system deactivated');
        }, 10000);
        
        return () => {
            clearInterval(interval);
            observer.disconnect();
            clearTimeout(timeout);
        };
    }, []);
    
    // 🔧 DEBUG: Verificar que las traducciones funcionan
    console.log('[ChatPanel] i18n ready:', i18n.isInitialized);
    console.log('[ChatPanel] Current language:', i18n.language);
    console.log('[ChatPanel] Test translation:', t('chatPanel.requestsTitle'));
    console.log('[ChatPanel] Translation function type:', typeof t);
    const { language } = useDashboardStore();
    useSyncLanguage(language);

    // 🔍 DEBUG: Mostrar workspace actual
    console.log(`[ChatPanel] Current workspace: ${workspaceId}`);
    console.log(`[ChatPanel] Session info:`, {
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userName: session?.user?.name,
        workspaceId: session?.user?.workspaceId
    });

    const {
        requests,
        myActiveChats,
        activeChat,
        addToMyActiveChats,
        setActiveChat,
        addMessageToActiveChat,
        closeActiveChat,
        loadMyActiveChatsFromDB
    } = useDashboardStore();

    const [input, setInput] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [botPaused, setBotPaused] = useState(false);
    const [chatTags, setChatTags] = useState<string[]>([]);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showTagModal, setShowTagModal] = useState(false);
    const [transferEmail, setTransferEmail] = useState("");
    const [newTag, setNewTag] = useState("");
    const [availableAgents, setAvailableAgents] = useState<Array<{id: string, email: string, name: string, role: string}>>([]);
    const [loadingAgents, setLoadingAgents] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState("");
    const [showLeadPanel, setShowLeadPanel] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Helper function para contar solo mensajes reales (no del sistema)
    const getRealMessageCount = (messages: Message[]) => {
        return messages.filter(m => m.role !== 'system').length;
    };

    // Helper function para traducciones con fallback
    const safeTranslate = (key: string, options?: any) => {
        try {
            const translation = t(key, options);
            if (translation === key) {
                console.warn(`[ChatPanel] Translation missing for key: ${key}`);
                // Fallback manual para claves comunes
                const fallbacks: Record<string, string> = {
                    'chatPanel.requestsTitle': 'Chat Requests',
                    'chatPanel.myActiveChatsTitle': 'My Active Chats',
                    'chatPanel.sessionLabel': 'Session',
                    'chatPanel.transferredLabel': 'Transferred',
                    'chatPanel.noRequests': 'No pending requests',
                    'chatPanel.noActiveChats': 'No active chats yet. Take one from requests above!',
                    'chatPanel.messagesCount': '{{count}} messages',
                    'chatPanel.transferredFrom': 'From: {{agent}}',
                    'chatPanel.status.in_progress': 'in progress',
                    'chatPanel.status.pending': 'pending',
                    'chatPanel.status.completed': 'completed',
                    'chatPanel.status.closed': 'closed'
                };
                return fallbacks[key] || key;
            }
            return translation;
        } catch (error) {
            console.error(`[ChatPanel] Translation error for key ${key}:`, error);
            return key;
        }
    };

    useEffect(() => {
        if (!socket) return;
        const handleConnect = () => {
            setIsConnected(true);
            setIsReconnecting(false);
        };
        const handleDisconnect = () => setIsConnected(false);
        const handleReconnecting = () => setIsReconnecting(true);
        const handleReconnect = () => {
            setIsConnected(true);
            setIsReconnecting(false);
            if (activeChat?.sessionId)
                socket.emit("join_session", activeChat.sessionId);
        };
        const handleHeartbeat = (data: { timestamp: number }) =>
            socket.emit("heartbeat_response", data);

        setIsConnected(socket.connected);
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("reconnecting", handleReconnecting);
        socket.on("reconnect", handleReconnect);
        socket.on("heartbeat", handleHeartbeat);
        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("reconnecting", handleReconnecting);
            socket.off("reconnect", handleReconnect);
            socket.off("heartbeat", handleHeartbeat);
        };
    }, [socket, activeChat?.sessionId]);

    useEffect(() => {
        if (!socket) return;
        const handleAssignmentSuccess = ({
            sessionId,
            history,
        }: {
            sessionId: string;
            history: Message[];
        }) => {
            console.log(`[ChatPanel] Assignment successful for session ${sessionId}`);
            
            // Solo actualizar si es para el chat activo actual
            if (activeChat?.sessionId === sessionId) {
                console.log(`[ChatPanel] Updating active chat ${sessionId} with full history (${history.length} messages)`);
                setActiveChat(sessionId, history);
            } else {
                console.log(`[ChatPanel] Ignoring assignment_success for ${sessionId} - not current active chat (${activeChat?.sessionId})`);
            }
        };
        const handleAssignmentFailure = ({ message }: { message: string }) => {
            // Solo mostrar alerta si no tenemos un chat activo
            // Si ya tenemos un chat activo, probablemente es solo un cambio de chat que falló
            if (!activeChat) {
                console.error(`[ChatPanel] Assignment failure received: ${message}`);
                alert(message);
            } else {
                console.log(`[ChatPanel] Assignment failure ignored (already have active chat): ${message}`);
            }
        };
        socket.on("assignment_success", handleAssignmentSuccess);
        socket.on("assignment_failure", handleAssignmentFailure);
        return () => {
            socket.off("assignment_success", handleAssignmentSuccess);
            socket.off("assignment_failure", handleAssignmentFailure);
        };
    }, [socket, setActiveChat, addMessageToActiveChat, session?.user?.name]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChat?.messages]);
    
    // 🔄 Cargar mis chats activos desde la base de datos cuando se conecta
    useEffect(() => {
        if (workspaceId && session?.user?.id && isConnected) {
            console.log('[ChatPanel] Loading my active chats from database...');
            loadMyActiveChatsFromDB(workspaceId, session.user.id);
        }
    }, [workspaceId, session?.user?.id, isConnected, loadMyActiveChatsFromDB]);
    
    // Cargar lista de agentes cuando se abre el modal de transferencia
    useEffect(() => {
        if (showTransferModal && workspaceId) {
            loadAgents();
        }
    }, [showTransferModal, workspaceId]);
    
    const loadAgents = async () => {
        if (!workspaceId) return;
        
        setLoadingAgents(true);
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/agents`);
            if (response.ok) {
                const data = await response.json();
                setAvailableAgents(data.agents || []);
                // Seleccionar el primer agente por defecto si hay agentes
                if (data.agents && data.agents.length > 0) {
                    setSelectedAgentId(data.agents[0].id);
                }
            } else {
                console.error('Error loading agents');
            }
        } catch (error) {
            console.error('Error fetching agents:', error);
        } finally {
            setLoadingAgents(false);
        }
    };
    useEffect(() => {
        if (socket && activeChat?.sessionId && isConnected) {
            socket.emit("join_session", activeChat.sessionId);
        }
    }, [socket, activeChat?.sessionId, isConnected]);

    const handleSelectChat = (request: ChatRequest) => {        
        if (socket && workspaceId && session?.user?.id && isConnected) {
            console.log(`[ChatPanel] Agent taking chat from requests: ${request.sessionId}`);
            
            // 1. Agregar a MIS chats activos (esto lo removera de requests)
            addToMyActiveChats(request.sessionId, [request.initialMessage]);
            
            // 2. Activar este chat para verlo
            setActiveChat(request.sessionId, [request.initialMessage]);
            
            // Auto-pausar el bot cuando el agente toma el chat
            setBotPaused(true);
            
            // Enviar evento de control del bot
            socket.emit('bot_control', {
                workspaceId,
                sessionId: request.sessionId,
                action: 'pause',
                agentName: session.user.name || 'Agente de Soporte'
            });
            
            // Enviar evento de agente unido (para notificar al servidor)
            socket.emit("agent_joined", {
                workspaceId,
                sessionId: request.sessionId,
                agentId: session.user.id,
                agentName: session.user.name || 'Agente de Soporte'
            });
            
            // Agregar mensaje del sistema al chat
            const systemMessage: Message = {
                id: `system-${Date.now()}`,
                content: `🔔 ${session.user.name || 'Un agente'} se ha unido al chat. La IA ha sido pausada automáticamente.`,
                role: 'system' as any,
                timestamp: new Date(),
            };
            
            // Agregar el mensaje al chat inmediatamente
            setTimeout(() => {
                addMessageToActiveChat(systemMessage);
            }, 100);
        }
    };

    // Nueva función para cambiar entre mis chats activos
    const handleSwitchToMyChat = (chat: ActiveChat) => {
        console.log(`[ChatPanel] Switching to my active chat: ${chat.sessionId}`);
        setActiveChat(chat.sessionId, chat.messages);
    };
    const handleSendMessage = () => {
        console.log('[ChatPanel] ============ handleSendMessage START ============');
        console.log('[ChatPanel] Input value:', input);
        console.log('[ChatPanel] Input trimmed:', input.trim());
        console.log('[ChatPanel] Active chat:', activeChat);
        console.log('[ChatPanel] Socket exists:', !!socket);
        console.log('[ChatPanel] WorkspaceId:', workspaceId);
        console.log('[ChatPanel] Is connected:', isConnected);
        
        if (!input.trim()) {
            console.log('[ChatPanel] ❌ No input text, returning');
            return;
        }
        
        if (!activeChat?.sessionId) {
            console.log('[ChatPanel] ❌ No active chat session, returning');
            alert('Por favor selecciona un chat primero');
            return;
        }
        
        if (!socket) {
            console.log('[ChatPanel] ❌ No socket connection, returning');
            alert('No hay conexión con el servidor');
            return;
        }
        
        if (!workspaceId) {
            console.log('[ChatPanel] ❌ No workspaceId, returning');
            return;
        }
        
        console.log('[ChatPanel] ✅ All conditions met, sending message');
            
        // Normal message handling
        const agentMessage: Message = {
            id: `agent-${Date.now()}`,
            content: input,
            role: "agent",
            agentName: session?.user?.name || "Support",
            timestamp: new Date(),
        };
        socket.emit("agent_message", {
            workspaceId,
            sessionId: activeChat.sessionId,
            message: agentMessage,
        });
        addMessageToActiveChat(agentMessage);
        setInput("");
    };
    const handleCloseChat = () => {
        if (!activeChat?.sessionId || !socket || !workspaceId || !isConnected)
            return;
        socket.emit("close_chat", { workspaceId, sessionId: activeChat.sessionId });
        closeActiveChat();
    };
    
    // Bot command handlers as buttons
    const handleBotToggle = () => {
        if (!activeChat?.sessionId || !socket || !workspaceId) return;
        
        console.log(`[ChatPanel] Bot toggle clicked. Current botPaused: ${botPaused}`);
        const newPausedState = !botPaused;
        const action = newPausedState ? 'pause' : 'resume';
        console.log(`[ChatPanel] Setting bot to ${action}`);
        
        // Cambiar estado inmediatamente
        setBotPaused(newPausedState);
        
        // Si se está reactivando el bot, no necesitamos cambiar el estado local
        // El servidor manejará el cambio de estado
        
        // Enviar evento al servidor
        socket.emit('bot_control', {
            workspaceId,
            sessionId: activeChat.sessionId,
            action: action,
            agentName: session?.user?.name || 'Agente de Soporte'
        });
        
        // Agregar mensaje del sistema al chat
        const systemMessage: Message = {
            id: `system-${Date.now()}`,
            content: newPausedState 
                ? `⏸️ Bot pausado por ${session?.user?.name || 'Agente'}. La IA no responderá hasta que se reactive.`
                : `🤖 Bot reactivado por ${session?.user?.name || 'Agente'}. La IA ahora responderá automáticamente.`,
            role: 'system' as any,
            timestamp: new Date(),
        };
        addMessageToActiveChat(systemMessage);
    };
    
    const handleShowStatus = () => {
        if (!activeChat) return;
        
        // Contar solo mensajes de conversación real (excluir mensajes de sistema)
        const userMessages = activeChat.messages.filter(m => m.role === 'user');
        const agentMessages = activeChat.messages.filter(m => m.role === 'agent');
        const botMessages = activeChat.messages.filter(m => m.role === 'assistant');
        
        const totalRealMessages = userMessages.length + agentMessages.length + botMessages.length;
        
        console.log('[ChatPanel] Simple count - User:', userMessages.length, 'Agent:', agentMessages.length, 'Bot:', botMessages.length, 'Total:', totalRealMessages);
        
        const statusContent = `📊 **ESTADO DE LA CONVERSACIÓN**
━━━━━━━━━━━━━━━━━━━━━━━━
🆔 ID Sesión: ${String(activeChat.sessionId).slice(-8)}
🤖 Estado del Bot: ${botPaused ? '⏸️ Pausado' : '✅ Activo'}
💬 Total de mensajes: ${totalRealMessages}
  • Cliente: ${userMessages.length}
  • Agente: ${agentMessages.length}
  • Bot: ${botMessages.length}
🏷️ Etiquetas: ${chatTags?.join(', ') || 'Sin etiquetas'}
📅 Estado: ${activeChat.status}`;
        
        const systemMessage: Message = {
            id: `system-${Date.now()}`,
            content: statusContent,
            role: 'system' as any,
            timestamp: new Date(),
        };
        addMessageToActiveChat(systemMessage);
    };
    
    const handleGenerateSummary = () => {
        if (!activeChat) return;
        
        const sessionInfo: ChatSessionInfo = {
            sessionId: activeChat.sessionId,
            messages: activeChat.messages,
            status: activeChat.status,
            tags: chatTags,
            botPaused: botPaused
        };
        
        const result = executeBotCommand('summarize', [], sessionInfo);
        
        const systemMessage: Message = {
            id: `system-${Date.now()}`,
            content: result.message || '',
            role: 'system' as any,
            timestamp: new Date(),
        };
        addMessageToActiveChat(systemMessage);
    };
    
    const handleTransferChat = () => {
        console.log('🔄 TRANSFER BUTTON CLICKED - handleTransferChat called');
        console.log('[ChatPanel] selectedAgentId:', selectedAgentId);
        console.log('[ChatPanel] activeChat?.sessionId:', activeChat?.sessionId);
        console.log('[ChatPanel] socket:', !!socket);
        console.log('[ChatPanel] workspaceId:', workspaceId);
        console.log('[ChatPanel] Current user:', session?.user?.id, session?.user?.email);
        
        if (!selectedAgentId || !activeChat?.sessionId || !socket || !workspaceId) {
            console.log('[ChatPanel] Transfer aborted - missing required data');
            return;
        }
        
        const selectedAgent = availableAgents.find(a => a.id === selectedAgentId);
        console.log('[ChatPanel] selectedAgent:', selectedAgent);
        if (!selectedAgent) {
            console.log('[ChatPanel] Transfer aborted - agent not found');
            return;
        }
        
        console.log('[ChatPanel] 🚀 EMITTING TRANSFER_CHAT EVENT');
        console.log('[ChatPanel] Transfer data:', {
            workspaceId,
            sessionId: activeChat.sessionId,
            targetAgentId: selectedAgent.id,
            targetAgentEmail: selectedAgent.email,
            targetAgentName: selectedAgent.name
        });
        console.log('[ChatPanel] Socket connected:', !!socket);
        console.log('[ChatPanel] Socket ID:', socket?.id);
        
        socket.emit('transfer_chat', {
            workspaceId,
            sessionId: activeChat.sessionId,
            targetAgentId: selectedAgent.id,
            targetAgentEmail: selectedAgent.email,
            targetAgentName: selectedAgent.name
        });
        
        const systemMessage: Message = {
            id: `system-${Date.now()}`,
            content: `📤 Transfiriendo conversación a ${selectedAgent.name || selectedAgent.email}...`,
            role: 'system' as any,
            timestamp: new Date(),
        };
        addMessageToActiveChat(systemMessage);
        
        // 🆕 INMEDIATO: Remover el chat de mis chats activos y cerrar el chat activo
        console.log('[ChatPanel] 🗑️ Removing transferred chat from my active chats immediately');
        const { removeFromMyActiveChats, clearActiveChat } = useDashboardStore.getState();
        removeFromMyActiveChats(activeChat.sessionId);
        clearActiveChat();
        
        setShowTransferModal(false);
        setSelectedAgentId("");
    };
    
    const handleAddTag = () => {
        if (!newTag.trim() || !activeChat?.sessionId || !socket || !workspaceId) return;
        
        const updatedTags = [...chatTags, newTag];
        setChatTags(updatedTags);
        
        socket.emit('add_tag', {
            workspaceId,
            sessionId: activeChat.sessionId,
            tag: newTag
        });
        
        const systemMessage: Message = {
            id: `system-${Date.now()}`,
            content: `🏷️ Etiqueta "${newTag}" añadida a la conversación.`,
            role: 'system' as any,
            timestamp: new Date(),
        };
        addMessageToActiveChat(systemMessage);
        
        setShowTagModal(false);
        setNewTag("");
    };
    const forceReconnect = () => {
        if (socket) {
            socket.disconnect();
            socket.connect();
        }
    };

    return (
        <div className="flex h-full relative flex-col sm:flex-row">
            {!notificationsEnabled && (
                <div className="absolute top-4 right-4 bg-yellow-100 border-yellow-300 text-yellow-800 p-3 rounded-lg shadow-md z-10">
                    <p className="font-semibold">{t("chatPanel.notifications.title")}</p>
                    <p className="text-sm mb-2">
                        {t("chatPanel.notifications.description")}
                    </p>
                    <button
                        onClick={enableNotifications}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                    >
                        {t("chatPanel.notifications.button")}
                    </button>
                </div>
            )}
            <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 sm:border-r border-b sm:border-b-0 bg-white p-2 sm:p-3 md:p-4 flex flex-col min-w-0 h-1/3 sm:h-full">
                <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs sm:text-sm mb-2 ${isConnected
                            ? "bg-green-100 text-green-800"
                            : isReconnecting
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                        }`}
                >
                    {isConnected ? (
                        <>
                            <Wifi size={16} className="mr-2" />
                            <span>{t("chatPanel.connection.connected")}</span>
                        </>
                    ) : isReconnecting ? (
                        <>
                            <WifiOff size={16} className="animate-pulse mr-2" />
                            <span>{t("chatPanel.connection.reconnecting")}</span>
                        </>
                    ) : (
                        <div className="flex flex-row items-center justify-between w-full">
                            <div className="flex flex-row items-center gap-2">
                                <WifiOff size={16} />
                                <span>{t("chatPanel.connection.disconnected")}</span>
                            </div>
                            <button
                                onClick={forceReconnect}
                                className="ml-1 px-1 py-0.5 text-red-800 rounded-full text-xs hover:bg-red-300"
                                title={t("chatPanel.connection.reconnect")}
                            >
                                <RefreshCcw size={16} />
                            </button>
                        </div>
                    )}
                </div>
                {/* Sección 1: Chat Requests (disponibles para todos) */}
                <h2 className="text-sm sm:text-base md:text-lg font-bold mb-2 md:mb-3 text-green-700">
                    📥 <span className="hidden sm:inline">{safeTranslate("chatPanel.requestsTitle")}</span>
                    <span className="sm:hidden">Requests</span>
                </h2>
                <div className="space-y-1 sm:space-y-2 mb-3 md:mb-4 max-h-48 sm:max-h-64 overflow-y-auto">
                    {requests.map((req) => (
                        <div
                            key={req.sessionId}
                            onClick={() => handleSelectChat(req)}
                            className={`p-2 sm:p-3 rounded-lg cursor-pointer transition-colors ${isConnected
                                    ? "bg-green-50 hover:bg-green-100 border border-green-200"
                                    : "bg-gray-50 cursor-not-allowed opacity-50"
                                }`}
                        >
                            <p className="font-semibold text-green-800 text-xs sm:text-sm">
                                🆕 <span className="hidden sm:inline">{safeTranslate("chatPanel.sessionLabel")}: </span>{req.sessionId.slice(-6)}
                            </p>
                            <p className="text-xs sm:text-sm truncate text-green-600 mt-1">{req.initialMessage.content}</p>
                        </div>
                    ))}
                    {requests.length === 0 && (
                        <p className="text-gray-500 text-sm mt-2 italic">
                            {safeTranslate("chatPanel.noRequests")}
                        </p>
                    )}
                </div>

                {/* Sección 2: My Active Chats (mis chats tomados) */}
                <h2 className="text-sm sm:text-base md:text-lg font-bold mb-2 md:mb-3 text-blue-700">
                    💬 <span className="hidden sm:inline">{safeTranslate("chatPanel.myActiveChatsTitle")}</span>
                    <span className="sm:hidden">My Chats</span>
                </h2>
                <div className="space-y-2 flex-1 overflow-y-auto">
                    {myActiveChats.map((chat) => {
                        const isTransferred = !!chat.transferInfo;
                        const isActive = activeChat?.sessionId === chat.sessionId;
                        
                        return (
                            <div
                                key={chat.sessionId}
                                onClick={() => handleSwitchToMyChat(chat)}
                                className={`p-2 sm:p-3 rounded-lg cursor-pointer transition-colors ${
                                    isActive
                                        ? isTransferred 
                                            ? "bg-orange-600 text-white" 
                                            : "bg-blue-600 text-white"
                                        : isConnected
                                            ? isTransferred
                                                ? "bg-orange-50 hover:bg-orange-100 border border-orange-200"
                                                : "bg-blue-50 hover:bg-blue-100 border border-blue-200"
                                            : "bg-gray-50 cursor-not-allowed opacity-50"
                                }`}
                            >
                                <p className="font-semibold text-xs sm:text-sm">
                                    {isActive ? "👁️" : isTransferred ? "📥" : "💭"} 
                                    <span className="hidden sm:inline">{safeTranslate("chatPanel.sessionLabel")}: </span>
                                    {chat.sessionId.slice(-6)}
                                    {isTransferred && (
                                        <span className={`ml-1 sm:ml-2 text-xs px-1 sm:px-2 py-1 rounded-full ${
                                            isActive 
                                                ? "bg-orange-800 text-orange-100" 
                                                : "bg-orange-200 text-orange-800"
                                        }`}>
                                            <span className="hidden sm:inline">{safeTranslate("chatPanel.transferredLabel")}</span>
                                            <span className="sm:hidden">T</span>
                                        </span>
                                    )}
                                </p>
                                <p className={`text-xs sm:text-sm ${isActive ? 'text-gray-200' : 'text-gray-600'} mt-1`}>
                                    {getRealMessageCount(chat.messages)} msgs • {safeTranslate(`chatPanel.status.${chat.status}`) || chat.status}
                                    {isTransferred && chat.transferInfo?.transferredFromAgent && (
                                        <span className="block mt-1 text-xs truncate">
                                            <span className="hidden sm:inline">{safeTranslate("chatPanel.transferredFrom", { agent: chat.transferInfo.transferredFromAgent })}</span>
                                            <span className="sm:hidden">From: {chat.transferInfo.transferredFromAgent}</span>
                                        </span>
                                    )}
                                </p>
                            </div>
                        );
                    })}
                    {myActiveChats.length === 0 && (
                        <p className="text-gray-500 text-sm mt-2 italic">
                            {safeTranslate("chatPanel.noActiveChats")}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex-1 flex flex-col bg-gray-50 min-w-0 h-2/3 sm:h-full">
                {activeChat && activeChat.status === "in_progress" ? (
                    <>
                        <div className="p-2 sm:p-3 md:p-4 border-b bg-white">
                            <div className="flex justify-between items-center mb-2 md:mb-3">
                                <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                                    <h3 className="text-sm sm:text-base md:text-lg font-bold truncate">
                                        <span className="hidden sm:inline">
                                            {t("chatPanel.activeChatTitle", {
                                                id: String(activeChat.sessionId || '').slice(-6),
                                            })}
                                        </span>
                                        <span className="sm:hidden">Chat: {String(activeChat.sessionId || '').slice(-6)}</span>
                                    </h3>
                                    {botPaused && (
                                        <span className="bg-yellow-100 text-yellow-800 text-xs px-1 sm:px-2 py-1 rounded-full hidden sm:inline">
                                            🤖 <span className="hidden md:inline">Bot Pausado</span>
                                        </span>
                                    )}
                                    {chatTags.length > 0 && (
                                        <div className="flex gap-1 overflow-x-auto">
                                            {chatTags.slice(0, 2).map((tag, idx) => (
                                                <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-1 sm:px-2 py-1 rounded-full whitespace-nowrap">
                                                    {tag}
                                                </span>
                                            ))}
                                            {chatTags.length > 2 && (
                                                <span className="bg-gray-100 text-gray-600 text-xs px-1 sm:px-2 py-1 rounded-full">
                                                    +{chatTags.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleCloseChat}
                                    disabled={!isConnected}
                                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm whitespace-nowrap ${isConnected
                                            ? "bg-red-500 text-white hover:bg-red-600"
                                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        }`}
                                >
                                    <span className="hidden sm:inline">{t("chatPanel.closeChatButton")}</span>
                                    <span className="sm:hidden">Close</span>
                                </button>
                            </div>
                            
                            {/* Bot Control Buttons */}
                            <div className="flex gap-1 sm:gap-2 flex-wrap">
                                <button
                                    onClick={handleBotToggle}
                                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                                        botPaused 
                                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                                            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                    }`}
                                    title={botPaused ? "Reactivar Bot" : "Pausar Bot"}
                                >
                                    {botPaused ? <Play size={12} className="sm:hidden" /> : <Pause size={12} className="sm:hidden" />}
                                    {botPaused ? <Play size={14} className="hidden sm:block" /> : <Pause size={14} className="hidden sm:block" />}
                                    <span className="hidden sm:inline">{botPaused ? "Reactivar Bot" : "Pausar Bot"}</span>
                                    <span className="sm:hidden">{botPaused ? "▶️" : "⏸️"}</span>
                                </button>
                                
                                <button
                                    onClick={handleShowStatus}
                                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs sm:text-sm transition-colors"
                                    title="Ver Estado"
                                >
                                    <Info size={12} className="sm:hidden" />
                                    <Info size={14} className="hidden sm:block" />
                                    <span className="hidden sm:inline">Estado</span>
                                    <span className="sm:hidden">ℹ️</span>
                                </button>
                                
                                <button
                                    onClick={handleGenerateSummary}
                                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-xs sm:text-sm transition-colors"
                                    title="Generar Resumen"
                                >
                                    <FileText size={12} className="sm:hidden" />
                                    <FileText size={14} className="hidden sm:block" />
                                    <span className="hidden sm:inline">Resumen</span>
                                    <span className="sm:hidden">📄</span>
                                </button>
                                
                                <button
                                    onClick={() => setShowTransferModal(true)}
                                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg text-xs sm:text-sm transition-colors"
                                    title="Transferir Chat"
                                >
                                    <UserPlus size={12} className="sm:hidden" />
                                    <UserPlus size={14} className="hidden sm:block" />
                                    <span className="hidden sm:inline">Transferir</span>
                                    <span className="sm:hidden">👥</span>
                                </button>
                                
                                <button
                                    onClick={() => setShowTagModal(true)}
                                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-xs sm:text-sm transition-colors"
                                    title="Añadir Etiqueta"
                                >
                                    <Tag size={12} className="sm:hidden" />
                                    <Tag size={14} className="hidden sm:block" />
                                    <span className="hidden sm:inline">Etiqueta</span>
                                    <span className="sm:hidden">🏷️</span>
                                </button>
                                
                                <button
                                    onClick={() => setShowLeadPanel(!showLeadPanel)}
                                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                                        showLeadPanel 
                                            ? 'bg-green-200 text-green-800' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    title="Ver Información del Lead"
                                >
                                    <Users size={12} className="sm:hidden" />
                                    <Users size={14} className="hidden sm:block" />
                                    <span className="hidden sm:inline">Lead Info</span>
                                    <span className="sm:hidden">👤</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-2 sm:p-3 md:p-4 overflow-y-auto space-y-2 sm:space-y-3 md:space-y-4">
                            {activeChat.messages.map((msg) => {
                                const isOutgoing = msg.role === "agent" || msg.role === "assistant";
                                const isSystem = msg.role === "system";
                                
                                if (isSystem) {
                                    return (
                                        <div key={msg.id} className="flex justify-center my-2">
                                            <div className="bg-gray-100 border border-gray-300 px-2 sm:px-3 md:px-4 py-2 rounded-lg max-w-[90%] sm:max-w-[80%]">
                                                <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap font-mono">
                                                    {msg.content}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
                                
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex items-end gap-1 sm:gap-2 ${isOutgoing ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[85%] sm:max-w-[70%] px-2 sm:px-3 md:px-4 py-2 rounded-xl ${
                                                isOutgoing
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-gray-200 text-gray-800"
                                            }`}
                                        >
                                            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                                                {msg.content}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-2 sm:p-3 md:p-4 bg-white border-t">
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (isConnected && input.trim()) {
                                        handleSendMessage();
                                    }
                                }}
                                className="flex items-center space-x-2"
                            >
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            if (isConnected && input.trim()) {
                                                handleSendMessage();
                                            }
                                        }
                                    }}
                                    disabled={!isConnected}
                                    placeholder={
                                        isConnected
                                            ? t("chatPanel.inputPlaceholder")
                                            : t("chatPanel.inputPlaceholderDisconnected")
                                    }
                                    rows={1}
                                    className="text-black disabled:cursor-not-allowed disabled:opacity-40 flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!isConnected || !input.trim()}
                                    aria-label="Send Message"
                                    onClick={(e) => {
                                        console.log('[ChatPanel] Button clicked!');
                                        console.log('[ChatPanel] Event type:', e.type);
                                        console.log('[ChatPanel] Button disabled?:', !isConnected || !input.trim());
                                    }}
                                    onMouseDown={() => console.log('[ChatPanel] Mouse down on button')}
                                    onMouseUp={() => console.log('[ChatPanel] Mouse up on button')}
                                    className="hover:opacity-90 disabled:bg-gray-400 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors flex items-center justify-center aspect-square bg-blue-600"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full p-4">
                        <p className="text-base sm:text-lg md:text-xl text-gray-500 text-center">
                            {activeChat?.status === "closed"
                                ? t("chatPanel.chatClosed")
                                : t("chatPanel.selectChatPrompt")}
                        </p>
                    </div>
                )}
            </div>
            
            {/* Lead Info Panel */}
            {activeChat && (
                <LeadInfoPanel
                    sessionId={activeChat.sessionId}
                    workspaceId={workspaceId}
                    messages={activeChat.messages}
                    isVisible={showLeadPanel}
                    onClose={() => setShowLeadPanel(false)}
                    existingTags={chatTags}
                    onAddTag={(tag) => {
                        const updatedTags = [...chatTags, tag];
                        setChatTags(updatedTags);
                        
                        socket?.emit('add_tag', {
                            workspaceId,
                            sessionId: activeChat.sessionId,
                            tag: tag
                        });
                        
                        const systemMessage: Message = {
                            id: `system-${Date.now()}`,
                            content: `🏷️ Etiqueta "${tag}" añadida a la conversación.`,
                            role: 'system' as any,
                            timestamp: new Date(),
                        };
                        addMessageToActiveChat(systemMessage);
                    }}
                />
            )}
            
            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                            <UserPlus size={18} className="sm:hidden" />
                            <UserPlus size={20} className="hidden sm:block" />
                            <span className="hidden sm:inline">Transferir Conversación</span>
                            <span className="sm:hidden">Transferir</span>
                        </h3>
                        
                        {loadingAgents ? (
                            <div className="py-6 sm:py-8 text-center">
                                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                                <p className="text-gray-600 text-sm sm:text-base">Cargando agentes disponibles...</p>
                            </div>
                        ) : availableAgents.length === 0 ? (
                            <div className="py-6 sm:py-8 text-center">
                                <UserPlus size={36} className="text-gray-300 mx-auto mb-2 sm:hidden" />
                                <UserPlus size={48} className="text-gray-300 mx-auto mb-2 hidden sm:block" />
                                <p className="text-gray-600 mb-4 text-sm sm:text-base">No hay otros agentes disponibles en este momento.</p>
                                <button
                                    onClick={() => setShowTransferModal(false)}
                                    className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm sm:text-base"
                                >
                                    Cerrar
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                                    <span className="hidden sm:inline">Selecciona el agente al que deseas transferir esta conversación:</span>
                                    <span className="sm:hidden">Selecciona agente:</span>
                                </p>
                                
                                <div className="mb-3 sm:mb-4">
                                    <select
                                        value={selectedAgentId}
                                        onChange={(e) => setSelectedAgentId(e.target.value)}
                                        className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
                                        size={Math.min(availableAgents.length + 1, 6)}
                                    >
                                        <option value="" disabled>
                                            <span className="hidden sm:inline">-- Selecciona un agente --</span>
                                            <span className="sm:hidden">-- Selecciona --</span>
                                        </option>
                                        {availableAgents.map((agent) => (
                                            <option key={agent.id} value={agent.id} className="py-2">
                                                {agent.name || agent.email}
                                                {agent.role === 'admin' && ' (Admin)'}
                                                {agent.email !== agent.name && agent.name && ` - ${agent.email}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {selectedAgentId && (
                                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                        <p className="text-xs sm:text-sm text-orange-800">
                                            <strong>
                                                <span className="hidden sm:inline">Agente seleccionado:</span>
                                                <span className="sm:hidden">Seleccionado:</span>
                                            </strong> {availableAgents.find(a => a.id === selectedAgentId)?.name || availableAgents.find(a => a.id === selectedAgentId)?.email}
                                        </p>
                                    </div>
                                )}
                                
                                <div className="flex gap-2 justify-end flex-col sm:flex-row">
                                    <button
                                        onClick={() => {
                                            setShowTransferModal(false);
                                            setSelectedAgentId("");
                                        }}
                                        className="px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base w-full sm:w-auto"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => {
                                            console.log('🔥 TRANSFER BUTTON CLICKED IN MODAL');
                                            handleTransferChat();
                                        }}
                                        disabled={!selectedAgentId}
                                        className="px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base w-full sm:w-auto"
                                    >
                                        Transferir
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            
            {/* Tag Modal */}
            {showTagModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                            <Tag size={18} className="sm:hidden" />
                            <Tag size={20} className="hidden sm:block" />
                            <span className="hidden sm:inline">Añadir Etiqueta</span>
                            <span className="sm:hidden">Etiqueta</span>
                        </h3>
                        <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                            <span className="hidden sm:inline">Ingresa una etiqueta para categorizar esta conversación:</span>
                            <span className="sm:hidden">Categorizar conversación:</span>
                        </p>
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                            placeholder="Ej: venta, soporte, queja"
                            className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3 sm:mb-4 text-sm sm:text-base"
                            autoFocus
                        />
                        <div className="mb-3">
                            <p className="text-xs sm:text-sm text-gray-500 mb-2">Etiquetas rápidas:</p>
                            <div className="flex gap-1 sm:gap-2 flex-wrap">
                                {["venta", "soporte", "queja", "consulta", "urgente"].map((quickTag) => (
                                    <button
                                        key={quickTag}
                                        onClick={() => setNewTag(quickTag)}
                                        className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm hover:bg-gray-200 transition-colors"
                                    >
                                        {quickTag}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end flex-col sm:flex-row">
                            <button
                                onClick={() => {
                                    setShowTagModal(false);
                                    setNewTag("");
                                }}
                                className="px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base w-full sm:w-auto"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddTag}
                                disabled={!newTag.trim()}
                                className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base w-full sm:w-auto"
                            >
                                Añadir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
