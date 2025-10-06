// app/dashboard/components/AgentsPanel.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { TeamMember, WorkspaceRole } from '@/types/chatbot';
import { Trash2 } from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSyncLanguage } from '@/hooks/useSyncLanguage';
import { Pagination } from './Pagination';
import { useTheme } from '@/providers/ThemeProvider';

interface AgentsPanelProps {
    workspaceId: string;
}

export const AgentsPanel: React.FC<AgentsPanelProps> = ({ workspaceId }) => {
    const { t } = useTranslation();
    const language = useDashboardStore((state) => state.language);
    useSyncLanguage(language);
    const { theme } = useTheme();

    const [agents, setAgents] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<WorkspaceRole>('agent');

    // --- ESTADOS PARA LA PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalAgents, setTotalAgents] = useState(0);

    const fetchAgents = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/members?page=${currentPage}&limit=${itemsPerPage}`);
            if (!response.ok) throw new Error('Failed to fetch team members');
            const { data, count } = await response.json();
            setAgents(data);
            setTotalAgents(count || 0);
        } catch (error) {
            console.error("Error fetching agents:", error);
            setFeedback("Could not load team members.");
        } finally { setIsLoading(false); }
    };

    useEffect(() => {
        if (workspaceId) { fetchAgents(); }
    }, [workspaceId, currentPage, itemsPerPage]);

    const handleInviteAgent = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFeedback(t('agents.feedback.inviting'));
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/invite`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, role }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to invite agent');
            setFeedback(t('agents.feedback.invitedSuccess'));
            fetchAgents();
            setName(''); setEmail(''); setPassword(''); setRole('agent');
        } catch (error: any) { setFeedback(`${t('common.errorPrefix')}: ${error.message}`); } finally { setIsSubmitting(false); }
    };

    const handleDeleteAgent = async (agentId: string, agentName: string | null) => {
        const agentDisplayName = agentName || 'this agent';
        if (!confirm(t('agents.deleteConfirm', { name: agentDisplayName }))) { return; }
        setFeedback(t('agents.feedback.removing'));
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/members/${agentId}`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to remove agent');
            setFeedback(t('agents.feedback.removedSuccess'));
            fetchAgents();
        } catch (error: any) { setFeedback(`${t('common.errorPrefix')}: ${error.message}`); }
    };

    // Paleta de colores para modo claro y oscuro
    const mainBg = theme === 'dark' ? 'bg-[#192229]' : 'bg-[#FBFBFE]';
    const cardBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const borderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-[#EFF3F5]';
    const textPrimary = theme === 'dark' ? 'text-[#EFF3F5]' : 'text-[#2A3B47]';
    const textSecondary = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const textLight = theme === 'dark' ? 'text-[#A0A7AC]' : 'text-[#A0A7AC]';
    const inputBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const inputBorder = theme === 'dark' ? 'border-[#2a3b47]' : 'border-gray-300';
    const tableHeaderBg = theme === 'dark' ? 'bg-[#2a3b47]' : 'bg-[#F9FAFB]';
    const tableHeaderText = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const tableBorderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-[#EFF3F5]';
    const buttonPrimary = theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700';
    const buttonSecondary = theme === 'dark' ? 'bg-gray-700 border-gray-500 hover:bg-gray-600' : 'bg-white border-gray-300 hover:bg-gray-50';

    if (isLoading) { 
        return (
            <div className={`p-6 ${mainBg} ${textPrimary}`}>
                {t('common.loading')}
            </div>
        ); 
    }

    return (
        <div className={`p-3 sm:p-4 md:p-6 min-h-screen ${mainBg}`}>
            <h2 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${textPrimary}`}>{t('agents.pageTitle')}</h2>
            <div className={`p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 ${cardBg} border ${borderColor}`}>
                <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${textPrimary}`}>{t('agents.inviteTitle')}</h3>
                <form onSubmit={handleInviteAgent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
                    <div>
                        <label htmlFor="name" className={`block text-xs sm:text-sm font-medium ${textSecondary}`}>{t('agents.fullNameLabel')}</label>
                        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className={`mt-1 block w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputBorder} ${textPrimary}`} />
                    </div>
                    <div>
                        <label htmlFor="email" className={`block text-xs sm:text-sm font-medium ${textSecondary}`}>{t('common.email')}</label>
                        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className={`mt-1 block w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputBorder} ${textPrimary}`} />
                    </div>
                    <div>
                        <label htmlFor="password" className={`block text-xs sm:text-sm font-medium ${textSecondary}`}>{t('agents.initialPasswordLabel')}</label>
                        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className={`mt-1 block w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputBorder} ${textPrimary}`} />
                    </div>
                    <div>
                        <label htmlFor="role" className={`block text-xs sm:text-sm font-medium ${textSecondary}`}>{t('common.role')}</label>
                        <select id="role" value={role} onChange={e => setRole(e.target.value as WorkspaceRole)} className={`mt-1 block w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputBorder} ${textPrimary}`}>
                            <option value="agent">{t('agents.roleAgent')}</option>
                            <option value="admin">{t('agents.roleAdmin')}</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4">
                        <button type="submit" disabled={isSubmitting} className={`w-full py-2 px-3 sm:px-4 text-sm sm:text-base text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${buttonPrimary}`}>
                            {isSubmitting ? t('agents.invitingButton') : `+ ${t('agents.inviteButton')}`}
                        </button>
                    </div>
                </form>
                {feedback && <p className={`mt-3 sm:mt-4 text-xs sm:text-sm text-center ${textSecondary}`}>{feedback}</p>}
            </div>
            <div className={`shadow rounded-lg overflow-x-auto ${cardBg} border ${borderColor}`}>
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className={`px-2 sm:px-4 md:px-5 py-2 sm:py-3 border-b-2 ${tableBorderColor} ${tableHeaderBg} text-left text-xs font-semibold uppercase tracking-wider ${tableHeaderText}`}>{t('common.name')}</th>
                            <th className={`px-2 sm:px-4 md:px-5 py-2 sm:py-3 border-b-2 ${tableBorderColor} ${tableHeaderBg} text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell ${tableHeaderText}`}>{t('common.email')}</th>
                            <th className={`px-2 sm:px-4 md:px-5 py-2 sm:py-3 border-b-2 ${tableBorderColor} ${tableHeaderBg} text-left text-xs font-semibold uppercase tracking-wider ${tableHeaderText}`}>{t('common.role')}</th>
                            <th className={`px-2 sm:px-4 md:px-5 py-2 sm:py-3 border-b-2 ${tableBorderColor} ${tableHeaderBg} text-right text-xs font-semibold uppercase tracking-wider ${tableHeaderText}`}>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map(agent => (
                            <tr key={agent.id}>
                                <td className={`px-2 sm:px-4 md:px-5 py-3 sm:py-4 border-b ${tableBorderColor} text-xs sm:text-sm`}>
                                    <div className={`font-medium ${textPrimary}`}>{agent.name || '-'}</div>
                                    <div className={`sm:hidden ${textSecondary}`}>{agent.email}</div>
                                </td>
                                <td className={`px-2 sm:px-4 md:px-5 py-3 sm:py-4 border-b ${tableBorderColor} text-xs sm:text-sm hidden sm:table-cell ${textPrimary}`}>{agent.email}</td>
                                <td className={`px-2 sm:px-4 md:px-5 py-3 sm:py-4 border-b ${tableBorderColor} text-xs sm:text-sm`}>
                                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 font-semibold leading-tight rounded-full text-xs ${
                                        agent.role === 'admin' 
                                            ? theme === 'dark' ? 'text-green-300 bg-green-900' : 'text-green-900 bg-green-200'
                                            : theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-200'
                                    }`}>
                                        {agent.role === 'admin' ? t('agents.roleAdmin') : t('agents.roleAgent')}
                                    </span>
                                </td>
                                <td className={`px-2 sm:px-4 md:px-5 py-3 sm:py-4 border-b ${tableBorderColor} text-xs sm:text-sm text-center`}>
                                    <button onClick={() => handleDeleteAgent(agent.id, agent.name)} className={`p-1 transition-colors ${
                                        theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'
                                    }`} title={t('common.delete')}>
                                        <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalItems={totalAgents}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
            </div>
        </div>
    );
};