import {create} from 'zustand'
import { Message } from '@/types/chatbot'

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
export const useChatStore = create<ChatState>((set) => ({

    messages: [initialMessage],
    isOpen: false,
    isLoading: false,

    toggleChat: () => set((state) => ({
        isOpen: !state.isOpen
    })),

    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
    })),

    setIsLoading: (isLoading) => set({ isLoading })
}))