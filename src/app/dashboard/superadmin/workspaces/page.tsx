'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Edit, Bot, MessageSquare, Copy } from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSyncLanguage } from '@/hooks/useSyncLanguage';


interface Workspace {
    id: string;
    name: string;
    created_at: string;
    ai_model?: string;
    ai_api_key_name?: string;
    //twilio_config_name?: string | null
    twilio_config_id?: string | null
    twilio_configs: { config_name: string } | null;
}

interface TwilioConfig {
    id: string;
    config_name: string;
}

const availableModels = [
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'moonshot-v1-8k', label: 'Kimi (Moonshot) 8k' },
    { value: 'moonshot-v1-32k', label: 'Kimi (Moonshot) 32k' },
];

const availableApiKeys = [
    { value: '', label: 'Use System Default Key' },
    { value: 'GEMINI_API_KEY_1', label: 'Gemini Key 1' },
    { value: 'KIMI_API_KEY_1', label: 'Kimi Key 1' },
    { value: 'KIMI_API_KEY_2', label: 'Kimi Key 2' },
];

// const availableTwilioConfigs = [
//     { value: 'DEFAULT', label: 'Use System Default Twilio Account' },
//     { value: 'CLIENTE_A', label: 'Twilio Config (Cliente A)' },
//     { value: 'CLIENTE_B', label: 'Twilio Config (Cliente B)' },
// ];

const ManageWorkspacesPage = () => {
    const { t } = useTranslation();
    const language = useDashboardStore((state) => state.language);
    useSyncLanguage(language);

    // --- 2. DEFINE LA URL BASE DE TU APLICACIÓN ---
    // Asegúrate de tener NEXT_PUBLIC_API_URL en tu .env.local y en Render
    const appUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [workspaceName, setWorkspaceName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
    const [newName, setNewName] = useState('');

    // ---  ESTADOS PARA EL MODAL DE CONFIGURACIÓN DE IA ---
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [aiModel, setAiModel] = useState('');
    const [aiApiKeyName, setAiApiKeyName] = useState('');

    // --- ESTADOS PARA TWILIO ---
    const [isTwilioModalOpen, setIsTwilioModalOpen] = useState(false);
    const [twilioConfigs, setTwilioConfigs] = useState<TwilioConfig[]>([]); // Para guardar la lista de la API
    const [selectedTwilioConfigId, setSelectedTwilioConfigId] = useState<string>(''); // Guarda el ID seleccionado

    const fetchWorkspaces = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/superadmin/workspaces');
            if (!response.ok) throw new Error('Failed to fetch workspaces');
            const data = await response.json();
            setWorkspaces(data);
        } catch (error) { setFeedback({ message: 'Error loading workspaces.', type: 'error' }); } finally { setIsLoading(false); }
    };

    // --- FUNCIÓN PARA CARGAR LAS CONFIGS DE TWILIO ---
    const fetchTwilioConfigs = async () => {
        try {
            const response = await fetch('/api/superadmin/twilio-configs');
            if (!response.ok) throw new Error('Failed to fetch Twilio configs');
            const data = await response.json();
            setTwilioConfigs(data);
        } catch (error) {
            setFeedback({ message: 'Error loading Twilio configurations.', type: 'error' });
        }
    };

    useEffect(() => {
        fetchWorkspaces();
        fetchTwilioConfigs();
    }, []);

    const handleCreateWorkspace = async (e: FormEvent) => {
        e.preventDefault();
        setFeedback({ message: t('superadmin.feedback.creating'), type: 'success' });
        try {
            const response = await fetch('/api/superadmin/workspaces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceName, adminName, adminEmail, adminPassword }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create workspace');
            setFeedback({ message: t('superadmin.feedback.createdSuccess'), type: 'success' });
            fetchWorkspaces();
            setWorkspaceName(''); setAdminName(''); setAdminEmail(''); setAdminPassword('');
        } catch (error: any) { setFeedback({ message: `${t('common.errorPrefix')}: ${error.message}`, type: 'error' }); }
    };

    const handleDeleteWorkspace = async (workspaceId: string, name: string) => {
        if (!confirm(t('superadmin.deleteConfirm', { name }))) { return; }
        try {
            setFeedback({ message: t('superadmin.feedback.deleting'), type: 'success' });
            const response = await fetch(`/api/superadmin/workspaces/${workspaceId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete workspace');
            setFeedback({ message: t('superadmin.feedback.deletedSuccess', { name }), type: 'success' });
            fetchWorkspaces();
        } catch (error: any) { setFeedback({ message: `${t('common.errorPrefix')}: ${error.message}`, type: 'error' }); }
    };

    const handleOpenEditModal = (workspace: Workspace) => {
        setEditingWorkspace(workspace);
        setNewName(workspace.name);
        setFeedback(null);
    };

    const handleUpdateWorkspace = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingWorkspace) return;
        setFeedback({ message: t('superadmin.feedback.updating'), type: 'success' });
        try {
            const response = await fetch(`/api/superadmin/workspaces/${editingWorkspace.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) });
            if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to update workspace'); }
            setFeedback({ message: t('superadmin.feedback.updatedSuccess'), type: 'success' });
            setEditingWorkspace(null);
            fetchWorkspaces();
        } catch (error: any) { setFeedback({ message: `${t('common.errorPrefix')}: ${error.message}`, type: 'error' }); }
    };


    const handleOpenAiModal = (workspace: Workspace) => {
        setSelectedWorkspace(workspace);
        setAiModel(workspace.ai_model || "gemini-2.0-flash");
        setAiApiKeyName(workspace.ai_api_key_name || '');
        setIsAiModalOpen(true);
        setFeedback(null);
    };

    const handleSaveAiConfig = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedWorkspace) return;

        setFeedback({ message: 'Updating AI configuration...', type: 'success' });

        try {
            const response = await fetch(`/api/superadmin/workspaces/${selectedWorkspace.id}/ai-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ai_model: aiModel, ai_api_key_name: aiApiKeyName }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update AI config.');
            }

            setFeedback({ message: 'AI configuration updated successfully!', type: 'success' });
            fetchWorkspaces();
            setIsAiModalOpen(false);

        } catch (error: any) {
            setFeedback({ message: `${t('common.errorPrefix')}: ${error.message}`, type: 'error' });
        }
    };

    // --- FUNCIONES PARA TWILIO ---
    const handleOpenTwilioModal = (workspace: Workspace) => {
        setSelectedWorkspace(workspace);
        setSelectedTwilioConfigId(workspace.twilio_config_id || ''); // Establece el ID guardado o vacío
        setIsTwilioModalOpen(true);
        setFeedback(null);
    };

    const handleSaveTwilioConfig = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedWorkspace) return;
        setFeedback({ message: 'Updating Twilio configuration...', type: 'success' });
        try {
            const response = await fetch(`/api/superadmin/workspaces/${selectedWorkspace.id}/twilio-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ twilio_config_id: selectedTwilioConfigId }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update Twilio config.');

            setFeedback({ message: 'Twilio configuration updated successfully!', type: 'success' });
            fetchWorkspaces(); // Recargar datos para que se refleje el cambio
            setIsTwilioModalOpen(false);
        } catch (error: any) {
            setFeedback({ message: `${t('common.errorPrefix')}: ${error.message}`, type: 'error' });
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('superadmin.pageTitle')}</h1>
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('superadmin.createTitle')}</h2>
                <form onSubmit={handleCreateWorkspace} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="workspaceName" className="block text-sm font-medium text-gray-600">{t('superadmin.companyNameLabel')}</label>
                        <input id="workspaceName" type="text" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="adminName" className="block text-sm font-medium text-gray-600">{t('superadmin.adminNameLabel')}</label>
                        <input id="adminName" type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-600">{t('superadmin.adminEmailLabel')}</label>
                        <input id="adminEmail" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-600">{t('superadmin.adminPasswordLabel')}</label>
                        <input id="adminPassword" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required minLength={8} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
                    </div>
                    <div className="md:col-span-2">
                        <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">{t('superadmin.createButton')}</button>
                    </div>
                </form>
                {feedback && <p className={`mt-4 text-sm ${feedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{feedback.message}</p>}
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 tracking-wider">{t('superadmin.tableHeaderName')}</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 tracking-wider">{t('superadmin.tableHeaderDate')}</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 tracking-wider">
                                Twilio Config
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 tracking-wider">
                                Webhook URL (Twilio)
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 tracking-wider">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (<tr><td colSpan={5} className="text-center p-4">{t('common.loading')}</td></tr>) : (
                            workspaces.map((ws) => {
                                const webhookUrl = `${appUrl}/api/whatsapp/webhook?workspaceId=${ws.id}`;
                                return (

                                    <tr key={ws.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm"><p className="text-gray-900">{ws.name}</p></td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm"><p className="text-gray-900">{new Date(ws.created_at).toLocaleDateString()}</p></td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                            {ws.twilio_configs ? (
                                                <span className="font-mono text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                    {ws.twilio_configs.config_name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(webhookUrl);
                                                    setFeedback({ message: 'Webhook URL copied!', type: 'success' });
                                                }}
                                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 font-mono"
                                                title="Copy Webhook URL"
                                            >
                                                <Copy size={14} />
                                                <span className='truncate max-w-[400px]'>{webhookUrl}</span>
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-right">
                                            <button
                                                onClick={() => handleOpenTwilioModal(ws)}
                                                className="text-green-600 hover:text-green-900 mr-4"
                                                title="Configure Twilio/WhatsApp"
                                            >
                                                <MessageSquare size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenAiModal(ws)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                                title="Configure AI"
                                            >
                                                <Bot size={20} />
                                            </button>
                                            <button onClick={() => handleOpenEditModal(ws)} className="text-indigo-600 hover:text-indigo-900 mr-4" title={t('common.edit')}><Edit size={18} /></button>
                                            <button onClick={() => handleDeleteWorkspace(ws.id, ws.name)} className="text-red-600 hover:text-red-900" title={t('common.delete')}><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
            {editingWorkspace && (
                <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-20" onClick={() => setEditingWorkspace(null)}>
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">{t('superadmin.editModalTitle')}</h3>
                        <form onSubmit={handleUpdateWorkspace}>
                            <div>
                                <label htmlFor="editWorkspaceName" className="block text-sm font-medium text-gray-700">{t('superadmin.newNameLabel')}</label>
                                <input id="editWorkspaceName" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500" />
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={() => setEditingWorkspace(null)} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">{t('common.cancel')}</button>
                                <button type="submit" className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{t('superadmin.updateButton')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAiModalOpen && selectedWorkspace && (
                <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-20" onClick={() => setIsAiModalOpen(false)}>
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">
                            Configure AI for <span className="text-blue-600">{selectedWorkspace.name}</span>
                        </h3>
                        <form onSubmit={handleSaveAiConfig}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="aiModel" className="block text-sm font-medium text-gray-700">AI Model</label>
                                    <select
                                        id="aiModel"
                                        value={aiModel}
                                        onChange={(e) => setAiModel(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                                    >
                                        {availableModels.map(model => (
                                            <option key={model.value} value={model.value}>{model.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="aiApiKeyName" className="block text-sm font-medium text-gray-700">API Key Reference</label>
                                    <select
                                        id="aiApiKeyName"
                                        value={aiApiKeyName}
                                        onChange={(e) => setAiApiKeyName(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                                    >
                                        {availableApiKeys.map(key => (
                                            <option key={key.value} value={key.value}>{key.label}</option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">The selected key must be configured on the server environment.</p>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsAiModalOpen(false)} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">{t('common.cancel')}</button>
                                <button type="submit" className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Save AI Config</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isTwilioModalOpen && selectedWorkspace && (
                <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-20" onClick={() => setIsTwilioModalOpen(false)}>
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">
                            Configure Twilio for <span className="text-green-600">{selectedWorkspace.name}</span>
                        </h3>
                        <form onSubmit={handleSaveTwilioConfig}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="twilioConfigId" className="block text-sm font-medium text-gray-700">Twilio Account Configuration</label>
                                    <select
                                        id="twilioConfigId"
                                        value={selectedTwilioConfigId || ''}
                                        onChange={(e) => setSelectedTwilioConfigId(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500"
                                    >
                                        <option value="">(Use System Default)</option>
                                        {twilioConfigs.map(config => (
                                            <option key={config.id} value={config.id}>{config.config_name}</option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">Select the set of Twilio credentials for this workspace.</p>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsTwilioModalOpen(false)} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">{t('common.cancel')}</button>
                                <button type="submit" className="py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">Save Twilio Config</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageWorkspacesPage;