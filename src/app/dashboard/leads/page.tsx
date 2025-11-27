// app/dashboard/leads/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { Pagination } from '@/components/Pagination';
import { useTheme } from '@/providers/ThemeProvider';

// Interfaz para el tipado de un lead
interface Lead {
    id: string;
    created_at: string;
    name: string;
    email: string;
    phone: string | null;
}

const LeadsPage = () => {
    const { t } = useTranslation();
    const { data: session } = useSession();
    const { theme } = useTheme();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // --- ESTADOS PARA LA PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalLeads, setTotalLeads] = useState(0);

    const workspaceId = session?.user?.workspaceId;

    // Paleta de colores
    const mainBg = theme === 'dark' ? 'bg-[#192229]' : 'bg-[#FBFBFE]';
    const cardBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const borderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-[#EFF3F5]';
    const textPrimary = theme === 'dark' ? 'text-[#EFF3F5]' : 'text-[#2A3B47]';
    const textSecondary = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const tableHeaderBg = theme === 'dark' ? 'bg-[#192229]' : 'bg-[#EFF3F5]';
    const tableRowHover = theme === 'dark' ? 'hover:bg-[#2a3b47]' : 'hover:bg-[#EFF3F5]';

    const fetchLeads = async () => {
        if (!workspaceId) return;
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/workspaces/${workspaceId}/leads?page=${currentPage}&limit=${itemsPerPage}`);
            
            if (response.status !== 200) throw new Error('Failed to fetch leads');

            const { data, count } = await response.data; // <-- Obtiene los datos y el conteo
            setLeads(data);
            setTotalLeads(count || 0);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to fetch leads';
            setFeedback({ message: `${t('common.errorPrefix')}: ${errorMessage}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (workspaceId) {
            fetchLeads();
        }
    }, [workspaceId, currentPage, itemsPerPage]);

    const handleDeleteLead = async (leadId: string) => {
        if (!workspaceId || !confirm(t('leads.deleteConfirm'))) return;
        try {
            await apiClient.delete(`/workspaces/${workspaceId}/leads/${leadId}`);
            setFeedback({ message: t('leads.feedback.deletedSuccess'), type: 'success' });
            fetchLeads(); // Recargar la lista
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to delete lead';
            setFeedback({ message: `${t('common.errorPrefix')}: ${errorMessage}`, type: 'error' });
        }
    };

    const handleDeleteAllLeads = async () => {
        if (!workspaceId) return;
        const confirmation = prompt(t('leads.deleteAllConfirm', { count: leads.length }));
        if (confirmation !== 'DELETE') {
            if (confirmation !== null) {
                setFeedback({ message: t('leads.deleteCancelled'), type: 'error' });
            }
            return;
        }

        try {
            setFeedback({ message: t('leads.feedback.deletingAll'), type: 'success' });
            await apiClient.delete(`/workspaces/${workspaceId}/leads`);
            setFeedback({ message: t('leads.feedback.deletedAllSuccess'), type: 'success' });
            fetchLeads();
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to delete all leads';
            setFeedback({ message: `${t('common.errorPrefix')}: ${errorMessage}`, type: 'error' });
        }
    };

    return (
        <div className={`p-3 sm:p-4 min-h-full ${mainBg}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 gap-3 sm:gap-4">
                <h1 className={`text-xl sm:text-3xl font-bold ${textPrimary}`}>{t('leads.pageTitle')}</h1>
                {session?.user?.workspaceRole === 'admin' && leads.length > 0 && (
                    <button
                        onClick={handleDeleteAllLeads}
                        className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors text-sm"
                    >
                        {t('leads.deleteAllButton')}
                    </button>
                )}
            </div>

            {feedback && (
                <div className={`mb-3 sm:mb-4 p-3 rounded-lg border text-xs sm:text-sm ${feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    {feedback.message}
                </div>
            )}

            {/* Vista móvil: Cards */}
            <div className="block sm:hidden space-y-3">
                {isLoading ? (
                    <div className={`text-center p-6 ${textSecondary}`}>{t('common.loading')}</div>
                ) : leads.length > 0 ? (
                    leads.map((lead) => (
                        <div key={lead.id} className={`p-3 rounded-lg ${cardBg} border ${borderColor}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`font-semibold text-sm ${textPrimary}`}>{lead.name}</span>
                                <button onClick={() => handleDeleteLead(lead.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <p className={`text-xs ${textSecondary} truncate`}>{lead.email}</p>
                            <div className="flex items-center justify-between mt-2">
                                <span className={`text-xs ${textSecondary}`}>{lead.phone || 'N/A'}</span>
                                <span className={`text-xs ${textSecondary}`}>{new Date(lead.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={`text-center p-8 ${textSecondary}`}>{t('leads.noLeads')}</div>
                )}
            </div>

            {/* Vista desktop: Tabla */}
            <div className={`hidden sm:block shadow-md rounded-lg overflow-x-auto ${cardBg} border ${borderColor}`}>
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className={`px-3 md:px-5 py-3 border-b-2 ${borderColor} ${tableHeaderBg} text-left text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>{t('leads.tableHeaderName')}</th>
                            <th className={`px-3 md:px-5 py-3 border-b-2 ${borderColor} ${tableHeaderBg} text-left text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>{t('leads.tableHeaderEmail')}</th>
                            <th className={`px-3 md:px-5 py-3 border-b-2 ${borderColor} ${tableHeaderBg} text-left text-xs font-semibold ${textSecondary} uppercase tracking-wider hidden lg:table-cell`}>{t('leads.tableHeaderPhone')}</th>
                            <th className={`px-3 md:px-5 py-3 border-b-2 ${borderColor} ${tableHeaderBg} text-left text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>{t('leads.tableHeaderDate')}</th>
                            <th className={`px-3 md:px-5 py-3 border-b-2 ${borderColor} ${tableHeaderBg} text-right text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className={`text-center p-6 ${textSecondary}`}>{t('common.loading')}</td></tr>
                        ) : leads.length > 0 ? (
                            leads.map((lead) => (
                                <tr key={lead.id} className={`${tableRowHover} transition-colors`}>
                                    <td className={`px-3 md:px-5 py-3 md:py-4 border-b ${borderColor} text-xs md:text-sm`}><p className={`${textPrimary} whitespace-nowrap`}>{lead.name}</p></td>
                                    <td className={`px-3 md:px-5 py-3 md:py-4 border-b ${borderColor} text-xs md:text-sm`}><p className={`${textPrimary} whitespace-nowrap truncate max-w-[150px] md:max-w-none`}>{lead.email}</p></td>
                                    <td className={`px-3 md:px-5 py-3 md:py-4 border-b ${borderColor} text-xs md:text-sm hidden lg:table-cell`}><p className={`${textPrimary} whitespace-nowrap`}>{lead.phone || 'N/A'}</p></td>
                                    <td className={`px-3 md:px-5 py-3 md:py-4 border-b ${borderColor} text-xs md:text-sm`}><p className={`${textPrimary} whitespace-nowrap`}>{new Date(lead.created_at).toLocaleDateString()}</p></td>
                                    <td className={`px-3 md:px-5 py-3 md:py-4 border-b ${borderColor} text-sm text-right`}>
                                        <button onClick={() => handleDeleteLead(lead.id)} className="text-red-500 hover:text-red-700" title={t('common.delete')}>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className={`text-center p-8 ${textSecondary}`}>{t('leads.noLeads')}</td></tr>
                        )}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalItems={totalLeads}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
            </div>

            {/* Paginación móvil */}
            <div className="block sm:hidden mt-4">
                <Pagination
                    currentPage={currentPage}
                    totalItems={totalLeads}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
            </div>
        </div>
    );
};

export default LeadsPage;