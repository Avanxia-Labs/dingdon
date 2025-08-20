// app/components/chatbot/ChatbotUI.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { I18nProvider } from '@/providers/I18nProvider';
import { useTranslation } from 'react-i18next';
import { useChatbot } from '@/hooks/useChatbot';
import { useChatStore } from '@/stores/chatbotStore';
import { useSyncLanguage } from '@/hooks/useSyncLanguage';
import { Bot, User, Globe } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import 'react-phone-number-input/style.css';

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    // { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    // { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    // { code: 'zh', name: '中文', flag: '🇨🇳' },
];

const ChatLanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const { setLanguage } = useChatStore();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setLanguage(lng);
    };

    return (
        <div className="relative">
            <Globe className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70 pointer-events-none" />
            <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="pl-7 text-xs bg-transparent border-0 text-white focus:outline-none focus:ring-0 appearance-none"
                aria-label="Select chat language"
            >
                {languages.map(lang => (
                    <option key={lang.code} value={lang.code} className="text-black bg-white">
                        {lang.name} {lang.flag}
                    </option>
                ))}
            </select>
        </div>
    );
};

const ChatInterface = () => {
    // Llamamos a useTranslation() sin argumentos para usar el namespace por defecto
    const { t } = useTranslation();
    const { messages, isLoading, sendMessage, status, startNewChat, config, error, leadCollected, setLeadCollected, workspaceId } = useChatbot();
    const language = useChatStore((state) => state.language);

    useSyncLanguage(language);

    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Estados para el formulario inicial para captar leads
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState<string | undefined>('');
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);


    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSendMessage = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        if (!inputMessage.trim()) return;
        sendMessage(inputMessage);
        setInputMessage('');
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Form para enviar Leads
    const handleLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError('');
        try {
            await apiClient.post('/leads', { workspaceId, name, email, phone });
            setLeadCollected(true);
        } catch (err) {
            setFormError("There was an issue. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isHidden = leadCollected ? '' : 'hidden';

    console.log("Avatar URL:", config.botAvatarUrl);

    return (
        <div className={`h-full w-full bg-white rounded-lg flex flex-col overflow-hidden ${language === 'ar' ? 'rtl' : 'ltr'}`}>
            <div className="text-white p-4 rounded-t-lg flex-shrink-0 flex justify-between items-start" style={{ backgroundColor: config.botColor }}>
                <div>
                    <h3 className="font-semibold text-lg">{config.botName}</h3>
                    <p className="text-sm opacity-90">{config.botIntroduction || t('chatbotUI.headerTitle')}</p>
                </div>
                <ChatLanguageSwitcher />
            </div>
            {error ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                    <svg className="w-12 h-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h4 className="font-semibold text-gray-800">{t('chatbotUI.errorMessage')}</h4>
                    <p className="text-sm text-gray-500 mt-1">{error}</p>
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                            <div key={message.id} className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {/* --- AÑADIR AVATAR A LOS MENSAJES DEL BOT --- */}
                                {(message.role === 'assistant' || message.role === 'agent') && (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 self-start border-2 border-black/10">
                                        <img
                                            src={message.role === 'agent' && message.avatarUrl ? message.avatarUrl : config.botAvatarUrl} // Por ahora, el agente también usa el avatar del bot
                                            alt="Avatar"
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] px-4 py-2 rounded-xl ${message.role === 'assistant' ? 'bg-gray-100 text-gray-800' :
                                        message.role === 'user' ? 'text-white' :
                                            'bg-slate-200 text-slate-600 border border-slate-300'
                                        }`}
                                    style={message.role === 'user' ? { backgroundColor: config.botColor } : {}}
                                >
                                    <div className="mb-1">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            {message.role === 'assistant' ? (
                                                <div className="flex flex-row items-center gap-1">
                                                    {/* <Bot size={16} className='text-gray-500 flex-shrink-0' /> */}
                                                    <span className="text-xs font-semibold text-gray-600">{t('chatbotUI.botLabel')}</span>
                                                </div>
                                            ) : message.role === 'agent' ? (
                                                <div className="flex flex-row items-center gap-1">
                                                    {/* <User size={16} className='text-slate-500 flex-shrink-0' /> */}
                                                    <span className="text-xs font-semibold text-slate-600">{message.agentName || t('chatbotUI.agentLabel')}</span>
                                                </div>
                                            ) : null}
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    </div>

                                    {message.role === 'assistant' && (
                                        <div className="mt-2 pt-2 text-xs text-gray-500 border-t border-gray-200">
                                            {t('chatbotUI.agentInstruction')} <br />
                                            <b>{t('chatbotUI.agentKeyword')}</b>
                                            <br />
                                            <p className="text-gray-500 px-1 py-1 rounded text-xs mt-4">
                                                {t('chatbotUI.disclaimer')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Muestra el formulario si el lead NO ha sido recolectado */}
                        {!leadCollected && (
                            // <div className="p-4 bg-gray-50 rounded-lg border border-black/10 max-w-[80%]">
                            //     <form onSubmit={handleLeadSubmit} className="space-y-3">
                            //         <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('chatbotUI.leadFormName')} required className="w-full px-3 py-2 border border-black/10 rounded-lg" />
                            //         <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('chatbotUI.leadFormEmail')} required className="w-full px-3 py-2 border border-black/10 rounded-lg" />
                            //         <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('chatbotUI.leadFormPhone')} className="w-full px-3 py-2 border border-black/10 rounded-lg" />
                            //         {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}
                            //         <button type="submit" disabled={isSubmitting} style={{ backgroundColor: config.botColor }} className="w-full py-2 text-white font-semibold rounded-lg hover:opacity-90 disabled:bg-gray-400">
                            //             {isSubmitting ? t('chatbotUI.leadFormLoading') : t('chatbotUI.leadFormButton')}
                            //         </button>
                            //     </form>
                            // </div>

                            // Ajustes para que se le vea a TAURO en modo oscuro (Actualizar cuando se implemente los dos modos)
                            <div className="p-4 bg-gray-50 rounded-lg border border-black max-w-[80%]">
                                <form onSubmit={handleLeadSubmit} className="space-y-3">
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('chatbotUI.leadFormName')} required className="w-full px-3 py-2 border border-black text-black rounded-lg" />
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('chatbotUI.leadFormEmail')} required className="w-full px-3 py-2 border border-black text-black rounded-lg" />
                                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('chatbotUI.leadFormPhone')} className="w-full px-3 py-2 border border-black text-black rounded-lg" />
                                    {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}
                                    <button type="submit" disabled={isSubmitting} style={{ backgroundColor: config.botColor }} className="w-full py-2 text-white font-semibold rounded-lg hover:opacity-90 disabled:bg-gray-400">
                                        {isSubmitting ? t('chatbotUI.leadFormLoading') : t('chatbotUI.leadFormButton')}
                                    </button>
                                </form>
                            </div>
                        )}

                        {isLoading && (
                            <div className="flex items-end gap-2 justify-start">
                                <div className="bg-gray-100 px-4 py-2 rounded-xl">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-500">{t('chatbotUI.typing')}...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-3 border-t border-t-gray-300 bg-white rounded-b-lg flex-shrink-0">
                        {status === 'closed' ? (
                            <div className="text-center p-2">
                                <p className="text-sm text-gray-600 mb-2">{t('chatbotUI.sessionEnded')}</p>
                                <button onClick={startNewChat} style={{ backgroundColor: config.botColor }} className="px-4 py-2 text-white rounded-lg text-sm hover:opacity-90">{t('chatbotUI.newChatButton')}</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className={`flex items-center space-x-2 ${isHidden}`}>
                                <textarea
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder={t(`chatbotUI.${status === 'in_progress' ? 'inputPlaceholderAgent' : status === 'pending' ? 'inputPlaceholderPending' : 'inputPlaceholder'}`)}
                                    className="text-black disabled:cursor-not-allowed disabled:opacity-40 flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none"
                                    rows={1}
                                    disabled={isLoading || status === 'pending'}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !inputMessage.trim() || status === 'pending'}
                                    style={{ backgroundColor: config.botColor }}
                                    className="hover:opacity-90 disabled:bg-gray-400 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors flex items-center justify-center aspect-square" aria-label="Send Message"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                                </button>
                            </form>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export const ChatbotUI: React.FC = () => { return (<I18nProvider><ChatInterface /></I18nProvider>); };
