// app/dashboard/components/ChatPanel.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ChatSessionStatus, Message } from "@/types/chatbot";
import { useSession } from "next-auth/react";
import { useSocket } from "@/providers/SocketContext";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { useSyncLanguage } from "@/hooks/useSyncLanguage";
import { Send, Wifi, WifiOff, RefreshCcw, User, Bot, Play, Pause, Users, FileText, Loader2, Menu, X } from "lucide-react";
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
        addRequest
    } = useDashboardStore();

    const [input, setInput] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [summaryText, setSummaryText] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);

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
        }
    };


    console.log("ACTIVE BOT CONFIG", activeBotConfig);

    // Theme classes
    const mainBg = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
    const sidebarBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const sidebarBorderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
    const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const cardHoverBg = theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200';
    const activeChatBg = theme === 'dark' ? 'bg-blue-700' : 'bg-blue-600';
    const textPrimary = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';
    const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
    const inputBg = theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300';
    const inputDisabledBg = theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200';
    const modalBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const modalTextColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-700';
    const buttonCloseBg = theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
    const userMsgBg = theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-800';
    const botMsgBg = theme === 'dark' ? 'bg-slate-600' : 'bg-slate-700';

    return (
        <div className={`flex h-full relative ${mainBg}`}>
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

            {/* Mobile Header - Solo visible en móvil hasta 768px */}
            <div className={`md:hidden fixed top-0 left-0 right-0 h-14 ${cardBg} border-b ${sidebarBorderColor} px-4 flex items-center justify-between z-50`}>
                <button
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                >
                    {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                <h1 className={`font-bold text-lg ${textPrimary}`}>{t("chatPanel.requestsTitle")}</h1>
                <div className="w-10" />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMobileSidebarOpen(false)} />
            )}

            {/* Chat Requests Sidebar - Responsive */}
            <div className={`
                ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:relative md:w-1/3 lg:w-1/4
                fixed top-0 left-0 h-full w-64 sm:w-72
                border-r ${sidebarBorderColor} ${sidebarBg}
                p-4 flex flex-col z-50 md:z-0
                transition-transform duration-300 ease-in-out
                pt-16 md:pt-4
            `}>
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
                <h2 className={`text-xl font-bold mb-4 hidden md:block ${textPrimary}`}>
                    {t("chatPanel.requestsTitle")}
                </h2>
                <div className="space-y-2 flex-1 overflow-y-auto">
                    {requests.map((req) => (

                        <div
                            key={req.sessionId}
                            onClick={() => handleSelectChat(req)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors 
                                
                                ${req.isTransfer ? 'border-2 border-orange-400' : ''}
                                
                                ${activeChat?.sessionId === req.sessionId
                                    ? `${activeChatBg} text-white`
                                    : isConnected
                                        ? cardHoverBg
                                        : theme === 'dark' ? "bg-gray-900 cursor-not-allowed opacity-50" : "bg-gray-50 cursor-not-allowed opacity-50"
                                }`}
                        >
                            <p className="font-semibold">
                                Session: {req.sessionId.slice(-6)}
                            </p>
                            {/* Mostramos si es una transferencia */}
                            {req.isTransfer && <p className="text-xs font-bold text-orange-600">TRANSFER</p>}
                            <p className="text-sm truncate">{req.initialMessage.content}</p>
                        </div>
                    ))}
                    {requests.length === 0 && (
                        <p className={`text-sm mt-2 ${textSecondary}`}>
                            {t("chatPanel.noRequests")}
                        </p>
                    )}
                </div>
            </div>

            {/* CHATS - Main Content Area */}
            <div className={`flex-1 flex flex-col ${mainBg} pt-14 md:pt-0`}>
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
                                className="px-2 sm:px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5"
                            >
                                <Users size={14} />
                                <span>Transfer</span>
                            </button>

                            {/* --- BOTÓN DE PAUSAR/REANUDAR BOT --- */}
                            <button
                                onClick={handleToggleBotStatus} // <-- Llama a la función toggle
                                className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 transition-colors ${activeChat.status === 'in_progress'
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
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
                                className="px-2 sm:px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5"
                            >
                                <FileText size={14} />
                                <span>Summarize</span>
                            </button>

                            {/* --- BOTÓN DE CERRAR CHAT --- */}
                            <button
                                onClick={handleCloseChat}
                                disabled={!isConnected}
                                className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${isConnected
                                    ? "bg-red-500 text-white hover:bg-red-600"
                                    : theme === 'dark' ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 border border-black/10">
                                                {/* El usuario no tiene avatar en el panel, así que usamos un ícono genérico */}
                                                <User className="w-full h-full text-gray-500 p-1.5" />
                                            </div>
                                        )}

                                        {/* --- CUERPO DEL MENSAJE (EN EL MEDIO) --- */}
                                        <div
                                            className={`max-w-[70%] px-3 sm:px-4 py-2 rounded-xl ${isAgent ? "bg-blue-500 text-white" :
                                                isBot ? botMsgBg + " text-white" :
                                                    userMsgBg + " border border-black/10"
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
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 border border-black/10">
                                                {isAgent && (
                                                    msg.avatarUrl ? (
                                                        <img src={msg.avatarUrl} alt={msg.agentName || 'Agent'} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <User className="w-full h-full text-gray-500 p-1.5" /> // Avatar genérico para el agente
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
                                    className={`px-3 sm:px-4 py-2 rounded-lg ${isConnected && input.trim()
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : theme === 'dark' ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        }`}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className={`text-lg sm:text-xl ${textSecondary}`}>
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
                    <div className={`${modalBg} rounded-lg shadow-xl w-full max-w-lg p-6`}>
                        <h3 className={`text-lg font-bold mb-4 ${textPrimary}`}>{t("chatPanel.conversationSummary")}</h3>
                        {isSummarizing ? (
                            <div className="flex items-center justify-center h-24">
                                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                            </div>
                        ) : (
                            <div className={`text-sm ${modalTextColor} whitespace-pre-wrap max-h-96 overflow-y-auto`}>
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












