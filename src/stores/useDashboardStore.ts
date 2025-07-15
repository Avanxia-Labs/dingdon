// stores/useDashboardStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Message, ChatSessionStatus } from '@/types/chatbot'

interface ChatRequest {
    sessionId: string;
    initialMessage: Message;
}

interface ActiveChat {
    sessionId: string;
    messages: Message[];
    status: ChatSessionStatus;
}

interface DashboardState {
    // Estado de las solicitudes pendientes
    requests: ChatRequest[];
    
    // Estado del chat activo
    activeChat: ActiveChat | null;
    
    // Estado de notificaciones
    notificationsEnabled: boolean;

    // Estado del idioma
    language: string;
    
    // Acciones para las solicitudes
    addRequest: (request: ChatRequest) => void;
    removeRequest: (sessionId: string) => void;
    clearAllRequests: () => void;
    
    // Acciones para el chat activo
    setActiveChat: (sessionId: string, initialMessages?: Message[]) => void;
    addMessageToActiveChat: (message: Message) => void;
    closeActiveChat: () => void;
    
    // Acciones para notificaciones
    setNotificationsEnabled: (enabled: boolean) => void;

    // Acciones para el idioma
    setLanguage: (language: string) => void;
    
    // Utilidades
    resetDashboard: () => void;
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set, get) => ({
            requests: [],
            activeChat: null,
            notificationsEnabled: false,
            language: 'en',
            
            addRequest: (request) => set((state) => ({
                requests: state.requests.some(r => r.sessionId === request.sessionId) 
                    ? state.requests 
                    : [...state.requests, request]
            })),
            
            removeRequest: (sessionId) => set((state) => ({
                requests: state.requests.filter(r => r.sessionId !== sessionId)
            })),
            
            clearAllRequests: () => set({ requests: [] }),
            
            setActiveChat: (sessionId, initialMessages = []) => {
                // Remover la solicitud de la lista cuando se acepta
                set((state) => ({
                    requests: state.requests.filter(r => r.sessionId !== sessionId),
                    activeChat: {
                        sessionId,
                        messages: initialMessages,
                        status: 'in_progress'
                    }
                }));
            },
            
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
            
            closeActiveChat: () => set((state) => ({
                activeChat: state.activeChat ? {
                    ...state.activeChat,
                    status: 'closed'
                } : null
            })),
            
            setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

            setLanguage: (language) => set({ language }),
            
            resetDashboard: () => set({
                requests: [],
                activeChat: null,
                notificationsEnabled: false
            })
        }),
        {
            name: 'dashboard-storage', // Nombre para localStorage
            partialize: (state) => ({
                // Solo persistir lo que realmente necesitamos
                requests: state.requests,
                activeChat: state.activeChat,
                notificationsEnabled: state.notificationsEnabled,
                language: state.language,
            })
        }
    )
)