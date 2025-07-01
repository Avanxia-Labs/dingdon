// app/dashboard/components/ChatPanel.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message } from '@/types/chatbot';
import { useSession } from 'next-auth/react';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useDesktopNotification } from '@/hooks/useDesktopNotification';

interface ChatRequest {
    sessionId: string;
    initialMessage: Message;
}

interface ChatPanelProps {
    workspaceId: string;
}

const WEBSOCKET_API_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';

export const ChatPanel: React.FC<ChatPanelProps> = ({ workspaceId }) => {
    const { data: session } = useSession(); // Lo necesitamos para el nombre del agente

    const [requests, setRequests] = useState<ChatRequest[]>([]);
    const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const activeChatSessionIdRef = useRef(activeChatSessionId);

    const { playSound, isEnabled: isSoundEnabled, requestPermission: requestSoundPermission } = useNotificationSound('/notification.mp3');
    const { permission: notificationPermission, requestPermission: requestDesktopPermission, showNotification } = useDesktopNotification();

    useEffect(() => {
        activeChatSessionIdRef.current = activeChatSessionId;
    }, [activeChatSessionId]);

    useEffect(() => {
        if (!workspaceId) return;
        const socket = io(WEBSOCKET_API_URL);
        socketRef.current = socket;
        socket.emit('join_agent_dashboard', { workspaceId });

        socket.on('new_chat_request', (request: ChatRequest) => {
            setRequests(prev => prev.some(r => r.sessionId === request.sessionId) ? prev : [...prev, request]);
            playSound();
            showNotification('New Chat Request', { body: `Session: ${request.sessionId.slice(-6)}` });
        });

        socket.on('chat_taken', ({ sessionId }) => setRequests(prev => prev.filter(r => r.sessionId !== sessionId)));
        socket.on('assignment_success', ({ sessionId, history }) => {
            setActiveChatSessionId(sessionId);
            setMessages(history);
        });
        socket.on('assignment_failure', ({ message }) => alert(message));
        socket.on('incoming_user_message', ({ sessionId, message }) => {
            if (activeChatSessionIdRef.current === sessionId) {
                setMessages(prev => [...prev, message]);
            }
        });
        socket.on('agent_message', (message) => {
            if (activeChatSessionIdRef.current === message.sessionId) {
                setMessages(prev => [...prev, message]);
            }
        });

        return () => { socket.disconnect(); };
    }, [workspaceId, playSound, showNotification]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectChat = (request: ChatRequest) => {
        if (socketRef.current && workspaceId) {
            socketRef.current.emit('agent_joined', { workspaceId, sessionId: request.sessionId });
        }
    };

    const handleSendMessage = () => {
        if (!input.trim() || !activeChatSessionId || !socketRef.current || !workspaceId) return;
        const agentMessage: Message = {
            id: `agent-${Date.now()}`,
            content: input,
            role: 'agent',
            agentName: session?.user?.name || 'Support',
            timestamp: new Date(),
        };
        socketRef.current.emit('agent_message', { workspaceId, sessionId: activeChatSessionId, message: agentMessage });
        setMessages(prev => [...prev, agentMessage]);
        setInput('');
    };

    const handleCloseChat = () => {
        if (!activeChatSessionId || !socketRef.current || !workspaceId) return;
        socketRef.current.emit('close_chat', { workspaceId, sessionId: activeChatSessionId });
        setRequests(prev => prev.filter(req => req.sessionId !== activeChatSessionId));
        setActiveChatSessionId(null);
        setMessages([]);
    };

    const handleEnablePermissions = () => {
        requestDesktopPermission();
        requestSoundPermission();
    };

    return (
        <div className="flex h-full">
            {(notificationPermission === 'default' || !isSoundEnabled) && (
                <div className="absolute top-4 right-4 bg-yellow-100 border-yellow-300 text-yellow-800 p-3 rounded-lg shadow-md z-10">
                    <p className="font-semibold">Enable Alerts</p>
                    <p className="text-sm mb-2">Click to enable desktop and sound notifications.</p>
                    <button onClick={handleEnablePermissions} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">Enable</button>
                </div>
            )}
            <div className="w-1/4 border-r bg-white p-4 flex flex-col">
                <h2 className="text-xl font-bold mb-4">Chat Requests</h2>
                <div className="space-y-2 flex-1 overflow-y-auto">
                    {requests.map(req => (
                        <div key={req.sessionId} onClick={() => handleSelectChat(req)} className={`p-3 rounded-lg cursor-pointer ${activeChatSessionId === req.sessionId ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                            <p className="font-semibold">Session: {req.sessionId.slice(-6)}</p>
                            <p className="text-sm truncate">{req.initialMessage.content}</p>
                        </div>
                    ))}
                    {requests.length === 0 && <p className="text-gray-500">No pending requests.</p>}
                </div>
            </div>
            <div className="flex-1 flex flex-col">
                {activeChatSessionId ? (
                    <>
                        <div className="p-4 border-b bg-white flex justify-between items-center">
                            <h3 className="text-lg font-bold">Active Chat: {activeChatSessionId}</h3>
                            <button onClick={handleCloseChat} className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">Close Chat</button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map(msg => {
                                const isOutgoing = msg.role === 'agent' || msg.role === 'assistant';
                                return (
                                    <div key={msg.id} className={`flex items-end gap-2 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] px-4 py-2 rounded-xl ${isOutgoing ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 bg-white border-t">
                            <div className="flex space-x-2">
                                <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 p-2 border rounded-lg" placeholder="Type your response..." />
                                <button onClick={handleSendMessage} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Send</button>
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
};