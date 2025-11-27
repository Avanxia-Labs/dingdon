// app/dashboard/components/ChatPanel.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ChatSessionStatus, Message } from "@/types/chatbot";
import { useSession } from "next-auth/react";
import { useSocket } from "@/providers/SocketContext";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { useSyncLanguage } from "@/hooks/useSyncLanguage";
import { Send, Wifi, WifiOff, RefreshCcw, User, Bot, Play, Pause, Users, FileText, Loader2, MessageSquare, X, ArrowLeft } from "lucide-react";
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
        setRequests,
        setAssignedChats,
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

    // useEffect para hacer el fetch inicial de los chats pendientes Y asignados al cargar el componente.
    // IMPORTANTE: Usamos setRequests/setAssignedChats para REEMPLAZAR los datos con los del servidor
    // Esto evita datos fantasma de sesiones anteriores
    useEffect(() => {
        if (!workspaceId || !session?.user?.id) return;

        const fetchInitialChats = async () => {
            try {
                // Fetch pending chats - REEMPLAZA el estado completo
                const pendingResponse = await fetch(`/api/workspaces/${workspaceId}/pending-chats`);
                if (pendingResponse.ok) {
                    const pendingChats: ChatRequest[] = await pendingResponse.json();
                    setRequests(pendingChats);
                    console.log("[ChatPanel] Loaded pending chats:", pendingChats.length);
                }

                // Fetch assigned chats for this agent - REEMPLAZA el estado completo
                const assignedResponse = await fetch(`/api/workspaces/${workspaceId}/assigned-chats?agentId=${session.user.id}`);
                if (assignedResponse.ok) {
                    const assignedChatsData: ChatRequest[] = await assignedResponse.json();
                    setAssignedChats(assignedChatsData);
                    console.log("[ChatPanel] Loaded assigned chats:", assignedChatsData.length);
                }

            } catch (error) {
                console.error("Could not fetch initial chats:", error);
            }
        }

        fetchInitialChats();

    }, [workspaceId, session?.user?.id, setRequests, setAssignedChats]);

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
            botConfig,
            assignedAgentId
        }: {
            sessionId: string;
            history: Message[];
            botConfig: BotConfig;
            assignedAgentId?: string;
        }) => {
            console.log(`[ChatPanel] ¡EVENTO 'assignment_success' RECIBIDO! Para la sesión: ${sessionId}, assignedAgentId: ${assignedAgentId}`);
            setActiveChat(sessionId, history, assignedAgentId || session?.user?.id);
            setActiveBotConfig(botConfig);
        };

        const handleSwitchChatSuccess = ({
            sessionId,
            history,
            botConfig
        }: {
            sessionId: string;
            history: Message[];
            botConfig: BotConfig;
        }) => {
            console.log(`[ChatPanel] Switch chat success para sesión: ${sessionId}`);
            // Solo actualizar la vista activa sin modificar assignedChats
            setActiveChat(sessionId, history);
            setActiveBotConfig(botConfig);
        };

        const handleAssignmentFailure = ({ message }: { message: string }) => {
            console.error("[ChatPanel] Assignment failure:", message);
            alert(message);
        };

        socket.on("assignment_success", handleAssignmentSuccess);
        socket.on("switch_chat_success", handleSwitchChatSuccess);
        socket.on("assignment_failure", handleAssignmentFailure);
        return () => {
            console.log("[ChatPanel] Limpiando listeners.");
            socket.off("assignment_success", handleAssignmentSuccess);
            socket.off("switch_chat_success", handleSwitchChatSuccess);
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
        console.log(`[ChatPanel] handleSelectChat called. SessionId: ${request.sessionId}, isAlreadyAssigned: ${isAlreadyAssigned}`);

        if (!socket) {
            console.error("[ChatPanel] Socket is null");
            return;
        }
        if (!workspaceId) {
            console.error("[ChatPanel] WorkspaceId is null");
            return;
        }
        if (!session?.user?.id) {
            console.error("[ChatPanel] Session user ID is null");
            return;
        }
        if (!isConnected) {
            console.error("[ChatPanel] Socket not connected");
            return;
        }

        if (isAlreadyAssigned) {
            // Es un chat ya asignado, solo cambiamos la vista localmente
            console.log(`[ChatPanel] Emitting switch_chat for session ${request.sessionId}`);
            socket.emit("switch_chat", {
                workspaceId,
                sessionId: request.sessionId,
                agentId: session.user.id,
            });
        } else {
            // Es un chat nuevo de la lista de requests
            console.log(`[ChatPanel] Emitting agent_joined for session ${request.sessionId}`);
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
            const sessionIdToTransfer = activeChat.sessionId;

            socket.emit('transfer_to_queue', {
                workspaceId,
                sessionId: sessionIdToTransfer
            });

            // Quitamos el chat de la lista de chats asignados del agente
            removeAssignedChat(sessionIdToTransfer);

            // Cerramos la vista del chat para el agente actual
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
    console.log("[ChatPanel] assignedChats:", assignedChats);
    console.log("[ChatPanel] Current user ID:", session?.user?.id);
    console.log("[ChatPanel] Filtered chats:", assignedChats.filter(chat => chat.assignedAgentId === session?.user?.id));

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

    // Estado para controlar vista móvil (lista vs chat)
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

    // Cuando se selecciona un chat en móvil, cambiar a vista de chat
    const handleMobileSelectChat = (request: ChatRequest, isAlreadyAssigned: boolean = false) => {
        handleSelectChat(request, isAlreadyAssigned);
        setMobileView('chat');
    };

    return (
        <div className={`flex h-full relative ${mainBg}`}>
            {!notificationsEnabled && showNotificationPopup && (
                <div className={`absolute top-4 right-4 p-3 rounded-lg shadow-md z-10 border max-w-[280px] sm:max-w-xs ${theme === 'dark' ? 'bg-amber-900 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                    <button
                        onClick={() => setShowNotificationPopup(false)}
                        className={`absolute top-1 right-1 p-1 rounded ${theme === 'dark' ? 'hover:bg-amber-800' : 'hover:bg-amber-100'}`}
                    >
                        <X size={14} />
                    </button>
                    <p className="font-semibold text-sm">{t("chatPanel.notifications.title")}</p>
                    <p className="text-xs sm:text-sm mb-2">
                        {t("chatPanel.notifications.description")}
                    </p>
                    <button
                        onClick={enableNotifications}
                        className={`px-3 py-1 rounded text-xs sm:text-sm ${theme === 'dark' ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                    >
                        {t("chatPanel.notifications.button")}
                    </button>
                </div>
            )}

            {/* Chat Requests y Connection - Oculto en móvil cuando hay chat activo */}
            <div className={`
                ${activeChat && mobileView === 'chat' ? 'hidden' : 'flex'}
                md:flex
                w-full md:w-80 lg:w-72 xl:w-80
                border-r p-3 sm:p-4 flex-col flex-shrink-0
                ${sidebarBg} ${sidebarBorderColor}
            `}>
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
                <h2 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${textPrimary}`}>
                    {t("chatPanel.requestsTitle")}
                </h2>
                <div className="space-y-4 flex-1 overflow-y-auto">
                    {/* Chats asignados al agente - FILTRADOS por agentId */}
                    {assignedChats.filter(chat => chat.assignedAgentId === session?.user?.id).length > 0 && (
                        <div>
                            <h3 className={`text-sm font-semibold mb-2 ${textSecondary}`}>{t("chatPanel.myChats")}</h3>
                            <div className="space-y-2">
                                {assignedChats
                                    .filter(chat => chat.assignedAgentId === session?.user?.id)
                                    .map((req) => {
                                        console.log(`[ChatPanel] Rendering chat ${req.sessionId} with onClick handler`);
                                        return (
                                            <button
                                                key={req.sessionId}
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    console.log(`[ChatPanel] Chat clicked! SessionId: ${req.sessionId}`);
                                                    handleMobileSelectChat(req, true);
                                                }}
                                                className={`w-full text-left p-2.5 sm:p-3 rounded-lg cursor-pointer transition-colors ${req.isTransfer ? 'border-2 border-orange-400' : ''} ${activeChat?.sessionId === req.sessionId
                                                    ? `${activeChatBg} text-white`
                                                    : isConnected
                                                        ? `${cardBg} ${cardHoverBg} ${textPrimary}`
                                                        : `${cardBg} cursor-not-allowed opacity-50 ${textPrimary}`
                                                    }`}
                                            >
                                                <p className="font-semibold text-sm sm:text-base">
                                                    Session: {req.sessionId.slice(-6)}
                                                </p>
                                                {req.isTransfer && <p className="text-xs font-bold text-orange-600">{t("chatPanel.transferLabel")}</p>}
                                                <p className="text-xs sm:text-sm truncate">{req.initialMessage.content}</p>
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Solicitudes pendientes */}
                    {requests.length > 0 && (
                        <div>
                            <h3 className={`text-sm font-semibold mb-2 ${textSecondary}`}>{t("chatPanel.pendingRequests")}</h3>
                            <div className="space-y-2">
                                {requests.map((req) => {
                                    const isTakenByOther = !!req.takenBy;

                                    return (
                                        <button
                                            key={req.sessionId}
                                            type="button"
                                            disabled={isTakenByOther}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!isTakenByOther) {
                                                    console.log(`[ChatPanel] Pending chat clicked! SessionId: ${req.sessionId}`);
                                                    handleMobileSelectChat(req, false);
                                                }
                                            }}
                                            className={`w-full text-left p-2.5 sm:p-3 rounded-lg transition-colors
                                                ${req.isTransfer ? 'border-2 border-orange-400' : ''}
                                                ${isTakenByOther
                                                    ? `${cardBg} opacity-60 cursor-not-allowed border border-green-500`
                                                    : activeChat?.sessionId === req.sessionId
                                                        ? `${activeChatBg} text-white cursor-pointer`
                                                        : isConnected
                                                            ? `${cardBg} ${cardHoverBg} ${textPrimary} cursor-pointer`
                                                            : `${cardBg} cursor-not-allowed opacity-50 ${textPrimary}`
                                                }`}
                                        >
                                            <p className={`font-semibold text-sm sm:text-base ${isTakenByOther ? textSecondary : ''}`}>
                                                Session: {req.sessionId.slice(-6)}
                                            </p>
                                            {req.isTransfer && !isTakenByOther && (
                                                <p className="text-xs font-bold text-orange-600">{t("chatPanel.transferLabel")}</p>
                                            )}
                                            {isTakenByOther ? (
                                                <p className="text-xs font-bold text-green-600">
                                                    {t("chatPanel.takenBy", { agent: req.takenBy?.agentName })}
                                                </p>
                                            ) : (
                                                <p className={`text-xs sm:text-sm truncate ${isTakenByOther ? textSecondary : ''}`}>
                                                    {req.initialMessage.content}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {requests.length === 0 && assignedChats.filter(chat => chat.assignedAgentId === session?.user?.id).length === 0 && (
                        <p className={`text-sm mt-2 ${textSecondary}`}>
                            {t("chatPanel.noRequests")}
                        </p>
                    )}
                </div>
            </div>

            {/* CHATS - Oculto en móvil cuando no hay chat activo o estamos en vista de lista */}
            <div className={`
                ${!activeChat || mobileView === 'list' ? 'hidden' : 'flex'}
                md:flex
                flex-1 flex-col min-w-0
                ${mainBg}
            `}>
                {activeChat && ["in_progress", "bot"].includes(activeChat.status) ? (
                    <>
                        <div className={`p-2 sm:p-4 border-b ${sidebarBg} ${sidebarBorderColor}`}>
                            {/* Header con botón volver en móvil */}
                            <div className="flex items-center gap-2 mb-2 sm:mb-0">
                                {/* Botón volver - solo móvil */}
                                <button
                                    onClick={() => setMobileView('list')}
                                    className={`md:hidden p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-[#2a3b47]' : 'hover:bg-[#EFF3F5]'}`}
                                >
                                    <ArrowLeft size={20} className={textPrimary} />
                                </button>
                                <h3 className={`text-base sm:text-lg font-bold ${textPrimary} truncate`}>
                                    {t("chatPanel.activeChatTitle", {
                                        id: activeChat.sessionId.slice(-6),
                                    })}
                                </h3>
                            </div>

                            {/* Botones de acción - Responsive grid */}
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                                {/* --- BOTÓN DE TRANSFERENCIA --- */}
                                <button
                                    onClick={handleTransferToQueue}
                                    className="px-2 sm:px-3 py-1.5 sm:py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5"
                                >
                                    <Users size={14} className="hidden sm:block" />
                                    <span>{t("chatPanel.transferButton")}</span>
                                </button>

                                {/* --- BOTÓN DE PAUSAR/REANUDAR BOT --- */}
                                <button
                                    onClick={handleToggleBotStatus}
                                    className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 transition-colors ${activeChat.status === 'in_progress'
                                        ? 'bg-green-500 hover:bg-green-600 text-white'
                                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                        }`}
                                >
                                    {activeChat.status === 'in_progress' ? (
                                        <>
                                            <Play size={14} className="hidden sm:block" />
                                            <span>{t("chatPanel.resumeBotButton")}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Pause size={14} className="hidden sm:block" />
                                            <span>{t("chatPanel.pauseBotButton")}</span>
                                        </>
                                    )}
                                </button>

                                {/* --- BOTÓN DE RESUMEN --- */}
                                <button
                                    onClick={handleGetSummary}
                                    className="px-2 sm:px-3 py-1.5 sm:py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5"
                                >
                                    <FileText size={14} className="hidden sm:block" />
                                    <span>{t("chatPanel.summarizeButton")}</span>
                                </button>

                                {/* --- BOTÓN DE CERRAR CHAT --- */}
                                <button
                                    onClick={handleCloseChat}
                                    disabled={!isConnected}
                                    className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm ${isConnected
                                        ? "bg-red-500 text-white hover:bg-red-600"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        }`}
                                >
                                    {t("chatPanel.closeChatButton")}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-2 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4">

                            {activeChat.messages.map((msg) => {
                                const isUser = msg.role === 'user';
                                const isAgent = msg.role === 'agent';
                                const isBot = msg.role === 'assistant';
                                const isOutgoing = isAgent || isBot;
                                const isBotAttending = activeChat.status === "bot";

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex items-start gap-2 sm:gap-3 ${isOutgoing ? 'justify-end' : 'justify-start'} ${isBotAttending ? 'opacity-20' : ''}`}
                                    >
                                        {/* --- AVATAR DEL USUARIO (IZQUIERDA) --- */}
                                        {isUser && (
                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 border ${theme === 'dark' ? 'bg-[#2a3b47] border-[#3a4b57]' : 'bg-[#EFF3F5] border-gray-300'}`}>
                                                <User className={`w-full h-full p-1 sm:p-1.5 ${textSecondary}`} />
                                            </div>
                                        )}

                                        {/* --- CUERPO DEL MENSAJE --- */}
                                        <div
                                            className={`max-w-[80%] sm:max-w-[70%] px-3 sm:px-4 py-2 rounded-xl ${
                                                isAgent || isBot
                                                    ? `${agentBotMsgBg} text-white`
                                                    : `${userMsgBg} ${userMsgText} border ${theme === 'dark' ? 'border-[#3a4b57]' : 'border-gray-300'}`
                                            }`}
                                        >
                                            {isAgent && <p className="text-xs font-bold text-white/80 mb-1">{msg.agentName}</p>}
                                            {isBot && <p className="text-xs font-bold text-white/80 mb-1">{activeBotConfig?.name || 'Bot'}</p>}
                                            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                        </div>

                                        {/* --- AVATAR DEL AGENTE O DEL BOT (DERECHA) --- */}
                                        {isOutgoing && (
                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 border ${theme === 'dark' ? 'bg-[#2a3b47] border-[#3a4b57]' : 'bg-[#EFF3F5] border-gray-300'}`}>
                                                {isAgent && (
                                                    msg.avatarUrl ? (
                                                        <img src={msg.avatarUrl} alt={msg.agentName || 'Agent'} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <User className={`w-full h-full p-1 sm:p-1.5 ${textSecondary}`} />
                                                    )
                                                )}
                                                {isBot && (
                                                    <img src={activeBotConfig?.avatarUrl || '/default-bot-avatar.png'} alt="Bot Avatar" className="w-full h-full rounded-full object-cover" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className={`p-2 sm:p-4 border-t ${sidebarBg} ${sidebarBorderColor}`}>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                    disabled={!isConnected || activeChat.status === "bot"}
                                    className={`flex-1 p-2 text-sm sm:text-base border rounded-lg ${textPrimary} ${!isConnected || activeChat.status === "bot"
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
                                    className={`px-3 sm:px-4 py-2 rounded-lg flex-shrink-0 ${isConnected && input.trim()
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
                    <div className="flex items-center justify-center h-full p-4">
                        <div className="text-center">
                            <MessageSquare size={48} className={`mx-auto mb-4 ${textSecondary} opacity-50`} />
                            <p className={`text-base sm:text-xl ${textSecondary}`}>
                                {activeChat?.status === "closed"
                                    ? t("chatPanel.chatClosed")
                                    : t("chatPanel.selectChatPrompt")}
                            </p>
                        </div>
                    </div>
                )}


            </div>

            {/* Modal de Resumen */}
            {isSummaryModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className={`rounded-lg shadow-xl w-full max-w-[95vw] sm:max-w-lg p-4 sm:p-6 ${modalBg}`}>
                        <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 ${textPrimary}`}>{t("chatPanel.conversationSummary")}</h3>
                        {isSummarizing ? (
                            <div className="flex items-center justify-center h-20 sm:h-24">
                                <Loader2 className={`h-6 w-6 sm:h-8 sm:w-8 animate-spin ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} />
                            </div>
                        ) : summaryText.startsWith('Error:') ? (
                            <div className={`text-xs sm:text-sm p-3 sm:p-4 rounded-lg border ${theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                <p className="font-semibold mb-2">{t("chatPanel.errorOccurred") || "Error"}</p>
                                <p className="whitespace-pre-wrap">{summaryText.replace('Error: ', '')}</p>
                            </div>
                        ) : (
                            <div className={`text-xs sm:text-sm whitespace-pre-wrap max-h-[50vh] sm:max-h-96 overflow-y-auto ${modalTextColor}`}>
                                {summaryText}
                            </div>
                        )}
                        <div className="mt-4 sm:mt-6 flex justify-end">
                            <button
                                onClick={() => setIsSummaryModalOpen(false)}
                                className={`px-3 sm:px-4 py-2 rounded-md text-sm ${buttonCloseBg} ${textPrimary}`}
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












