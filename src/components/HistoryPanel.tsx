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
import { Pagination } from './Pagination';
import { useTheme } from '@/providers/ThemeProvider';

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
    const { theme } = useTheme();

    const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChatHistory, setSelectedChatHistory] = useState<Message[] | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    // ---  ESTADOS PARA LA PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalChats, setTotalChats] = useState(0);

    const fetchHistoryList = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/chats?page=${currentPage}&limit=${itemsPerPage}`);

            if (response.ok) {
                const { data, count } = await response.json();
                setChatLogs(data);
                setTotalChats(count || 0);
            } else {
                throw new Error('Failed to load chat history');
            }
        } catch (error: any) {
            setFeedback(`${t('common.errorPrefix')}: ${error.message}`);
            setChatLogs([]); // Limpiar en caso de error
            setTotalChats(0);
        } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchHistoryList(); }, [workspaceId, currentPage, itemsPerPage]);

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

    // Paleta de colores
    const mainBg = theme === 'dark' ? 'bg-[#192229]' : 'bg-[#FBFBFE]';
    const cardBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const borderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-[#EFF3F5]';
    const textPrimary = theme === 'dark' ? 'text-[#EFF3F5]' : 'text-[#2A3B47]';
    const textSecondary = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const tableHeaderBg = theme === 'dark' ? 'bg-[#192229]' : 'bg-[#EFF3F5]';
    const tableRowHover = theme === 'dark' ? 'hover:bg-[#2a3b47]' : 'hover:bg-[#EFF3F5]';
    const userMsgBg = theme === 'dark' ? 'bg-[#2a3b47]' : 'bg-[#EFF3F5]';
    const userMsgText = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const agentBotMsgBg = theme === 'dark' ? 'bg-[#52A5E0]' : 'bg-[#1083D3]';

    if (isLoading) return <div className={`p-6 ${mainBg} ${textPrimary}`}>{t('common.loading')}</div>;

    return (
        <>
            <div className={`p-6 min-h-full ${mainBg}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-2xl font-bold ${textPrimary}`}>{t('history.pageTitle')}</h2>
                    <button onClick={handleDeleteAll} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50" disabled={chatLogs.length === 0}>{t('history.deleteAllButton')}</button>
                </div>
                <div className={`shadow rounded-lg overflow-x-auto ${cardBg} border ${borderColor}`}>
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className={`px-5 py-3 border-b-2 ${borderColor} ${tableHeaderBg} text-left text-xs font-semibold ${textSecondary} uppercase`}>{t('history.tableHeaderDate')}</th>
                                <th className={`px-5 py-3 border-b-2 ${borderColor} ${tableHeaderBg} text-left text-xs font-semibold ${textSecondary} uppercase`}>{t('history.tableHeaderChannel')}</th>
                                <th className={`px-5 py-3 border-b-2 ${borderColor} ${tableHeaderBg} text-left text-xs font-semibold ${textSecondary} uppercase`}>{t('history.tableHeaderAgent')}</th>
                                <th className={`px-5 py-3 border-b-2 ${borderColor} ${tableHeaderBg} text-left text-xs font-semibold ${textSecondary} uppercase`}>{t('history.tableHeaderPreview')}</th>
                                <th className={`px-5 py-3 border-b-2 ${borderColor} ${tableHeaderBg} text-left text-xs font-semibold ${textSecondary} uppercase text-center`}>{t('history.tableHeaderMessages')}</th>
                                <th className={`px-5 py-3 border-b-2 ${borderColor} ${tableHeaderBg} text-right text-xs font-semibold ${textSecondary} uppercase`}>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chatLogs.map(log => (
                                <tr key={log.id} className={tableRowHover}>
                                    <td className={`px-5 py-4 border-b ${borderColor} text-sm ${textPrimary}`}>{new Date(log.startTime).toLocaleString()}</td>
                                    <td className={`px-5 py-4 border-b ${borderColor} text-sm`}>
                                        <div className="flex justify-center">
                                            {log.channel === 'whatsapp' ? (
                                                <WhatsAppIcon
                                                    style={{ color: '#25D366' }}
                                                    titleAccess="WhatsApp"
                                                />
                                            ) : (
                                                <LanguageIcon
                                                    className={theme === 'dark' ? 'text-[#52A5E0]' : 'text-[#1083D3]'}
                                                    titleAccess="Web Chat"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className={`px-5 py-4 border-b ${borderColor} text-sm ${textPrimary}`}>{log.agentName}</td>
                                    <td className={`px-5 py-4 border-b ${borderColor} text-sm ${textPrimary}`}><p className="truncate max-w-xs">{log.firstMessage}</p></td>
                                    <td className={`px-5 py-4 border-b ${borderColor} text-sm text-center ${textPrimary}`}>{log.messageCount}</td>
                                    <td className={`px-5 py-4 border-b ${borderColor} text-sm text-right space-x-4`}>
                                        <button onClick={() => handleViewChat(log.id)} className={theme === 'dark' ? 'text-[#52A5E0] hover:text-[#7fc0eb]' : 'text-[#1083D3] hover:text-[#0d6db3]'} title="View Chat"><Eye size={18} /></button>
                                        <button onClick={() => handleDeleteChat(log.id)} className="text-red-500 hover:text-red-700" title={t('common.delete')}><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalChats}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                </div>
            </div>

            {/* Selected Chat View */}
            {selectedChatHistory && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-20" onClick={() => setSelectedChatHistory(null)}>
                    <div className={`rounded-lg shadow-xl w-full max-w-lg h-[80vh] flex flex-col ${cardBg}`} onClick={(e) => e.stopPropagation()}>

                        <div className={`p-4 border-b ${borderColor} flex justify-between items-center`}>
                            <h3 className={`font-bold ${textPrimary}`}>{t('history.modalTitle')}</h3>
                            <button onClick={() => setSelectedChatHistory(null)} className={`${textSecondary} hover:${textPrimary}`}><X /></button>
                        </div>

                        <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${cardBg} rounded-b-lg`}>
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
                                            <div className={`w-10 h-10 rounded-full flex-shrink-0 border ${theme === 'dark' ? 'bg-[#2a3b47] border-[#3a4b57]' : 'bg-[#EFF3F5] border-gray-300'}`}>
                                                <User className={`w-full h-full p-1.5 ${textSecondary}`} />
                                            </div>
                                        )}

                                        {/* --- CUERPO DEL MENSAJE (EN EL MEDIO) --- */}
                                        <div
                                            className={`max-w-[70%] px-4 py-2 rounded-xl ${
                                                isAgent || isBot
                                                    ? `${agentBotMsgBg} text-white`
                                                    : `${userMsgBg} ${userMsgText} border ${theme === 'dark' ? 'border-[#3a4b57]' : 'border-gray-300'}`
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
                                            <div className={`w-10 h-10 rounded-full flex-shrink-0 border ${theme === 'dark' ? 'bg-[#2a3b47] border-[#3a4b57]' : 'bg-[#EFF3F5] border-gray-300'}`}>
                                                {isAgent && (
                                                    msg.avatarUrl ? (
                                                        <img
                                                            src={msg.avatarUrl}
                                                            alt={msg.agentName || 'Agent'}
                                                            className="w-full h-full rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <User className={`w-full h-full p-1.5 ${textSecondary}`} />
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