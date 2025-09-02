// src/components/MonitoringPanel.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/providers/SocketContext';
import { ChatRequest, Message, BotConfig } from '@/types/chatbot'; // Importa los tipos necesarios
import { User, Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

    // --- NUEVO ESTADO PARA LA VISTA DETALLADA ---
    const [activeChat, setActiveChat] = useState<ActiveMonitoringChat | null>(null);
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
        <div className="flex h-full">
            {/* Columna Izquierda: Lista de Chats en Monitoreo */}
            <div className="w-1/3 border-r bg-white p-4 flex flex-col lg:w-1/4">
                <h2 className="text-xl font-bold mb-4">Bot Conversations ({monitoringChats.length})</h2>
                <div className="space-y-2 flex-1 overflow-y-auto">
                    {monitoringChats.map(chat => (
                        <div
                            key={chat.sessionId}
                            onClick={() => handleSelectChat(chat.sessionId)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${activeChat?.sessionId === chat.sessionId ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                        >
                            <p className="font-semibold">Session: {chat.sessionId.slice(-6)}</p>
                            <p className="text-sm truncate">Last: {chat.initialMessage.content}</p>
                        </div>
                    ))}
                    {monitoringChats.length === 0 && <p className="text-gray-500">No active bot chats.</p>}
                </div>
            </div>

            {/* Columna Derecha: Vista del Chat Activo */}
            <div className="flex-1 flex flex-col bg-gray-50">
                {activeChat ? (
                    <>
                        <div className="p-4 border-b bg-white flex justify-between items-center">
                            <h3 className="text-lg font-bold">Monitoring Session: {activeChat.sessionId.slice(-6)}</h3>
                            <button
                                onClick={() => handleIntervene(activeChat.sessionId)}
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                            >
                                Intervene
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {activeChat.messages.map((msg) => (
                                <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'assistant' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'user' && <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 border"><User className="w-full h-full text-gray-500 p-1.5" /></div>}
                                    <div className={`max-w-[70%] px-4 py-2 rounded-xl ${msg.role === 'assistant' ? "bg-slate-700 text-white" : "bg-gray-200 text-gray-800"}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                    {msg.role === 'assistant' && <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 border">
                                        {/* <Bot className="w-full h-full text-gray-500 p-1.5" /> */}
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
                        <p className="text-xl text-gray-500">Select a conversation to monitor.</p>
                    </div>
                )}
            </div>
        </div>
    );
};