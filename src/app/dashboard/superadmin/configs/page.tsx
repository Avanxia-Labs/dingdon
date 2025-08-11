// app/dashboard/superadmin/configs/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { I18nProvider } from '@/providers/I18nProvider';

interface TwilioConfig {
    id: string;
    config_name: string;
    account_sid: string;
    whatsapp_number: string;
    description: string | null;
}

const TwilioConfigsPageContent = () => {
    const { t } = useTranslation();
    const [configs, setConfigs] = useState<TwilioConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const [configName, setConfigName] = useState('');
    const [accountSid, setAccountSid] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [description, setDescription] = useState('');

    const fetchConfigs = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/superadmin/twilio-configs');
            if (!response.ok) throw new Error('Failed to fetch configs');
            const data = await response.json();
            setConfigs(data);
        } catch (error: any) {
            setFeedback({ message: `Error: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchConfigs(); }, []);

    const handleCreateConfig = async (e: FormEvent) => {
        e.preventDefault();
        setFeedback({ message: 'Creating configuration...', type: 'success' });
        try {
            const response = await fetch('/api/superadmin/twilio-configs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    config_name: configName,
                    account_sid: accountSid,
                    whatsapp_number: whatsappNumber,
                    description: description,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create config');
            
            setFeedback({ message: 'Configuration created successfully!', type: 'success' });
            fetchConfigs();
            setConfigName(''); setAccountSid(''); setWhatsappNumber(''); setDescription('');
        } catch (error: any) {
            setFeedback({ message: `${t('common.errorPrefix')}: ${error.message}`, type: 'error' });
        }
    };

    const handleDeleteConfig = async (configId: string) => {
        if (!confirm('Are you sure you want to delete this configuration? This cannot be undone.')) return;
        
        try {
             const response = await fetch(`/api/superadmin/twilio-configs/${configId}`, {
                method: 'DELETE',
            });
             if (!response.ok) throw new Error('Failed to delete configuration.');
             setFeedback({ message: 'Configuration deleted successfully.', type: 'success' });
             fetchConfigs();
        } catch (error: any) {
             setFeedback({ message: `Error: ${error.message}`, type: 'error' });
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Twilio Configurations</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Add New Twilio Configuration</h2>
                <form onSubmit={handleCreateConfig} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="configName" className="block text-sm font-medium text-gray-600">Configuration Name (e.g., CLIENTE_A)</label>
                            <input id="configName" type="text" value={configName} onChange={(e) => setConfigName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
                            <p className="text-xs text-gray-500 mt-1">This MUST match the `<b>TWILIO_TOKEN_</b>[NAME]` environment variable.</p>
                        </div>
                        <div>
                            <label htmlFor="accountSid" className="block text-sm font-medium text-gray-600">Account SID</label>
                            <input id="accountSid" type="text" value={accountSid} onChange={(e) => setAccountSid(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-600">WhatsApp Number</label>
                            <input id="whatsappNumber" type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} required placeholder="whatsapp:+1234567890" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
                        </div>
                         <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-600">Description</label>
                            <input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Add Configuration</button>
                </form>
                 {feedback && <p className={`mt-4 text-sm ${feedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{feedback.message}</p>}
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 tracking-wider">Config Name</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 tracking-wider">Account SID</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 tracking-wider">WhatsApp Number</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 tracking-wider">Description</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center p-6 text-gray-500">Loading...</td></tr>
                        ) : configs.length > 0 ? (
                            configs.map((config) => (
                                <tr key={config.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm"><p className="text-gray-900 font-mono whitespace-no-wrap">{config.config_name}</p></td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm"><p className="text-gray-900 whitespace-no-wrap">{config.account_sid}</p></td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm"><p className="text-gray-900 whitespace-no-wrap">{config.whatsapp_number}</p></td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm"><p className="text-gray-900 whitespace-no-wrap">{config.description}</p></td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm text-right">
                                        <button onClick={() => handleDeleteConfig(config.id)} className="text-red-600 hover:text-red-900" title="Delete Config">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                             <tr><td colSpan={5} className="text-center p-8 text-gray-500">No Twilio configurations found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TwilioConfigsPage = () => {
    return (
        <I18nProvider>
            <TwilioConfigsPageContent />
        </I18nProvider>
    );
};

export default TwilioConfigsPage;