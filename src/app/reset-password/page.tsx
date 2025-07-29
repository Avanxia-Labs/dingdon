// app/reset-password/page.tsx
'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { I18nProvider } from '@/providers/I18nProvider';
import { useResetPassword } from '@/hooks/useResetPassword'; 

// Este componente ahora solo se encarga de mostrar la UI.
// Toda la lógica (estados, useEffects, llamadas a Supabase) vive en el hook useResetPassword.
function ResetPasswordContent() {
    const { t } = useTranslation();
    
    // Usamos el hook para obtener todo el estado y las funciones necesarias.
    const {
        status,
        newPassword,
        setNewPassword,
        error,
        message,
        isLoading,
        handleResetPassword
    } = useResetPassword();

    // Renderizado condicional basado en el estado que nos da el hook.
    if (status === 'verifying') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center p-4">
                <div>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-xl text-gray-600">{t('resetPassword.verifyingLink')}</p>
                </div>
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-red-600">{t('resetPassword.invalidLinkTitle')}</h2>
                    <p className="text-gray-700">{error}</p>
                    <Link href="/login" className="text-blue-600 hover:underline">
                        {t('resetPassword.backToLogin')}
                    </Link>
                </div>
            </div>
        );
    }

    // Si el estado es 'valid', mostramos el formulario.
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <h2 className="text-2xl font-bold text-center">{t('resetPassword.title')}</h2>
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                        <label htmlFor="new-password" className="sr-only">{t('resetPassword.newPasswordPlaceholder')}</label>
                        <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                            placeholder={t('resetPassword.newPasswordPlaceholder')}
                        />
                    </div>
                    {message && <p className="text-green-600 text-sm text-center">{message}</p>}
                    {error && <p className="text-red-600 text-sm text-center">{error}</p>}
                    <button type="submit" disabled={isLoading || !!message} className="w-full mt-6 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {isLoading ? t('resetPassword.updatingButton') : t('resetPassword.updateButton')}
                    </button>
                </form>
            </div>
        </div>
    );
}

// El componente principal no cambia, sigue envolviendo todo en el I18nProvider.
export default function ResetPasswordPage() {
    return (
        <I18nProvider>
            <ResetPasswordContent />
        </I18nProvider>
    );
}