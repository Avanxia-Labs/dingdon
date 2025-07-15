// stores/useChatStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
     * Sets the current session status, which can be 'bot', 'pending_agent', 'in_progress', or 'closed'
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
}

/**
 * The initial welcome message for the chatbot.
 */
const createInitialMessage = (botName: string): Message => ({
    id: 'init-1',
    content: `Hi! I'm ${botName}. How can I help you today?`,
    role: 'assistant',
    timestamp: new Date()
});

/**
 * Zustand store for managing the chatbot's state with persistence.
 */
export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => {
            const initialConfig = {
                botName: 'Virtual Assistant',
                botColor: '#007bff'
            };

            return {
                messages: [createInitialMessage(initialConfig.botName)],
                isOpen: false,
                isLoading: false,
                sessionId: null,
                status: 'bot',
                workspaceId: null,
                config: initialConfig,
                error: null,
                language: 'en',

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
                    messages: [createInitialMessage(state.config.botName)],
                })),

                requestAgentHandoff: () => {
                    const currentState = get();
                    if (currentState.status === 'bot') {
                        set({ status: 'pending_agent' });
                    }
                },

                setSessionStatus: (status: ChatSessionStatus) => set({
                    status: status
                }),

                resetChat: () => set((state) => ({
                    messages: [createInitialMessage(state.config.botName)],
                    sessionId: uuidv4(),
                    status: 'bot',
                    isLoading: false,
                })),

                startNewChat: () => set((state) => ({
                    messages: [createInitialMessage(state.config.botName)],
                    sessionId: uuidv4(),
                    status: 'bot',
                    isLoading: false,
                })),

                setWorkspaceId: (workspaceId) => set({ workspaceId }),

                setConfig: (newConfig) => set((state) => {
                    const updatedConfig = { ...state.config, ...newConfig };
                    // Si cambió el nombre del bot, actualizar el mensaje inicial
                    const updatedMessages = state.messages.map(msg => 
                        msg.id === 'init-1' 
                            ? { ...msg, content: `Hi! I'm ${updatedConfig.botName}. How can I help you today?` }
                            : msg
                    );
                    
                    return {
                        config: updatedConfig,
                        messages: updatedMessages
                    };
                }),


                setError: (error) => set({ error }),
                setLanguage: (language) => set({ language }),
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
            })
        }
    )
)