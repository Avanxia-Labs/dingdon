'use client';

import React, { ReactNode, Suspense } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/app/i18n'; 

// Un componente Suspense simple para mostrar mientras se cargan las traducciones
const Loader = () => (
    <div className="flex h-screen items-center justify-center">
        Loading translations...
    </div>
);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
    return (
        <I18nextProvider i18n={i18n}>
            {/* Suspense es necesario para que el backend HTTP cargue los archivos de idioma */}
            <Suspense fallback={<Loader />}>{children}</Suspense>
        </I18nextProvider>
    );
};

