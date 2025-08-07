'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '@/stores/chatbotStore';
import { apiClient } from '@/services/apiClient';

export const LeadCollectorForm = () => {
    const { t } = useTranslation();
    const { setLeadCollected, workspaceId, config } = useChatStore();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await apiClient.post('/leads', {
                workspaceId,
                name,
                email,
                phone
            });
             
            // Si todo va bien, actualizamos el estado para mostrar el chat
            setLeadCollected(true);

        } catch (err: any) {
            const errorMessage = err.response?.data?.error || "There was an issue. Please try again.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full w-full bg-white rounded-lg flex flex-col p-6 justify-center">
            <h3 className="font-semibold text-lg text-center mb-2">{t('chatbotUI.leadFormTitle')}</h3>
            <p className="text-sm text-gray-500 text-center mb-6">{t('chatbotUI.leadFormSubtitle')}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="sr-only">{t('chatbotUI.leadFormName')}</label>
                    <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('chatbotUI.leadFormName')} required className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                    <label htmlFor="email" className="sr-only">{t('chatbotUI.leadFormEmail')}</label>
                    <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('chatbotUI.leadFormEmail')} required className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                    <label htmlFor="phone" className="sr-only">{t('chatbotUI.leadFormPhone')}</label>
                    <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('chatbotUI.leadFormPhone')} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button type="submit" disabled={isLoading} style={{ backgroundColor: config.botColor }} className="w-full py-2 text-white rounded-lg hover:opacity-90 disabled:bg-gray-400">
                    {isLoading ? t('chatbotUI.leadFormLoading') : t('chatbotUI.leadFormButton')}
                </button>
            </form>
        </div>
    );
};