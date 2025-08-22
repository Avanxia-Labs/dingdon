// app/dashboard/components/HistoryPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Message } from '@/types/chatbot';
import { Bot, Eye, MessageCircle, MessageSquare, Trash2, User, X } from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSyncLanguage } from '@/hooks/useSyncLanguage';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LanguageIcon from '@mui/icons-material/Language';
//import { BotConfig } from '@/stores/useDashboardStore';

interface ChatLog {
    id: string;
    startTime: string;
    agentName: string;
    messageCount: number;
    firstMessage: string;
    channel: 'web' | 'whatsapp' | null
}

export interface BotConfig {
    name?: string;
    avatarUrl?: string;
}

interface HistoryPanelProps {
    workspaceId: string;
    botConfig?: BotConfig;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ workspaceId, botConfig }) => {
    const { t } = useTranslation();
    const language = useDashboardStore((state) => state.language);
    useSyncLanguage(language);

    const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChatHistory, setSelectedChatHistory] = useState<Message[] | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    const fetchHistoryList = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/chats`);
            const data = await response.json();
            if (response.ok) setChatLogs(data);
            else throw new Error(data.error || 'Failed to load chat history');
        } catch (error: any) { setFeedback(`${t('common.errorPrefix')}: ${error.message}`); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchHistoryList(); }, [workspaceId]);

    const handleViewChat = async (chatId: string) => {
        try {
            const response = await fetch(`/api/chats/${chatId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setSelectedChatHistory(data.history);
        } catch (error: any) { alert(`${t('common.errorPrefix')}: ${error.message}`); }
    };

    const handleDeleteChat = async (chatId: string) => {
        if (!confirm(t('history.deleteConfirm'))) return;
        try {
            const response = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete chat');
            fetchHistoryList();
        } catch (error: any) { alert(`${t('common.errorPrefix')}: ${error.message}`); }
    };

    const handleDeleteAll = async () => {
        const confirmationText = "DELETE";
        const userInput = prompt(t('history.deleteAllConfirm', { count: chatLogs.length }));

        if (userInput !== confirmationText) { alert(t('history.deleteCancelled')); return; }
        setFeedback(t('history.feedback.deletingAll'));
        setIsLoading(true);

        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/chats`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to delete all histories');
            setFeedback(t('history.feedback.deletedAllSuccess'));
            fetchHistoryList();
        } catch (error: any) { setFeedback(`${t('common.errorPrefix')}: ${error.message}`); }
    };

    if (isLoading) return <div className="p-6">{t('common.loading')}</div>;

    return (
        <>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{t('history.pageTitle')}</h2>
                    <button onClick={handleDeleteAll} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50" disabled={chatLogs.length === 0}>{t('history.deleteAllButton')}</button>
                </div>
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">{t('history.tableHeaderDate')}</th>
                                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">{t('history.tableHeaderChannel')}</th>
                                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">{t('history.tableHeaderAgent')}</th>
                                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">{t('history.tableHeaderPreview')}</th>
                                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase text-center">{t('history.tableHeaderMessages')}</th>
                                <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chatLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-4 border-b text-sm">{new Date(log.startTime).toLocaleString()}</td>
                                    <td className="px-5 py-4 border-b text-sm">
                                        <div className="flex justify-center">
                                            {log.channel === 'whatsapp' ? (
                                                <WhatsAppIcon
                                                    style={{ color: '#25D366' }} // Color oficial de WhatsApp
                                                    titleAccess="WhatsApp"
                                                />
                                            ) : (
                                                <LanguageIcon
                                                    className="text-blue-600" // Usa una clase de Tailwind
                                                    titleAccess="Web Chat"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 border-b text-sm">{log.agentName}</td>
                                    <td className="px-5 py-4 border-b text-sm"><p className="truncate max-w-xs">{log.firstMessage}</p></td>
                                    <td className="px-5 py-4 border-b text-sm text-center">{log.messageCount}</td>
                                    <td className="px-5 py-4 border-b text-sm text-right space-x-4">
                                        <button onClick={() => handleViewChat(log.id)} className="text-indigo-600 hover:text-indigo-900" title="View Chat"><Eye size={18} /></button>
                                        <button onClick={() => handleDeleteChat(log.id)} className="text-red-600 hover:text-red-900" title={t('common.delete')}><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Selected Chat View */}
            {selectedChatHistory && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-20" onClick={() => setSelectedChatHistory(null)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold">{t('history.modalTitle')}</h3>
                            <button onClick={() => setSelectedChatHistory(null)} className="text-gray-500 hover:text-gray-800"><X /></button>
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white rounded-b-lg">
                            {selectedChatHistory.map(msg => {
                                
                                const isUser = msg.role === 'user';
                                const isAgent = msg.role === 'agent';
                                const isBot = msg.role === 'assistant';
                                const isOutgoing = isAgent || isBot;

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex items-start gap-3 ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {/* --- AVATAR DEL USUARIO (IZQUIERDA) --- */}
                                        {isUser && (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 border border-black/10">
                                                <User className="w-full h-full text-gray-500 p-1.5" />
                                            </div>
                                        )}

                                        {/* --- CUERPO DEL MENSAJE (EN EL MEDIO) --- */}
                                        <div
                                            className={`max-w-[70%] px-4 py-2 rounded-xl ${isAgent ? "bg-blue-500 text-white" :        // Mensaje del agente
                                                isBot ? "bg-slate-700 text-white" :         // Mensaje del bot
                                                    "bg-gray-200 border border-black/10 text-gray-800"  // Mensaje del usuario
                                                }`}
                                        >
                                            {/* Nombre del remitente (si es agente o bot) */}
                                            {isAgent && <p className="text-xs font-bold text-white/80 mb-1">{msg.agentName}</p>}
                                            {isBot && <p className="text-xs font-bold text-white/80 mb-1">Bot</p>}

                                            {/* Contenido del mensaje */}
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>

                                        {/* --- AVATAR DEL AGENTE O DEL BOT (DERECHA) --- */}
                                        {isOutgoing && (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 border border-black/10">
                                                {isAgent && (
                                                    msg.avatarUrl ? (
                                                        <img
                                                            src={msg.avatarUrl}
                                                            alt={msg.agentName || 'Agent'}
                                                            className="w-full h-full rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <User className="w-full h-full text-gray-500 p-1.5" />
                                                    )
                                                )}
                                                {isBot && (
                                                    <img
                                                        src={botConfig?.avatarUrl || '/default-bot-avatar.png'}
                                                        alt={botConfig?.name || 'Bot'}
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};