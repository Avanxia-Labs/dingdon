// stores/useChatStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ChatSessionStatus, Message } from '@/types/chatbot'
import { v4 as uuidv4 } from 'uuid';

/**
 * @file Defines the state management for the chatbot using Zustand with persistence.
 * @description This store holds the chat messages, the open/closed state of the
 * chat window, and the loading status. Actions are provided to manipulate this state.
 */

interface ChatbotConfigState {
    botName: string;
    botColor: string;
    botAvatarUrl: string;    
    botIntroduction: string;
}

/**
 * Interface for the chatbot's state.
 */
interface ChatState {
    // STATE
    messages: Message[];
    isOpen: boolean;
    isLoading: boolean;
    sessionId?: string | null;
    status: ChatSessionStatus;
    workspaceId: string | null;
    config: ChatbotConfigState;
    error: string | null;
    language: string;
    leadCollected: boolean

    // ACTIONS
    /** Toggles the chat window's visibility */
    toggleChat: () => void;

    /**
     * Adds a new message to the conversation history
     * @param message - The message object to add
     */
    addMessage: (message: Message) => void;

    /**
     * Sets the loading state, typically used when waiting for an assistance response
     * @param isLoading - The new loading state
     */
    setIsLoading: (isLoading: boolean) => void;

    /**
     * Sets the current session ID, which is used to track the conversation
     */
    startSession: () => void;

    /**
     * Requests an agent handoff, indicating that the user needs human assistance
     */
    requestAgentHandoff: () => void;

    /**
     * Sets the current session status, which can be 'bot', 'pending', 'in_progress', or 'closed'
     * @param status - The new status of the chat session
     */
    setSessionStatus: (status: ChatSessionStatus) => void;

    /**
     * Resets the chat state, clearing all messages and resetting the session ID
     */
    resetChat: () => void;

    /**
     * Starts a new chat session (used when previous session was closed)
     */
    startNewChat: () => void;

    setWorkspaceId: (workspaceId: string) => void;

    setConfig: (config: Partial<ChatbotConfigState>) => void;

    setError: (error: string | null) => void;

    setLanguage: (language: string) => void;

    initializeOrSyncWorkspace: (workspaceId: string) => void;

    setLeadCollected: (collected: boolean) => void;
}

// Developer Note: Initial messages are now managed in a multilingual dictionary.
const initialMessages: Record<string, (botName: string) => Message> = {
    en: (botName) => ({ id: 'init-1', content: `Hi! I'm ${botName}. How can I help you today?`, role: 'assistant', timestamp: new Date() }),
    es: (botName) => ({ id: 'init-1', content: `¡Hola! Soy ${botName}. ¿Cómo puedo ayudarte hoy?`, role: 'assistant', timestamp: new Date() }),
    ru: (botName) => ({ id: 'init-1', content: `Привет! Я ${botName}. Чем я могу вам помочь сегодня?`, role: 'assistant', timestamp: new Date() }),
    ar: (botName) => ({ id: 'init-1', content: `مرحبًا! أنا ${botName}. كيف يمكنني مساعدتك اليوم؟`, role: 'assistant', timestamp: new Date() }),
    zh: (botName) => ({ id: 'init-1', content: `你好！我是${botName}。今天我能如何帮助您？`, role: 'assistant', timestamp: new Date() }),
};

/**
 * The initial welcome message for the chatbot.
 */
// const createInitialMessage = (botName: string, lang: string): Message => {
//     const messageFn = initialMessages[lang] || initialMessages.es
//     return messageFn(botName)
// };
const createInitialMessage = (botName: string, lang: string): Message => {
    const messageFn = initialMessages[lang] || initialMessages.es;
    const initialMsg = messageFn(botName);

    // --- MENSAJE ADICIONAL ---
    const leadPromptMessages: Record<string, string> = {
        en: "\n\nPlease fill out the form below to get started.",
        es: "\n\nPor favor, rellena el formulario de abajo para comenzar.",
        ru: "\n\nПожалуйста, заполните форму ниже, чтобы начать.",
        ar: "\n\nيرجى ملء النموذج أدناه للبدء.",
        zh: "\n\n请填写下面的表格以开始。"
    };

    initialMsg.content += leadPromptMessages[lang] || leadPromptMessages.es;
    return initialMsg;
};

/**
 * Zustand store for managing the chatbot's state with persistence.
 */
export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => {
            const initialConfig = {
                botName: 'Asistente Virtual',
                botColor: '#007bff',
                botAvatarUrl: '/default-bot-avatar.png',
                botIntroduction: initialMessages.es('Asistente Virtual').content
            };
            const initialLanguage = 'es';

            return {
                messages: [createInitialMessage(initialConfig.botName, initialLanguage)],
                isOpen: false,
                isLoading: false,
                sessionId: null,
                status: 'bot',
                workspaceId: null,
                config: initialConfig,
                error: null,
                language: initialLanguage,
                leadCollected: false,

                toggleChat: () => set((state) => ({
                    isOpen: !state.isOpen
                })),

                addMessage: (message) => set((state) => ({
                    messages: [...state.messages, message]
                })),

                setIsLoading: (isLoading) => set({ isLoading }),

                startSession: () => set((state) => ({
                    sessionId: uuidv4(),
                    status: 'bot',
                    messages: [createInitialMessage(state.config.botName, state.language)],
                })),

                requestAgentHandoff: () => {
                    const currentState = get();
                    if (currentState.status === 'bot') {
                        set({ status: 'pending' });
                    }
                },

                setSessionStatus: (status: ChatSessionStatus) => set({
                    status: status
                }),

                resetChat: () => set((state) => ({
                    messages: [createInitialMessage(state.config.botName, state.language)],
                    sessionId: uuidv4(),
                    status: 'bot',
                    isLoading: false,
                })),

                startNewChat: () => set((state) => ({
                    messages: [createInitialMessage(state.config.botName, state.language)],
                    sessionId: uuidv4(),
                    status: 'bot',
                    isLoading: false,
                })),

                // setWorkspaceId: (workspaceId) => set({ workspaceId }),

                setWorkspaceId: (newWorkspaceId) => {
                    const currentState = get();

                    // Compara el ID real del widget con el ID que está actualmente en el estado
                    // (que puede ser el que se cargó desde localStorage).
                    if (currentState.workspaceId !== newWorkspaceId) {
                        // console.warn(`[Zustand] Discrepancia de Workspace detectada. Reseteando. Widget actual: ${newWorkspaceId}, Estado anterior: ${currentState.workspaceId}`);
                        console.warn(`Reseteando config de workspace...`)
                        // Si no coinciden, forzamos un reseteo completo, creando una sesión nueva.
                        // Usamos la config y language del estado "viejo" para el mensaje de bienvenida,
                        // lo cual está bien porque el hook buscará la nueva config inmediatamente después.
                        set({
                            workspaceId: newWorkspaceId, // Establecemos el nuevo ID correcto.
                            sessionId: uuidv4(),         // ¡Generamos un ID de sesión nuevo y único!
                            status: 'bot',
                            messages: [createInitialMessage(currentState.config.botName, currentState.language)],
                            isLoading: false,
                            error: null
                        });
                    }

                },

                setConfig: (newConfig) => set((state) => {
                    const updatedConfig = { ...state.config, ...newConfig };
                    // Si cambió el nombre del bot, actualizar el mensaje inicial
                    const updatedMessages = state.messages.map(msg =>
                        msg.id === 'init-1' ? createInitialMessage(updatedConfig.botName, state.language) : msg
                    );

                    return {
                        config: updatedConfig,
                        messages: updatedMessages
                    };
                }),


                setError: (error) => set({ error }),
                //setLanguage: (language) => set({ language }),
                setLanguage: (language) => set((state) => {
                    // Developer Note: When language changes, update the initial message if it exists.
                    const updatedMessages = state.messages.map(msg =>
                        msg.id === 'init-1' ? createInitialMessage(state.config.botName, language) : msg
                    );
                    return { language, messages: updatedMessages };
                }),

                initializeOrSyncWorkspace: (newWorkspaceId) => {
                    const currentState = get();

                    // Si el workspaceId del estado persistido no coincide con el nuevo,
                    // significa que tenemos datos de otra sesión. ¡Hay que resetear!
                    if (currentState.workspaceId !== newWorkspaceId) {
                        console.warn(`[Zustand] Workspace cambiado. Reseteando sesión de ${currentState.workspaceId} a ${newWorkspaceId}.`)

                        // Obtenemos la config actual para el mensaje de bienvenida
                        const config = currentState.config;
                        const language = currentState.language;

                        set({
                            workspaceId: newWorkspaceId,
                            sessionId: uuidv4(), // <-- Nuevo y único sessionId
                            status: 'bot',
                            messages: [createInitialMessage(config.botName, language)],
                            error: null,
                        })
                    }
                    // Si los workspaceId coinciden, no hacemos nada. Significa que el usuario
                    // refrescó la página y la rehidratación desde localStorage es correcta.
                },

                setLeadCollected: (collected) => set({leadCollected: collected}),
            };
        },
        {
            name: 'chatbot-storage', // Nombre para localStorage

            partialize: (state) => ({
                // Persistir todo excepto isOpen e isLoading
                messages: state.messages,
                sessionId: state.sessionId,
                status: state.status,
                workspaceId: state.workspaceId,
                config: state.config,
                language: state.language,
                leadCollected: state.leadCollected,
            }),

            // Reseteo despues de 24h de inactividad
            storage: createJSONStorage(() => localStorage, {
                //Nombre para la clave de expiracion
                reviver: (key, value: any) => {
                    if (key === 'state' && value.sessionId) {
                        const now = Date.now();
                        const lastUpdated = value.lastUpdated || now;

                        // 24 horas 
                        const oneDay = 24 * 60 * 60 * 1000 // h * min * sec * milSec
                        

                        if (now - lastUpdated > oneDay) {
                            // Si han pasado más de 24h, no cargamos la sesión vieja.
                            // Devolvemos `undefined` para que Zustand use el estado inicial.
                            console.warn("Chat session expired due to inactivity.");
                            return undefined;
                        }
                    }
                
                    return value;
                },

                replacer: (key, value: any) => {
                    // Añadir una marca de tiempo cada vez que se guarde el estado
                    if (key === 'state') {
                        return {...value, lastUpdated: Date.now()}
                    }

                    return value;
                }
            })


        }
    )
)