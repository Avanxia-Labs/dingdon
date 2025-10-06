// app/dashboard/leads/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { Trash2, Mail, Phone, Calendar, User } from 'lucide-react';
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
    const feedbackSuccess = theme === 'dark' ? 'bg-green-900/20 border-green-700 text-green-400' : 'bg-green-50 border-green-200 text-green-700';
    const feedbackError = theme === 'dark' ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-200 text-red-700';

    return (
        <div className={`p-4 sm:p-6 min-h-screen ${mainBg}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
                <h1 className={`text-2xl sm:text-3xl font-bold ${textPrimary}`}>{t('leads.pageTitle')}</h1>
                {session?.user?.workspaceRole === 'admin' && leads.length > 0 && (
                    <button
                        onClick={handleDeleteAllLeads}
                        className={`px-3 sm:px-4 py-2 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors w-full sm:w-auto ${
                            theme === 'dark' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                        }`}
                    >
                        {t('leads.deleteAllButton')}
                    </button>
                )}
            </div>

            {feedback && (
                <div className={`mb-4 p-3 rounded-lg border text-sm ${
                    feedback.type === 'error' ? feedbackError : feedbackSuccess
                }`}>
                    {feedback.message}
                </div>
            )}

            {/* Vista de tabla para desktop */}
            <div className={`hidden md:block shadow-md rounded-lg overflow-x-auto ${cardBg} border ${borderColor}`}>
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className={`px-5 py-3 border-b-2 ${tableBorderColor} ${tableHeaderBg} text-left text-xs font-semibold uppercase tracking-wider ${tableHeaderText}`}>{t('leads.tableHeaderName')}</th>
                            <th className={`px-5 py-3 border-b-2 ${tableBorderColor} ${tableHeaderBg} text-left text-xs font-semibold uppercase tracking-wider ${tableHeaderText}`}>{t('leads.tableHeaderEmail')}</th>
                            <th className={`px-5 py-3 border-b-2 ${tableBorderColor} ${tableHeaderBg} text-left text-xs font-semibold uppercase tracking-wider ${tableHeaderText}`}>{t('leads.tableHeaderPhone')}</th>
                            <th className={`px-5 py-3 border-b-2 ${tableBorderColor} ${tableHeaderBg} text-left text-xs font-semibold uppercase tracking-wider ${tableHeaderText}`}>{t('leads.tableHeaderDate')}</th>
                            <th className={`px-5 py-3 border-b-2 ${tableBorderColor} ${tableHeaderBg} text-right text-xs font-semibold uppercase tracking-wider ${tableHeaderText}`}>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className={`text-center p-6 ${textSecondary}`}>{t('common.loading')}</td></tr>
                        ) : leads.length > 0 ? (
                            leads.map((lead) => (
                                <tr key={lead.id} className={`transition-colors ${tableRowHover}`}>
                                    <td className={`px-5 py-4 border-b ${tableBorderColor} text-sm`}><p className={`whitespace-no-wrap ${textPrimary}`}>{lead.name}</p></td>
                                    <td className={`px-5 py-4 border-b ${tableBorderColor} text-sm`}><p className={`whitespace-no-wrap ${textPrimary}`}>{lead.email}</p></td>
                                    <td className={`px-5 py-4 border-b ${tableBorderColor} text-sm`}><p className={`whitespace-no-wrap ${textPrimary}`}>{lead.phone || 'N/A'}</p></td>
                                    <td className={`px-5 py-4 border-b ${tableBorderColor} text-sm`}><p className={`whitespace-no-wrap ${textPrimary}`}>{new Date(lead.created_at).toLocaleString()}</p></td>
                                    <td className={`px-5 py-4 border-b ${tableBorderColor} text-sm text-right`}>
                                        <button onClick={() => handleDeleteLead(lead.id)} className={`transition-colors ${
                                            theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'
                                        }`} title={t('common.delete')}>
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

            {/* Vista de tarjetas para móvil */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    <div className={`text-center p-6 ${textSecondary}`}>{t('common.loading')}</div>
                ) : leads.length > 0 ? (
                    <>
                        {leads.map((lead) => (
                            <div key={lead.id} className={`shadow rounded-lg p-4 space-y-3 ${cardBg} border ${borderColor}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User size={16} className={textLight} />
                                            <span className={`font-medium ${textPrimary}`}>{lead.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail size={16} className={textLight} />
                                            <span className={`text-sm ${textSecondary}`}>{lead.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} className={textLight} />
                                            <span className={`text-sm ${textSecondary}`}>{lead.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className={textLight} />
                                            <span className={`text-xs ${textSecondary}`}>
                                                {new Date(lead.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteLead(lead.id)} 
                                        className={`p-2 rounded-lg transition-colors ${
                                            theme === 'dark' 
                                            ? 'text-red-400 hover:bg-red-900/20' 
                                            : 'text-red-600 hover:bg-red-50'
                                        }`}
                                        title={t('common.delete')}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <Pagination
                            currentPage={currentPage}
                            totalItems={totalLeads}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    </>
                ) : (
                    <div className={`text-center p-8 ${cardBg} rounded-lg border ${borderColor}`}>
                        <p className={textSecondary}>{t('leads.noLeads')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeadsPage;