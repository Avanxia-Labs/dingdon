import {create} from 'zustand'
import { ChatSessionStatus, Message } from '@/types/chatbot'

/**
 * @file Defines the state management for the chatbot using Zustand.
 * @description This store holds the chat messages, the open/closed state of the
 * chat window, and the loading status. Actions are provided to manipulate this state.
 */

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

    // ACTIONS

    /** Toggles the chat window's visivility */
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
     * @param sessionId  - The unique identifier for the chat session
     */
    startSession: (sessionId: string) => void;

    /**
     * Requests an agent handoff, indicating that the user needs human assistance
     */
    requestAgentHandoff: () => void;
    
    /**
     * Sets the current session status, which can be 'bot', 'pending_agent', 'in_progress', or 'closed'
     * @param status - The new status of the chat session
     * */
    setSessionStatus: (status: ChatSessionStatus) => void;

    /**
     * Resets the chat state, clearing all messages and resetting the session ID
     */
    resetChat: () => void;
}

/**
 * The initial welcome message for the chatbot.
 */
const initialMessage: Message = {
    id: 'init-1',
    content: "Hi! I'm the virtual assistant for GYB Connect. How can I help you today?",
    role: 'assistant',
    timestamp: new Date()
};

/**
 * Zustand store for managing the chatbot's state.
 */
export const useChatStore = create<ChatState>((set, get) => ({

    messages: [initialMessage],
    isOpen: false,
    isLoading: false,
    sessionId: null,
    status: 'bot',

    toggleChat: () => set((state) => ({
        isOpen: !state.isOpen
    })),

    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
    })),

    setIsLoading: (isLoading) => set({ isLoading }),

    startSession: (sessionId: string) => set({
        sessionId,
        status: 'bot',
        messages: [initialMessage]
    }),

    requestAgentHandoff: () => {
        const currentState = get();

        if (currentState.status === 'bot') {
            set({status: 'pending_agent' });
        }
    },

    setSessionStatus: (status: ChatSessionStatus) => set({
        status: status  
    }),

    resetChat: () => set({
        messages: [initialMessage],
        sessionId: null,
        status: 'bot',
        isLoading: false,
    })

}))