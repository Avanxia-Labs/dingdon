'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/app/i18n';
import { ChevronDown, Globe } from 'lucide-react';

interface LanguageSelectorProps {
  className?: string;
  showFlag?: boolean;
  showName?: boolean;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  showFlag = true,
  showName = true,
  compact = false
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (languageCode: string) => {
    // Cambiar idioma
    i18n.changeLanguage(languageCode);
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('i18nextLng', languageCode);
    
    // Cerrar dropdown
    setIsOpen(false);
    
    console.log(`[LanguageSelector] Changed language to: ${languageCode}`);
  };

  // Versión compacta - solo bandera
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
          title={`Current language: ${currentLanguage.name}`}
        >
          {showFlag ? (
            <span className="text-lg">{currentLanguage.flag}</span>
          ) : (
            <Globe size={16} className="text-gray-600" />
          )}
        </button>

        {isOpen && (
          <>
            {/* Overlay para cerrar */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute right-0 top-10 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] max-h-64 overflow-y-auto">
              {SUPPORTED_LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                    language.code === i18n.language ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span className="text-sm font-medium">{language.name}</span>
                  {language.code === i18n.language && (
                    <span className="ml-auto text-blue-600 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Versión completa
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
      >
        {showFlag && <span className="text-lg">{currentLanguage.flag}</span>}
        {showName && <span className="text-sm font-medium text-gray-700">{currentLanguage.name}</span>}
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-12 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[250px] max-h-64 overflow-y-auto">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              Select Language
            </div>
            
            {SUPPORTED_LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                  language.code === i18n.language ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="text-sm font-medium">{language.name}</span>
                <span className="text-xs text-gray-400 ml-auto">{language.code.toUpperCase()}</span>
                {language.code === i18n.language && (
                  <span className="text-blue-600 text-xs ml-1">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;