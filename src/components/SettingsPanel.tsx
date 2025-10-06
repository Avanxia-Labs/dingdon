// app/dashboard/components/SettingsPanel.tsx

'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSyncLanguage } from '@/hooks/useSyncLanguage';
import { useTheme } from '@/providers/ThemeProvider';
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
    const { theme } = useTheme();
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
    const [notificationEmail, setNotificationEmail] = useState('');
    const [resendApiKey, setResendApiKey] = useState('');
    const [resendFromEmail, setResendFromEmail] = useState('');

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
                    setNotificationEmail(data.notification_email || '');
                    setResendFromEmail(data.resend_from_email || '');
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
                    bot_introduction: botIntroduction,
                    notification_email: notificationEmail,
                    resend_api_key: resendApiKey || undefined,
                    resend_from_email: resendFromEmail,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to save settings');
            setFeedback(t('settings.feedback.savedSuccess'));
            setResendApiKey(''); // Limpiamos el campo de Resend API Key después de guardar
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

    // Generate embed code
    const appUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const embedCode = `<script src="${appUrl}/loader.js" data-bot-color="${botColor}" data-workspace-id="${workspaceId}" defer></script>`;

    // Paleta de colores para modo claro y oscuro
    const mainBg = theme === 'dark' ? 'bg-[#192229]' : 'bg-[#FBFBFE]';
    const cardBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-white';
    const borderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-gray-200';
    const textPrimary = theme === 'dark' ? 'text-[#EFF3F5]' : 'text-gray-900';
    const textSecondary = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-gray-600';
    const textLight = theme === 'dark' ? 'text-[#A0A7AC]' : 'text-gray-500';
    const inputBg = theme === 'dark' ? 'bg-[#2a3b47]' : 'bg-white';
    const inputBorder = theme === 'dark' ? 'border-[#3a4b57]' : 'border-gray-300';
    const inputText = theme === 'dark' ? 'text-[#EFF3F5]' : 'text-gray-900';
    const hoverBg = theme === 'dark' ? 'hover:bg-[#3a4b57]' : 'hover:bg-gray-50';
    const buttonPrimary = theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700';
    const buttonPurple = theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-700';
    const sectionBg = theme === 'dark' ? 'bg-[#2a3b47]' : 'bg-gray-50';
    const codeBg = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-900';
    const codeText = theme === 'dark' ? 'text-gray-100' : 'text-gray-100';
    const alertBg = theme === 'dark' ? 'bg-[#2a3b47]' : 'bg-blue-50';
    const alertBorder = theme === 'dark' ? 'border-[#52A5E0]' : 'border-blue-200';
    const alertText = theme === 'dark' ? 'text-[#52A5E0]' : 'text-blue-700';
    const successBg = theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50';
    const successBorder = theme === 'dark' ? 'border-green-600' : 'border-green-200';
    const successText = theme === 'dark' ? 'text-green-400' : 'text-green-700';
    const errorBg = theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50';
    const errorBorder = theme === 'dark' ? 'border-red-600' : 'border-red-200';
    const errorText = theme === 'dark' ? 'text-red-400' : 'text-red-700';

    if (isLoading) {
        return (
            <div className={`min-h-full ${mainBg} flex items-center justify-center p-8`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className={textSecondary}>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full ${mainBg}`} style={{ minHeight: '100%', backgroundColor: theme === 'dark' ? '#192229' : '#FBFBFE' }}>
            <div className={`w-full ${mainBg} py-4 sm:py-6 px-4 sm:px-6 lg:px-8`}>
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-6 sm:mb-8">
                        <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold ${textPrimary} mb-2`}>{t('settings.pageTitle')}</h1>
                        <p className={`text-sm sm:text-base ${textSecondary}`}>{t('settings.pageSubtitle')}</p>
                    </div>
                {feedback && (
                    <div className={`mb-6 p-4 rounded-lg border ${
                        feedback.includes(t('common.errorPrefix')) 
                            ? `${errorBg} ${errorBorder} ${errorText}` 
                            : feedback.includes(t('settings.feedback.savedSuccess')) 
                            ? `${successBg} ${successBorder} ${successText}` 
                            : `${alertBg} ${alertBorder} ${alertText}`
                    }`}>
                        <div className="flex items-center">
                            <Info className="w-5 h-5 mr-3 flex-shrink-0" />
                            <p className="text-sm font-medium">{feedback}</p>
                        </div>
                    </div>
                )}
                <div className="space-y-8">
                    <div className={`${cardBg} shadow-sm rounded-xl border ${borderColor}`}>
                        <div className={`px-4 sm:px-6 py-4 border-b ${borderColor}`}>
                            <h2 className={`text-lg sm:text-xl font-semibold ${textPrimary} flex items-center`}><SlidersHorizontal className="w-5 h-5 mr-2 text-blue-600" />{t('settings.customization.title')}</h2>
                            <p className={`text-sm ${textSecondary} mt-1`}>{t('settings.customization.subtitle')}</p>
                        </div>
                        <form onSubmit={handleSaveSettings} className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label htmlFor="botName" className={`block text-sm font-medium ${textPrimary} mb-2`}>{t('settings.botName.label')}</label>
                                    <p className={`text-xs ${textLight} mb-3`}>{t('settings.botName.description')}</p>
                                    <input id="botName" type="text" value={botName} onChange={(e) => setBotName(e.target.value)} className={`w-full px-3 py-2 border ${inputBorder} ${inputBg} ${inputText} rounded-lg focus:ring-2 focus:ring-blue-500`} placeholder={t('settings.botName.placeholder')} />
                                </div>

                                <div>
                                    <label htmlFor="botColor" className={`block text-sm font-medium ${textPrimary} mb-2`}>{t('settings.primaryColor.label')}</label>
                                    <p className={`text-xs ${textLight} mb-3`}>{t('settings.primaryColor.description')}</p>
                                    <div className="flex items-center gap-3">
                                        <input id="botColor" type="color" value={botColor} onChange={(e) => setBotColor(e.target.value)} className={`h-10 w-16 rounded-lg border ${inputBorder} cursor-pointer`} />
                                        <input type="text" value={botColor} onChange={(e) => setBotColor(e.target.value)} className={`flex-1 px-3 py-2 border ${inputBorder} ${inputBg} ${inputText} rounded-lg focus:ring-2 focus:ring-blue-500`} placeholder="#007bff" />
                                    </div>
                                </div>

                                {/* --- INICIO DEL NUEVO BLOQUE DE AVATAR --- */}
                                <div className="md:col-span-2">
                                    <label className={`block text-sm font-medium ${textPrimary} mb-2`}>
                                        {t('settings.botAvatar.label')}
                                    </label>
                                    <p className={`text-xs ${textLight} mb-3`}>{t('settings.botAvatar.description')}</p>
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={botAvatarUrl || '/default-bot-avatar.png'}
                                            alt="Avatar Preview"
                                            className={`w-16 h-16 rounded-full object-cover border-2 ${
                                                theme === 'dark' ? 'bg-[#2a3b47] border-[#3a4b57]' : 'bg-gray-100 border-black/10'
                                            }`}
                                        />
                                        <label htmlFor="avatar-upload" className={`cursor-pointer py-2 px-3 border ${inputBorder} ${inputBg} ${hoverBg} rounded-md shadow-sm text-sm leading-4 font-medium ${textPrimary}`}>
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
                                                className={`py-2 px-3 border border-transparent rounded-md text-sm font-medium ${
                                                    theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'
                                                }`}
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
                                    <label htmlFor="botIntroduction" className={`block text-sm font-medium ${textPrimary} mb-2`}>
                                        {t('settings.botIntro.label')}
                                    </label>
                                    <p className={`text-xs ${textLight} mb-3`}>{t('settings.botIntro.description')}</p>
                                    <textarea
                                        id="botIntroduction"
                                        value={botIntroduction}
                                        onChange={(e) => setBotIntroduction(e.target.value)}
                                        rows={2}
                                        className={`w-full px-3 py-2 border ${inputBorder} ${inputBg} ${inputText} rounded-lg`}
                                        placeholder={t('settings.botIntro.placeholder')}
                                    />
                                </div>
                                {/* --- FIN DEL BLOQUE DE INTRODUCCIÓN --- */}

                                {/* --- BLOQUE DE NOTIFICACIONES --- */}
                                <div className={`md:col-span-2 border-t ${borderColor} pt-6`}>
                                    <h3 className={`text-lg font-medium ${textPrimary} mb-4`}>
                                        {t('settings.notifications.sectionTitle')}
                                    </h3>

                                    {/* CAMPO: Notification Email (TO) */}
                                    <div className="mb-4">
                                        <label htmlFor="notificationEmail" className={`block text-sm font-medium ${textPrimary}`}>{t('settings.notifications.emailLabel')}</label>
                                        <p className={`text-xs ${textLight} mt-1`}>{t('settings.notifications.emailDescription')}</p>
                                        <input id="notificationEmail" type="email" value={notificationEmail} onChange={(e) => setNotificationEmail(e.target.value)} className={`mt-2 w-full px-3 py-2 border ${inputBorder} ${inputBg} ${inputText} rounded-lg`} />
                                    </div>

                                    {/* CAMPO: Resend From Email (FROM) */}
                                    <div className="mb-4">
                                        <label htmlFor="resendFromEmail" className={`block text-sm font-medium ${textPrimary}`}>{t('settings.notifications.fromEmailLabel')}</label>
                                        <p className={`text-xs ${textLight} mt-1`}>{t('settings.notifications.fromEmailDescription')}</p>
                                        <input id="resendFromEmail" type="email" value={resendFromEmail} onChange={(e) => setResendFromEmail(e.target.value)} className={`mt-2 w-full px-3 py-2 border ${inputBorder} ${inputBg} ${inputText} rounded-lg`} />
                                    </div>

                                    {/* CAMPO: Resend API Key */}
                                    <div>
                                        <label htmlFor="resendApiKey" className={`block text-sm font-medium ${textPrimary}`}>{t('settings.notifications.apiKeyLabel')}</label>
                                        <p className={`text-xs ${textLight} mt-1`}>{t('settings.notifications.apiKeyDescription')}</p>
                                        <input id="resendApiKey" type="password" value={resendApiKey} onChange={(e) => setResendApiKey(e.target.value)} className={`mt-2 w-full px-3 py-2 border ${inputBorder} ${inputBg} ${inputText} rounded-lg`} placeholder={t('settings.notifications.apiKeyPlaceholder')} />
                                    </div>
                                </div>



                            </div>
                            <div className="mt-6 flex justify-end"><button type="submit" className={`px-4 sm:px-6 py-2 ${buttonPrimary} text-white font-medium rounded-lg focus:ring-2 focus:ring-blue-500`}>{t('settings.saveButton')}</button></div>
                        </form>
                    </div>
                    <div className={`${cardBg} shadow-sm rounded-xl border ${borderColor}`}>
                        <div className={`px-4 sm:px-6 py-4 border-b ${borderColor}`}>
                            <h2 className={`text-lg sm:text-xl font-semibold ${textPrimary} flex items-center`}><Code2 className="w-5 h-5 mr-2 text-green-600" />{t('settings.installation.title')}</h2>
                            <p className={`text-sm ${textSecondary} mt-1`}>{t('settings.installation.subtitle')}</p>
                        </div>
                        <div className="p-4 sm:p-6">
                            <div className="mb-6">
                                <h3 className={`text-lg font-medium ${textPrimary} mb-3`}>{t('settings.installation.embedTitle')}</h3>
                                <p className={`text-sm ${textSecondary} mb-4`}>{t('settings.installation.embedDescription')}</p>
                                <div className="relative"><pre className={`${codeBg} ${codeText} p-4 rounded-lg text-xs sm:text-sm overflow-x-auto`}><code>{embedCode}</code></pre><button onClick={() => { navigator.clipboard.writeText(embedCode); setFeedback(t('settings.feedback.copied')); }} className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600">{t('settings.installation.copyButton')}</button></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={`${
                                    theme === 'dark' ? 'bg-blue-900/20 border-blue-600' : 'bg-blue-50 border-blue-200'
                                } border rounded-lg p-4`}>
                                    <h4 className={`font-medium ${
                                        theme === 'dark' ? 'text-blue-400' : 'text-blue-900'
                                    } mb-2 flex items-center`}>
                                        <BadgeCheck className="w-4 h-4 mr-2" />
                                        {t('settings.installation.wpTitle')}
                                    </h4>
                                    <p className={`text-sm ${
                                        theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
                                    } mb-3`}>
                                        {t('settings.installation.wpDescription')}
                                    </p>
                                    <ol className={`text-sm ${
                                        theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                                    } space-y-1 ml-4`}>
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
                                                components={{ code: <code className={`${
                                                    theme === 'dark' ? 'bg-blue-900/40' : 'bg-blue-100'
                                                } px-1 py-0.5 rounded text-xs`} /> }}
                                            />
                                        </li>
                                        <li>
                                            <Trans
                                                i18nKey="settings.installation.wpStep5"
                                                components={{ strong: <strong /> }}
                                            />
                                        </li>
                                    </ol>
                                    <p className={`text-xs ${
                                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                    } mt-2`}>
                                        <Trans
                                            i18nKey="settings.installation.wpAlternative"
                                            components={{ strong: <strong /> }}
                                        />
                                    </p>
                                </div>

                                <div className={`${
                                    theme === 'dark' ? 'bg-green-900/20 border-green-600' : 'bg-green-50 border-green-200'
                                } border rounded-lg p-4`}>
                                    <h4 className={`font-medium ${
                                        theme === 'dark' ? 'text-green-400' : 'text-green-900'
                                    } mb-2 flex items-center`}>
                                        <Braces className="w-4 h-4 mr-2" />
                                        {t('settings.installation.customTitle')}
                                    </h4>
                                    <p className={`text-sm ${
                                        theme === 'dark' ? 'text-green-300' : 'text-green-800'
                                    } mb-3`}>
                                        {t('settings.installation.customDescription')}
                                    </p>
                                    <ol className={`text-sm ${
                                        theme === 'dark' ? 'text-green-300' : 'text-green-700'
                                    } space-y-1 ml-4`}>
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
                                                components={{ code: <code className={`${
                                                    theme === 'dark' ? 'bg-green-900/40' : 'bg-green-100'
                                                } px-1 py-0.5 rounded text-xs`} /> }}
                                            />
                                        </li>
                                        <li>{t('settings.installation.customStep4')}</li>
                                    </ol>
                                    <p className={`text-xs ${
                                        theme === 'dark' ? 'text-green-400' : 'text-green-600'
                                    } mt-2`}>
                                        <Trans
                                            i18nKey="settings.installation.customNote"
                                            components={{ strong: <strong /> }}
                                        />
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={`${cardBg} shadow-sm rounded-xl border ${borderColor}`}>
                        <div className={`px-4 sm:px-6 py-4 border-b ${borderColor}`}>
                            <h2 className={`text-lg sm:text-xl font-semibold ${textPrimary} flex items-center`}><FileText className="w-5 h-5 mr-2 text-purple-600" />{t('settings.knowledge.title')}</h2>
                            <p className={`text-sm ${textSecondary} mt-1`}>{t('settings.knowledge.subtitle')}</p>
                        </div>
                        <div className="p-4 sm:p-6">
                            <p className={`text-sm ${textSecondary} mb-4`}>{t('settings.knowledge.description')}</p>
                            <div className={`border-2 border-dashed ${
                                theme === 'dark' ? 'border-[#3a4b57] hover:border-[#52A5E0]' : 'border-gray-300 hover:border-gray-400'
                            } rounded-lg p-6 text-center`}><UploadCloud className={`mx-auto h-12 w-12 ${
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            }`} strokeWidth={1.5} /><div className="mt-4"><label htmlFor="file-upload" className="cursor-pointer"><span className={`mt-2 block text-sm font-medium ${textPrimary}`}>{t('settings.knowledge.uploadLabel')}</span><span className={`block text-xs ${textLight} mt-1`}>{t('settings.knowledge.uploadHint')}</span></label><input id="file-upload" type="file" onChange={handleFileChange} accept=".pdf,.txt,.docx" className="hidden" /></div></div>
                            {file && (<div className={`mt-4 p-3 ${sectionBg} rounded-lg border ${borderColor}`}><div className="flex items-center justify-between"><div className="flex items-center"><File className={`w-4 h-4 ${textLight} mr-2`} /><span className={`text-sm ${textPrimary}`}>{file.name}</span></div><button onClick={() => setFile(null)} className={`${
                                theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'
                            } text-sm`}>{t('settings.knowledge.removeButton')}</button></div></div>)}
                            <div className="mt-6 flex justify-end"><button onClick={handleKnowledgeUpload} disabled={!file || isUploading} className={`px-4 sm:px-6 py-2 ${buttonPurple} text-white font-medium rounded-lg focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed`}>{isUploading ? (<><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" />{t('settings.knowledge.processingButton')}</>) : (t('settings.knowledge.uploadButton'))}</button></div>
                        </div>
                    </div>
                    <div className={`${cardBg} shadow-sm rounded-xl border ${borderColor} opacity-60`}>
                        <div className={`px-4 sm:px-6 py-4 border-b ${borderColor}`}>
                            <div className="flex items-center justify-between"><h2 className={`text-lg sm:text-xl font-semibold ${textLight} flex items-center`}><Globe className={`w-5 h-5 mr-2 ${textLight}`} />{t('settings.comingSoon.title')}</h2><span className={`px-2 py-1 text-xs font-semibold ${textLight} ${
                                theme === 'dark' ? 'bg-[#2a3b47]' : 'bg-gray-200'
                            } rounded-full`}>{t('settings.comingSoon.tag')}</span></div>
                            <p className={`text-sm ${textLight} mt-1`}>{t('settings.comingSoon.subtitle')}</p>
                        </div>
                        <div className="p-4 sm:p-6">
                            <p className={`text-sm ${textLight} mb-4`}>{t('settings.comingSoon.description')}</p>
                            <div className="flex flex-col sm:flex-row gap-4"><input type="url" placeholder="https://www.example.com" className={`flex-1 px-3 py-2 border ${inputBorder} rounded-lg ${
                                theme === 'dark' ? 'bg-[#2a3b47]' : 'bg-gray-100'
                            } cursor-not-allowed`} disabled /><button disabled className="px-4 sm:px-6 py-2 bg-gray-400 text-white font-medium rounded-lg cursor-not-allowed">{t('settings.comingSoon.crawlButton')}</button></div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};