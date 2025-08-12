// app/dashboard/components/SettingsPanel.tsx

'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSyncLanguage } from '@/hooks/useSyncLanguage';
import { Trash2 } from 'lucide-react';
import {
    Info, SlidersHorizontal, Code2, BadgeCheck, Braces,
    FileText, UploadCloud, File, Loader2, Globe
} from 'lucide-react';

interface SettingsPanelProps {
    workspaceId: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ workspaceId }) => {
    const { t } = useTranslation();
    const language = useDashboardStore((state) => state.language);
    useSyncLanguage(language);

    const [botName, setBotName] = useState('');
    const [botColor, setBotColor] = useState('#007bff');
    const [botAvatarUrl, setBotAvatarUrl] = useState('');
    const [botIntroduction, setBotIntroduction] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/workspaces/${workspaceId}/config`);
                const data = await response.json();
                if (response.ok) {
                    setBotName(data.bot_name || 'Virtual Assistant');
                    setBotColor(data.bot_color || '#007bff');
                    setBotAvatarUrl(data.bot_avatar_url || '');
                    setBotIntroduction(data.bot_introduction || '');
                } else {
                    throw new Error(data.error || 'Failed to load settings');
                }
            } catch (error: any) {
                setFeedback(`${t('common.errorPrefix')}: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, [workspaceId, t]);

    const handleSaveSettings = async (e: FormEvent) => {
        e.preventDefault();
        setFeedback(t('settings.feedback.saving'));
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bot_name: botName,
                    bot_color: botColor,
                    bot_avatar_url: botAvatarUrl,
                    bot_introduction: botIntroduction
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to save settings');
            setFeedback(t('settings.feedback.savedSuccess'));
        } catch (error: any) {
            setFeedback(`${t('common.errorPrefix')}: ${error.message}`);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleKnowledgeUpload = async () => {
        if (!file) {
            setFeedback(t('settings.feedback.selectFile'));
            return;
        }
        setIsUploading(true);
        setFeedback(t('settings.feedback.uploading'));
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspaceId', workspaceId);
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/knowledge`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Upload failed');
            setFeedback(t('settings.feedback.uploadSuccess'));
        } catch (error: any) {
            setFeedback(`${t('common.errorPrefix')}: ${error.message}`);
        } finally {
            setIsUploading(false);
            setFile(null);
        }
    };

    // --- FUNCIÓN PARA MANEJAR LA SUBIDA DEL AVATAR ---
    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        setFeedback(t('settings.feedback.uploading'));

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/avatar`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Upload failed');

            // Actualizamos el estado con la nueva URL devuelta por la API
            setBotAvatarUrl(data.avatarUrl);
            setFeedback(t('settings.feedback.avatarUpdated'));

        } catch (error: any) {
            setFeedback(`${t('common.errorPrefix')}: ${error.message}`);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    const appUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const embedCode = `<script src="${appUrl}/loader.js" data-bot-color="${botColor}" data-workspace-id="${workspaceId}" defer></script>`;

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('settings.pageTitle')}</h1>
                    <p className="text-gray-600">{t('settings.pageSubtitle')}</p>
                </div>
                {feedback && (
                    <div className={`mb-6 p-4 rounded-lg border ${feedback.includes(t('common.errorPrefix')) ? 'bg-red-50 border-red-200 text-red-700' : feedback.includes(t('settings.feedback.savedSuccess')) ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                        <div className="flex items-center">
                            <Info className="w-5 h-5 mr-3 flex-shrink-0" />
                            <p className="text-sm font-medium">{feedback}</p>
                        </div>
                    </div>
                )}
                <div className="space-y-8">
                    <div className="bg-white shadow-sm rounded-xl border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center"><SlidersHorizontal className="w-5 h-5 mr-2 text-blue-600" />{t('settings.customization.title')}</h2>
                            <p className="text-sm text-gray-600 mt-1">{t('settings.customization.subtitle')}</p>
                        </div>
                        <form onSubmit={handleSaveSettings} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="botName" className="block text-sm font-medium text-gray-700 mb-2">{t('settings.botName.label')}</label>
                                    <p className="text-xs text-gray-500 mb-3">{t('settings.botName.description')}</p>
                                    <input id="botName" type="text" value={botName} onChange={(e) => setBotName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder={t('settings.botName.placeholder')} />
                                </div>
                                
                                <div>
                                    <label htmlFor="botColor" className="block text-sm font-medium text-gray-700 mb-2">{t('settings.primaryColor.label')}</label>
                                    <p className="text-xs text-gray-500 mb-3">{t('settings.primaryColor.description')}</p>
                                    <div className="flex items-center gap-3">
                                        <input id="botColor" type="color" value={botColor} onChange={(e) => setBotColor(e.target.value)} className="h-10 w-16 rounded-lg border border-gray-300 cursor-pointer" />
                                        <input type="text" value={botColor} onChange={(e) => setBotColor(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="#007bff" />
                                    </div>
                                </div>
                                
                                {/* --- INICIO DEL NUEVO BLOQUE DE AVATAR --- */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('settings.botAvatar.label')}
                                    </label>
                                    <p className="text-xs text-gray-500 mb-3">{t('settings.botAvatar.description')}</p>
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={botAvatarUrl || '/default-bot-avatar.png'}
                                            alt="Avatar Preview"
                                            className="w-16 h-16 rounded-full object-cover bg-gray-100 border-2 border-black/10"
                                        />
                                        <label htmlFor="avatar-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50">
                                            {isUploadingAvatar ? t('settings.botAvatar.uploadingButton') : t('settings.botAvatar.changeButton')}
                                        </label>
                                        <input
                                            id="avatar-upload"
                                            name="avatar-upload"
                                            type="file"
                                            className="sr-only" // Oculta el input de archivo feo
                                            onChange={handleAvatarUpload}
                                            accept="image/png, image/jpeg, image/gif"
                                            disabled={isUploadingAvatar}
                                        />
                                        {botAvatarUrl && ( // Solo muestra el botón si hay un avatar personalizado
                                            <button
                                                type="button" 
                                                onClick={() => setBotAvatarUrl('')} 
                                                className="py-2 px-3 border border-transparent rounded-md text-sm font-medium text-red-600 hover:text-red-800"
                                                title="Remove custom avatar"
                                            >

                                                <Trash2 />
                                            </button>
                                        )}
                                    </div>
                                    {/* <p className="mt-1 text-xs text-gray-500">After changing the image, click "Save Settings" to confirm.</p> */}
                                </div>
                                {/* --- FIN DEL BLOQUE DE AVATAR --- */}

                                {/* --- INICIO DEL NUEVO BLOQUE DE INTRODUCCIÓN --- */}
                                <div className="md:col-span-2">
                                    <label htmlFor="botIntroduction" className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('settings.botIntro.label')}
                                    </label>
                                    <p className="text-xs text-gray-500 mb-3">{t('settings.botIntro.description')}</p>
                                    <textarea
                                        id="botIntroduction"
                                        value={botIntroduction}
                                        onChange={(e) => setBotIntroduction(e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder={t('settings.botIntro.placeholder')}
                                    />
                                </div>
                                {/* --- FIN DEL BLOQUE DE INTRODUCCIÓN --- */}
                            </div>
                            <div className="mt-6 flex justify-end"><button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500">{t('settings.saveButton')}</button></div>
                        </form>
                    </div>
                    <div className="bg-white shadow-sm rounded-xl border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center"><Code2 className="w-5 h-5 mr-2 text-green-600" />{t('settings.installation.title')}</h2>
                            <p className="text-sm text-gray-600 mt-1">{t('settings.installation.subtitle')}</p>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">{t('settings.installation.embedTitle')}</h3>
                                <p className="text-sm text-gray-600 mb-4">{t('settings.installation.embedDescription')}</p>
                                <div className="relative"><pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>{embedCode}</code></pre><button onClick={() => { navigator.clipboard.writeText(embedCode); setFeedback(t('settings.feedback.copied')); }} className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600">{t('settings.installation.copyButton')}</button></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                                        <BadgeCheck className="w-4 h-4 mr-2" />
                                        {t('settings.installation.wpTitle')}
                                    </h4>
                                    <p className="text-sm text-blue-800 mb-3">
                                        {t('settings.installation.wpDescription')}
                                    </p>
                                    <ol className="text-sm text-blue-700 space-y-1 ml-4">
                                        <li>
                                            <Trans
                                                i18nKey="settings.installation.wpStep1"
                                                components={{ strong: <strong /> }}
                                            />
                                        </li>
                                        <li>{t('settings.installation.wpStep2')}</li>
                                        <li>
                                            <Trans
                                                i18nKey="settings.installation.wpStep3"
                                                components={{ strong: <strong /> }}
                                            />
                                        </li>
                                        <li>
                                            <Trans
                                                i18nKey="settings.installation.wpStep4"
                                                components={{ code: <code className="bg-blue-100 px-1 py-0.5 rounded text-xs" /> }}
                                            />
                                        </li>
                                        <li>
                                            <Trans
                                                i18nKey="settings.installation.wpStep5"
                                                components={{ strong: <strong /> }}
                                            />
                                        </li>
                                    </ol>
                                    <p className="text-xs text-blue-600 mt-2">
                                        <Trans
                                            i18nKey="settings.installation.wpAlternative"
                                            components={{ strong: <strong /> }}
                                        />
                                    </p>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-medium text-green-900 mb-2 flex items-center">
                                        <Braces className="w-4 h-4 mr-2" />
                                        {t('settings.installation.customTitle')}
                                    </h4>
                                    <p className="text-sm text-green-800 mb-3">
                                        {t('settings.installation.customDescription')}
                                    </p>
                                    <ol className="text-sm text-green-700 space-y-1 ml-4">
                                        <li>
                                            <Trans
                                                i18nKey="settings.installation.customStep1"
                                                components={{ strong: <strong /> }}
                                            />
                                        </li>
                                        <li>{t('settings.installation.customStep2')}</li>
                                        <li>
                                            <Trans
                                                i18nKey="settings.installation.customStep3"
                                                components={{ code: <code className="bg-green-100 px-1 py-0.5 rounded text-xs" /> }}
                                            />
                                        </li>
                                        <li>{t('settings.installation.customStep4')}</li>
                                    </ol>
                                    <p className="text-xs text-green-600 mt-2">
                                        <Trans
                                            i18nKey="settings.installation.customNote"
                                            components={{ strong: <strong /> }}
                                        />
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white shadow-sm rounded-xl border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center"><FileText className="w-5 h-5 mr-2 text-purple-600" />{t('settings.knowledge.title')}</h2>
                            <p className="text-sm text-gray-600 mt-1">{t('settings.knowledge.subtitle')}</p>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">{t('settings.knowledge.description')}</p>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400"><UploadCloud className="mx-auto h-12 w-12 text-gray-400" strokeWidth={1.5} /><div className="mt-4"><label htmlFor="file-upload" className="cursor-pointer"><span className="mt-2 block text-sm font-medium text-gray-900">{t('settings.knowledge.uploadLabel')}</span><span className="block text-xs text-gray-500 mt-1">{t('settings.knowledge.uploadHint')}</span></label><input id="file-upload" type="file" onChange={handleFileChange} accept=".pdf,.txt,.docx" className="hidden" /></div></div>
                            {file && (<div className="mt-4 p-3 bg-gray-50 rounded-lg border"><div className="flex items-center justify-between"><div className="flex items-center"><File className="w-4 h-4 text-gray-400 mr-2" /><span className="text-sm text-gray-700">{file.name}</span></div><button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700 text-sm">{t('settings.knowledge.removeButton')}</button></div></div>)}
                            <div className="mt-6 flex justify-end"><button onClick={handleKnowledgeUpload} disabled={!file || isUploading} className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 disabled:bg-gray-400">{isUploading ? (<><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" />{t('settings.knowledge.processingButton')}</>) : (t('settings.knowledge.uploadButton'))}</button></div>
                        </div>
                    </div>
                    <div className="bg-white shadow-sm rounded-xl border border-gray-200 opacity-60">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-gray-500 flex items-center"><Globe className="w-5 h-5 mr-2 text-gray-400" />{t('settings.comingSoon.title')}</h2><span className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-200 rounded-full">{t('settings.comingSoon.tag')}</span></div>
                            <p className="text-sm text-gray-400 mt-1">{t('settings.comingSoon.subtitle')}</p>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-400 mb-4">{t('settings.comingSoon.description')}</p>
                            <div className="flex gap-4"><input type="url" placeholder="https://www.example.com" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" disabled /><button disabled className="px-6 py-2 bg-gray-400 text-white font-medium rounded-lg cursor-not-allowed">{t('settings.comingSoon.crawlButton')}</button></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};