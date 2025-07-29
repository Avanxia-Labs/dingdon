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
    const [isMounted, setIsMounted] = useState(false);

    // First, check if we're on the client side
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // --- IMPORTACIÓN DINÁMICA SOLO EN EL CLIENTE ---
    useEffect(() => {
        if (!isMounted) return; // Only run on client side
        
        // Importamos el cliente de Supabase solo cuando el componente se monta en el navegador
        import('@/lib/supabase/client').then((module) => {
            setSupabase(module.supabase);
        }).catch((err) => {
            console.error('Failed to load Supabase client:', err);
            setStatus('invalid');
            setError('Failed to initialize authentication');
        });
    }, [isMounted]);

    useEffect(() => {
        if (!isMounted || !supabase) return; // No hacer nada hasta que estemos en el cliente y Supabase esté cargado

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
    }, [isMounted, supabase, status, t]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !isMounted) return; // Guardia de seguridad

        setIsLoading(true);
        setError('');
        
        try {
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
        } catch (err) {
            setIsLoading(false);
            setStatus('invalid');
            setError(t('resetPassword.updateError'));
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