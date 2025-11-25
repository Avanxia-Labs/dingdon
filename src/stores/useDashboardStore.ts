// stores/useDashboardStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Message, ChatSessionStatus } from '@/types/chatbot'

interface ChatRequest {
    sessionId: string;
    initialMessage: Message;
    isTransfer?: boolean;
    assignedAgentId?: string;  // ID del agente asignado
}

interface ActiveChat {
    sessionId: string;
    messages: Message[];
    status: ChatSessionStatus;
}

export interface BotConfig {
    name?: string;
    avatarUrl?: string;
}

interface DashboardState {
    // Estado de las solicitudes pendientes (no asignadas)
    requests: ChatRequest[];

    // Estado de los chats asignados al agente
    assignedChats: ChatRequest[];

    // Estado del chat activo
    activeChat: ActiveChat | null;

    // Estado del bot para el ChatPanel
    activeBotConfig: BotConfig | null;

    // Estado de notificaciones
    notificationsEnabled: boolean;

    // Estado del idioma
    language: string;

    // Chats de monitoreo
    monitoringChats: ChatRequest[];

    // Acciones para las solicitudes
    addRequest: (request: ChatRequest) => void;
    removeRequest: (sessionId: string) => void;
    clearAllRequests: () => void;

    // Acciones para los chats asignados
    addAssignedChat: (request: ChatRequest) => void;
    removeAssignedChat: (sessionId: string) => void;

    // Acciones para el chat activo
    setActiveChat: (sessionId: string, initialMessages?: Message[], assignedAgentId?: string) => void;
    updateActiveChatStatus: (status: ChatSessionStatus) => void;
    addMessageToActiveChat: (message: Message) => void;
    closeActiveChat: () => void;
    clearActiveChatView: () => void;

    // Acciones de monitoreo de chats
    setMonitoringChats: (chats: ChatRequest[]) => void;
    addMonitoringChat: (chat: ChatRequest) => void;
    removeMonitoringChat: (sessionId: string) => void;
    
    // Acciones para notificaciones
    setNotificationsEnabled: (enabled: boolean) => void;

    // Acciones para el idioma
    setLanguage: (language: string) => void;

    // Acciones para la config del bot
    setActiveBotConfig: (config: BotConfig) => void;
    
    // Utilidades
    resetDashboard: () => void;
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set, get) => ({
            requests: [],
            assignedChats: [],
            activeChat: null,
            monitoringChats: [],
            notificationsEnabled: false,
            language: 'en',
            activeBotConfig: null,

            addRequest: (request) => set((state) => ({
                requests: state.requests.some(r => r.sessionId === request.sessionId)
                    ? state.requests
                    : [...state.requests, request]
            })),

            removeRequest: (sessionId) => set((state) => ({
                requests: state.requests.filter(r => r.sessionId !== sessionId)
            })),

            clearAllRequests: () => set({ requests: [] }),

            addAssignedChat: (request) => set((state) => ({
                assignedChats: state.assignedChats.some(r => r.sessionId === request.sessionId)
                    ? state.assignedChats
                    : [...state.assignedChats, request]
            })),

            removeAssignedChat: (sessionId) => set((state) => ({
                assignedChats: state.assignedChats.filter(r => r.sessionId !== sessionId)
            })),

            setActiveChat: (sessionId, initialMessages = [], assignedAgentId?: string) => {
                const state = get();

                // Verificar si el chat ya está en assignedChats (es un switch)
                const isAlreadyAssigned = state.assignedChats.some(r => r.sessionId === sessionId);

                // Si no está asignado, buscar en requests
                const chatRequest = state.requests.find(r => r.sessionId === sessionId);

                set({
                    // Solo remover de requests si es un chat nuevo
                    requests: chatRequest ? state.requests.filter(r => r.sessionId !== sessionId) : state.requests,
                    // Solo agregar a assignedChats si es un chat nuevo
                    assignedChats: chatRequest && !isAlreadyAssigned
                        ? [...state.assignedChats, { ...chatRequest, assignedAgentId }]
                        : state.assignedChats,
                    activeChat: {
                        sessionId,
                        messages: initialMessages,
                        status: state.activeChat?.sessionId === sessionId ? state.activeChat.status : 'in_progress'
                    }
                });
            },

            updateActiveChatStatus: (status) => set((state) => {
                if (!state.activeChat) return {}; // No hagas nada si no hay chat activo
                return {
                    activeChat: {
                        ...state.activeChat,
                        status: status, // <-- Actualiza solo el status
                    }
                };
            }),
            
            addMessageToActiveChat: (message) => set((state) => {
                if (!state.activeChat) return state;
                
                // Evitar mensajes duplicados
                const messageExists = state.activeChat.messages.some(m => m.id === message.id);
                if (messageExists) return state;
                
                return {
                    activeChat: {
                        ...state.activeChat,
                        messages: [...state.activeChat.messages, message]
                    }
                };
            }),

            setMonitoringChats: (chats) => set({
                monitoringChats: chats
            }),

            addMonitoringChat: (chats) => set((state) => ({
                monitoringChats: state.monitoringChats.some(c => c.sessionId === chats.sessionId)
                    ? state.monitoringChats
                    : [...state.monitoringChats, chats]
            })),

            removeMonitoringChat: (sessionId) => set((state) => ({
                monitoringChats: state.monitoringChats.filter(c => c.sessionId !== sessionId)
            })),
            
            closeActiveChat: () => set((state) => ({
                activeChat: state.activeChat ? {
                    ...state.activeChat,
                    status: 'closed'
                } : null
            })),

            clearActiveChatView: () => set({
                activeChat: null,
                //activeBotConfig: null,
            }),

            
            setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

            setLanguage: (language) => set({ language }),

            setActiveBotConfig: (config) => set({ activeBotConfig: config }),
            
            resetDashboard: () => set({
                requests: [],
                assignedChats: [],
                activeChat: null,
                notificationsEnabled: false
            })
        }),
        {
            name: 'dashboard-storage', // Nombre para localStorage
            partialize: (state) => ({
                // Solo persistir lo que realmente necesitamos
                requests: state.requests,
                assignedChats: state.assignedChats,
                activeChat: state.activeChat,
                notificationsEnabled: state.notificationsEnabled,
                language: state.language,
                activeBotConfig: state.activeBotConfig,
            })
        }
    )
)