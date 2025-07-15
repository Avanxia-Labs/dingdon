// // app/dashboard/components/SettingsPanel.tsx
// // code 1
// 'use client';

// import { useState, useEffect, FormEvent } from 'react';
// import {
//     Info, 
//     CheckCircle2, 
//     XCircle, 
//     SlidersHorizontal, 
//     Code2, 
//     BadgeCheck, 
//     Braces,
//     FileText,
//     UploadCloud,
//     File,
//     Loader2,
//     Globe} from 'lucide-react'

// interface SettingsPanelProps {
//     workspaceId: string;
// }

// export const SettingsPanel: React.FC<SettingsPanelProps> = ({ workspaceId }) => {
//     const [botName, setBotName] = useState('');
//     const [botColor, setBotColor] = useState('#007bff');
//     const [isLoading, setIsLoading] = useState(true);
//     const [feedback, setFeedback] = useState<string | null>(null);
//     const [file, setFile] = useState<File | null>(null);
//     const [isUploading, setIsUploading] = useState(false);

//     // Load current configuration on component mount
//     useEffect(() => {
//         const fetchConfig = async () => {
//             setIsLoading(true);
//             try {
//                 const response = await fetch(`/api/workspaces/${workspaceId}/config`);
//                 const data = await response.json();
//                 if (response.ok) {
//                     setBotName(data.bot_name || 'Virtual Assistant');
//                     setBotColor(data.bot_color || '#007bff');
//                 } else {
//                     throw new Error(data.error || 'Failed to load settings');
//                 }
//             } catch (error: any) {
//                 setFeedback(`Error: ${error.message}`);
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         fetchConfig();
//     }, [workspaceId]);

//     const handleSaveSettings = async (e: FormEvent) => {
//         e.preventDefault();
//         setFeedback('Saving...');
//         try {
//             const response = await fetch(`/api/workspaces/${workspaceId}/config`, {
//                 method: 'PUT',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ bot_name: botName, bot_color: botColor }),
//             });
//             const data = await response.json();
//             if (!response.ok) throw new Error(data.error || 'Failed to save settings');
//             setFeedback('Settings saved successfully!');
//         } catch (error: any) {
//             setFeedback(`Error: ${error.message}`);
//         }
//     };

//     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         if (e.target.files) {
//             setFile(e.target.files[0]);
//         }
//     };

//     const handleKnowledgeUpload = async () => {
//         if (!file) {
//             setFeedback('Please select a file first.');
//             return;
//         }
//         setIsUploading(true);
//         setFeedback('Uploading and processing file...');

//         const formData = new FormData();
//         formData.append('file', file);
//         formData.append('workspaceId', workspaceId);

//         console.log(file)
//         console.log(workspaceId)

//         try {
//             const response = await fetch(`/api/workspaces/${workspaceId}/knowledge`, {
//                 method: 'POST',
//                 body: formData,
//             });
//             const data = await response.json();
//             if (!response.ok) throw new Error(data.error || 'Upload failed');
//             setFeedback('Knowledge base updated successfully!');
//         } catch (error: any) {
//             setFeedback(`Error: ${error.message}`);
//         } finally {
//             setIsUploading(false);
//             setFile(null);
//         }
//     };

//     if (isLoading) {
//         return (
//             <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//                 <div className="text-center">
//                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//                     <p className="text-gray-600">Loading settings...</p>
//                 </div>
//             </div>
//         );
//     }

//     const appUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
//     const embedCode = `<script src="${appUrl}/loader.js" data-bot-color="${botColor}" data-workspace-id="${workspaceId}" defer></script>`;

//     return (
//         <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
//             <div className="max-w-4xl mx-auto">
//                 {/* Header */}
//                 <div className="text-center mb-8">
//                     <h1 className="text-3xl font-bold text-gray-900 mb-2">Bot Settings</h1>
//                     <p className="text-gray-600">Customize your chatbot and manage integrations</p>
//                 </div>

//                 {/* Global Feedback Message */}
//                 {feedback && (
//                     <div className={`mb-6 p-4 rounded-lg border ${
//                         feedback.includes('Error') || feedback.includes('failed') 
//                             ? 'bg-red-50 border-red-200 text-red-700' 
//                             : feedback.includes('successfully') 
//                                 ? 'bg-green-50 border-green-200 text-green-700'
//                                 : 'bg-blue-50 border-blue-200 text-blue-700'
//                     }`}>
//                         <div className="flex items-center">
//                             <div className="flex-shrink-0">
//                                 {feedback.includes('Error') || feedback.includes('failed') ? (
//                                     <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
//                                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                                     </svg>
//                                 ) : feedback.includes('successfully') ? (
//                                     <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
//                                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                                     </svg>
//                                 ) : (
//                                     <Info className="w-5 h-5 mr-2 text-blue-600" />
//                                 )}
//                             </div>
//                             <div className="ml-3">
//                                 <p className="text-sm font-medium">{feedback}</p>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 <div className="space-y-8">
//                     {/* Bot Customization Section */}
//                     <div className="bg-white shadow-sm rounded-xl border border-gray-200">
//                         <div className="px-6 py-4 border-b border-gray-200">
//                             <h2 className="text-xl font-semibold text-gray-900 flex items-center">
//                                 <SlidersHorizontal className="w-5 h-5 mr-2 text-blue-600" />
//                                 Bot Customization
//                             </h2>
//                             <p className="text-sm text-gray-600 mt-1">Personalize your chatbot's appearance and behavior</p>
//                         </div>

//                         <form onSubmit={handleSaveSettings} className="p-6">
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                                 <div>
//                                     <label htmlFor="botName" className="block text-sm font-medium text-gray-700 mb-2">
//                                         Chatbot Name
//                                     </label>
//                                     <p className="text-xs text-gray-500 mb-3">This name will appear in the chat header</p>
//                                     <input
//                                         id="botName"
//                                         type="text"
//                                         value={botName}
//                                         onChange={(e) => setBotName(e.target.value)}
//                                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
//                                         placeholder="Enter bot name"
//                                     />
//                                 </div>

//                                 <div>
//                                     <label htmlFor="botColor" className="block text-sm font-medium text-gray-700 mb-2">
//                                         Primary Color
//                                     </label>
//                                     <p className="text-xs text-gray-500 mb-3">Used for headers and user messages</p>
//                                     <div className="flex items-center gap-3">
//                                         <input
//                                             id="botColor"
//                                             type="color"
//                                             value={botColor}
//                                             onChange={(e) => setBotColor(e.target.value)}
//                                             className="h-10 w-16 rounded-lg border border-gray-300 cursor-pointer"
//                                         />
//                                         <input
//                                             type="text"
//                                             value={botColor}
//                                             onChange={(e) => setBotColor(e.target.value)}
//                                             className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
//                                             placeholder="#007bff"
//                                         />
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="mt-6 flex justify-end">
//                                 <button 
//                                     type="submit" 
//                                     className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
//                                 >
//                                     Save Settings
//                                 </button>
//                             </div>
//                         </form>
//                     </div>

//                     {/* Installation Instructions Section */}
//                     <div className="bg-white shadow-sm rounded-xl border border-gray-200">
//                         <div className="px-6 py-4 border-b border-gray-200">
//                             <h2 className="text-xl font-semibold text-gray-900 flex items-center">
//                                 <Code2 className="w-5 h-5 mr-2 text-green-600" />
//                                 Installation
//                             </h2>
//                             <p className="text-sm text-gray-600 mt-1">Add your chatbot to your website</p>
//                         </div>

//                         <div className="p-6">
//                             <div className="mb-6">
//                                 <h3 className="text-lg font-medium text-gray-900 mb-3">Embed Code</h3>
//                                 <p className="text-sm text-gray-600 mb-4">
//                                     Copy and paste this code snippet just before the closing <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">&lt;/body&gt;</code> tag on your website.
//                                 </p>
//                                 <div className="relative">
//                                     <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
//                                         <code>{embedCode}</code>
//                                     </pre>
//                                     <button 
//                                         onClick={() => {
//                                             navigator.clipboard.writeText(embedCode);
//                                             setFeedback('Code copied to clipboard!');
//                                         }}
//                                         className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 transition-colors"
//                                     >
//                                         Copy
//                                     </button>
//                                 </div>
//                             </div>

//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                                     <h4 className="font-medium text-blue-900 mb-2 flex items-center">
//                                         <BadgeCheck className="w-4 h-4 mr-2" />
//                                         WordPress Sites
//                                     </h4>
//                                     <p className="text-sm text-blue-800 mb-3">
//                                         For WordPress websites, follow these steps:
//                                     </p>
//                                     <ol className="text-sm text-blue-700 space-y-1 ml-4">
//                                         <li>1. Go to <strong>Appearance → Theme Editor</strong></li>
//                                         <li>2. Select your active theme</li>
//                                         <li>3. Find and edit <strong>footer.php</strong></li>
//                                         <li>4. Paste the code just before <code>&lt;/body&gt;</code></li>
//                                         <li>5. Click <strong>Update File</strong></li>
//                                     </ol>
//                                     <p className="text-xs text-blue-600 mt-2">
//                                         <strong>Alternative:</strong> Use a plugin like "Insert Headers and Footers" to add the code without editing theme files.
//                                     </p>
//                                 </div>

//                                 <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                                     <h4 className="font-medium text-green-900 mb-2 flex items-center">
//                                         <Braces className="w-4 h-4 mr-2" />
//                                         Custom Code Sites
//                                     </h4>
//                                     <p className="text-sm text-green-800 mb-3">
//                                         For websites with custom code:
//                                     </p>
//                                     <ol className="text-sm text-green-700 space-y-1 ml-4">
//                                         <li>1. Open your main HTML file (<strong>index.html</strong>)</li>
//                                         <li>2. For React/Vue: Edit your main layout component</li>
//                                         <li>3. Paste the code before the closing <code>&lt;/body&gt;</code> tag</li>
//                                         <li>4. Save and deploy your changes</li>
//                                     </ol>
//                                     <p className="text-xs text-green-600 mt-2">
//                                         <strong>Note:</strong> The chatbot will automatically appear on all pages where the script is included.
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Knowledge Base Section */}
//                     <div className="bg-white shadow-sm rounded-xl border border-gray-200">
//                         <div className="px-6 py-4 border-b border-gray-200">
//                             <h2 className="text-xl font-semibold text-gray-900 flex items-center">
//                                 <FileText className="w-5 h-5 mr-2 text-purple-600" />
//                                 Knowledge Base
//                             </h2>
//                             <p className="text-sm text-gray-600 mt-1">Upload documents to train your chatbot</p>
//                         </div>

//                         <div className="p-6">
//                             <p className="text-sm text-gray-600 mb-4">
//                                 Upload PDF, TXT, or DOCX files containing your company's information, FAQs, policies, or any other relevant content.
//                             </p>

//                             <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
//                                 <UploadCloud className="mx-auto h-12 w-12 text-gray-400" strokeWidth={1.5} />

//                                 <div className="mt-4">
//                                     <label htmlFor="file-upload" className="cursor-pointer">
//                                         <span className="mt-2 block text-sm font-medium text-gray-900">
//                                             Upload a file or drag and drop
//                                         </span>
//                                         <span className="block text-xs text-gray-500 mt-1">
//                                             PDF, TXT, DOCX up to 10MB
//                                         </span>
//                                     </label>
//                                     <input
//                                         id="file-upload"
//                                         type="file"
//                                         onChange={handleFileChange}
//                                         accept=".pdf,.txt,.docx"
//                                         className="hidden"
//                                     />
//                                 </div>
//                             </div>

//                             {file && (
//                                 <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
//                                     <div className="flex items-center justify-between">
//                                         <div className="flex items-center">
//                                             <File className="w-4 h-4 text-gray-400 mr-2" />
//                                             <span className="text-sm text-gray-700">{file.name}</span>
//                                         </div>
//                                         <button
//                                             onClick={() => setFile(null)}
//                                             className="text-red-500 hover:text-red-700 text-sm"
//                                         >
//                                             Remove
//                                         </button>
//                                     </div>
//                                 </div>
//                             )}

//                             <div className="mt-6 flex justify-end">
//                                 <button 
//                                     onClick={handleKnowledgeUpload}
//                                     disabled={!file || isUploading}
//                                     className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
//                                 >
//                                     {isUploading ? (
//                                         <>
//                                             <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" />
//                                             Processing...
//                                         </>
//                                     ) : (
//                                         'Upload & Process'
//                                     )}
//                                 </button>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Coming Soon Section */}
//                     <div className="bg-white shadow-sm rounded-xl border border-gray-200 opacity-60">
//                         <div className="px-6 py-4 border-b border-gray-200">
//                             <div className="flex items-center justify-between">
//                                 <h2 className="text-xl font-semibold text-gray-500 flex items-center">
//                                     <Globe className="w-5 h-5 mr-2 text-gray-400" />
//                                     Website Training
//                                 </h2>
//                                 <span className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-200 rounded-full">
//                                     COMING SOON
//                                 </span>
//                             </div>
//                             <p className="text-sm text-gray-400 mt-1">Automatically train your bot from website content</p>
//                         </div>

//                         <div className="p-6">
//                             <p className="text-sm text-gray-400 mb-4">
//                                 Enter your website URL to automatically crawl and extract content for your chatbot's knowledge base.
//                             </p>

//                             <div className="flex gap-4">
//                                 <input
//                                     type="url"
//                                     placeholder="https://www.example.com"
//                                     className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
//                                     disabled
//                                 />
//                                 <button 
//                                     disabled 
//                                     className="px-6 py-2 bg-gray-400 text-white font-medium rounded-lg cursor-not-allowed"
//                                 >
//                                     Crawl & Train
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };




'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSyncLanguage } from '@/hooks/useSyncLanguage';
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
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/workspaces/${workspaceId}/config`);
                const data = await response.json();
                if (response.ok) {
                    setBotName(data.bot_name || 'Virtual Assistant');
                    setBotColor(data.bot_color || '#007bff');
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
                body: JSON.stringify({ bot_name: botName, bot_color: botColor }),
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