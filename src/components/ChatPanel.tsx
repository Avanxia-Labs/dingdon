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
        activeChat,
        setActiveChat,
        addMessageToActiveChat,
        closeActiveChat,
        activeBotConfig,
        setActiveBotConfig,
        clearActiveChatView,
        updateActiveChatStatus,
        addRequest,
        isMobileSidebarOpen
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
        socket.on('summary_received', handleSummaryReceived);
        return () => { socket.off('summary_received', handleSummaryReceived); };
    }, [socket, activeChat?.sessionId]);


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

    const handleSelectChat = (request: ChatRequest) => {
        if (socket && workspaceId && session?.user?.id && isConnected) {
            socket.emit("agent_joined", {
                workspaceId,
                sessionId: request.sessionId,
                agentId: session.user.id,
            });
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
                sessionId: activeChat.sessionId,
                agentId: session?.user.id
            });
            // Cerramos la vista del chat para el agente actual.
            clearActiveChatView();
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
                <div className={`absolute top-4 right-4 p-3 rounded-lg shadow-md z-10 border max-w-xs ${
                    theme === 'dark' 
                    ? 'bg-amber-900 border-amber-700 text-amber-200' 
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                    <button
                        onClick={() => setShowNotificationPopup(false)}
                        className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
                            theme === 'dark'
                            ? 'hover:bg-amber-800 text-amber-300'
                            : 'hover:bg-amber-100 text-amber-700'
                        }`}
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                    <p className="font-semibold pr-6">{t("chatPanel.notifications.title")}</p>
                    <p className="text-sm mb-2">
                        {t("chatPanel.notifications.description")}
                    </p>
                    <button
                        onClick={() => {
                            enableNotifications();
                            setShowNotificationPopup(false);
                        }}
                        className={`w-full px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            theme === 'dark'
                            ? 'bg-amber-500 hover:bg-amber-400 text-white'
                            : 'bg-amber-500 hover:bg-amber-600 text-white'
                        }`}
                    >
                        {t("chatPanel.notifications.button")}
                    </button>
                </div>
            )}

            {/* Mobile Chat Toggle Button - Solo visible en móvil cuando hay un chat activo y el sidebar no está abierto */}
            {activeChat && !isMobileSidebarOpen && (
                <button
                    onClick={() => setIsMobileChatListOpen(!isMobileChatListOpen)}
                    className={`md:hidden fixed top-20 left-4 z-30 p-2 rounded-full shadow-lg transition-all duration-300 ${
                        theme === 'dark' 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                    <MessageSquare size={20} />
                    {requests.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {requests.length}
                        </span>
                    )}
                </button>
            )}

            {/* Mobile Chat List Overlay */}
            {isMobileChatListOpen && (
                <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setIsMobileChatListOpen(false)} />
            )}

            {/* Chat Requests Sidebar - Responsive */}
            <div className={`
                ${isMobileChatListOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:relative md:w-1/3 lg:w-1/4
                fixed top-16 md:top-0 left-0 bottom-0 w-64 sm:w-72
                border-r-2 ${sidebarBorderColor} ${sidebarBg}
                p-4 flex flex-col z-25 md:z-0
                transition-transform duration-300 ease-in-out
                ${theme === 'dark' ? 'md:shadow-xl md:shadow-black/50' : 'md:shadow-lg md:shadow-gray-200/50'}
            `}>
                <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm mb-2 ${
                        isConnected
                            ? theme === 'dark' ? "bg-green-900 text-green-400" : "bg-green-50 text-green-600"
                            : isReconnecting
                                ? theme === 'dark' ? "bg-amber-900 text-amber-400" : "bg-amber-50 text-amber-600"
                                : theme === 'dark' ? "bg-red-900 text-red-400" : "bg-red-50 text-red-600"
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
                                className={`ml-1 px-1 py-0.5 rounded-full text-xs ${
                                    theme === 'dark'
                                    ? 'text-red-400 hover:bg-red-900'
                                    : 'text-red-600 hover:bg-red-100'
                                }`}
                                title={t("chatPanel.connection.reconnect")}
                            >
                                <RefreshCcw size={16} />
                            </button>
                        </div>
                    )}
                </div>
                <h2 className={`text-xl font-bold mb-2 hidden md:block ${textPrimary}`}>
                    {t("chatPanel.requestsTitle")}
                </h2>
                <div className="space-y-2 flex-1 overflow-y-auto">
                    {requests.map((req) => {
                        const isActive = activeChat?.sessionId === req.sessionId;
                        const isTransfer = req.isTransfer;
                        
                        return (
                            <div
                                key={req.sessionId}
                                onClick={() => {
                                    handleSelectChat(req);
                                    // Cerrar la lista de chats en móvil al seleccionar uno
                                    if (window.innerWidth < 768) {
                                        setIsMobileChatListOpen(false);
                                    }
                                }}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                    isActive
                                        ? activeChatBg + ' text-white'
                                        : isConnected
                                            ? cardHoverBg
                                            : theme === 'dark' 
                                                ? 'bg-gray-900 cursor-not-allowed opacity-50' 
                                                : 'bg-gray-50 cursor-not-allowed opacity-50'
                                } ${
                                    isTransfer 
                                        ? theme === 'dark'
                                            ? 'border-2 border-amber-400'
                                            : 'border-2 border-amber-500'
                                        : ''
                                }`}
                            >
                                <p className={`font-semibold ${
                                    isActive 
                                        ? 'text-white' 
                                        : textPrimary
                                }`}>
                                    Session: {req.sessionId.slice(-6)}
                                </p>
                                {/* Mostramos si es una transferencia */}
                                {isTransfer && (
                                    <p className={`text-xs font-bold ${
                                        isActive
                                            ? 'text-white'
                                            : theme === 'dark' 
                                                ? 'text-amber-400' 
                                                : 'text-amber-600'
                                    }`}>
                                        TRANSFER
                                    </p>
                                )}
                                <p className={`text-sm truncate ${
                                    isActive 
                                        ? 'text-white/90' 
                                        : textSecondary
                                }`}>
                                    {req.initialMessage.content}
                                </p>
                            </div>
                        );
                    })}
                    {requests.length === 0 && (
                        <p className={`text-sm mt-2 ${textSecondary}`}>
                            {t("chatPanel.noRequests")}
                        </p>
                    )}
                </div>
            </div>

            {/* CHATS - Main Content Area */}
            <div className={`flex-1 flex flex-col ${mainBg} pt-16 lg:pt-0`}>
                {activeChat && ["in_progress", "bot"].includes(activeChat.status) ? (
                    <>
                        <div className={`p-4 border-b ${cardBg} ${sidebarBorderColor} flex flex-wrap sm:flex-nowrap justify-between items-center gap-2`}>
                            <h3 className={`text-base sm:text-lg font-bold ${textPrimary}`}>
                                {t("chatPanel.activeChatTitle", {
                                    id: activeChat.sessionId.slice(-6),
                                })}
                            </h3>

                            {/* --- BOTÓN DE TRANSFERENCIA --- */}
                            <button
                                onClick={handleTransferToQueue}
                                className={`px-2 sm:px-3 py-1 border rounded-lg text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 transition-all ${
                                    theme === 'dark'
                                    ? 'bg-gray-700 border-gray-500 text-white hover:bg-gray-600 hover:border-gray-400'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                                }`}
                            >
                                <Users size={14} />
                                <span>{t("chatPanel.transferButton")}</span>
                            </button>

                            {/* --- BOTÓN DE PAUSAR/REANUDAR BOT --- */}
                            <button
                                onClick={handleToggleBotStatus} // <-- Llama a la función toggle
                                className={`px-2 sm:px-3 py-1 border rounded-lg text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 transition-all ${
                                    theme === 'dark' 
                                    ? 'bg-gray-700 border-gray-500 text-white hover:bg-gray-600 hover:border-gray-400' 
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                                }`}
                            >
                                {activeChat.status === 'in_progress' ? (
                                    <>
                                        <Play size={14} />
                                        <span>{t("chatPanel.resumeBotButton")}</span>
                                    </>
                                ) : (
                                    <>
                                        <Pause size={14} />
                                        <span>{t("chatPanel.pauseBotButton")}</span>
                                    </>
                                )}
                            </button>

                            {/* --- BOTÓN DE RESUMEN --- */}
                            <button
                                onClick={handleGetSummary}
                                className={`px-2 sm:px-3 py-1 border rounded-lg text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 transition-all ${
                                    theme === 'dark'
                                    ? 'bg-gray-700 border-gray-500 text-white hover:bg-gray-600 hover:border-gray-400'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                                }`}
                            >
                                <FileText size={14} />
                                <span>{t("chatPanel.summarizeButton")}</span>
                            </button>

                            {/* --- BOTÓN DE CERRAR CHAT --- */}
                            <button
                                onClick={handleCloseChat}
                                disabled={!isConnected}
                                className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${
                                    isConnected
                                        ? theme === 'dark' ? "bg-red-400 text-white hover:bg-red-500" : "bg-red-500 text-white hover:bg-red-600"
                                        : theme === 'dark' ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                }`}
                            >
                                {t("chatPanel.closeChatButton")}
                            </button>
                        </div>

                        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-6 sm:space-y-8">

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
                                            <div className={`w-10 h-10 rounded-full flex-shrink-0 border ${
                                                theme === 'dark'
                                                ? 'bg-[#2a3b47] border-[#3a4b57]'
                                                : 'bg-[#EFF3F5] border-[#e5e9eb]'
                                            }`}>
                                                {/* El usuario no tiene avatar en el panel, así que usamos un ícono genérico */}
                                                <User className={`w-full h-full p-1.5 ${
                                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                }`} />
                                            </div>
                                        )}

                                        {/* --- CUERPO DEL MENSAJE (EN EL MEDIO) --- */}
                                        <div
                                            className={`max-w-[70%] px-3 sm:px-4 py-4 sm:py-5 rounded-xl ${
                                                isAgent || isBot
                                                    ? agentBotMsgBg + " text-white"
                                                    : userMsgBg + " " + userMsgText
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
                                            <div className={`w-10 h-10 rounded-full flex-shrink-0 border ${
                                                theme === 'dark'
                                                ? 'bg-[#2a3b47] border-[#3a4b57]'
                                                : 'bg-[#EFF3F5] border-[#e5e9eb]'
                                            }`}>
                                                {isAgent && (
                                                    msg.avatarUrl ? (
                                                        <img src={msg.avatarUrl} alt={msg.agentName || 'Agent'} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <User className={`w-full h-full p-1.5 ${
                                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                        }`} /> // Avatar genérico para el agente
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

                        <div className={`p-3 sm:p-4 ${cardBg} border-t ${sidebarBorderColor}`}>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                    disabled={!isConnected || activeChat.status === "bot"}
                                    className={`flex-1 p-2 border rounded-lg ${!isConnected || activeChat.status === "bot"
                                        ? inputDisabledBg + " cursor-not-allowed opacity-50"
                                        : inputBg + " focus:border-blue-500"
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
                                    className={`px-3 sm:px-4 py-2 rounded-lg ${
                                        isConnected && input.trim()
                                            ? theme === 'dark' ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-blue-600 text-white hover:bg-blue-700"
                                            : theme === 'dark' ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    }`}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                        <MessageSquare className={`h-16 w-16 mb-4 ${textSecondary} opacity-50`} />
                        <p className={`text-lg sm:text-xl ${textSecondary} text-center`}>
                            {activeChat?.status === "closed"
                                ? t("chatPanel.chatClosed")
                                : t("chatPanel.selectChatPrompt")}
                        </p>
                        {requests.length > 0 && !activeChat && (
                            <button
                                onClick={() => setIsMobileChatListOpen(true)}
                                className={`md:hidden mt-4 px-4 py-2 rounded-lg ${
                                    theme === 'dark'
                                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                            >
                                {t("chatPanel.viewRequests")} ({requests.length})
                            </button>
                        )}
                    </div>
                )}


            </div>

            {/* Modal de Resumen */}
            {isSummaryModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className={`${modalBg} rounded-lg shadow-xl w-full max-w-lg p-6`}>
                        <h3 className={`text-lg font-bold mb-4 ${textPrimary}`}>{t("chatPanel.conversationSummary")}</h3>
                        {isSummarizing ? (
                            <div className="flex items-center justify-center h-24">
                                <Loader2 className={`h-8 w-8 animate-spin ${
                                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                }`} />
                            </div>
                        ) : (
                            <div className={`text-sm ${modalTextColor} whitespace-pre-wrap max-h-96 overflow-y-auto ${
                                theme === 'dark' ? 'scrollbar-dark' : 'scrollbar-light'
                            }`}>
                                {summaryText}
                            </div>
                        )}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsSummaryModalOpen(false)}
                                className={`px-4 py-2 ${buttonCloseBg} ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'} rounded-md`}
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












