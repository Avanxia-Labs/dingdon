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
     transferInfo?: {
        transferredBy?: string;
        transferredFromAgent?: string;
        transferredFromAgentId?: string;
        transferredToAgent?: string;
        transferredToAgentId?: string;
        transferredAt?: number;
    };
}

interface BotConfig {
    name?: string;
    avatarUrl?: string;
}

interface DashboardState {
    // Estado de las solicitudes pendientes (compartidas entre agentes)
    requests: ChatRequest[];
    
    // Estado de los chats que YO he tomado
    myActiveChats: ActiveChat[];
    
    // Estado del chat activo (ÚNICO) - cuál está visible actualmente
    activeChat: ActiveChat | null;
    
    // Caché de todos los chats para mantener historial
    chatCache: { [sessionId: string]: ActiveChat };

    // Estado del bot para el ChatPanel
    activeBotConfig: BotConfig | null;
    
    // Estado de notificaciones
    notificationsEnabled: boolean;

    // Estado del idioma
    language: string;
    
    // Acciones para las solicitudes
    addRequest: (request: ChatRequest) => void;
    removeRequest: (sessionId: string) => void;
    clearAllRequests: () => void;
    
    // Acciones para los chats que YO he tomado
    addToMyActiveChats: (sessionId: string, initialMessages?: Message[]) => void;
    removeFromMyActiveChats: (sessionId: string) => void;
    
    // Acciones para el chat activo (ÚNICO) - cuál está visible
    setActiveChat: (sessionId: string, initialMessages?: Message[]) => void;
    addMessageToActiveChat: (message: Message) => void;
    closeActiveChat: () => void;
    clearActiveChat: () => void;
    
    // Funciones para el caché de chats
    getCachedChat: (sessionId: string) => ActiveChat | null;
    saveChatToCache: (sessionId: string, chat: ActiveChat) => void;
    
    // Función para cargar mis chats activos desde la base de datos
     loadMyActiveChatsFromDB: (workspaceId: string, agentId: string) => Promise<void>;
    
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
            myActiveChats: [],
            activeChat: null,
            chatCache: {},
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
            
            // Funciones para los chats que YO he tomado
            addToMyActiveChats: (sessionId, initialMessages = []) => set((state) => {
                // Verificar si ya está en mis chats activos
                const existingChat = state.myActiveChats.find(c => c.sessionId === sessionId);
                if (existingChat) {
                    return state; // Ya existe, no hacer nada
                }
                
                // Buscar en el caché primero
                const cachedChat = state.chatCache[sessionId];
                const newChat: ActiveChat = cachedChat || {
                    sessionId,
                    messages: initialMessages,
                    status: 'in_progress'
                };
                
                return {
                    requests: state.requests.filter(r => r.sessionId !== sessionId), // Remover de requests
                    myActiveChats: [...state.myActiveChats, newChat],
                    chatCache: {
                        ...state.chatCache,
                        [sessionId]: newChat
                    }
                };
            }),
            
            removeFromMyActiveChats: (sessionId) => set((state) => {
                const newMyChats = state.myActiveChats.filter(c => c.sessionId !== sessionId);
                const newActiveChat = state.activeChat?.sessionId === sessionId 
                    ? (newMyChats.length > 0 ? newMyChats[0] : null)
                    : state.activeChat;
                
                return {
                    myActiveChats: newMyChats,
                    activeChat: newActiveChat
                };
            }),
            
            // Funciones del chat activo (ÚNICO) - solo cambia cuál está visible
            setActiveChat: (sessionId, initialMessages = []) => set((state) => {
                // 1. Guardar el chat actual en el caché si existe
                if (state.activeChat) {
                    state.chatCache[state.activeChat.sessionId] = state.activeChat;
                }
                
                // 2. Buscar primero en myActiveChats, luego en caché
                let chatToActivate = state.myActiveChats.find(c => c.sessionId === sessionId);
                
                if (!chatToActivate) {
                    // Buscar en el caché
                    const cachedChat = state.chatCache[sessionId];
                    if (cachedChat) {
                        chatToActivate = {
                            ...cachedChat,
                            messages: initialMessages.length > cachedChat.messages.length 
                                ? initialMessages 
                                : cachedChat.messages
                        };
                    } else {
                        // Crear nuevo chat
                        chatToActivate = {
                            sessionId,
                            messages: initialMessages,
                            status: 'in_progress'
                        };
                    }
                }
                
                // 3. Actualizar myActiveChats si el chat no está ahí
                const updatedMyChats = state.myActiveChats.find(c => c.sessionId === sessionId)
                    ? state.myActiveChats.map(c => c.sessionId === sessionId ? chatToActivate : c)
                    : state.myActiveChats;
                
                return {
                    activeChat: chatToActivate,
                    myActiveChats: updatedMyChats,
                    chatCache: {
                        ...state.chatCache,
                        [sessionId]: chatToActivate
                    }
                };
            }),
            
            addMessageToActiveChat: (message) => set((state) => {
                if (!state.activeChat) return state;
                
                // Evitar duplicados
                if (state.activeChat.messages.some(m => m.id === message.id)) return state;
                
                const updatedActiveChat = {
                    ...state.activeChat,
                    messages: [...state.activeChat.messages, message]
                };
                
                // Actualizar también en myActiveChats
                const updatedMyChats = state.myActiveChats.map(chat => 
                    chat.sessionId === updatedActiveChat.sessionId 
                        ? updatedActiveChat 
                        : chat
                );
                
                return {
                    activeChat: updatedActiveChat,
                    myActiveChats: updatedMyChats,
                    chatCache: {
                        ...state.chatCache,
                        [updatedActiveChat.sessionId]: updatedActiveChat
                    }
                };
            }),
            
            closeActiveChat: () => set((state) => ({
                activeChat: state.activeChat ? {
                    ...state.activeChat,
                    status: 'closed'
                } : null
            })),
            
            clearActiveChat: () => set({ activeChat: null }),
            
            // Funciones para el caché de chats
            getCachedChat: (sessionId) => {
                const state = get();
                return state.chatCache[sessionId] || null;
            },
            
            saveChatToCache: (sessionId, chat) => set((state) => ({
                chatCache: {
                    ...state.chatCache,
                    [sessionId]: chat
                }
            })),
            
            // Cargar mis chats activos desde la base de datos
            loadMyActiveChatsFromDB: async (workspaceId, agentId) => {
                try {
                    console.log(`[Store] 🔄 Loading active chats for agent ${agentId} in workspace ${workspaceId}`);
                    console.log(`[Store] 📋 Current myActiveChats before reload:`, get().myActiveChats.map(c => c.sessionId));
                    
                    // Hacer fetch a la API para obtener mis chats activos
                    const response = await fetch(`/api/workspaces/${workspaceId}/my-active-chats?agentId=${agentId}`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        const activeChats = data.chats || [];
                        
                        console.log(`[Store] ✅ Loaded ${activeChats.length} active chats from database:`, activeChats.map(c => c.id));
                        console.log(`[Store] 📋 Raw chat data from API:`, activeChats);
                        
                        const newMyActiveChats = activeChats.map((chatData: any) => ({
                            sessionId: chatData.id,
                            messages: chatData.history || [],
                            status: chatData.status || 'in_progress',
                            transferInfo: chatData.transfer_info ? {
                                transferredBy: chatData.transfer_info.transferredBy,
                                transferredFromAgent: chatData.transfer_info.transferredFromAgent,
                                transferredFromAgentId: chatData.transfer_info.transferredFromAgentId,
                                transferredToAgent: chatData.transfer_info.transferredToAgent,
                                transferredToAgentId: chatData.transfer_info.transferredToAgentId,
                                transferredAt: chatData.transfer_info.transferredAt
                            } : undefined
                        }));
                        
                        console.log(`[Store] 📋 Transformed myActiveChats:`, newMyActiveChats.map(c => ({ 
                            id: c.sessionId, 
                            hasTransferInfo: !!c.transferInfo,
                            transferredFromAgent: c.transferInfo?.transferredFromAgent 
                        })));
                        
                        set((state) => ({
                            myActiveChats: newMyActiveChats
                        }));
                    } else {
                        console.error('[Store] ❌ Failed to load active chats:', response.status, response.statusText);
                        const errorText = await response.text();
                        console.error('[Store] Error response:', errorText);
                        // En caso de error, mantener array vacío
                        set({ myActiveChats: [] });
                    }
                } catch (error) {
                    console.error('[Store] Error loading active chats:', error);
                    // En caso de error, mantener array vacío
                    set({ myActiveChats: [] });
                }
            },
            
            setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

            setLanguage: (language) => set({ language }),

            setActiveBotConfig: (config) => set({ activeBotConfig: config }),
            
            resetDashboard: () => set({
                requests: [],
                myActiveChats: [],
                activeChat: null,
                chatCache: {},
                notificationsEnabled: false
            })
        }),
        {
            name: 'dashboard-storage', // Nombre para localStorage
            partialize: (state) => ({
                // Solo persistir lo que realmente necesitamos
                requests: state.requests,
                // TEMPORAL: Persistir myActiveChats para debugging
                myActiveChats: state.myActiveChats, 
                activeChat: state.activeChat,
                chatCache: state.chatCache, // Persistir el caché para mantener historial
                notificationsEnabled: state.notificationsEnabled,
                language: state.language,
                activeBotConfig: state.activeBotConfig,
            })
        }
    )
)