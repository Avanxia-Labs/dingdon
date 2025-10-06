// src/components/MonitoringPanel.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/providers/SocketContext';
import { ChatRequest, Message, BotConfig } from '@/types/chatbot'; 
import { User, Bot, Eye, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/providers/ThemeProvider';

interface MonitoringPanelProps {
    workspaceId: string;
}

// Estado para el chat que se está viendo en detalle
interface ActiveMonitoringChat {
    sessionId: string;
    messages: Message[];
    botConfig?: BotConfig;
}

export const MonitoringPanel: React.FC<MonitoringPanelProps> = ({ workspaceId }) => {
    const { data: session } = useSession();
    const { socket } = useSocket();
    const router = useRouter();
    const { monitoringChats, setMonitoringChats, removeMonitoringChat, setActiveChat: setGlobalActiveChat, activeBotConfig } = useDashboardStore();
    const { t } = useTranslation();
    const { theme } = useTheme();

    // --- NUEVO ESTADO PARA LA VISTA DETALLADA ---
    const [activeChat, setActiveChat] = useState<ActiveMonitoringChat | null>(null);
    const [showMonitoringList, setShowMonitoringList] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll automático al final del chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChat?.messages]);

    // Fetch inicial de los chats en estado 'bot'
    useEffect(() => {
        if (!workspaceId) return;
        const fetchBotChats = async () => {
            try {
                const response = await fetch(`/api/workspaces/${workspaceId}/bot-chats`);
                const chats = await response.json();
                setMonitoringChats(chats);
            } catch (error) {
                console.error("Failed to fetch bot chats:", error);
            }
        };
        fetchBotChats();
    }, [workspaceId, setMonitoringChats]);

    // Lógica para la intervención del agente
    const handleIntervene = (sessionId: string) => {
        if (socket && session?.user?.id) {
            // a. Obtenemos el historial del chat que ya tenemos en la vista activa.
            //    Si no hay un chat activo seleccionado, no podemos intervenir.
            if (activeChat?.sessionId !== sessionId) {
                alert("Please select a chat to view its history before intervening.");
                return;
            }
            const currentHistory = activeChat.messages;

            // b. Actualizamos el estado global INMEDIATAMENTE.
            //    Esto establece el chat como activo en el store persistente.
            setGlobalActiveChat(sessionId, currentHistory);

            // c. Navegamos al dashboard principal.
            router.push('/dashboard');

            // d. Notificamos al servidor de lo que hemos hecho.
            //    El servidor se encargará de actualizar el estado en la DB
            //    y notificar a otros agentes.
            socket.emit('agent_intervene', {
                workspaceId,
                sessionId,
                agentId: session.user.id
            });
        }
    };

    // Lógica para seleccionar un chat y ver su historial
    const handleSelectChat = async (sessionId: string) => {
        try {
            // Hacemos un fetch al historial completo de la sesión
            const response = await fetch(`/api/chats/${sessionId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to fetch history with status: ${response.status}`);
            }

            const { history } = await response.json();

            // --- LOG #5: ¿QUÉ HISTORIAL MUESTRA EL FETCH INICIAL? ---
            console.log(`[MonitoringPanel] Historial de FETCH para ${sessionId}. Tiene ${history.length} mensajes. Últimos 2:`, JSON.stringify(history.slice(-2).map((m: Message) => ({ role: m.role, content: m.content.slice(0, 20) }))));


            setActiveChat({ sessionId, messages: history });

        } catch (error) {
            console.error("Failed to fetch chat history for monitoring:", error);
        }
    };

    // Listeners de Socket.IO
    useEffect(() => {
        if (!socket) return;

        // --- CORRECCIÓN DE TIPADO ---
        const handleRemoveFromMonitoring = ({ sessionId }: { sessionId: string }) => {
            removeMonitoringChat(sessionId);
            // Si el chat removido era el que estábamos viendo, limpiamos la vista
            if (activeChat?.sessionId === sessionId) {
                setActiveChat(null);
            }
        };

        // --- CORRECCIÓN DE TIPADO ---
        const handleBotChatUpdate = (updatedChat: ChatRequest) => {

            // --- LOG #6: ¿QUÉ MENSAJES LLEGAN POR SOCKET? ---
            console.log(`[MonitoringPanel] Evento 'bot_chat_updated' recibido para ${updatedChat.sessionId}. Último mensaje:`, JSON.stringify({ role: updatedChat.initialMessage.role, content: updatedChat.initialMessage.content.slice(0, 20) }));

            useDashboardStore.setState(state => {
                const existingChatIndex = state.monitoringChats.findIndex(c => c.sessionId === updatedChat.sessionId);
                let newChats = [...state.monitoringChats];
                if (existingChatIndex > -1) {
                    newChats[existingChatIndex] = updatedChat;
                } else {
                    newChats = [...state.monitoringChats, updatedChat];
                }
                return { monitoringChats: newChats };
            });

            // Si el chat actualizado es el que estamos viendo, actualizamos los mensajes
            if (activeChat?.sessionId === updatedChat.sessionId) {
                // Para obtener el historial completo, tendríamos que hacer otro fetch
                // o el servidor debería enviar el historial completo en el evento.
                // Por ahora, solo actualizamos el último mensaje en la lista.
                handleSelectChat(updatedChat.sessionId);
            }
        };

        socket.on('remove_from_monitoring', handleRemoveFromMonitoring);
        socket.on('bot_chat_updated', handleBotChatUpdate);

        return () => {
            socket.off('remove_from_monitoring', handleRemoveFromMonitoring);
            socket.off('bot_chat_updated', handleBotChatUpdate);
        };
    }, [socket, removeMonitoringChat, activeChat?.sessionId]);

    // Paleta de colores para modo claro y oscuro
    const mainBg = theme === 'dark' ? 'bg-[#192229]' : 'bg-[#FBFBFE]';
    const sidebarBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const borderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-[#EFF3F5]';
    const textPrimary = theme === 'dark' ? 'text-[#EFF3F5]' : 'text-[#2A3B47]';
    const textSecondary = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const textLight = theme === 'dark' ? 'text-[#A0A7AC]' : 'text-[#A0A7AC]';
    const cardBg = theme === 'dark' ? 'bg-[#2a3b47]' : 'bg-gray-100';
    const cardHoverBg = theme === 'dark' ? 'hover:bg-[#3a4b57]' : 'hover:bg-gray-200';
    const activeChatBg = theme === 'dark' ? 'bg-[#52A5E0]' : 'bg-blue-600';
    const headerBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-white';
    const userMsgBg = theme === 'dark' ? 'bg-[#2a3b47]' : 'bg-gray-200';
    const userMsgText = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const botMsgBg = theme === 'dark' ? 'bg-gray-700' : 'bg-slate-700';
    const avatarBg = theme === 'dark' ? 'bg-[#2a3b47]' : 'bg-gray-200';
    const avatarBorder = theme === 'dark' ? 'border-[#3a4b57]' : 'border-gray-300';
    const buttonGreen = theme === 'dark' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600';

    return (
        <div className="flex h-full relative">
            {/* Botón móvil para abrir la lista de monitoreo */}
            <button
                onClick={() => setShowMonitoringList(!showMonitoringList)}
                className={`lg:hidden fixed bottom-8 right-2 z-40 p-3 rounded-full shadow-lg ${
                    theme === 'dark' ? 'bg-[#52A5E0] hover:bg-[#4090C8]' : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-all duration-200`}
            >
                {showMonitoringList ? <X className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                {monitoringChats.length > 0 && !showMonitoringList && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                        {monitoringChats.length}
                    </span>
                )}
            </button>

            {/* Overlay móvil */}
            {showMonitoringList && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setShowMonitoringList(false)}
                />
            )}

            {/* Columna Izquierda: Lista de Chats en Monitoreo */}
            <div className={`${
                showMonitoringList 
                    ? 'fixed inset-y-0 left-0 z-40 w-80 sm:w-96' 
                    : 'hidden lg:block lg:relative lg:w-1/4'
                } border-r ${borderColor} ${sidebarBg} flex flex-col transition-all duration-300`}>
                <div className="p-4 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-lg sm:text-xl font-bold ${textPrimary}`}>
                            {t('monitoringPanel.title')} ({monitoringChats.length})
                        </h2>
                        <button
                            onClick={() => setShowMonitoringList(false)}
                            className={`lg:hidden p-1 rounded ${theme === 'dark' ? 'hover:bg-[#2a3b47]' : 'hover:bg-gray-200'}`}
                        >
                            <X className={`w-5 h-5 ${textPrimary}`} />
                        </button>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto">
                        {monitoringChats.map(chat => (
                            <div
                                key={chat.sessionId}
                                onClick={() => {
                                    handleSelectChat(chat.sessionId);
                                    setShowMonitoringList(false);
                                }}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                    activeChat?.sessionId === chat.sessionId 
                                    ? activeChatBg + ' text-white' 
                                    : cardBg + ' ' + cardHoverBg
                                }`}
                            >
                                <p className={`font-semibold ${
                                    activeChat?.sessionId === chat.sessionId ? 'text-white' : textPrimary
                                }`}>
                                    {t('monitoringPanel.sessionLabel')} {chat.sessionId.slice(-6)}
                                </p>
                                <p className={`text-sm truncate ${
                                    activeChat?.sessionId === chat.sessionId ? 'text-white/90' : textSecondary
                                }`}>
                                    {t('monitoringPanel.lastMessageLabel')} {chat.initialMessage.content}
                                </p>
                            </div>
                        ))}
                        {monitoringChats.length === 0 && <p className={textSecondary}>{t('monitoringPanel.noChats')}</p>}
                    </div>
                </div>
            </div>

            {/* Columna Derecha: Vista del Chat Activo */}
            <div className={`flex-1 flex flex-col ${mainBg} ${theme === 'dark' ? '' : ''}`}>
                {activeChat ? (
                    <>
                        <div className={`p-4 border-b ${borderColor} ${headerBg} flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3`}>
                            <h3 className={`text-base sm:text-lg font-bold ${textPrimary}`}>
                                {t('monitoringPanel.activeChatTitle')} {activeChat.sessionId.slice(-6)}
                            </h3>
                            <button
                                onClick={() => handleIntervene(activeChat.sessionId)}
                                className={`px-3 py-1.5 sm:py-1 text-white rounded text-sm transition-colors w-full sm:w-auto ${buttonGreen}`}
                            >
                                {t('monitoringPanel.interveneButton')}
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 sm:space-y-6">
                            {activeChat.messages.map((msg) => (
                                <div key={msg.id} className={`flex items-start gap-2 sm:gap-3 ${msg.role === 'assistant' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'user' && (
                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 border ${avatarBg} ${avatarBorder}`}>
                                            <User className={`w-full h-full p-1 sm:p-1.5 ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            }`} />
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] sm:max-w-[70%] px-3 py-3 sm:px-4 sm:py-4 rounded-xl ${
                                        msg.role === 'assistant' 
                                        ? botMsgBg + ' text-white' 
                                        : userMsgBg + ' ' + userMsgText
                                    }`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                    {msg.role === 'assistant' && (
                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 border ${avatarBg} ${avatarBorder}`}>
                                        {/* <Bot className="w-full h-full text-gray-500 p-1.5" /> */}
                                        <img
                                            src={activeBotConfig?.avatarUrl || '/default-bot-avatar.png'}
                                            alt={activeBotConfig?.name || 'Bot'}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full p-4">
                        <p className={`text-lg sm:text-xl ${textSecondary} text-center`}>{t('monitoringPanel.selectPrompt')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};