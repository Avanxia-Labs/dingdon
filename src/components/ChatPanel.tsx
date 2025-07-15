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



'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Message } from '@/types/chatbot';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/providers/SocketContext';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSyncLanguage } from '@/hooks/useSyncLanguage';
import { Send, Wifi, WifiOff, RefreshCcw } from 'lucide-react';

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

    const { requests, activeChat, setActiveChat, addMessageToActiveChat, closeActiveChat } = useDashboardStore();

    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;
        const handleConnect = () => { setIsConnected(true); setIsReconnecting(false); };
        const handleDisconnect = () => setIsConnected(false);
        const handleReconnecting = () => setIsReconnecting(true);
        const handleReconnect = () => { setIsConnected(true); setIsReconnecting(false); if (activeChat?.sessionId) socket.emit('join_session', activeChat.sessionId); };
        const handleHeartbeat = (data: { timestamp: number }) => socket.emit('heartbeat_response', data);
        
        setIsConnected(socket.connected);
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('reconnecting', handleReconnecting);
        socket.on('reconnect', handleReconnect);
        socket.on('heartbeat', handleHeartbeat);
        return () => { socket.off('connect', handleConnect); socket.off('disconnect', handleDisconnect); socket.off('reconnecting', handleReconnecting); socket.off('reconnect', handleReconnect); socket.off('heartbeat', handleHeartbeat); };
    }, [socket, activeChat?.sessionId]);

    useEffect(() => {
        if (!socket) return;
        const handleAssignmentSuccess = ({ sessionId, history }: { sessionId: string; history: Message[] }) => setActiveChat(sessionId, history);
        const handleAssignmentFailure = ({ message }: { message: string }) => alert(message);
        socket.on('assignment_success', handleAssignmentSuccess);
        socket.on('assignment_failure', handleAssignmentFailure);
        return () => { socket.off('assignment_success', handleAssignmentSuccess); socket.off('assignment_failure', handleAssignmentFailure); };
    }, [socket, setActiveChat]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeChat?.messages]);
    useEffect(() => { if (socket && activeChat?.sessionId && isConnected) { socket.emit('join_session', activeChat.sessionId); } }, [socket, activeChat?.sessionId, isConnected]);

    const handleSelectChat = (request: ChatRequest) => { if (socket && workspaceId && session?.user?.id && isConnected) { socket.emit('agent_joined', { workspaceId, sessionId: request.sessionId, agentId: session.user.id }); } };
    const handleSendMessage = () => { if (!input.trim() || !activeChat?.sessionId || !socket || !workspaceId || !isConnected) return; const agentMessage: Message = { id: `agent-${Date.now()}`, content: input, role: 'agent', agentName: session?.user?.name || 'Support', timestamp: new Date() }; socket.emit('agent_message', { workspaceId, sessionId: activeChat.sessionId, message: agentMessage }); addMessageToActiveChat(agentMessage); setInput(''); };
    const handleCloseChat = () => { if (!activeChat?.sessionId || !socket || !workspaceId || !isConnected) return; socket.emit('close_chat', { workspaceId, sessionId: activeChat.sessionId }); closeActiveChat(); };
    const forceReconnect = () => { if (socket) { socket.disconnect(); socket.connect(); } };

    return (
        <div className="flex h-full relative">
            {!notificationsEnabled && (<div className="absolute top-4 right-4 bg-yellow-100 border-yellow-300 text-yellow-800 p-3 rounded-lg shadow-md z-10"><p className="font-semibold">{t('chatPanel.notifications.title')}</p><p className="text-sm mb-2">{t('chatPanel.notifications.description')}</p><button onClick={enableNotifications} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">{t('chatPanel.notifications.button')}</button></div>)}
            <div className="w-1/3 border-r bg-white p-4 flex flex-col lg:w-1/4">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm mb-2 ${isConnected ? 'bg-green-100 text-green-800' : isReconnecting ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{isConnected ? (<><Wifi size={16} className='mr-2' /><span>{t('chatPanel.connection.connected')}</span></>) : isReconnecting ? (<><WifiOff size={16} className="animate-pulse mr-2" /><span>{t('chatPanel.connection.reconnecting')}</span></>) : (<div className='flex flex-row items-center justify-between w-full'><div className='flex flex-row items-center gap-2'><WifiOff size={16} /><span>{t('chatPanel.connection.disconnected')}</span></div><button onClick={forceReconnect} className="ml-1 px-1 py-0.5 text-red-800 rounded-full text-xs hover:bg-red-300" title={t('chatPanel.connection.reconnect')}><RefreshCcw size={16} /></button></div>)}</div>
                <h2 className="text-xl font-bold mb-4">{t('chatPanel.requestsTitle')}</h2>
                <div className="space-y-2 flex-1 overflow-y-auto">{requests.map(req => (<div key={req.sessionId} onClick={() => handleSelectChat(req)} className={`p-3 rounded-lg cursor-pointer transition-colors ${activeChat?.sessionId === req.sessionId ? 'bg-blue-600 text-white' : isConnected ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-50 cursor-not-allowed opacity-50'}`}><p className="font-semibold">Session: {req.sessionId.slice(-6)}</p><p className="text-sm truncate">{req.initialMessage.content}</p></div>))}{requests.length === 0 && (<p className="text-gray-500 text-sm mt-2">{t('chatPanel.noRequests')}</p>)}</div>
            </div>
            <div className="flex-1 flex flex-col bg-gray-50">
                {activeChat && activeChat.status === 'in_progress' ? (
                    <>
                        <div className="p-4 border-b bg-white flex justify-between items-center"><h3 className="text-lg font-bold">{t('chatPanel.activeChatTitle', { id: activeChat.sessionId.slice(-6) })}</h3><button onClick={handleCloseChat} disabled={!isConnected} className={`px-3 py-1 rounded-lg text-sm ${isConnected ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>{t('chatPanel.closeChatButton')}</button></div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">{activeChat.messages.map(msg => { const isOutgoing = msg.role === 'agent' || msg.role === 'assistant'; return (<div key={msg.id} className={`flex items-end gap-2 ${isOutgoing ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[70%] px-4 py-2 rounded-xl ${isOutgoing ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}><p className="text-sm whitespace-pre-wrap">{msg.content}</p></div></div>);})}<div ref={messagesEndRef} /></div>
                        <div className="p-4 bg-white border-t"><div className="flex space-x-2"><input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} disabled={!isConnected} className={`flex-1 p-2 border rounded-lg ${isConnected ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50 cursor-not-allowed'}`} placeholder={isConnected ? t('chatPanel.inputPlaceholder') : t('chatPanel.inputPlaceholderDisconnected')}/><button onClick={handleSendMessage} disabled={!isConnected || !input.trim()} className={`px-4 py-2 rounded-lg ${isConnected && input.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}><Send size={18} /></button></div></div>
                    </>
                ) : (<div className="flex items-center justify-center h-full"><p className="text-xl text-gray-500">{activeChat?.status === 'closed' ? t('chatPanel.chatClosed') : t('chatPanel.selectChatPrompt')}</p></div>)}
            </div>
        </div>
    );
};