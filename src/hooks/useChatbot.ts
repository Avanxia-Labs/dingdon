// app/hooks/useChatbot.ts
'use client';
import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { useChatStore } from '@/stores/chatbotStore';
import { Message, ChatSessionStatus } from '@/types/chatbot';
import { chatbotServiceClient } from '@/services/client/chatbotServiceClient';
import { saveHistoryBeforeResetClient } from '@/lib/chatHistoryService';
import { io, Socket } from 'socket.io-client';


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
  const {
    messages,
    addMessage,
    setIsLoading,
    toggleChat,
    status,
    sessionId,
    startSession,
    setSessionStatus,
    resetChat,
    workspaceId,
    setWorkspaceId,
    config,
    setConfig,
    error,
    setError,
    language,
    initializeOrSyncWorkspace,
    leadCollected,
    setLeadCollected,
    updateLastActivity,
    getHistoryData,
    agentName,
    setAgentName,
    botPaused,
    setBotPaused
  } = useChatStore(
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
      language: state.language,
      initializeOrSyncWorkspace: state.initializeOrSyncWorkspace,
      leadCollected: state.leadCollected,
      setLeadCollected: state.setLeadCollected,
      updateLastActivity: state.updateLastActivity,
      getHistoryData: state.getHistoryData,
      agentName: state.agentName,
      setAgentName: state.setAgentName,
      botPaused: state.botPaused,
      setBotPaused: state.setBotPaused
    }))
  );

  // Reference to the socket connection
  const socketRef = useRef<Socket | null>(null);
  const waitingMessageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- EFECTO PARA VERIFICAR INACTIVIDAD DE 24 HORAS ---
  useEffect(() => {
    const checkInactivity = async () => {
      const historyData = getHistoryData();
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      // Verificar si han pasado más de 24 horas desde la última actividad
      if (historyData.sessionId && now - historyData.lastActivity > twentyFourHours) {
        console.log('[useChatbot] 24 horas de inactividad detectadas. Guardando historial y reseteando...');
        
        // Guardar historial antes del reinicio por inactividad
        await saveHistoryBeforeResetClient(
          historyData.sessionId ?? null,
          historyData.workspaceId ?? null,
          historyData.messages
        );
        
        // Resetear el estado
        resetChat();
      }
    };
    
    checkInactivity();
  }, []); // Solo ejecutar una vez al montar el componente

  // --- EFECTO CLAVE: GESTOR DE CAMBIO DE WORKSPACE ---
  useEffect(() => {
    const handleWorkspaceChange = async () => {
      // En el iframe del widget, el workspaceId ya se obtiene de los parámetros URL
      // y se establece en el store, así que no necesitamos window.chatbotConfig
      
      // Si ya tenemos workspaceId en el store, no hacer nada más
      if (workspaceId) {
        console.log(`[useChatbot] Workspace ID ya configurado: ${workspaceId}`);
        return;
      }

      // Solo si estamos en el contexto del widget principal (no iframe)
      // intentamos obtener de window.chatbotConfig
      const newWorkspaceIdFromConfig = (window as any).chatbotConfig?.workspaceId;

      if (newWorkspaceIdFromConfig) {
        // 3. Guardar historial antes del posible cambio de workspace
        const historyData = getHistoryData();
        if (historyData.workspaceId && historyData.workspaceId !== newWorkspaceIdFromConfig) {
          await saveHistoryBeforeResetClient(
            historyData.sessionId ?? null,
            historyData.workspaceId ?? null,
            historyData.messages
          );
        }

        // 4. Cambiar workspace (síncrono)
        setWorkspaceId(newWorkspaceIdFromConfig);
      }
    };

    handleWorkspaceChange();
  }, [workspaceId, setWorkspaceId, getHistoryData]);


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
      socket.on('agent_message', (message: Message & { agentName?: string }) => {
        console.log(`[Chatbot] Agent message received:`, message);
        
        // Si es el primer mensaje del agente, guardar su nombre
        if (message.agentName && !agentName) {
          setAgentName(message.agentName);
        }
        
        addMessage(message);
        
        // Detener mensajes de espera cuando llega el agente
        if (waitingMessageIntervalRef.current) {
          clearInterval(waitingMessageIntervalRef.current);
          waitingMessageIntervalRef.current = null;
        }
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
      
      // Listener para control del bot
      socket.on('bot_control', (data: { action: 'pause' | 'resume', agentName?: string }) => {
        console.log(`[Chatbot] Bot control received:`, data);
        console.log(`[Chatbot] Current status before change: "${status}", botPaused: ${botPaused}`);
        setBotPaused(data.action === 'pause');
        
        // Cuando se reactiva el bot, asegurar que el status sea 'bot'
        if (data.action === 'resume') {
          console.log(`[Chatbot] Setting status to 'bot' for resume action`);
          setSessionStatus('bot');
        }
        
        console.log(`[Chatbot] After bot_control: status should be "${data.action === 'resume' ? 'bot' : status}", botPaused: ${data.action === 'pause'}`);
        
        if (data.agentName) {
          setAgentName(data.agentName);
        }
        
        // Mensaje del sistema indicando el cambio
        const systemMessage: Message = {
          id: `system-${Date.now()}`,
          content: data.action === 'pause' 
            ? `🔔 ${data.agentName || 'Un agente'} está revisando tu conversación. Por favor espera su respuesta.`
            : `🤖 El asistente virtual ha sido reactivado y puede continuar ayudándote.`,
          role: 'system' as any,
          timestamp: new Date(),
        };
        addMessage(systemMessage);
      });
      
      // Listener para cuando un agente toma el chat (solo para comandos de chat)
      socket.on('agent_assigned', (data: { agentName: string }) => {
        console.log(`[Chatbot] Agent assigned via command:`, data);
        setAgentName(data.agentName);
        
        // Detener mensajes de espera
        if (waitingMessageIntervalRef.current) {
          clearInterval(waitingMessageIntervalRef.current);
          waitingMessageIntervalRef.current = null;
        }
      });

      // 🔧 CAMBIO 3: Join inicial después de configurar listeners
      socket.emit('join_session', sessionId);
      console.log(`[Chatbot] Joined session ${sessionId}`);
      console.log(`[Chatbot] Listeners configured. Waiting for bot_control events...`);
      
      // Debug: Log all incoming events
      socket.onAny((eventName, ...args) => {
        console.log(`[Chatbot] Received event: ${eventName}`, args);
      });

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
      if (waitingMessageIntervalRef.current) {
        clearInterval(waitingMessageIntervalRef.current);
        waitingMessageIntervalRef.current = null;
      }
    }
  }, [workspaceId, sessionId, startSession, setSessionStatus, addMessage]);

  // --- USEEFFECT PARA CARGAR LA CONFIG DEL BOT! ---
  // useEffect(() => {
  //   if (workspaceId) {
  //     const fetchConfig = async () => {
  //       try {
  //         const response = await fetch(`/api/public/config/${workspaceId}`);
  //         if (response.ok) {
  //           const data = await response.json();
  //           setConfig({
  //             botName: data.bot_name || 'Virtual Assistant',
  //             botColor: data.bot_color || '#007bff',
  //           });
  //         }
  //       } catch (error) {
  //         console.error("Failed to fetch public bot config:", error);
  //       }
  //     };
  //     fetchConfig();
  //   }
  // }, [workspaceId, setConfig]);

  useEffect(() => {
    if (workspaceId) {
      const fetchConfig = async () => {
        try {
          const response = await fetch(`/api/public/config/${workspaceId}`);
          if (response.ok) {
            const data = await response.json();
            const newConfig = {
              botName: data.bot_name || 'Virtual Assistant',
              botColor: data.bot_color || '#007bff',
              botAvatarUrl: data.bot_avatar_url,
              botIntroduction: data.bot_introduction,
            };
            setConfig(newConfig);


            // Envía un mensaje a la ventana padre (la página anfitriona) con el nuevo color.
            if (window.parent) {
              window.parent.postMessage({
                type: 'CHATBOT_COLOR_UPDATE', // Un identificador para nuestro mensaje
                color: newConfig.botColor
              }, '*'); // '*' permite enviarlo a cualquier dominio anfitrión.
            }
            

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
      language: string,
    }) => chatbotServiceClient.postChatMessage(variables.workspaceId, variables.message, variables.sessionId, variables.history, variables.language),

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

    // Actualizar actividad cuando el usuario envía un mensaje
    updateLastActivity();

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

    // Solo llamamos a la IA si el estado es 'bot' Y el bot no está pausado
    console.log(`[useChatbot] Checking AI call conditions: status="${status}", botPaused=${botPaused}`);
    if (status === 'bot' && !botPaused) {
      console.log('✅ [useChatbot] Calling AI - conditions met');
      const updatedHistory = [...messages, userMessage];
      // --- CAMBIO: Pasamos el workspaceId a la mutación ---
      mutation.mutate({ workspaceId, message: content, sessionId, history: updatedHistory, language });
    } else if (botPaused) {
      console.log('❌ [useChatbot] Bot is paused, message not sent to AI');
    } else if (status === 'pending_agent') {
      // Si está esperando un agente, iniciar mensajes periódicos si no están activos
      if (!waitingMessageIntervalRef.current) {
        let messageCount = 0;
        const waitingMessages = [
          '🕑 Seguimos buscando un agente disponible. Por favor, espera un momento más...',
          '🔍 Todos nuestros agentes están ocupados. Te atenderemos en breve...',
          '✅ Tu solicitud está en cola. Un agente te atenderá pronto...',
          '🙏 Gracias por tu paciencia. Estamos conectando con el próximo agente disponible...'
        ];
        
        waitingMessageIntervalRef.current = setInterval(() => {
          const waitingMessage: Message = {
            id: `system-wait-${Date.now()}`,
            content: waitingMessages[messageCount % waitingMessages.length],
            role: 'system' as any,
            timestamp: new Date(),
          };
          addMessage(waitingMessage);
          messageCount++;
        }, 15000); // Cada 15 segundos
      }
    }
  };



  /**
   * Function to resets the chat state if the chat is being closed.
   */
  const startNewChat = async () => {
    // Guardar historial antes del reinicio
    const historyData = getHistoryData();
    await saveHistoryBeforeResetClient(
      historyData.sessionId ?? null,
      historyData.workspaceId ?? null,
      historyData.messages
    );

    // Disconnect the current socket if it exists
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    // Reset the chat state (ahora síncrono)
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
    error,
    leadCollected,
    setLeadCollected,
    workspaceId,
    agentName,
    botPaused
  };
};

