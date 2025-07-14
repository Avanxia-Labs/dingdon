// // app/login/page.tsx
// 'use client';
// import { signIn } from 'next-auth/react';
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';


// export default function LoginPage() {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const router = useRouter();

//     const handleCredentialsSignIn = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError('');
//         setIsLoading(true);

//         try {
//             const result = await signIn('credentials', {
//                 redirect: false,
//                 email,
//                 password,
//             });

//             if (result?.error) {
//                 setError('Invalid email or password.');
//             } else if (result?.ok) {
//                 router.push('/dashboard');
//             }
//         } catch (error) {
//             setError('An unexpected error occurred. Please try again.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
//             <div className="max-w-md w-full space-y-8">
//                 {/* Header */}
//                 <div className="text-center">
//                     <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
//                         <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                                 d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
//                         </svg>
//                     </div>
//                     <h2 className="text-3xl font-bold text-gray-900 mb-2">Customer Service Bot</h2>
//                     <p className="text-gray-600">Access your control panel</p>
//                 </div>

//                 {/* Login Card */}
//                 <div className="bg-white rounded-2xl shadow-xl p-8">
//                     <div className="space-y-6">
//                         <div>
//                             <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">
//                                 Agent Login
//                             </h3>
//                         </div>

//                         {/* Google Login */}
//                         <button
//                             onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
//                             disabled={isLoading}
//                             className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
//                         >
//                             <img 
//                                 className="w-5 h-5" 
//                                 src="https://www.svgrepo.com/show/475656/google-color.svg" 
//                                 loading="lazy" 
//                                 alt="Google logo" 
//                             />
//                             <span>Continue with Google</span>
//                         </button>

//                         {/* Divider */}
//                         <div className="relative">
//                             <div className="absolute inset-0 flex items-center">
//                                 <div className="w-full border-t border-gray-200"></div>
//                             </div>
//                             <div className="relative flex justify-center text-sm">
//                                 <span className="px-4 bg-white text-gray-500 font-medium">or continue with email</span>
//                             </div>
//                         </div>

//                         {/* Email/Password Form */}
//                         <form onSubmit={handleCredentialsSignIn} className="space-y-5">
//                             <div>
//                                 <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
//                                     Email address
//                                 </label>
//                                 <input
//                                     id="email"
//                                     type="email"
//                                     value={email}
//                                     onChange={(e) => setEmail(e.target.value)}
//                                     required
//                                     disabled={isLoading}
//                                     className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-colors"
//                                     placeholder="agent@company.com"
//                                 />
//                             </div>

//                             <div>
//                                 <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
//                                     Password
//                                 </label>
//                                 <input
//                                     id="password"
//                                     type="password"
//                                     value={password}
//                                     onChange={(e) => setPassword(e.target.value)}
//                                     required
//                                     disabled={isLoading}
//                                     className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-colors"
//                                     placeholder="Enter your password"
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
//                                         <span>Signing in...</span>
//                                     </div>
//                                 ) : (
//                                     'Sign in to Dashboard'
//                                 )}
//                             </button>
//                         </form>

//                         {/* Forgot Password Link */}
//                         <div className="text-center">
//                             <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
//                                 Forgot your password?
//                             </a>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Footer */}
//                 <div className="text-center text-sm text-gray-500">
//                     <p>Secure access to your customer service management platform</p>
//                 </div>
//             </div>
//         </div>
//     );
// }


'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { I18nProvider } from '@/providers/I18nProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

// Developer Note: The LoginForm component is separated to allow the use of the
// `useTranslation` hook, which must be a child of the `I18nProvider`.
function LoginForm() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleCredentialsSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError(t('login.invalidCredentialsError'));
            } else if (result?.ok) {
                router.push('/dashboard');
            }
        } catch (error) {
            setError(t('login.unexpectedError'));
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                {/* Header & Language Switcher */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('login.title')}</h2>
                    <p className="text-gray-600 mb-6">{t('login.subtitle')}</p>
                    <div className="flex justify-center">
                        <LanguageSwitcher />
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">
                                {t('login.agentLogin')}
                            </h3>
                        </div>

                        {/* Google Login */}
                        <button
                            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            <img 
                                className="w-5 h-5" 
                                src="https://www.svgrepo.com/show/475656/google-color.svg" 
                                loading="lazy" 
                                alt="Google logo" 
                            />
                            <span>{t('login.googleButton')}</span>
                        </button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500 font-medium">{t('login.divider')}</span>
                            </div>
                        </div>

                        {/* Email/Password Form */}
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

                        {/* Forgot Password Link */}
                        <div className="text-center">
                            <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                                {t('login.forgotPassword')}
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500">
                    <p>Secure access to your customer service management platform</p>
                </div>
            </div>
        </div>
    );
}

// The page export wraps the main component with the I18nProvider
// to make the translation context available.
export default function LoginPage() {
    return (
        <I18nProvider>
            <LoginForm />
        </I18nProvider>
    );
}