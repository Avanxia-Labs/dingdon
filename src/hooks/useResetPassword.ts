// src/hooks/useResetPassword.ts
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { SupabaseClient } from '@supabase/supabase-js';

type PageStatus = 'verifying' | 'valid' | 'invalid';

export function useResetPassword() {
    const { t } = useTranslation();
    const router = useRouter();
    const [status, setStatus] = useState<PageStatus>('verifying');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    // --- IMPORTACIÓN DINÁMICA ---
    useEffect(() => {
        // Importamos el cliente de Supabase solo cuando el componente se monta en el navegador
        import('@/lib/supabase/client').then((module) => {
            setSupabase(module.supabase);
        });
    }, []);

    useEffect(() => {
        if (!supabase) return; // No hacer nada hasta que Supabase esté cargado

        let hasMounted = true;
        
        const timer = setTimeout(() => {
            if (hasMounted && status === 'verifying') {
                setStatus('invalid');
                setError(t('resetPassword.invalidLinkSubtitle'));
            }
        }, 3000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'PASSWORD_RECOVERY' && hasMounted) {
                clearTimeout(timer);
                setStatus('valid');
                setMessage(t('resetPassword.sessionVerified'));
            }
        });

        return () => {
            hasMounted = false;
            subscription?.unsubscribe();
            clearTimeout(timer);
        };
    }, [supabase, status, t]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return; // Guardia de seguridad

        setIsLoading(true);
        setError('');
        
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        setIsLoading(false);
        if (error) {
            setStatus('invalid');
            setError(t('resetPassword.updateError'));
        } else {
            setMessage(t('resetPassword.updateSuccess'));
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        }
    };

    return {
        status,
        newPassword,
        setNewPassword,
        error,
        message,
        isLoading,
        handleResetPassword
    };
}