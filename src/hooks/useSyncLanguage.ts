'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Developer Note: This hook synchronizes the i18next instance with a language
// state managed elsewhere (Zustand). It ensures that on component mount,
// the UI reflects the persisted language preference.
export function useSyncLanguage(language: string) {
    const { i18n } = useTranslation();

    useEffect(() => {
        if (i18n.isInitialized && i18n.language !== language) {
            i18n.changeLanguage(language);
        }
    }, [i18n, language]);
}