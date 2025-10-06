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

    // Paleta de colores para modo claro y oscuro
    const mainBg = theme === 'dark' ? 'bg-[#192229]' : 'bg-[#FBFBFE]';
    const cardBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const borderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-[#EFF3F5]';
    const textPrimary = theme === 'dark' ? 'text-[#EFF3F5]' : 'text-[#2A3B47]';
    const textSecondary = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const textLight = theme === 'dark' ? 'text-[#A0A7AC]' : 'text-[#A0A7AC]';
    const tableHeaderBg = theme === 'dark' ? 'bg-[#2a3b47]' : 'bg-[#F9FAFB]';
    const tableHeaderText = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const tableBorderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-[#EFF3F5]';
    const tableRowHover = theme === 'dark' ? 'hover:bg-[#2a3b47]' : 'hover:bg-gray-50';
    const modalBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-white';
    const modalBorderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-gray-200';
    const userMsgBg = theme === 'dark' ? 'bg-[#2a3b47]' : 'bg-gray-200';
    const userMsgBorder = theme === 'dark' ? 'border-[#3a4b57]' : 'border-black/10';
    const agentMsgBg = theme === 'dark' ? 'bg-[#52A5E0]' : 'bg-blue-500';
    const botMsgBg = theme === 'dark' ? 'bg-gray-700' : 'bg-slate-700';
    const avatarBg = theme === 'dark' ? 'bg-[#2a3b47]' : 'bg-gray-200';
    const avatarBorder = theme === 'dark' ? 'border-[#3a4b57]' : 'border-black/10';

    if (isLoading) {
        return (
            <div className={`p-6 min-h-screen ${mainBg} ${textPrimary}`}>
                {t('common.loading')}
            </div>
        );
    }

    return (
        <>
            <div className={`p-4 sm:p-6 min-h-screen ${mainBg}`}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <h2 className={`text-xl sm:text-2xl font-bold ${textPrimary}`}>{t('history.pageTitle')}</h2>
                    <button 
                        onClick={handleDeleteAll} 
                        className={`px-3 py-2 sm:px-4 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${
                            theme === 'dark' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                        }`}
                        disabled={chatLogs.length === 0}
                    >
                        {t('history.deleteAllButton')}
                    </button>
                </div>
                {/* Vista de tabla para desktop */}
                <div className={`hidden md:block shadow rounded-lg overflow-x-auto ${cardBg} border ${borderColor}`}>
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className={`px-5 py-3 border-b-2 ${tableBorderColor} ${tableHeaderBg} text-left text-xs font-semibold uppercase ${tableHeaderText}`}>{t('history.tableHeaderDate')}</th>
                                <th className={`px-5 py-3 border-b-2 ${tableBorderColor} ${tableHeaderBg} text-left text-xs font-semibold uppercase ${tableHeaderText}`}>{t('history.tableHeaderChannel')}</th>
                                <th className={`px-5 py-3 border-b-2 ${tableBorderColor} ${tableHeaderBg} text-left text-xs font-semibold uppercase ${tableHeaderText}`}>{t('history.tableHeaderAgent')}</th>
                                <th className={`px-5 py-3 border-b-2 ${tableBorderColor} ${tableHeaderBg} text-left text-xs font-semibold uppercase ${tableHeaderText}`}>{t('history.tableHeaderPreview')}</th>
                                <th className={`px-5 py-3 border-b-2 ${tableBorderColor} ${tableHeaderBg} text-left text-xs font-semibold uppercase text-center ${tableHeaderText}`}>{t('history.tableHeaderMessages')}</th>
                                <th className={`px-5 py-3 border-b-2 ${tableBorderColor} ${tableHeaderBg} text-right text-xs font-semibold uppercase ${tableHeaderText}`}>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chatLogs.map(log => (
                                <tr key={log.id} className={tableRowHover}>
                                    <td className={`px-5 py-4 border-b ${tableBorderColor} text-sm ${textPrimary}`}>{new Date(log.startTime).toLocaleString()}</td>
                                    <td className={`px-5 py-4 border-b ${tableBorderColor} text-sm`}>
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
                                    <td className={`px-5 py-4 border-b ${tableBorderColor} text-sm ${textPrimary}`}>{log.agentName}</td>
                                    <td className={`px-5 py-4 border-b ${tableBorderColor} text-sm ${textPrimary}`}><p className="truncate max-w-xs">{log.firstMessage}</p></td>
                                    <td className={`px-5 py-4 border-b ${tableBorderColor} text-sm text-center ${textPrimary}`}>{log.messageCount}</td>
                                    <td className={`px-5 py-4 border-b ${tableBorderColor} text-sm text-right space-x-4`}>
                                        <button onClick={() => handleViewChat(log.id)} className={`transition-colors ${
                                            theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-900'
                                        }`} title="View Chat"><Eye size={18} /></button>
                                        <button onClick={() => handleDeleteChat(log.id)} className={`transition-colors ${
                                            theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'
                                        }`} title={t('common.delete')}><Trash2 size={18} /></button>
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

                {/* Vista de tarjetas para móvil */}
                <div className="md:hidden space-y-4">
                    {chatLogs.map(log => (
                        <div key={log.id} className={`shadow rounded-lg p-4 space-y-3 ${cardBg} border ${borderColor}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {log.channel === 'whatsapp' ? (
                                            <WhatsAppIcon
                                                style={{ color: '#25D366', fontSize: '20px' }}
                                                titleAccess="WhatsApp"
                                            />
                                        ) : (
                                            <LanguageIcon
                                                className="text-blue-600"
                                                style={{ fontSize: '20px' }}
                                                titleAccess="Web Chat"
                                            />
                                        )}
                                        <span className={`text-sm font-medium ${textPrimary}`}>{log.agentName}</span>
                                    </div>
                                    <p className={`text-xs mb-2 ${textSecondary}`}>
                                        {new Date(log.startTime).toLocaleString()}
                                    </p>
                                    <p className={`text-sm line-clamp-2 ${textPrimary}`}>{log.firstMessage}</p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <MessageSquare size={14} className={textLight} />
                                        <span className={`text-xs ${textSecondary}`}>{log.messageCount} {t('history.tableHeaderMessages')}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleViewChat(log.id)} 
                                        className={`p-2 rounded-lg transition-colors ${
                                            theme === 'dark' 
                                                ? 'text-indigo-400 hover:bg-[#2a3b47]' 
                                                : 'text-indigo-600 hover:bg-indigo-50'
                                        }`}
                                        title="View Chat"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteChat(log.id)} 
                                        className={`p-2 rounded-lg transition-colors ${
                                            theme === 'dark' 
                                                ? 'text-red-400 hover:bg-[#2a3b47]' 
                                                : 'text-red-600 hover:bg-red-50'
                                        }`}
                                        title={t('common.delete')}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalChats}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                </div>
            </div>

            {/* Selected Chat View - Modal */}
            {selectedChatHistory && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4" onClick={() => setSelectedChatHistory(null)}>
                    <div className={`rounded-lg shadow-xl w-full max-w-lg h-[90vh] sm:h-[85vh] md:h-[80vh] max-h-[700px] flex flex-col ${modalBg} ${borderColor} border`} onClick={(e) => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className={`p-3 sm:p-4 border-b ${modalBorderColor} flex justify-between items-center`}>
                            <h3 className={`font-bold text-base sm:text-lg ${textPrimary}`}>{t('history.modalTitle')}</h3>
                            <button 
                                onClick={() => setSelectedChatHistory(null)} 
                                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                                    theme === 'dark' 
                                        ? 'text-gray-400 hover:text-gray-200 hover:bg-[#2a3b47]' 
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                                }`}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Container */}
                        <div className={`flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 ${
                            theme === 'dark' ? 'bg-[#1a2329]' : 'bg-gray-50'
                        } rounded-b-lg`}>
                            {selectedChatHistory.map(msg => {

                                const isUser = msg.role === 'user';
                                const isAgent = msg.role === 'agent';
                                const isBot = msg.role === 'assistant';
                                const isOutgoing = isAgent || isBot;

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex items-start gap-2 sm:gap-3 ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {/* User Avatar (Left) */}
                                        {isUser && (
                                            <div className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex-shrink-0 border ${avatarBg} ${avatarBorder}`}>
                                                <User className={`w-full h-full p-1 sm:p-1.5 ${
                                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                }`} />
                                            </div>
                                        )}

                                        {/* Message Body */}
                                        <div
                                            className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded-xl ${
                                                isAgent ? (theme === 'dark' ? agentMsgBg : 'bg-blue-500') + ' text-white' :
                                                isBot ? (theme === 'dark' ? botMsgBg : 'bg-slate-700') + ' text-white' :
                                                    theme === 'dark' 
                                                        ? userMsgBg + ' ' + userMsgBorder + ' border ' + textPrimary
                                                        : 'bg-gray-200 border border-black/10 text-gray-800'
                                            }`}
                                        >
                                            {/* Sender Name */}
                                            {isAgent && <p className="text-xs font-bold text-white/90 mb-1">{msg.agentName}</p>}
                                            {isBot && <p className="text-xs font-bold text-white/90 mb-1">{botConfig?.name || 'Bot'}</p>}

                                            {/* Message Content */}
                                            <p className={`text-xs sm:text-sm whitespace-pre-wrap break-words ${
                                                isUser && theme === 'dark' ? 'text-[#EFF3F5]' : ''
                                            }`}>{msg.content}</p>
                                        </div>

                                        {/* Agent/Bot Avatar (Right) */}
                                        {isOutgoing && (
                                            <div className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex-shrink-0 border ${avatarBg} ${avatarBorder}`}>
                                                {isAgent && (
                                                    msg.avatarUrl ? (
                                                        <img
                                                            src={msg.avatarUrl}
                                                            alt={msg.agentName || 'Agent'}
                                                            className="w-full h-full rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <User className={`w-full h-full p-1 sm:p-1.5 ${
                                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                        }`} />
                                                    )
                                                )}
                                                {isBot && (
                                                    botConfig?.avatarUrl ? (
                                                        <img
                                                            src={botConfig.avatarUrl}
                                                            alt={botConfig?.name || 'Bot'}
                                                            className="w-full h-full rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <Bot className={`w-full h-full p-1 sm:p-1.5 ${
                                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                        }`} />
                                                    )
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