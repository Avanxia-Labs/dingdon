// // app/components/chatbot/ChatbotUI.tsx
// 'use client';

// import React, { useState, useRef, useEffect } from 'react';
// import { useChatbot } from '@/hooks/useChatbot';
// import { Bot, User } from 'lucide-react';

// /**
//  * @file Renders the chat panel UI (header, messages, input).
//  * @description This component is designed to be displayed inside an iframe.
//  * It fills 100% of its container and handles all the chat interaction logic.
//  * Visibility of this component is controlled by the parent page via the iframe.
//  */
// export const ChatbotUI: React.FC = () => {
//   // NOTA: 'isOpen' y 'toggleChat' ya no son necesarios aquí.
//   const { messages, isLoading, sendMessage, status, startNewChat, config, error } = useChatbot();
//   const [inputMessage, setInputMessage] = useState('');
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     console.log('🔍 ChatbotUI Debug:', {
//       messagesCount: messages.length,
//       isLoading,
//       status,
//       error,
//       config
//     });
//   }, [messages, isLoading, status, error, config]);


//   console.log('ChatbotUI State:', { isLoading, status, error });

//   /**
//    * Effect to automatically scroll to the latest message.
//    * Se ejecuta cada vez que los mensajes cambian.
//    */
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   /**
//    * Handles the form submission to send a message.
//    */
//   const handleSendMessage = (e?: React.FormEvent<HTMLFormElement>) => {
//     e?.preventDefault();
//     if (!inputMessage.trim()) return;
//     sendMessage(inputMessage);
//     console.log('handleSendMessage triggered! y se envio: ', inputMessage);
//     setInputMessage('');
//   };

//   /**
//    * Allows sending a message by pressing the Enter key without Shift.
//    * @param {React.KeyboardEvent<HTMLTextAreaElement>} e - The keyboard event.
//    */
//   const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   return (
//     // CONTENEDOR PRINCIPAL: Ahora ocupa el 100% de su padre (el iframe).
//     // Ya no tiene 'position: fixed' ni transiciones de opacidad.
//     <div className="h-full w-full bg-white rounded-lg flex flex-col overflow-hidden">
//       {/* Header */}
//       <div
//         className="text-white p-4 rounded-t-lg flex-shrink-0"
//         style={{ backgroundColor: config.botColor }} // Uso de style para colores dinámicos es más seguro
//       >
//         <h3 className="font-semibold text-lg">{config.botName}</h3>
//         <p className="text-sm opacity-90">How can I help you today?</p>
//       </div>

//       {error ? (
//         // Si hay un error, mostramos un mensaje de error en lugar del chat
//         <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
//           <svg className="w-12 h-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
//           <h4 className="font-semibold text-gray-800">Oops! Something went wrong.</h4>
//           <p className="text-sm text-gray-500 mt-1">{error}</p>
//         </div>
//       ) : (
//         <>
//           {/* Messages Container */}
//           <div className="flex-1 overflow-y-auto p-4 space-y-4">
//             {messages.map((message) => (
//               <div
//                 key={message.id}
//                 className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
//               >
//                 <div
//                   className={`max-w-[80%] px-4 py-2 rounded-xl ${message.role === 'assistant' ? 'bg-gray-100 text-gray-800' :
//                       message.role === 'user' ? 'bg-blue-500 text-white' : // Este color será sobrescrito por el style
//                         'bg-slate-200 text-slate-700 border border-slate-400'
//                     }`}
//                   style={
//                     message.role === 'user'
//                       ? { backgroundColor: config.botColor }
//                       : undefined
//                   }
//                 >
//                   <div className="mb-1">
//                     <div className="flex items-center gap-1 mb-1">
//                       {message.role === 'assistant' ? (
//                         <div className="flex flex-row items-center gap-1">
//                           <Bot size={16} className='text-gray-500' />
//                           <span className="text-xs text-gray-500">Bot</span>
//                         </div>
//                       ) : message.role === 'user' ? null : (
//                         <div className="flex flex-row items-center gap-1">
//                           <User size={14} className='text-slate-500' />
//                           <span className="text-xs text-slate-500">Agent</span>
//                         </div>
//                       )}
//                     </div>
//                     <p className="text-sm whitespace-pre-wrap">{message.content}</p>
//                   </div>

//                   {message.role === 'assistant' && (
//                     <div className="mt-2 pt-2 text-xs text-gray-500 border-t border-gray-200">
//                       If you want to talk to a human please type: <br />
//                       <b>I want to talk to an agent</b>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//             {isLoading && (
//               <div className="flex items-end gap-2 justify-start">
//                 <div className="bg-gray-100 px-4 py-2 rounded-xl">
//                   <div className="flex items-center space-x-2">
//                     <span className="text-sm text-gray-500">Typing</span>
//                     <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
//                     <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
//                     <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
//                   </div>
//                 </div>
//               </div>
//             )}
//             <div ref={messagesEndRef} />
//           </div>

//           {/* Input Form */}
//           <div className="p-3 border-t border-t-gray-300 bg-white rounded-b-lg flex-shrink-0">
//             {status === 'closed' ? (
//               <div className="text-center p-2">
//                 <p className="text-sm text-gray-600 mb-2">This chat session has ended.</p>
//                 <button
//                   onClick={startNewChat}
//                   style={{ backgroundColor: config.botColor }}
//                   className="px-4 py-2 text-white rounded-lg text-sm hover:opacity-90"
//                 >
//                   Start New Chat
//                 </button>
//               </div>
//             ) : (
//               <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
//                 <textarea
//                   value={inputMessage}
//                   onChange={(e) => setInputMessage(e.target.value)}
//                   onKeyDown={handleKeyPress}
//                   placeholder={
//                     status === 'in_progress' ? 'Reply to the agent' :
//                       status === 'pending_agent' ? 'Waiting for an agent to take over...' :
//                         'Ask about our services...'
//                   }
//                   className="text-black flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none"
//                   rows={1}
//                   disabled={isLoading || status === 'pending_agent'}
//                 />
//                 <button
//                   type="submit"
//                   disabled={isLoading || !inputMessage.trim() || status === 'pending_agent'}
//                   style={{ backgroundColor: config.botColor }}
//                   className="hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors flex items-center justify-center aspect-square"
//                   aria-label="Send Message"
//                 >
//                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
//                 </button>
//               </form>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// };




'use client';

import React, { useState, useRef, useEffect } from 'react';
import { I18nProvider } from '@/providers/I18nProvider';
import { useTranslation } from 'react-i18next';
import { useChatbot } from '@/hooks/useChatbot';
import { useChatStore } from '@/stores/chatbotStore';
import { useSyncLanguage } from '@/hooks/useSyncLanguage';
import { Bot, User } from 'lucide-react';

const ChatInterface = () => {
    const { t } = useTranslation();
    const { messages, isLoading, sendMessage, status, startNewChat, config, error } = useChatbot();
    const language = useChatStore((state) => state.language);
    useSyncLanguage(language);
    
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    const handleSendMessage = (e?: React.FormEvent<HTMLFormElement>) => { e?.preventDefault(); if (!inputMessage.trim()) return; sendMessage(inputMessage); setInputMessage(''); };
    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };

    return (
        <div className="h-full w-full bg-white rounded-lg flex flex-col overflow-hidden">
            <div className="text-white p-4 rounded-t-lg flex-shrink-0" style={{ backgroundColor: config.botColor }}>
                <h3 className="font-semibold text-lg">{config.botName}</h3><p className="text-sm opacity-90">{t('chatbotUI.headerTitle')}</p>
            </div>
            {error ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                    <svg className="w-12 h-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h4 className="font-semibold text-gray-800">{t('chatbotUI.errorMessage')}</h4><p className="text-sm text-gray-500 mt-1">{error}</p>
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                            <div key={message.id} className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-4 py-2 rounded-xl ${message.role === 'assistant' ? 'bg-gray-100 text-gray-800' : 'bg-slate-200 text-slate-700 border border-slate-400'}`} style={message.role === 'user' ? { backgroundColor: config.botColor, color: 'white' } : undefined}>
                                    <div className="mb-1">
                                        <div className="flex items-center gap-1 mb-1">{message.role === 'assistant' ? (<div className="flex flex-row items-center gap-1"><Bot size={16} className='text-gray-500' /><span className="text-xs text-gray-500">Bot</span></div>) : message.role === 'user' ? null : (<div className="flex flex-row items-center gap-1"><User size={14} className='text-slate-500' /><span className="text-xs text-slate-500">Agent</span></div>)}</div>
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                    {message.role === 'assistant' && (<div className="mt-2 pt-2 text-xs text-gray-500 border-t border-gray-200">{t('chatbotUI.agentInstruction')} <br /><b>{t('chatbotUI.agentKeyword')}</b></div>)}
                                </div>
                            </div>
                        ))}
                        {isLoading && (<div className="flex items-end gap-2 justify-start"><div className="bg-gray-100 px-4 py-2 rounded-xl"><div className="flex items-center space-x-2"><span className="text-sm text-gray-500">{t('chatbotUI.typing')}</span><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div></div></div></div>)}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-3 border-t border-t-gray-300 bg-white rounded-b-lg flex-shrink-0">
                        {status === 'closed' ? (
                            <div className="text-center p-2"><p className="text-sm text-gray-600 mb-2">{t('chatbotUI.sessionEnded')}</p><button onClick={startNewChat} style={{ backgroundColor: config.botColor }} className="px-4 py-2 text-white rounded-lg text-sm hover:opacity-90">{t('chatbotUI.newChatButton')}</button></div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                                <textarea value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={handleKeyPress} placeholder={status === 'in_progress' ? t('chatbotUI.inputPlaceholderAgent') : status === 'pending_agent' ? t('chatbotUI.inputPlaceholderPending') : t('chatbotUI.inputPlaceholder')} className="text-black flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none" rows={1} disabled={isLoading || status === 'pending_agent'} />
                                <button type="submit" disabled={isLoading || !inputMessage.trim() || status === 'pending_agent'} style={{ backgroundColor: config.botColor }} className="hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors flex items-center justify-center aspect-square" aria-label="Send Message"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg></button>
                            </form>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export const ChatbotUI: React.FC = () => { return (<I18nProvider><ChatInterface /></I18nProvider>); };


