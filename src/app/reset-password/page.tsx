// // app/reset-password/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { supabase } from '@/lib/supabase/client';
// import Link from 'next/link';
// import { useTranslation } from 'react-i18next';
// import { I18nProvider } from '@/providers/I18nProvider';

// type PageStatus = 'verifying' | 'valid' | 'invalid';

// function ResetPasswordContent() {
//     const { t } = useTranslation();
//     const router = useRouter();
//     const [status, setStatus] = useState<PageStatus>('verifying');
//     const [newPassword, setNewPassword] = useState('');
//     const [error, setError] = useState('');
//     const [message, setMessage] = useState('');
//     const [isLoading, setIsLoading] = useState(false);

//     useEffect(() => {
//         let hasMounted = true;
        
//         const timer = setTimeout(() => {
//             if (hasMounted && status === 'verifying') {
//                 setStatus('invalid');
//                 setError(t('resetPassword.invalidLinkSubtitle'));
//             }
//         }, 3000);

//         const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
//             if (event === 'PASSWORD_RECOVERY' && hasMounted) {
//                 clearTimeout(timer);
//                 setStatus('valid');
//                 setMessage(t('resetPassword.sessionVerified'));
//             }
//         });

//         return () => {
//             hasMounted = false;
//             subscription.unsubscribe();
//             clearTimeout(timer);
//         };
//     }, [status, t]);

//     const handleResetPassword = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setIsLoading(true);
//         setError('');
        
//         const { error } = await supabase.auth.updateUser({ password: newPassword });

//         setIsLoading(false);
//         if (error) {
//             setStatus('invalid');
//             setError(t('resetPassword.updateError'));
//             console.error("Error updating password:", error.message);
//         } else {
//             setMessage(t('resetPassword.updateSuccess'));
//             setTimeout(() => {
//                 router.push('/login');
//             }, 3000);
//         }
//     };

//     if (status === 'verifying') {
//         return (
//             <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center p-4">
//                 <div>
//                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//                     <p className="text-xl text-gray-600">{t('resetPassword.verifyingLink')}</p>
//                 </div>
//             </div>
//         );
//     }

//     if (status === 'invalid') {
//         return (
//             <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center p-4">
//                 <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
//                     <h2 className="text-2xl font-bold text-red-600">{t('resetPassword.invalidLinkTitle')}</h2>
//                     <p className="text-gray-700">{error}</p>
//                     <Link href="/login" className="text-blue-600 hover:underline">
//                         {t('resetPassword.backToLogin')}
//                     </Link>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//             <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
//                 <h2 className="text-2xl font-bold text-center">{t('resetPassword.title')}</h2>
//                 <form onSubmit={handleResetPassword} className="space-y-4">
//                     <div>
//                         <label htmlFor="new-password" className="sr-only">{t('resetPassword.newPasswordPlaceholder')}</label>
//                         <input
//                             id="new-password"
//                             type="password"
//                             value={newPassword}
//                             onChange={(e) => setNewPassword(e.target.value)}
//                             required
//                             className="w-full px-4 py-3 border border-gray-200 rounded-xl"
//                             placeholder={t('resetPassword.newPasswordPlaceholder')}
//                         />
//                     </div>
//                     {message && <p className="text-green-600 text-sm text-center">{message}</p>}
//                     {error && <p className="text-red-600 text-sm text-center">{error}</p>}
//                     <button type="submit" disabled={isLoading || !!message} className="w-full mt-6 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
//                         {isLoading ? t('resetPassword.updatingButton') : t('resetPassword.updateButton')}
//                     </button>
//                 </form>
//             </div>
//         </div>
//     );
// }

// export default function ResetPasswordPage() {
//     return (
//         <I18nProvider>
//             <ResetPasswordContent />
//         </I18nProvider>
//     );
// }

'use client';
import React from 'react'
import { redirect } from 'next/navigation';

function page() {
  redirect('/login');
}

export default page