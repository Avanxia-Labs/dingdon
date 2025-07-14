// app/hooks/useChatbot.ts
'use client';
import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { useChatStore } from '@/stores/chatbotStore';
import { Message, ChatSessionStatus } from '@/types/chatbot';
import { chatbotServiceClient } from '@/services/client/chatbotServiceClient';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';


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
  const { messages, addMessage, setIsLoading, toggleChat, status, sessionId, startSession, setSessionStatus, resetChat, workspaceId, setWorkspaceId, config, setConfig, error, setError } = useChatStore(
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
      workspaceId: state.workspaceId,
      setWorkspaceId: state.setWorkspaceId,
      config: state.config,
      setConfig: state.setConfig,
      error: state.error,
      setError: state.setError,
    }))
  );

  // Reference to the socket connection
  const socketRef = useRef<Socket | null>(null);


  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).chatbotConfig?.workspaceId) {
      const id = (window as any).chatbotConfig.workspaceId;
      if (id) {
        setWorkspaceId(id);
        setError(null); // Limpiar cualquier error anterior al encontrar un ID
      } else {
        // Si el ID está vacío, establecemos un error
        setError("Configuration error: Workspace ID is missing.");
      }
    }
  }, [setWorkspaceId, setError]);


  // - useEffect de WebSocket 

  useEffect(() => {
    
    if (workspaceId && !sessionId) {
        console.log('[Chatbot] Workspace ID presente. Iniciando nueva sesión...');
        startSession();
    }

    if (sessionId && !socketRef.current) {
      // Initialize the socket connection
      const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001')
      socketRef.current = socket;

      // 🔧 CAMBIO 1: Configurar listeners ANTES de hacer join
      socket.on('agent_message', (message: Message) => {
        console.log(`[Chatbot] Agent message received:`, message);
        addMessage(message);
      });

      socket.on('status_change', (newStatus: ChatSessionStatus) => {
        console.log(`[Chatbot] Status change to: ${newStatus}`);
        setSessionStatus(newStatus);

        // 🔧 CAMBIO 2: Re-join INMEDIATAMENTE cuando cambia el status
        if (newStatus === 'in_progress' && sessionId) {
          socket.emit('join_session', sessionId);
          console.log(`[Chatbot] Re-joined session ${sessionId} for agent chat`);
        }
      });

      // 🔧 CAMBIO 3: Join inicial después de configurar listeners
      socket.emit('join_session', sessionId);
      console.log(`[Chatbot] Joined session ${sessionId}`);

      // 🔧 CAMBIO 4: Listener para confirmar que estamos en la sala
      socket.on('connect', () => {
        console.log(`[Chatbot] Socket connected, re-joining session ${sessionId}`);
        socket.emit('join_session', sessionId);
      });

      // 🔧 CAMBIO 5: Listener para reconexión
      socket.on('disconnect', () => {
        console.log(`[Chatbot] Socket disconnected`);
      });

      socket.on('reconnect', () => {
        console.log(`[Chatbot] Socket reconnected, re-joining session ${sessionId}`);
        socket.emit('join_session', sessionId);
      });
    }

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }
  }, [workspaceId, sessionId, startSession, setSessionStatus, addMessage]);

  // --- USEEFFECT PARA CARGAR LA CONFIG DEL BOT! ---
  useEffect(() => {
    if (workspaceId) {
      const fetchConfig = async () => {
        try {
          const response = await fetch(`/api/public/config/${workspaceId}`);
          if (response.ok) {
            const data = await response.json();
            setConfig({
              botName: data.bot_name || 'Virtual Assistant',
              botColor: data.bot_color || '#007bff',
            });
          }
        } catch (error) {
          console.error("Failed to fetch public bot config:", error);
        }
      };
      fetchConfig();
    }
  }, [workspaceId, setConfig]);

  const mutation = useMutation({

    mutationFn: (variables: {
      workspaceId: string,
      message: string,
      sessionId: string,
      history: Message[],
    }) => chatbotServiceClient.postChatMessage(variables.workspaceId, variables.message, variables.sessionId, variables.history),

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
      if (socketRef.current && sessionId && workspaceId) {
        socketRef.current.emit('user_message', { workspaceId, sessionId, message: assistantMessage })
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

    console.log('🔍 [useChatbot] sendMessage called with:', {
      content,
      contentTrim: content.trim(),
      mutationPending: mutation.isPending,
      sessionId,
      workspaceId,
      status,
      messagesCount: messages.length
    });

    if (!content.trim()) {
      console.log('❌ [useChatbot] Message rejected: content is empty');
      return;
    }

    if (mutation.isPending) {
      console.log('❌ [useChatbot] Message rejected: mutation is pending');
      return;
    }

    if (!sessionId) {
      console.log('❌ [useChatbot] Message rejected: no sessionId');
      return;
    }

    if (!workspaceId) {
      console.log('❌ [useChatbot] Message rejected: no workspaceId');
      return;
    }

    console.log('✅ [useChatbot] All checks passed, creating user message');

    if (!content.trim() || mutation.isPending || !sessionId || !workspaceId) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date(),
    };

    addMessage(userMessage);

    // Siempre enviamos el mensaje del usuario al servidor para que se guarde y/o reenvíe
    if (socketRef.current) {
      // --- CAMBIO: Añadimos workspaceId al payload ---
      socketRef.current.emit('user_message', { workspaceId, sessionId, message: userMessage });
    }

    // Solo llamamos a la IA si el estado es 'bot'
    if (status === 'bot') {
      const updatedHistory = [...messages, userMessage];
      // --- CAMBIO: Pasamos el workspaceId a la mutación ---
      mutation.mutate({ workspaceId, message: content, sessionId, history: updatedHistory });
    }
  };



  /**
   * Function to resets the chat state if the chat is being closed.
   */
  const startNewChat = () => {
    // Disconnect the current socket if it exists
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    // Reset the chat state
    resetChat();
  }

  return {
    messages,
    status,
    isLoading: mutation.isPending,
    config,
    toggleChat,
    sendMessage,
    startNewChat,
    error
  };
};

