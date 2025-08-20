<<<<<<< HEAD
// app/dashboard/leads/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';

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
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const workspaceId = session?.user?.workspaceId;

    const fetchLeads = async () => {
        if (!workspaceId) return;
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/workspaces/${workspaceId}/leads`);
            setLeads(response.data);
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
    }, [workspaceId]);

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
            setFeedback({ message: t('leads.feedback.deletingAll'), type: 'success'});
            await apiClient.delete(`/workspaces/${workspaceId}/leads`);
            setFeedback({ message: t('leads.feedback.deletedAllSuccess'), type: 'success' });
            fetchLeads();
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to delete all leads';
            setFeedback({ message: `${t('common.errorPrefix')}: ${errorMessage}`, type: 'error' });
        }
    };

    return (
        <div className='p-4'>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">{t('leads.pageTitle')}</h1>
                {session?.user?.workspaceRole === 'admin' && leads.length > 0 && (
                     <button 
                        onClick={handleDeleteAllLeads} 
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                     >
                         {t('leads.deleteAllButton')}
                     </button>
                )}
            </div>

            {feedback && (
                <div className={`mb-4 p-3 rounded-lg border text-sm ${feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    {feedback.message}
                </div>
            )}

            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 tracking-wider">{t('leads.tableHeaderName')}</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 tracking-wider">{t('leads.tableHeaderEmail')}</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 tracking-wider">{t('leads.tableHeaderPhone')}</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 tracking-wider">{t('leads.tableHeaderDate')}</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 tracking-wider">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center p-6 text-gray-500">{t('common.loading')}</td></tr>
                        ) : leads.length > 0 ? (
                            leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm"><p className="text-gray-900 whitespace-no-wrap">{lead.name}</p></td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm"><p className="text-gray-900 whitespace-no-wrap">{lead.email}</p></td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm"><p className="text-gray-900 whitespace-no-wrap">{lead.phone || 'N/A'}</p></td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm"><p className="text-gray-900 whitespace-no-wrap">{new Date(lead.created_at).toLocaleString()}</p></td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm text-right">
                                        <button onClick={() => handleDeleteLead(lead.id)} className="text-red-600 hover:text-red-900" title={t('common.delete')}>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="text-center p-8 text-gray-500">{t('leads.noLeads')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

=======
// app/dashboard/leads/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';

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
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const workspaceId = session?.user?.workspaceId;

    const fetchLeads = async () => {
        if (!workspaceId) return;
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/workspaces/${workspaceId}/leads`);
            setLeads(response.data);
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
    }, [workspaceId]);

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
            setFeedback({ message: t('leads.feedback.deletingAll'), type: 'success'});
            await apiClient.delete(`/workspaces/${workspaceId}/leads`);
            setFeedback({ message: t('leads.feedback.deletedAllSuccess'), type: 'success' });
            fetchLeads();
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to delete all leads';
            setFeedback({ message: `${t('common.errorPrefix')}: ${errorMessage}`, type: 'error' });
        }
    };

    return (
        <div className='p-4'>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">{t('leads.pageTitle')}</h1>
                {session?.user?.workspaceRole === 'admin' && leads.length > 0 && (
                     <button 
                        onClick={handleDeleteAllLeads} 
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                     >
                         {t('leads.deleteAllButton')}
                     </button>
                )}
            </div>

            {feedback && (
                <div className={`mb-4 p-3 rounded-lg border text-sm ${feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    {feedback.message}
                </div>
            )}

            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('leads.tableHeaderName')}</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('leads.tableHeaderEmail')}</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('leads.tableHeaderPhone')}</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('leads.tableHeaderDate')}</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center p-6 text-gray-500">{t('common.loading')}</td></tr>
                        ) : leads.length > 0 ? (
                            leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm"><p className="text-gray-900 whitespace-no-wrap">{lead.name}</p></td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm"><p className="text-gray-900 whitespace-no-wrap">{lead.email}</p></td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm"><p className="text-gray-900 whitespace-no-wrap">{lead.phone || 'N/A'}</p></td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm"><p className="text-gray-900 whitespace-no-wrap">{new Date(lead.created_at).toLocaleString()}</p></td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm text-right">
                                        <button onClick={() => handleDeleteLead(lead.id)} className="text-red-600 hover:text-red-900" title={t('common.delete')}>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="text-center p-8 text-gray-500">{t('leads.noLeads')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

>>>>>>> samuel-dev
export default LeadsPage;