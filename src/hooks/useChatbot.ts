// app/hooks/useChatbot.ts
'use client';

import { useMutation } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { useChatStore } from '@/stores/chatbotStore';
import { Message } from '@/types/chatbot';
import { chatbotServiceClient } from '@/services/client/chatbotServiceClient';

/**
 * @file The main client-side hook for managing the chatbot's state and logic.
 * @description This hook is the primary interface for the UI components. It integrates
 * the Zustand store for reactive state management and React Query for handling
 * asynchronous API calls to the backend via the `chatbotServiceClient`.
 */

/**
 * A custom hook that provides all the necessary state and functions for the chatbot UI.
 * @returns An object containing the chat's state (messages, isOpen, isLoading) and
 * functions to interact with it (toggleChat, sendMessage).
 */
export const useChatbot = () => {
  const { messages, addMessage, setIsLoading, toggleChat, isOpen } = useChatStore(
    // useShallow prevents re-renders if other parts of the state change
    useShallow((state) => ({
      messages: state.messages,
      addMessage: state.addMessage,
      setIsLoading: state.setIsLoading,
      toggleChat: state.toggleChat,
      isOpen: state.isOpen,
      isLoading: state.isLoading,
    }))
  );

  const mutation = useMutation({
    // The mutation function now calls our clean client service
    mutationFn: (message: string) => chatbotServiceClient.postChatMessage(message),

    onMutate: () => {
      setIsLoading(true);
    },

    onSuccess: (reply) => {
      // The `data` from the mutation is the string reply from our backend
      const assistantMessage: Message = {
        id: `asst-${Date.now()}`,
        content: reply,
        role: 'assistant',
        timestamp: new Date(),
      };
      addMessage(assistantMessage);
    },

    onError: (error) => {
      console.error('Mutation Error in useChatbot:', error);
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        content: "I'm having trouble connecting. Please check your connection and try again.",
        role: 'system', // 'system' role for visually distinct error messages
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    },

    onSettled: () => {
      // This runs after onSuccess or onError
      setIsLoading(false);
    },
  });

  /**
   * Public function to send a new message.
   * It adds the user's message to the state immediately for a snappy UI
   * and then triggers the mutation to get the assistant's response.
   * @param {string} content - The text content of the user's message.
   */
  const sendMessage = (content: string) => {
    if (!content.trim() || mutation.isPending) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date(),
    };
    addMessage(userMessage);

    // Trigger the mutation to send the message to the backend
    mutation.mutate(content);
  };

  return {
    messages,
    isOpen,
    isLoading: mutation.isPending, // Use mutation's pending state as the source of truth
    toggleChat,
    sendMessage,
  };
};