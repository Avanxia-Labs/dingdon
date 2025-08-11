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
import { Send, Wifi, WifiOff, RefreshCcw, Bot, Pause, Play, FileText, Tag, UserPlus, Info } from "lucide-react";
import { executeBotCommand, ChatSessionInfo } from "@/utils/botCommands";

interface ChatRequest {
    sessionId: string;
    initialMessage: Message;
}

interface ChatPanelProps {
    workspaceId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ workspaceId }) => {
    const { t } = useTranslation();
    const { data: session } = useSession();
    const { socket, notificationsEnabled, enableNotifications } = useSocket();
    const { language } = useDashboardStore();
    useSyncLanguage(language);

    const {
        requests,
        activeChat,
        setActiveChat,
        addMessageToActiveChat,
        closeActiveChat,
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
            setActiveChat(sessionId, history);
            
            // Agregar mensaje de sistema indicando que la IA ha sido pausada
            const systemMessage: Message = {
                id: `system-${Date.now()}`,
                content: `🔔 ${session?.user?.name || 'Un agente'} se ha unido al chat. La IA ha sido pausada automáticamente.`,
                role: 'system' as any,
                timestamp: new Date(),
            };
            
            // Agregar el mensaje al chat activo
            setTimeout(() => {
                addMessageToActiveChat(systemMessage);
            }, 100); // Pequeño delay para asegurar que el activeChat esté establecido
        };
        const handleAssignmentFailure = ({ message }: { message: string }) =>
            alert(message);
        socket.on("assignment_success", handleAssignmentSuccess);
        socket.on("assignment_failure", handleAssignmentFailure);
        return () => {
            socket.off("assignment_success", handleAssignmentSuccess);
            socket.off("assignment_failure", handleAssignmentFailure);
        };
    }, [socket, setActiveChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChat?.messages]);
    
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
            console.log(`[ChatPanel] Agent selecting chat ${request.sessionId}, auto-pausing bot`);
            
            // Auto-pausar el bot cuando el agente toma el chat
            setBotPaused(true);
            
            // Enviar evento de control del bot
            socket.emit('bot_control', {
                workspaceId,
                sessionId: request.sessionId,
                action: 'pause',
                agentName: session.user.name || 'Agente de Soporte'
            });
            
            // Enviar evento de agente unido
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
            // Note: Este mensaje se agregará cuando el activeChat se establezca
        }
    };
    const handleSendMessage = () => {
        console.log('[ChatPanel] handleSendMessage called');
        console.log('[ChatPanel] Conditions check:', {
            'input.trim()': !!input.trim(),
            'activeChat?.sessionId': !!activeChat?.sessionId,
            'socket': !!socket,
            'workspaceId': !!workspaceId,
            'isConnected': isConnected
        });
        
        if (!input.trim()) {
            console.log('[ChatPanel] handleSendMessage: no input text, returning');
            return;
        }
        
        if (!activeChat?.sessionId) {
            console.log('[ChatPanel] handleSendMessage: no active chat session, returning');
            return;
        }
        
        if (!socket) {
            console.log('[ChatPanel] handleSendMessage: no socket connection, returning');
            return;
        }
        
        if (!workspaceId) {
            console.log('[ChatPanel] handleSendMessage: no workspaceId, returning');
            return;
        }
        
        console.log('[ChatPanel] handleSendMessage: all conditions met, sending message');
            
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
        
        // Si se está reactivando el bot, cambiar status a 'bot'
        if (!newPausedState && activeChat && activeChat.sessionId) {
            console.log(`[ChatPanel] Changing chat status from ${activeChat.status} to 'bot'`);
            setActiveChat({
                sessionId: String(activeChat.sessionId), // Asegurar que sea string
                messages: activeChat.messages || [],
                status: 'bot' as any
            });
        }
        
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
        
        console.log('[ChatPanel] Emitting transfer_chat event');
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
        <div className="flex h-full relative">
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
            <div className="w-1/3 border-r bg-white p-4 flex flex-col lg:w-1/4">
                <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm mb-2 ${isConnected
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
                <h2 className="text-xl font-bold mb-4">
                    {t("chatPanel.requestsTitle")}
                </h2>
                <div className="space-y-2 flex-1 overflow-y-auto">
                    {requests.map((req) =>  (
                        
                        <div
                            key={req.sessionId}
                            onClick={() => handleSelectChat(req)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${activeChat?.sessionId === req.sessionId
                                    ? "bg-blue-600 text-white"
                                    : isConnected
                                        ? "bg-gray-100 hover:bg-gray-200"
                                        : "bg-gray-50 cursor-not-allowed opacity-50"
                                }`}
                        >
                            <p className="font-semibold">
                                Session: {req.sessionId.slice(-6)}
                            </p>
                            <p className="text-sm truncate">{req.initialMessage.content}</p>
                        </div>
                    ))}
                    {requests.length === 0 && (
                        <p className="text-gray-500 text-sm mt-2">
                            {t("chatPanel.noRequests")}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex-1 flex flex-col bg-gray-50">
                {activeChat && activeChat.status === "in_progress" ? (
                    <>
                        <div className="p-4 border-b bg-white">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-lg font-bold">
                                        {t("chatPanel.activeChatTitle", {
                                            id: String(activeChat.sessionId || '').slice(-6),
                                        })}
                                    </h3>
                                    {botPaused && (
                                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                            🤖 Bot Pausado
                                        </span>
                                    )}
                                    {chatTags.length > 0 && (
                                        <div className="flex gap-1">
                                            {chatTags.map((tag, idx) => (
                                                <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleCloseChat}
                                    disabled={!isConnected}
                                    className={`px-3 py-1 rounded-lg text-sm ${isConnected
                                            ? "bg-red-500 text-white hover:bg-red-600"
                                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        }`}
                                >
                                    {t("chatPanel.closeChatButton")}
                                </button>
                            </div>
                            
                            {/* Bot Control Buttons */}
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={handleBotToggle}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                        botPaused 
                                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                                            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                    }`}
                                    title={botPaused ? "Reactivar Bot" : "Pausar Bot"}
                                >
                                    {botPaused ? <Play size={14} /> : <Pause size={14} />}
                                    {botPaused ? "Reactivar Bot" : "Pausar Bot"}
                                </button>
                                
                                <button
                                    onClick={handleShowStatus}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm transition-colors"
                                    title="Ver Estado"
                                >
                                    <Info size={14} />
                                    Estado
                                </button>
                                
                                <button
                                    onClick={handleGenerateSummary}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-sm transition-colors"
                                    title="Generar Resumen"
                                >
                                    <FileText size={14} />
                                    Resumen
                                </button>
                                
                                <button
                                    onClick={() => setShowTransferModal(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg text-sm transition-colors"
                                    title="Transferir Chat"
                                >
                                    <UserPlus size={14} />
                                    Transferir
                                </button>
                                
                                <button
                                    onClick={() => setShowTagModal(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-sm transition-colors"
                                    title="Añadir Etiqueta"
                                >
                                    <Tag size={14} />
                                    Etiqueta
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {activeChat.messages.map((msg) => {
                                const isOutgoing = msg.role === "agent" || msg.role === "assistant";
                                const isSystem = msg.role === "system";
                                
                                if (isSystem) {
                                    return (
                                        <div key={msg.id} className="flex justify-center my-2">
                                            <div className="bg-gray-100 border border-gray-300 px-4 py-2 rounded-lg max-w-[80%]">
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                                                    {msg.content}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
                                
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex items-end gap-2 ${isOutgoing ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[70%] px-4 py-2 rounded-xl ${
                                                isOutgoing
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-gray-200 text-gray-800"
                                            }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">
                                                {msg.content}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 bg-white border-t">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                    disabled={!isConnected}
                                    className={`flex-1 p-2 border rounded-lg ${isConnected
                                            ? "border-gray-300 focus:border-blue-500"
                                            : "border-gray-200 bg-gray-50 cursor-not-allowed"
                                        }`}
                                    placeholder={
                                        isConnected
                                            ? t("chatPanel.inputPlaceholder")
                                            : t("chatPanel.inputPlaceholderDisconnected")
                                    }
                                />
                                <button
                                    onClick={(e) => {
                                        console.log('[ChatPanel] Send button clicked');
                                        console.log('[ChatPanel] Current input value:', input);
                                        e.preventDefault();
                                        handleSendMessage();
                                    }}
                                    title={`Button state: isConnected=${isConnected}, input='${input}', input.trim()='${input.trim()}'`}
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-xl text-gray-500">
                            {activeChat?.status === "closed"
                                ? t("chatPanel.chatClosed")
                                : t("chatPanel.selectChatPrompt")}
                        </p>
                    </div>
                )}
            </div>
            
            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <UserPlus size={20} />
                            Transferir Conversación
                        </h3>
                        
                        {loadingAgents ? (
                            <div className="py-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                                <p className="text-gray-600">Cargando agentes disponibles...</p>
                            </div>
                        ) : availableAgents.length === 0 ? (
                            <div className="py-8 text-center">
                                <UserPlus size={48} className="text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-600 mb-4">No hay otros agentes disponibles en este momento.</p>
                                <button
                                    onClick={() => setShowTransferModal(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                >
                                    Cerrar
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-600 mb-4">
                                    Selecciona el agente al que deseas transferir esta conversación:
                                </p>
                                
                                <div className="mb-4">
                                    <select
                                        value={selectedAgentId}
                                        onChange={(e) => setSelectedAgentId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        size={Math.min(availableAgents.length + 1, 6)}
                                    >
                                        <option value="" disabled>-- Selecciona un agente --</option>
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
                                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                        <p className="text-sm text-orange-800">
                                            <strong>Agente seleccionado:</strong> {availableAgents.find(a => a.id === selectedAgentId)?.name || availableAgents.find(a => a.id === selectedAgentId)?.email}
                                        </p>
                                    </div>
                                )}
                                
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => {
                                            setShowTransferModal(false);
                                            setSelectedAgentId("");
                                        }}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => {
                                            console.log('🔥 TRANSFER BUTTON CLICKED IN MODAL');
                                            handleTransferChat();
                                        }}
                                        disabled={!selectedAgentId}
                                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Tag size={20} />
                            Añadir Etiqueta
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Ingresa una etiqueta para categorizar esta conversación:
                        </p>
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                            placeholder="Ej: venta, soporte, queja"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                            autoFocus
                        />
                        <div className="mb-3">
                            <p className="text-sm text-gray-500 mb-2">Etiquetas rápidas:</p>
                            <div className="flex gap-2 flex-wrap">
                                {["venta", "soporte", "queja", "consulta", "urgente"].map((quickTag) => (
                                    <button
                                        key={quickTag}
                                        onClick={() => setNewTag(quickTag)}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                                    >
                                        {quickTag}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowTagModal(false);
                                    setNewTag("");
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddTag}
                                disabled={!newTag.trim()}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
