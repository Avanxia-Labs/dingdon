// // app/dashboard/profile/page.tsx
// 'use client';

// import { useState, useEffect, FormEvent } from 'react';
// import { useSession } from 'next-auth/react';
// import { useTranslation } from 'react-i18next';
// import { I18nProvider } from '@/providers/I18nProvider';
// import { Loader2 } from 'lucide-react';

// function ProfilePageContent() {
//     const { t } = useTranslation();
//     const { update: updateSession } = useSession();
//     const [name, setName] = useState('');
//     const [avatarUrl, setAvatarUrl] = useState('');
//     const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSaving, setIsSaving] = useState(false);
//     const [isUploading, setIsUploading] = useState(false);

//     useEffect(() => {
//         const fetchProfile = async () => {
//             try {
//                 const response = await fetch('/api/me/profile');
//                 if (!response.ok) throw new Error('Failed to fetch profile');
//                 const data = await response.json();
//                 setName(data.name || '');
//                 setAvatarUrl(data.avatar_url || '');
//             } catch (error: any) {
//                 setFeedback({ message: `Error: ${error.message}`, type: 'error' });
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         fetchProfile();
//     }, []);

//     const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (!file) return;

//         setIsUploading(true);
//         setFeedback(null);
        
//         const formData = new FormData();
//         formData.append('avatar', file);
        
//         try {
//             const response = await fetch('/api/me/avatar', { method: 'POST', body: formData });
//             const data = await response.json();
//             if (!response.ok) throw new Error(data.error || 'Upload failed');

//             setAvatarUrl(data.avatarUrl);
//             setFeedback({ message: t('profile.feedback.avatarUpdated'), type: 'success' });
//         } catch (error: any) {
//             setFeedback({ message: `Error: ${error.message}`, type: 'error' });
//         } finally {
//             setIsUploading(false);
//         }
//     };

//     const handleSaveProfile = async (e: FormEvent) => {
//         e.preventDefault();
//         setIsSaving(true);
//         setFeedback(null);
        
//         try {
//             const response = await fetch('/api/me/profile', {
//                 method: 'PUT',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ name, avatar_url: avatarUrl }),
//             });
//             if (!response.ok) throw new Error('Failed to save profile');
            
//             setFeedback({ message: t('profile.feedback.saveSuccess'), type: 'success' });
//             await updateSession({ name, image: avatarUrl });
//         } catch (error: any) {
//              setFeedback({ message: `Error: ${error.message}`, type: 'error' });
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     if (isLoading) {
//         return (
//             <div className="flex h-full items-center justify-center">
//                 <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
//             </div>
//         );
//     }

//     return (
//         <div className=' p-4 min-h-screen'>
//             <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('profile.pageTitle')}</h1>
//             <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
//                 <form onSubmit={handleSaveProfile} className="space-y-6">
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700">{t('profile.avatarLabel')}</label>
//                         <div className="mt-2 flex items-center gap-4">
//                             <img 
//                                 src={avatarUrl || `https://ui-avatars.com/api/?name=${name.charAt(0) || 'P'}&background=random&color=fff`} 
//                                 alt="Avatar" 
//                                 className="w-20 h-20 rounded-full object-cover bg-gray-200 border"
//                             />
//                             <label htmlFor="avatar-upload" className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
//                                 {isUploading ? t('profile.uploadingButton') : t('profile.changeButton')}
//                             </label>
//                             <input id="avatar-upload" type="file" className="sr-only" onChange={handleAvatarUpload} accept="image/*" disabled={isUploading} />
//                         </div>
//                     </div>

//                     <div>
//                         <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('common.name')}</label>
//                         <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
//                     </div>

//                     <div className="flex justify-end pt-4 border-t">
//                         <button type="submit" disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
//                             {isSaving ? t('profile.savingButton') : t('common.save')}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//              {feedback && <p className={`mt-4 text-sm font-medium ${feedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{feedback.message}</p>}
//         </div>
//     );
// }

// export default function ProfilePage() {
//     return (
//         <I18nProvider>
//             <ProfilePageContent />
//         </I18nProvider>
//     );
// };



// app/dashboard/profile/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { Loader2, User, Camera } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

function ProfilePageContent() {
    const { t } = useTranslation();
    const { update: updateSession } = useSession();
    const { theme } = useTheme();
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch('/api/me/profile');
                if (!response.ok) throw new Error('Failed to fetch profile');
                const data = await response.json();
                setName(data.name || '');
                setAvatarUrl(data.avatar_url || '');
            } catch (error: any) {
                setFeedback({ message: `Error: ${error.message}`, type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setFeedback(null);
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        try {
            const response = await fetch('/api/me/avatar', { method: 'POST', body: formData });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Upload failed');

            setAvatarUrl(data.avatarUrl);
            setFeedback({ message: t('profile.feedback.avatarUpdated'), type: 'success' });
        } catch (error: any) {
            setFeedback({ message: `Error: ${error.message}`, type: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setFeedback(null);
        
        try {
            const response = await fetch('/api/me/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, avatar_url: avatarUrl }),
            });
            if (!response.ok) throw new Error('Failed to save profile');
            
            setFeedback({ message: t('profile.feedback.saveSuccess'), type: 'success' });
            await updateSession({ name, image: avatarUrl });
        } catch (error: any) {
             setFeedback({ message: `Error: ${error.message}`, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    // Paleta de colores para modo claro y oscuro
    const mainBg = theme === 'dark' ? 'bg-[#192229]' : 'bg-[#FBFBFE]';
    const cardBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const borderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-[#EFF3F5]';
    const textPrimary = theme === 'dark' ? 'text-[#EFF3F5]' : 'text-[#2A3B47]';
    const textSecondary = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const inputBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const inputBorder = theme === 'dark' ? 'border-[#2a3b47]' : 'border-gray-300';
    const buttonPrimary = theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700';
    const feedbackSuccess = theme === 'dark' ? 'bg-green-900/20 border-green-700 text-green-400' : 'bg-green-50 border-green-200 text-green-700';
    const feedbackError = theme === 'dark' ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-200 text-red-700';
    const avatarRing = theme === 'dark' ? 'ring-[#2a3b47]' : 'ring-gray-200';
    const cameraBtnBg = theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600';

    if (isLoading) {
        return (
            <div className={`h-full flex items-center justify-center ${mainBg}`}>
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className={`h-8 w-8 animate-spin ${
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
                    }`} />
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-4 sm:p-6 ${mainBg}`}>
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
                <h1 className={`text-xl sm:text-2xl font-bold mb-2 ${textPrimary}`}>
                    {t('profile.pageTitle')}
                </h1>
            </div>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto">
                {/* Feedback Messages */}
                {feedback && (
                    <div className="mb-4 sm:mb-6">
                        <div className={`p-3 sm:p-4 rounded-lg border ${
                            feedback.type === 'error' ? feedbackError : feedbackSuccess
                        }`}>
                            <p className="text-sm font-medium">{feedback.message}</p>
                        </div>
                    </div>
                )}

                <div className={`rounded-lg shadow-sm border ${cardBg} ${borderColor}`}>
                    {/* Header Section */}
                    {/* <div className="bg-blue-500 px-6 py-4 rounded-t-lg">
                        <h2 className="text-lg font-semibold text-white">
                            Personal Information
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                            Update your basic details
                        </p>
                    </div> */}

                    <form onSubmit={handleSaveProfile} className="p-4 sm:p-6 space-y-6">
                        {/* Avatar Section */}
                        <div className="text-center">
                            <label className={`block text-sm font-semibold mb-4 ${textPrimary}`}>
                                {t('profile.avatarLabel')}
                            </label>
                            
                            <div className="relative inline-block">
                                <div className="relative">
                                    <img 
                                        src={avatarUrl || `https://ui-avatars.com/api/?name=${name.charAt(0) || 'P'}&background=${theme === 'dark' ? '2a3b47' : 'e5e7eb'}&color=${theme === 'dark' ? 'EFF3F5' : '374151'}&size=120`} 
                                        alt="Avatar" 
                                        className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 shadow-md ring-2 ${
                                            theme === 'dark' ? 'border-[#212E36]' : 'border-white'
                                        } ${avatarRing}`}
                                    />
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                                        </div>
                                    )}
                                </div>
                                
                                <label 
                                    htmlFor="avatar-upload" 
                                    className={`absolute bottom-0 right-0 sm:bottom-1 sm:right-1 text-white p-1.5 sm:p-2 rounded-full cursor-pointer shadow-md transition-colors border-2 ${
                                        theme === 'dark' ? 'border-[#212E36]' : 'border-white'
                                    } ${cameraBtnBg}`}
                                >
                                    <Camera className="h-4 w-4" />
                                </label>
                                
                                <input 
                                    id="avatar-upload" 
                                    type="file" 
                                    className="sr-only" 
                                    onChange={handleAvatarUpload} 
                                    accept="image/*" 
                                    disabled={isUploading} 
                                />
                            </div>
                        </div>

                        {/* Name Section */}
                        <div>
                            <label 
                                htmlFor="name" 
                                className={`block text-sm font-semibold mb-2 ${textSecondary}`}
                            >
                                {t('common.name')}
                            </label>
                            <input 
                                id="name" 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                required 
                                className={`w-full px-3 sm:px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${inputBg} ${inputBorder} ${textPrimary}`}
                            />
                        </div>

                        
                        {/* Future Settings Section */}
                        {/* <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">
                                Additional Settings
                            </h3>
                            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <p className="text-gray-500 text-sm">
                                    More configuration options coming soon
                                </p>
                            </div>
                        </div> */}


                        {/* Action Buttons */}
                        <div className={`flex justify-end space-x-3 pt-4 border-t ${borderColor}`}>
                            <button 
                                type="submit" 
                                disabled={isSaving} 
                                className={`px-4 sm:px-6 py-2 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 w-full sm:w-auto justify-center ${buttonPrimary}`}
                            >
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                <span>
                                    {isSaving ? t('profile.savingButton') : t('common.save')}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return <ProfilePageContent />;
}