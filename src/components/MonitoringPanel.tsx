// src/components/MonitoringPanel.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/providers/SocketContext';
import { ChatRequest, Message, BotConfig } from '@/types/chatbot';
import { User, Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/providers/ThemeProvider';
import { useSyncLanguage } from '@/hooks/useSyncLanguage';

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
    const { t } = useTranslation();
    const { data: session } = useSession();
    const { socket } = useSocket();
    const router = useRouter();
    const { theme } = useTheme();
    const { monitoringChats, setMonitoringChats, removeMonitoringChat, setActiveChat: setGlobalActiveChat, activeBotConfig, language } = useDashboardStore();
    useSyncLanguage(language);

    // --- NUEVO ESTADO PARA LA VISTA DETALLADA ---
    const [activeChat, setActiveChat] = useState<ActiveMonitoringChat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Paleta de colores
    const mainBg = theme === 'dark' ? 'bg-[#192229]' : 'bg-[#FBFBFE]';
    const sidebarBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const borderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-[#EFF3F5]';
    const textPrimary = theme === 'dark' ? 'text-[#EFF3F5]' : 'text-[#2A3B47]';
    const textSecondary = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const cardBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const cardHoverBg = theme === 'dark' ? 'hover:bg-[#2a3b47]' : 'hover:bg-[#EFF3F5]';
    const activeChatBg = theme === 'dark' ? 'bg-[#52A5E0]' : 'bg-[#1083D3]';
    const userMsgBg = theme === 'dark' ? 'bg-[#2a3b47]' : 'bg-[#EFF3F5]';
    const userMsgText = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const botMsgBg = theme === 'dark' ? 'bg-[#52A5E0]' : 'bg-[#1083D3]';

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
                alert(t("monitoring.selectChatFirst"));
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

    return (
        <div className={`flex h-full ${mainBg}`}>
            {/* Columna Izquierda: Lista de Chats en Monitoreo */}
            <div className={`w-1/3 border-r p-4 flex flex-col lg:w-1/4 ${sidebarBg} ${borderColor}`}>
                <h2 className={`text-xl font-bold mb-4 ${textPrimary}`}>{t("monitoring.title")} ({monitoringChats.length})</h2>
                <div className="space-y-2 flex-1 overflow-y-auto">
                    {monitoringChats.map(chat => (
                        <div
                            key={chat.sessionId}
                            onClick={() => handleSelectChat(chat.sessionId)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${activeChat?.sessionId === chat.sessionId ? `${activeChatBg} text-white` : `${cardBg} ${cardHoverBg} ${textPrimary}`}`}
                        >
                            <p className="font-semibold">{t("monitoring.sessionLabel")}: {chat.sessionId.slice(-6)}</p>
                            <p className="text-sm truncate">{t("monitoring.lastMessage")}: {chat.initialMessage.content}</p>
                        </div>
                    ))}
                    {monitoringChats.length === 0 && <p className={textSecondary}>{t("monitoring.noActiveChats")}</p>}
                </div>
            </div>

            {/* Columna Derecha: Vista del Chat Activo */}
            <div className={`flex-1 flex flex-col ${mainBg}`}>
                {activeChat ? (
                    <>
                        <div className={`p-4 border-b flex justify-between items-center ${sidebarBg} ${borderColor}`}>
                            <h3 className={`text-lg font-bold ${textPrimary}`}>{t("monitoring.monitoringSession")}: {activeChat.sessionId.slice(-6)}</h3>
                            <button
                                onClick={() => handleIntervene(activeChat.sessionId)}
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                            >
                                {t("monitoring.interveneButton")}
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {activeChat.messages.map((msg) => (
                                <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'assistant' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'user' && <div className={`w-10 h-10 rounded-full flex-shrink-0 border ${theme === 'dark' ? 'bg-[#2a3b47] border-[#3a4b57]' : 'bg-[#EFF3F5] border-gray-300'}`}><User className={`w-full h-full p-1.5 ${textSecondary}`} /></div>}
                                    <div className={`max-w-[70%] px-4 py-2 rounded-xl ${msg.role === 'assistant' ? `${botMsgBg} text-white` : `${userMsgBg} ${userMsgText} border ${theme === 'dark' ? 'border-[#3a4b57]' : 'border-gray-300'}`}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                    {msg.role === 'assistant' && <div className={`w-10 h-10 rounded-full flex-shrink-0 border ${theme === 'dark' ? 'bg-[#2a3b47] border-[#3a4b57]' : 'bg-[#EFF3F5] border-gray-300'}`}>
                                        <img
                                            src={activeBotConfig?.avatarUrl || '/default-bot-avatar.png'}
                                            alt={activeBotConfig?.name || 'Bot'}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className={`text-xl ${textSecondary}`}>{t("monitoring.selectPrompt")}</p>
                    </div>
                )}
            </div>
        </div>
    );
};