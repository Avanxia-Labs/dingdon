// // // app/login/page.tsx
// 'use client';
// import { signIn } from 'next-auth/react';
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { I18nProvider } from '@/providers/I18nProvider';
// import { LanguageSwitcher } from '@/components/LanguageSwitcher';
// import { useTranslation } from 'react-i18next';
// import { useDashboardStore } from '@/stores/useDashboardStore';
// import { useSyncLanguage } from '@/hooks/useSyncLanguage';

// function LoginForm() {
//     const { t } = useTranslation();
//     const router = useRouter();
//     const { language, setLanguage } = useDashboardStore();
//     useSyncLanguage(language);

//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
    
//     const handleCredentialsSignIn = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError('');
//         setIsLoading(true);
//         try {
//             const result = await signIn('credentials', { redirect: false, email, password });
//             if (result?.error) {
//                 setError(t('login.invalidCredentialsError'));
//             } else if (result?.ok) {
//                 router.push('/dashboard');
//             }
//         } catch (error) {
//             setError(t('login.unexpectedError'));
//         } finally {
//             setIsLoading(false);
//         }
//     };
    
//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
//             <div className="max-w-md w-full space-y-8">
//                 <div className="text-center">
//                     <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
//                         <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
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
//                         <button onClick={() => signIn('google', { callbackUrl: '/dashboard' })} disabled={true} className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
//                             <img className="w-5 h-5" src="https://www.svgrepo.com/show/475656/google-color.svg" loading="lazy" alt="Google logo" />
//                             <span>{t('login.googleButton')}</span>
//                         </button>
//                         <div className="relative">
//                             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
//                             <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500 font-medium">{t('login.divider')}</span></div>
//                         </div>
//                         <form onSubmit={handleCredentialsSignIn} className="space-y-5">
//                             <div>
//                                 <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">{t('login.emailLabel')}</label>
//                                 <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-colors" placeholder={t('login.emailPlaceholder')} />
//                             </div>
//                             <div>
//                                 <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">{t('login.passwordLabel')}</label>
//                                 <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-colors" placeholder={t('login.passwordPlaceholder')} />
//                             </div>
//                             {error && (<div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-red-600 text-sm font-medium">{error}</p></div>)}
//                             <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl">
//                                 {isLoading ? (<div className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>{t('login.signingInButton')}</span></div>) : (t('login.signInButton'))}
//                             </button>
//                         </form>
//                         <div className="text-center"><a onClick={() => {alert('Contact the admin')}} className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">{t('login.forgotPassword')}</a></div>
//                     </div>
//                 </div>
//                 <div className="text-center text-sm text-gray-500"><p>Secure access to your customer service management platform</p></div>
//             </div>
//         </div>
//     );
// }

// export default function LoginPage() {
//     return (<I18nProvider><LoginForm /></I18nProvider>);
// }


// app/login/page.tsx
// app/login/page.tsx
"use client"
import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Dynamically import the login form to prevent SSR issues
const LoginFormDynamic = dynamicImport(() => import('./LoginForm'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-pulse">
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-6"></div>
            </div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded-xl"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
});

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginFormDynamic />
    </Suspense>
  );
}