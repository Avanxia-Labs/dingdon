// // app/login/LoginForm.tsx
// 'use client';
// import { signIn } from 'next-auth/react';
// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { I18nProvider } from '@/providers/I18nProvider';
// import { LanguageSwitcher } from '@/components/LanguageSwitcher';
// import { useTranslation } from 'react-i18next';
// import { useDashboardStore } from '@/stores/useDashboardStore';
// import { useSyncLanguage } from '@/hooks/useSyncLanguage';


// function LoginFormContent() {
//     const { t } = useTranslation();
//     const router = useRouter();
//     const { language, setLanguage } = useDashboardStore();
//     const [mounted, setMounted] = useState(false);

//     useSyncLanguage(language);

//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const [isLoading, setIsLoading] = useState(false);

//     // Prevent hydration mismatch
//     useEffect(() => {
//         setMounted(true);
//     }, []);

//     if (!mounted) {
//         return (
//             <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
//                 <div className="animate-pulse">
//                     <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
//                 </div>
//             </div>
//         );
//     }

//     const handleCredentialsSignIn = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError('');
//         setIsLoading(true);

//         try {
//             const result = await Promise.race([
//                 signIn('credentials', { redirect: false, email, password }),
//                 new Promise((_, reject) =>
//                     setTimeout(() => reject(new Error('Timeout')), 30000)
//                 )
//             ]);

//             // Type guard for signIn result
//             if (result && typeof result === 'object' && 'error' in result && result.error) {
//                 setError(t('login.invalidCredentialsError'));
//             } else if (result && typeof result === 'object' && 'ok' in result && result.ok) {
//                 router.push('/dashboard');
//             }
//         } catch (error: unknown) {
//             const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//             if (errorMessage === 'Timeout') {
//                 setError('Sign in timed out. Please try again.');
//             } else {
//                 setError(t('login.unexpectedError'));
//             }
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
//             <div className="max-w-md w-full space-y-8">
//                 <div className="text-center">
//                     <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
//                         <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
//                         </svg>
//                     </div>
//                     <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('login.title')}</h2>
//                     <p className="text-gray-600 mb-6">{t('login.subtitle')}</p>
//                     <div className="flex justify-center">
//                         <LanguageSwitcher setLanguage={setLanguage} className="!bg-white !text-gray-700 !border-gray-300" />
//                     </div>
//                 </div>

//                 <div className="bg-white rounded-2xl shadow-xl p-8">
//                     <div className="space-y-6">
//                         <div>
//                             <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">{t('login.agentLogin')}</h3>
//                         </div>
//                         <button
//                             onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
//                             disabled={true}
//                             className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
//                         >
//                             <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="25" height="25" viewBox="0 0 48 48">
//                                 <path fill="#fbc02d" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#e53935" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4caf50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1565c0" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
//                             </svg>
//                             {/* <img className="w-5 h-5" src="https://www.svgrepo.com/show/475656/google-color.svg" loading="lazy" alt="Google logo" /> */}
//                             <span>{t('login.googleButton')}</span>
//                         </button>
//                         <div className="relative">
//                             <div className="absolute inset-0 flex items-center">
//                                 <div className="w-full border-t border-gray-200"></div>
//                             </div>
//                             <div className="relative flex justify-center text-sm">
//                                 <span className="px-4 bg-white text-gray-500 font-medium">{t('login.divider')}</span>
//                             </div>
//                         </div>
//                         <form onSubmit={handleCredentialsSignIn} className="space-y-5">
//                             <div>
//                                 <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
//                                     {t('login.emailLabel')}
//                                 </label>
//                                 <input
//                                     id="email"
//                                     type="email"
//                                     value={email}
//                                     onChange={(e) => setEmail(e.target.value)}
//                                     required
//                                     disabled={isLoading}
//                                     className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-colors"
//                                     placeholder={t('login.emailPlaceholder')}
//                                 />
//                             </div>
//                             <div>
//                                 <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
//                                     {t('login.passwordLabel')}
//                                 </label>
//                                 <input
//                                     id="password"
//                                     type="password"
//                                     value={password}
//                                     onChange={(e) => setPassword(e.target.value)}
//                                     required
//                                     disabled={isLoading}
//                                     className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-colors"
//                                     placeholder={t('login.passwordPlaceholder')}
//                                 />
//                             </div>
//                             {error && (
//                                 <div className="bg-red-50 border border-red-200 rounded-xl p-3">
//                                     <p className="text-red-600 text-sm font-medium">{error}</p>
//                                 </div>
//                             )}
//                             <button
//                                 type="submit"
//                                 disabled={isLoading}
//                                 className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
//                             >
//                                 {isLoading ? (
//                                     <div className="flex items-center justify-center gap-2">
//                                         <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
//                                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                                         </svg>
//                                         <span>{t('login.signingInButton')}</span>
//                                     </div>
//                                 ) : (
//                                     t('login.signInButton')
//                                 )}
//                             </button>
//                         </form>
//                         <div className="text-center">
//                             <button
//                                 onClick={() => { alert('Contact the admin') }}
//                                 className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
//                             >
//                                 {t('login.forgotPassword')}
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//                 <div className="text-center text-sm text-gray-500">
//                     <p>Secure access to your customer service management platform</p>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default function LoginForm() {
//     return (
//         <I18nProvider>
//             <LoginFormContent />
//         </I18nProvider>
//     );
// }




// app/login/LoginForm.tsx
'use client';
import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { I18nProvider } from '@/providers/I18nProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSyncLanguage } from '@/hooks/useSyncLanguage';
import { supabase } from '@/lib/supabase/client';

function LoginFormContent() {
    const { t } = useTranslation();
    const router = useRouter();
    const { language, setLanguage } = useDashboardStore();
    const [mounted, setMounted] = useState(false);

    useSyncLanguage(language);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Estados para el modal de reseteo de contraseña
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [resetError, setResetError] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCredentialsSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await Promise.race([
                signIn('credentials', { redirect: false, email, password }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 30000)
                )
            ]);

            if (result && typeof result === 'object' && 'error' in result && result.error) {
                setError(t('login.invalidCredentialsError'));
            } else if (result && typeof result === 'object' && 'ok' in result && result.ok) {
                router.push('/dashboard');
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage === 'Timeout') {
                setError('Sign in timed out. Please try again.');
            } else {
                setError(t('login.unexpectedError'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsResetting(true);
        setResetMessage('');
        setResetError('');

        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        setIsResetting(false);
        if (error) {
            setResetError(t('login.resetPasswordError'));
            console.error("Error sending password reset email:", error.message);
        } else {
            setResetMessage(t('login.resetPasswordSuccess'));
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="animate-pulse">
                    <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('login.title')}</h2>
                    <p className="text-gray-600 mb-6">{t('login.subtitle')}</p>
                    <div className="flex justify-center">
                        <LanguageSwitcher setLanguage={setLanguage} className="!bg-white !text-gray-700 !border-gray-300" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">{t('login.agentLogin')}</h3>
                        </div>
                        <button
                            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                            disabled={true}
                            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="25" height="25" viewBox="0 0 48 48">
                                <path fill="#fbc02d" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#e53935" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4caf50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1565c0" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                            </svg>
                            <span>{t('login.googleButton')}</span>
                        </button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500 font-medium">{t('login.divider')}</span>
                            </div>
                        </div>
                        <form onSubmit={handleCredentialsSignIn} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('login.emailLabel')}
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-colors"
                                    placeholder={t('login.emailPlaceholder')}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('login.passwordLabel')}
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-colors"
                                    placeholder={t('login.passwordPlaceholder')}
                                />
                            </div>
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                    <p className="text-red-600 text-sm font-medium">{error}</p>
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>{t('login.signingInButton')}</span>
                                    </div>
                                ) : (
                                    t('login.signInButton')
                                )}
                            </button>
                        </form>
                        <div className="text-center">
                            <button
                                //onClick={() => setShowResetModal(true)}
                                onClick={()=> {alert('Contact Admin')}}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                                {t('login.forgotPassword')}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="text-center text-sm text-gray-500">
                    <p>Secure access to your customer service management platform</p>
                </div>
            </div>

            {showResetModal && (
                <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
                        <h3 className="text-xl font-semibold text-gray-900 text-center mb-4">{t('login.resetPasswordTitle')}</h3>
                        <p className="text-gray-600 text-center text-sm mb-6">{t('login.resetPasswordSubtitle')}</p>
                        <form onSubmit={handlePasswordReset}>
                            <input
                                type="email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4"
                                placeholder={t('login.emailPlaceholder')}
                            />
                            {resetMessage && <p className="text-green-600 text-sm mb-4 text-center">{resetMessage}</p>}
                            {resetError && <p className="text-red-600 text-sm mb-4 text-center">{resetError}</p>}
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowResetModal(false)} disabled={isResetting} className="w-full py-2 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" disabled={isResetting} className="w-full py-2 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                    {isResetting ? t('login.sendingButton') : t('login.sendButton')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function LoginForm() {
    return (
        <I18nProvider>
            <LoginFormContent />
        </I18nProvider>
    );
}