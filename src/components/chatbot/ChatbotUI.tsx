// app/components/chatbot/ChatbotUI.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '@/hooks/useChatbot';
import { User, Send, SendHorizonal, LucideSend, SendIcon, User2 } from 'lucide-react';

/**
 * @file Renders the complete user interface for the chatbot.
 * @description This is a client component that consumes the `useChatbot` hook
 * to get all its state and logic. Its sole responsibility is presentation.
 */
export const ChatbotUI: React.FC = () => {
  const { messages, isOpen, isLoading, toggleChat, sendMessage, status, startNewChat, config } = useChatbot();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Effect to automatically scroll to the latest message.
   */
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  /**
   * Handles the form submission to send a message.
   */
  const handleSendMessage = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;
    sendMessage(inputMessage);
    setInputMessage('');
  };

  /**
   * Allows sending a message by pressing the Enter key without Shift.
   * @param {React.KeyboardEvent<HTMLTextAreaElement>} e - The keyboard event.
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const botColor = `bg-[${config.botColor}]`

  console.log("CONFIG: ", config.botColor)
  console.log("COLOR: ", botColor)

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={toggleChat}
        style={{ backgroundColor: config.botColor }}
        className={`fixed bottom-6 right-6 z-[1000] hover:opacity-90 text-white rounded-full p-4 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300`}
        aria-label={isOpen ? "Close Chat" : "Open Chat"}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        )}
      </button>

      {/* Chat Panel */}
      <div className={`fixed bottom-24 right-6 z-[999] w-full max-w-sm h-[70vh] max-h-[500px] bg-white rounded-lg shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {/* Header */}
        <div
          className={`text-white p-4 rounded-t-lg flex-shrink-0`}
          style={{ backgroundColor: config.botColor }}
        >
          <h3 className="font-semibold text-lg">{config.botName}</h3>
          <p className="text-sm opacity-90">How can I help you today?</p>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* <div className={`max-w-[80%] px-4 py-2 rounded-xl ${message.role === 'user' ? 'bg-blue-500 text-white' :
                message.role === 'assistant' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800 border border-red-200' // System/Error message style
                }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div> */}

              <div className={`max-w-[80%] px-4 py-2 rounded-xl ${message.role === 'user' ? 'bg-blue-500 text-white' :
                message.role === 'assistant' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800 border border-red-200' // System/Error message style
                }`}
                style={
                  message.role === 'user'
                    ? { backgroundColor: config.botColor }
                    : undefined
                }
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>

            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-xl">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Typing</span>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-3 border-t bg-white rounded-b-lg flex-shrink-0">
          {status === 'closed' ? (
            <div className="text-center p-2">
              <p className="text-sm text-gray-600 mb-2">This chat session has ended.</p>
              {/* --- ¡EL NUEVO BOTÓN! --- */}
              <button
                onClick={startNewChat}
                style={{ backgroundColor: config.botColor }}
                className={`px-4 py-2 text-white rounded-lg text-sm hover:opacity-90`}
              >
                Start New Chat
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  status === 'in_progress' ? 'Reply to the agent' :
                    status === 'pending_agent' ? 'Waiting for an agent to take over...' :
                      'Ask about our services...'
                }
                className="text-black flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none"
                rows={1}
                disabled={isLoading || status === 'pending_agent'}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim() || status === 'pending_agent'}
                style={{ backgroundColor: config.botColor }}
                className={`hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors flex items-center justify-center aspect-square`}
                aria-label="Send Message"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                {/* <Send /> */}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};