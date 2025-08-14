'use client';

import React, { ReactNode, Suspense, useState, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/app/i18n';
import { Globe } from 'lucide-react';

// Componente de carga mejorado
const TranslationLoader = () => (
    <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <Globe className="w-8 h-8 text-blue-600 animate-spin" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 text-sm font-medium">Loading translations...</p>
        </div>
    </div>
);

// Componente de error
const TranslationError = ({ retry }: { retry: () => void }) => (
    <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-4">
                <Globe className="w-12 h-12 text-red-500 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Translation Loading Failed</h2>
            <p className="text-gray-600 mb-4">
                Unable to load language files. Please check your connection and try again.
            </p>
            <button
                onClick={retry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Retry
            </button>
        </div>
    </div>
);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const initI18n = async () => {
            try {
                // Asegurar que i18n está inicializado
                if (!i18n.isInitialized) {
                    await i18n.init();
                }
                
                // Esperar a que se cargue el idioma inicial
                await i18n.loadLanguages([i18n.language]);
                
                setIsReady(true);
                setHasError(false);
                console.log(`[I18nProvider] ✅ Translations loaded successfully for language: ${i18n.language}`);
            } catch (error) {
                console.error('[I18nProvider] ❌ Failed to load translations:', error);
                setHasError(true);
                setIsReady(false);
                
                // Si es el primer intento y falla, intentar con inglés
                if (retryCount === 0 && i18n.language !== 'en') {
                    console.log('[I18nProvider] 🔄 Retrying with English...');
                    try {
                        await i18n.changeLanguage('en');
                        setIsReady(true);
                        setHasError(false);
                    } catch (fallbackError) {
                        console.error('[I18nProvider] ❌ Even English fallback failed:', fallbackError);
                    }
                }
            }
        };

        initI18n();
    }, [retryCount]);

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
        setHasError(false);
        setIsReady(false);
    };

    // Mostrar error si falló la carga
    if (hasError && !isReady) {
        return <TranslationError retry={handleRetry} />;
    }

    // Mostrar loader si no está listo
    if (!isReady) {
        return <TranslationLoader />;
    }

    return (
        <I18nextProvider i18n={i18n}>
            <Suspense fallback={<TranslationLoader />}>
                {children}
            </Suspense>
        </I18nextProvider>
    );
};

