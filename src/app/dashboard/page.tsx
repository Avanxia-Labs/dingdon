/**
 * Interfaz donde un agente humano puede ver que hay un chat en espera
 * porque un usuario ha solicitado contactar directamente con un humano
 */

"use client"

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message } from '@/types/chatbot';
import { redirect } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useDesktopNotification } from '@/hooks/useDesktopNotification';

interface ChatRequest {
    sessionId: string;
    initialMessage: Message
}

const WEBSOCKET_API_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';

const AgentDashboard: React.FC = () => {
    const [requests, setRequests] = useState<ChatRequest[]>([])
    const [activeChat, setActiveChat] = useState<ChatRequest | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const socketRef = useRef<Socket | null>(null)

    const {
        playSound, 
        isEnabled: isSoundEnabled, 
        requestPermission: requestSoundPermission
    } = useNotificationSound('/notification.mp3')
    
    const {
        permission: notificationPermission, 
        requestPermission: requestDesktopPermission, 
        showNotification
    } = useDesktopNotification();

    // Referencia que apuntará al final de la lista de mensajes.
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // --- Obtener datos de la sesion ---
    const { data: session, status } = useSession({
        required: true, // Redirige si no hay sesión
        onUnauthenticated() {
            // Si no esta autenticado, redirige a la página de login
            redirect('/login')
        }
    })

    if (status === 'loading') {
        return <div className="flex h-screen items-center justify-center">Loading session...</div>;
    }


    // --- EFECTO 1: Conexión y listeners globales ---
    useEffect(() => {
        const socket = io(WEBSOCKET_API_URL);
        socketRef.current = socket;

        socket.emit('join_agent_dashboard');

        socket.on('new_handoff_request', (request: ChatRequest) => {

            //setRequests(prev => [...prev, request]);

            // Añadir solo si no existe para evitar duplicados en reconexiones
            setRequests(prev => prev.some(r => r.sessionId === request.sessionId) ? prev : [...prev, request]);

            // Reproducir sonido de notificación
            playSound(); 

            // Mostrar notificación de escritorio
            showNotification('New Chat Request', {
                body: `Session: ${request.sessionId.slice(-6)}\n"${request.initialMessage.content}"`,
                icon: '/favicon.ico', // Asegúrate de tener un icono disponible
            })
        });

        // Escucha cuando OTRO agente ha tomado un chat.
        socket.on('chat_taken', ({ sessionId }: { sessionId: string }) => {
            console.log(`[Dashboard] Recibido 'chat_taken' para la sesión: ${sessionId}. Eliminando de la lista.`);
            // Elimina la solicitud de la lista de este agente.
            setRequests(prev => prev.filter(req => req.sessionId !== sessionId));
        });


        // Limpieza: desconectar al desmontar el componente
        return () => {
            socket.disconnect();
        };
    }, [playSound, showNotification]); 


    // --- EFECTO 2: Listener para mensajes del chat activo ---
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        // Definimos la función del listener aquí para poder removerla después
        const handleIncomingMessage = ({ sessionId, message }: { sessionId: string; message: Message }) => {
            // Solo actualizamos si el mensaje es para el chat que estamos viendo
            if (activeChat?.sessionId === sessionId) {
                //setMessages(prev => [...prev, message]);
                setMessages(prev => {
                    // Verificamos si el mensaje ya existe para evitar duplicados
                    if (prev.some(m => m.id === message.id)) {
                        return prev; // Si ya existe, no hacemos nada
                    }
                    return [...prev, message]; // Si no existe, lo agregamos
                })
            }
        };

        socket.on('incoming_user_message', handleIncomingMessage);

        // Limpieza: removemos el listener anterior para evitar duplicados
        return () => {
            socket.off('incoming_user_message', handleIncomingMessage);
        };
    }, [activeChat]); // Depende de `activeChat` para saber qué sesión escuchar.


    // --- EFECTO 3: Ir automaticamente al ultimo mensaje del chat ---
    useEffect(() => {
        // Esta funcion se ejecutara cada vez que 'messages' se actualice
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth'
        })
    }, [messages])

    const handleSelectChat = async (request: ChatRequest) => {
        setActiveChat(request);

        try {
            console.log(`Fetching history for ${request.sessionId}...`)
            const response = await fetch(`${WEBSOCKET_API_URL}/api/history/${request.sessionId}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch chat history. Status: ${response.status}, Body: ${errorText}`);
            }

            const data = await response.json();
            setMessages(data || []); // Cargar el historial completo
        } catch (error) {
            console.error(">>> DETAILED FETCH ERROR:", error);
            setMessages([request.initialMessage]);
        }

        // Notifica al servidor que un agente se ha unido a este chat
        if (socketRef.current) {
            socketRef.current.emit('agent_joined', {
                sessionId: request.sessionId
            })
        }
    };

    const handleSendMessage = () => {
        if (!input.trim() || !activeChat || !socketRef.current) return;

        const agentMessage: Message = {
            id: `agent-${Date.now()}`,
            content: input,
            role: 'agent',
            agentName: 'Support Team', // Podemos hacerlo dinámico para que cargue el nombre del agente
            timestamp: new Date(),
        };

        // Enviar mensaje al servidor para que lo reenvíe al usuario
        socketRef.current.emit('agent_message', {
            sessionId: activeChat.sessionId,
            message: agentMessage,
        });

        setMessages(prev => [...prev, agentMessage]);
        setInput('');
    };

    const handleCloseChat = () => {
        if (!activeChat || !socketRef.current) return;

        console.log(`Closing chat for session: ${activeChat.sessionId}`)

        // Notificar al servidor que el agente ha cerrado el chat
        socketRef.current.emit('close_chat', { sessionId: activeChat.sessionId })

        // Limpiar la interfaz del agente
        // Quitar el chat de la lista de solicitudes (mas adelante, moverlo a una lista de "resueltos")
        setRequests(prev => prev.filter(
            req => req.sessionId !== activeChat.sessionId
        ))

        // Limpia el chat activo
        setActiveChat(null)
        setMessages([]);
    }

    // Función para manejar el banner de permisos
    const handleEnablePermissions = () => {
        requestDesktopPermission();
        requestSoundPermission(); // El hook de sonido ya maneja el desbloqueo
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">

            {/* Notificación de permisos */}
            {(notificationPermission === 'default' || !isSoundEnabled) && (
                <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-300 text-yellow-800 p-3 rounded-lg shadow-md z-10">
                    <p className="font-semibold">Enable Alerts</p>
                    <p className="text-sm mb-2">Click to enable desktop and sound notifications.</p>
                    <button 
                        onClick={handleEnablePermissions}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                    >
                        Enable
                    </button>
                </div>
            )}

            {/* Panel de Solicitudes en Espera */}
            <div className="w-1/4 border-r bg-white p-4 flex flex-col justify-between">
                <div>
                    <h2 className="text-xl font-bold mb-4">Chat Requests</h2>
                    <div className="space-y-2">
                        {requests.map(req => (
                            <div
                                key={req.sessionId}
                                onClick={() => handleSelectChat(req)}
                                className={`p-3 rounded-lg cursor-pointer ${activeChat?.sessionId === req.sessionId ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                <p className="font-semibold">Session: {req.sessionId.slice(-6)}</p>
                                <p className="text-sm truncate">{req.initialMessage.content}</p>
                            </div>
                        ))}
                        {requests.length === 0 && <p className="text-gray-500">No pending requests.</p>}
                    </div>
                </div>

                {/* --- INFORMACIÓN DEL AGENTE Y BOTÓN DE LOGOUT --- */}
                <div className="pt-4 border-t">
                    <p className="text-sm font-semibold text-gray-800">Agent: {session.user?.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{session.user?.email}</p>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            

            {/* Panel de Chat Activo */}
            <div className="flex-1 flex flex-col">
                {activeChat ? (
                    <>
                        <div className="p-4 border-b bg-white flex flex-col items-start sm:flex-row sm:justify-between">
                            <h3 className="text-lg font-bold">Active Chat: {activeChat.sessionId}</h3>
                            <button
                                onClick={handleCloseChat}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                            >
                                Close Chat
                            </button>
                        </div>
                        {/* Área de Mensajes */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`max-w-[70%] px-4 py-2 rounded-xl ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                                        }`}>
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                </div>
                            ))}

                            <div ref={messagesEndRef} />
                        </div>
                        {/* Área de Input */}
                        <div className="p-4 bg-white border-t">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1 p-2 border rounded-lg"
                                    placeholder="Type your response..."
                                />
                                <button onClick={handleSendMessage} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    Send
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-xl text-gray-500">Select a chat to begin</p>
                    </div>
                )}
            </div>
        </div>
    );


}

export default AgentDashboard;



