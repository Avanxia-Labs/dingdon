// app/hooks/useChatbot.ts
'use client';
import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { useChatStore } from '@/stores/chatbotStore';
import { Message, ChatSessionStatus } from '@/types/chatbot';
import { chatbotServiceClient } from '@/services/client/chatbotServiceClient';
import {io, Socket} from 'socket.io-client';


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
  const { messages, addMessage, setIsLoading, toggleChat, isOpen, status, sessionId, startSession, setSessionStatus, resetChat  } = useChatStore(
    // useShallow prevents re-renders if other parts of the state change
    useShallow((state) => ({
      messages: state.messages,
      addMessage: state.addMessage,
      setIsLoading: state.setIsLoading,
      toggleChat: state.toggleChat,
      isOpen: state.isOpen,
      isLoading: state.isLoading,
      status: state.status, 
      sessionId: state.sessionId, 
      startSession: state.startSession, 
      setSessionStatus: state.setSessionStatus,
      resetChat: state.resetChat,
    }))
  );

  // Reference to the socket connection
  const socketRef = useRef<Socket | null>(null);

  // --- EFECTO PARA GESTIONAR LA CONEXIÓN WEBSOCKET ---
  useEffect(() => {

    if (isOpen && !sessionId) {
      const newSessionId = `session-${Date.now()}`;
      startSession(newSessionId);
    }

    if (sessionId && !socketRef.current) {
      // Initialize the socket connection only if we have a sessionId and no existing socket
      const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001')
      socketRef.current = socket;

      // Join the session room using the sessionId
      socket.emit('join_session', sessionId);

      // Listen from new messages of the agent
      socket.on('agent_message', (message: Message) => {
        addMessage(message);
      })
    
      // Listen for session status changes
      socket.on('status_change', (newStatus: ChatSessionStatus) => {
        setSessionStatus(newStatus);
      })
    }
  
    // Cleanup function to disconnect the socket when the component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null; // Clear the reference to prevent memory leaks
      }
    }
  
  }, [isOpen, sessionId, startSession, setSessionStatus, addMessage])



   const mutation = useMutation({
    // The mutation function now calls our clean client service
    mutationFn: (variables: {message: string, sessionId: string, history: Message[]}) => chatbotServiceClient.postChatMessage(variables.message, variables.sessionId, variables.history),

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

      // Send the bot's message to save it
      if(socketRef.current && sessionId) {
        socketRef.current.emit('user_message', {sessionId, message: assistantMessage})
      }
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
    if (!content.trim() || mutation.isPending || !sessionId) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date(),
    };
    addMessage(userMessage);

    // Send the user message to save it
    if (socketRef.current && sessionId) {
      socketRef.current.emit('user_message', {sessionId, message: userMessage})
    }

    // We create an updated history to send it
    const updatedHistory = [...messages, userMessage]

    if (status === 'bot') {
      mutation.mutate({message: content, sessionId, history: updatedHistory});
    } else if (status === 'in_progress' && socketRef.current) {
      socketRef.current.emit('user_message', { sessionId, message: userMessage})
    }   
  };

   


  /**
   * Function to resets the chat state if the chat is being closed.
   */
  const startNewChat = () => {
    // Disconnect the current socket if it exists
    if(socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    // Reset the chat state
    resetChat();
  }

  return {
    messages,
    isOpen,
    status,
    isLoading: mutation.isPending, 
    toggleChat,
    sendMessage,
    startNewChat,
  };
};