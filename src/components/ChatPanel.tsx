// app/dashboard/components/ChatPanel.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ChatSessionStatus, Message } from "@/types/chatbot";
import { useSession } from "next-auth/react";
import { useSocket } from "@/providers/SocketContext";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { useSyncLanguage } from "@/hooks/useSyncLanguage";
import { Send, Wifi, WifiOff, RefreshCcw, User, Bot, Play, Pause, Users, FileText, Loader2, MessageSquare, X } from "lucide-react";
import { useTheme } from '@/providers/ThemeProvider';


interface ChatRequest {
    sessionId: string;
    initialMessage: Message;
}

interface ChatPanelProps {
    workspaceId: string;
}

interface BotConfig {
    name?: string;
    avatarUrl?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ workspaceId }) => {
    const { t } = useTranslation();
    const { data: session } = useSession();
    const { socket, notificationsEnabled, enableNotifications } = useSocket();
    const { language } = useDashboardStore();
    useSyncLanguage(language);
    const { theme } = useTheme();

    const {
        requests,
        assignedChats,
        activeChat,
        setActiveChat,
        addMessageToActiveChat,
        closeActiveChat,
        activeBotConfig,
        setActiveBotConfig,
        clearActiveChatView,
        updateActiveChatStatus,
        addRequest,
        removeAssignedChat
    } = useDashboardStore();

    const [input, setInput] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [isMobileChatListOpen, setIsMobileChatListOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [summaryText, setSummaryText] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [showNotificationPopup, setShowNotificationPopup] = useState(true);

    // useEffect para hacer el fetch inicial de los chats pendientes al cargar el componente.
    useEffect(() => {
        if (!workspaceId) return;

        const fetchInitialPendingChats = async () => {
            try {
                const response = await fetch(`/api/workspaces/${workspaceId}/pending-chats`);

                if (!response.ok) {
                    throw new Error(`Error fetching pending chats: ${response.statusText}`);
                }

                const initialChats: ChatRequest[] = await response.json();

                // Aquí actualizamos el estado global con las solicitudes obtenidas
                initialChats.forEach(chat => {
                    addRequest(chat);
                });

            } catch (error) {
                console.error("Could not fetch initial pending chats:", error);
            }
        }

        fetchInitialPendingChats();

    }, [workspaceId, addRequest]);

    useEffect(() => {
        if (!socket) return;
        const handleSummaryReceived = ({ sessionId, summary }: { sessionId: string; summary: string }) => {
            if (activeChat?.sessionId === sessionId) {
                setSummaryText(summary);
                setIsSummarizing(false);
            }
        };
        const handleCommandError = ({ message }: { message: string }) => {
            console.error('[ChatPanel] Error recibido del servidor:', message);
            if (isSummarizing) {
                setSummaryText(`Error: ${message || 'No se pudo generar el resumen.'}`);
                setIsSummarizing(false);
            }
        };
        socket.on('summary_received', handleSummaryReceived);
        socket.on('command_error', handleCommandError);
        return () => {
            socket.off('summary_received', handleSummaryReceived);
            socket.off('command_error', handleCommandError);
        };
    }, [socket, activeChat?.sessionId, isSummarizing]);


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

        console.log("[ChatPanel] Registrando listener para 'assignment_success'...");

        const handleAssignmentSuccess = ({
            sessionId,
            history,
            botConfig
        }: {
            sessionId: string;
            history: Message[];
            botConfig: BotConfig
        }) => {
            console.log(`[ChatPanel] ¡EVENTO 'assignment_success' RECIBIDO! Para la sesión: ${sessionId}`);
            setActiveChat(sessionId, history);
            setActiveBotConfig(botConfig);
        };

        const handleAssignmentFailure = ({ message }: { message: string }) =>
            alert(message);
        socket.on("assignment_success", handleAssignmentSuccess);
        socket.on("assignment_failure", handleAssignmentFailure);
        return () => {
            console.log("[ChatPanel] Limpiando listener de 'assignment_success'.");
            socket.off("assignment_success", handleAssignmentSuccess);
            socket.off("assignment_failure", handleAssignmentFailure);
        };
    }, [socket, setActiveChat, setActiveBotConfig]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChat?.messages]);


    useEffect(() => {
        if (socket && activeChat?.sessionId && isConnected) {
            socket.emit("join_session", activeChat.sessionId);
        }
    }, [socket, activeChat?.sessionId, isConnected]);


    useEffect(() => {
        if (!socket) return;

        const handleStatusChange = ({ sessionId, newStatus }: { sessionId: string, newStatus: ChatSessionStatus }) => {
            if (activeChat?.sessionId === sessionId) {
                // Actualiza el estado en la UI cuando el servidor confirma el cambio
                updateActiveChatStatus(newStatus);
            }
        };

        socket.on('session_status_changed', handleStatusChange);

        return () => {
            socket.off('session_status_changed', handleStatusChange);
        };
    }, [socket, activeChat?.sessionId, updateActiveChatStatus]);

    const handleSelectChat = (request: ChatRequest, isAlreadyAssigned: boolean = false) => {
        if (socket && workspaceId && session?.user?.id && isConnected) {
            // Si el chat ya está asignado, solo cambiamos la vista activa
            if (isAlreadyAssigned) {
                // Solo emitir agent_joined para unirse a la sala del socket
                socket.emit("agent_joined", {
                    workspaceId,
                    sessionId: request.sessionId,
                    agentId: session.user.id,
                });
            } else {
                // Es un chat nuevo de la lista de requests
                socket.emit("agent_joined", {
                    workspaceId,
                    sessionId: request.sessionId,
                    agentId: session.user.id,
                });
            }
        }
    };

    const handleSendMessage = () => {
        if (
            !input.trim() ||
            !activeChat?.sessionId ||
            !socket ||
            !workspaceId ||
            !isConnected
        )
            return;
        const agentMessage: Message = {
            id: `agent-${Date.now()}`,
            content: input,
            role: "agent",
            agentName: session?.user?.name || "Support",
            timestamp: new Date(),
            avatarUrl: session?.user?.image || undefined,
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
        // Remover el chat de la lista de asignados
        removeAssignedChat(activeChat.sessionId);
        closeActiveChat();
    };

    const forceReconnect = () => {
        if (socket) {
            socket.disconnect();
            socket.connect();
        }
    };

    const handleToggleBotStatus = () => {
        if (socket && activeChat) {
            console.log(`[ChatPanel] Emitiendo toggle_bot_status para sesión ${activeChat.sessionId}`);
            socket.emit('toggle_bot_status', {
                workspaceId,
                sessionId: activeChat.sessionId
            });
        }
    };

    // --- Funcion para el boton de transferir chat ---
    const handleTransferToQueue = () => {
        if (socket && activeChat) {
            socket.emit('transfer_to_queue', {
                workspaceId,
                sessionId: activeChat.sessionId
            });
            // Cerramos la vista del chat para el agente actual.
            clearActiveChatView();
        }
    };

    const handleGetSummary = () => {
        if (socket && activeChat) {
            setSummaryText(''); // Limpia el resumen anterior
            setIsSummarizing(true);
            setIsSummaryModalOpen(true);
            socket.emit('get_summary', { workspaceId, sessionId: activeChat.sessionId, language: language });

            // Timeout de seguridad: Si no recibe respuesta en 60 segundos, mostrar error
            setTimeout(() => {
                if (isSummarizing) {
                    console.warn('[ChatPanel] Timeout al esperar el resumen');
                    setSummaryText('Error: La generación del resumen está tardando más de lo esperado. Por favor, intenta de nuevo.');
                    setIsSummarizing(false);
                }
            }, 60000); // 60 segundos
        }
    };


    console.log("ACTIVE BOT CONFIG", activeBotConfig);

    // Paleta de colores exacta proporcionada
    const mainBg = theme === 'dark' ? 'bg-[#192229]' : 'bg-[#FBFBFE]';
    const sidebarBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const sidebarBorderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-[#EFF3F5]';
    const cardBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const cardHoverBg = theme === 'dark' ? 'hover:bg-[#2a3b47]' : 'hover:bg-[#EFF3F5]';
    const activeChatBg = theme === 'dark' ? 'bg-[#52A5E0]' : 'bg-[#1083D3]';
    const textPrimary = theme === 'dark' ? 'text-[#EFF3F5]' : 'text-[#2A3B47]';
    const textSecondary = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const textLight = theme === 'dark' ? 'text-[#A0A7AC]' : 'text-[#A0A7AC]';
    const inputBg = theme === 'dark' ? 'bg-[#212E36] border-[#2a3b47]' : 'bg-[#FFFFFF] border-[#EFF3F5]';
    const inputDisabledBg = theme === 'dark' ? 'bg-[#192229] border-[#2a3b47]' : 'bg-[#FBFBFE] border-[#EFF3F5]';
    const modalBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const modalTextColor = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const buttonCloseBg = theme === 'dark' ? 'hover:bg-[#2a3b47]' : 'hover:bg-[#EFF3F5]';
    const userMsgBg = theme === 'dark' ? 'bg-[#2a3b47]' : 'bg-[#EFF3F5]';
    const userMsgText = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const agentBotMsgBg = theme === 'dark' ? 'bg-[#52A5E0]' : 'bg-[#1083D3]';

    return (
        <div className={`flex h-full relative ${mainBg}`}>
            {!notificationsEnabled && showNotificationPopup && (
                <div className={`absolute top-4 right-4 p-3 rounded-lg shadow-md z-10 border max-w-xs ${theme === 'dark' ? 'bg-amber-900 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                    <button
                        onClick={() => setShowNotificationPopup(false)}
                        className={`absolute top-1 right-1 p-1 rounded ${theme === 'dark' ? 'hover:bg-amber-800' : 'hover:bg-amber-100'}`}
                    >
                        <X size={14} />
                    </button>
                    <p className="font-semibold">{t("chatPanel.notifications.title")}</p>
                    <p className="text-sm mb-2">
                        {t("chatPanel.notifications.description")}
                    </p>
                    <button
                        onClick={enableNotifications}
                        className={`px-3 py-1 rounded text-sm ${theme === 'dark' ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                    >
                        {t("chatPanel.notifications.button")}
                    </button>
                </div>
            )}

            {/* Chat Requests y Connection */}
            <div className={`w-1/3 border-r p-4 flex flex-col lg:w-1/4 ${sidebarBg} ${sidebarBorderColor}`}>
                <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm mb-2 ${isConnected
                        ? theme === 'dark' ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
                        : isReconnecting
                            ? theme === 'dark' ? "bg-yellow-900 text-yellow-200" : "bg-yellow-100 text-yellow-800"
                            : theme === 'dark' ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800"
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
                                className={`ml-1 px-1 py-0.5 rounded-full text-xs ${theme === 'dark' ? 'text-red-200 hover:bg-red-800' : 'text-red-800 hover:bg-red-300'}`}
                                title={t("chatPanel.connection.reconnect")}
                            >
                                <RefreshCcw size={16} />
                            </button>
                        </div>
                    )}
                </div>
                <h2 className={`text-xl font-bold mb-4 ${textPrimary}`}>
                    {t("chatPanel.requestsTitle")}
                </h2>
                <div className="space-y-4 flex-1 overflow-y-auto">
                    {/* Chats asignados al agente */}
                    {assignedChats.length > 0 && (
                        <div>
                            <h3 className={`text-sm font-semibold mb-2 ${textSecondary}`}>My Chats</h3>
                            <div className="space-y-2">
                                {assignedChats.map((req) => (
                                    <div
                                        key={req.sessionId}
                                        onClick={() => handleSelectChat(req, true)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors

                                            ${req.isTransfer ? 'border-2 border-orange-400' : ''}

                                            ${activeChat?.sessionId === req.sessionId
                                                ? `${activeChatBg} text-white`
                                                : isConnected
                                                    ? `${cardBg} ${cardHoverBg} ${textPrimary}`
                                                    : `${cardBg} cursor-not-allowed opacity-50 ${textPrimary}`
                                            }`}
                                    >
                                        <p className="font-semibold">
                                            Session: {req.sessionId.slice(-6)}
                                        </p>
                                        {req.isTransfer && <p className="text-xs font-bold text-orange-600">TRANSFER</p>}
                                        <p className="text-sm truncate">{req.initialMessage.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Solicitudes pendientes */}
                    {requests.length > 0 && (
                        <div>
                            <h3 className={`text-sm font-semibold mb-2 ${textSecondary}`}>Pending Requests</h3>
                            <div className="space-y-2">
                                {requests.map((req) => (
                                    <div
                                        key={req.sessionId}
                                        onClick={() => handleSelectChat(req, false)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors

                                            ${req.isTransfer ? 'border-2 border-orange-400' : ''}

                                            ${activeChat?.sessionId === req.sessionId
                                                ? `${activeChatBg} text-white`
                                                : isConnected
                                                    ? `${cardBg} ${cardHoverBg} ${textPrimary}`
                                                    : `${cardBg} cursor-not-allowed opacity-50 ${textPrimary}`
                                            }`}
                                    >
                                        <p className="font-semibold">
                                            Session: {req.sessionId.slice(-6)}
                                        </p>
                                        {req.isTransfer && <p className="text-xs font-bold text-orange-600">TRANSFER</p>}
                                        <p className="text-sm truncate">{req.initialMessage.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {requests.length === 0 && assignedChats.length === 0 && (
                        <p className={`text-sm mt-2 ${textSecondary}`}>
                            {t("chatPanel.noRequests")}
                        </p>
                    )}
                </div>
            </div>

            {/* CHATS */}
            <div className={`flex-1 flex flex-col ${mainBg}`}>
                {activeChat && ["in_progress", "bot"].includes(activeChat.status) ? (
                    <>
                        <div className={`p-4 border-b flex justify-between items-center ${sidebarBg} ${sidebarBorderColor}`}>
                            <h3 className={`text-lg font-bold ${textPrimary}`}>
                                {t("chatPanel.activeChatTitle", {
                                    id: activeChat.sessionId.slice(-6),
                                })}
                            </h3>

                            {/* --- BOTÓN DE TRANSFERENCIA --- */}
                            <button
                                onClick={handleTransferToQueue}
                                className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm flex items-center gap-1.5"
                            >
                                <Users size={14} />
                                <span>Transfer</span>
                            </button>

                            {/* --- BOTÓN DE PAUSAR/REANUDAR BOT --- */}
                            <button
                                onClick={handleToggleBotStatus} // <-- Llama a la función toggle
                                className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${activeChat.status === 'in_progress'
                                    ? 'bg-green-500 hover:bg-green-600 text-white' // Estilo para "Resume Bot"
                                    : 'bg-yellow-500 hover:bg-yellow-600 text-white' // Estilo para "Pause Bot"
                                    }`}
                            >
                                {activeChat.status === 'in_progress' ? (
                                    <>
                                        <Play size={14} />
                                        <span>Resume Bot</span>
                                    </>
                                ) : (
                                    <>
                                        <Pause size={14} />
                                        <span>Pause Bot</span>
                                    </>
                                )}
                            </button>

                            {/* --- BOTÓN DE RESUMEN --- */}
                            <button
                                onClick={handleGetSummary}
                                className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm flex items-center gap-1.5"
                            >
                                <FileText size={14} />
                                <span>Summarize</span>
                            </button>

                            {/* --- BOTÓN DE CERRAR CHAT --- */}
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

                        <div className="flex-1 p-4 overflow-y-auto space-y-4">

                            {activeChat.messages.map((msg) => {
                                // 1. Determina los roles para facilitar la lectura
                                const isUser = msg.role === 'user';
                                const isAgent = msg.role === 'agent';
                                const isBot = msg.role === 'assistant';

                                // 2. Define si el mensaje es "saliente" (del agente o del bot)
                                const isOutgoing = isAgent || isBot;

                                const isBotAttending = activeChat.status === "bot";

                                return (
                                    <div
                                        key={msg.id}
                                        // 3. La alineación ahora depende de si el mensaje es saliente
                                        className={`flex items-start gap-3 ${isOutgoing ? 'justify-end' : 'justify-start'} ${isBotAttending ? 'opacity-20' : ''}`}
                                    >
                                        {/* --- AVATAR DEL USUARIO (IZQUIERDA) --- */}
                                        {isUser && (
                                            <div className={`w-10 h-10 rounded-full flex-shrink-0 border ${theme === 'dark' ? 'bg-[#2a3b47] border-[#3a4b57]' : 'bg-[#EFF3F5] border-gray-300'}`}>
                                                {/* El usuario no tiene avatar en el panel, así que usamos un ícono genérico */}
                                                <User className={`w-full h-full p-1.5 ${textSecondary}`} />
                                            </div>
                                        )}

                                        {/* --- CUERPO DEL MENSAJE (EN EL MEDIO) --- */}
                                        <div
                                            className={`max-w-[70%] px-4 py-2 rounded-xl ${
                                                isAgent || isBot
                                                    ? `${agentBotMsgBg} text-white`
                                                    : `${userMsgBg} ${userMsgText} border ${theme === 'dark' ? 'border-[#3a4b57]' : 'border-gray-300'}`
                                            }`}
                                        >
                                            {/* Nombre del remitente (si es agente o bot) */}
                                            {isAgent && <p className="text-xs font-bold text-white/80 mb-1">{msg.agentName}</p>}
                                            {isBot && <p className="text-xs font-bold text-white/80 mb-1">{activeBotConfig?.name || 'Bot'}</p>}

                                            {/* Contenido del mensaje */}
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>

                                        {/* --- AVATAR DEL AGENTE O DEL BOT (DERECHA) --- */}
                                        {isOutgoing && (
                                            <div className={`w-10 h-10 rounded-full flex-shrink-0 border ${theme === 'dark' ? 'bg-[#2a3b47] border-[#3a4b57]' : 'bg-[#EFF3F5] border-gray-300'}`}>
                                                {isAgent && (
                                                    msg.avatarUrl ? (
                                                        <img src={msg.avatarUrl} alt={msg.agentName || 'Agent'} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <User className={`w-full h-full p-1.5 ${textSecondary}`} /> // Avatar genérico para el agente
                                                    )
                                                )}
                                                {isBot && (
                                                    // 4. Usa el activeBotConfig para el avatar del bot
                                                    <img src={activeBotConfig?.avatarUrl || '/default-bot-avatar.png'} alt="Bot Avatar" className="w-full h-full rounded-full object-cover" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className={`p-4 border-t ${sidebarBg} ${sidebarBorderColor}`}>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                    disabled={!isConnected || activeChat.status === "bot"}
                                    className={`flex-1 p-2 border rounded-lg ${textPrimary} ${!isConnected || activeChat.status === "bot"
                                        ? `${inputDisabledBg} cursor-not-allowed opacity-20`
                                        : `${inputBg} focus:border-[#52A5E0] focus:outline-none`
                                        }`}
                                    placeholder={
                                        isConnected
                                            ? t("chatPanel.inputPlaceholder")
                                            : t("chatPanel.inputPlaceholderDisconnected")
                                    }
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!isConnected || !input.trim()}
                                    className={`px-4 py-2 rounded-lg ${isConnected && input.trim()
                                        ? `${agentBotMsgBg} text-white hover:opacity-90`
                                        : theme === 'dark' ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className={`text-xl ${textSecondary}`}>
                            {activeChat?.status === "closed"
                                ? t("chatPanel.chatClosed")
                                : t("chatPanel.selectChatPrompt")}
                        </p>
                    </div>
                )}


            </div>

            {/* Modal de Resumen */}
            {isSummaryModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className={`rounded-lg shadow-xl w-full max-w-lg p-6 ${modalBg}`}>
                        <h3 className={`text-lg font-bold mb-4 ${textPrimary}`}>{t("chatPanel.conversationSummary")}</h3>
                        {isSummarizing ? (
                            <div className="flex items-center justify-center h-24">
                                <Loader2 className={`h-8 w-8 animate-spin ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} />
                            </div>
                        ) : (
                            <div className={`text-sm whitespace-pre-wrap max-h-96 overflow-y-auto ${modalTextColor}`}>
                                {summaryText}
                            </div>
                        )}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsSummaryModalOpen(false)}
                                className={`px-4 py-2 rounded-md ${buttonCloseBg} ${textPrimary}`}
                            >
                                {t("chatPanel.close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};












