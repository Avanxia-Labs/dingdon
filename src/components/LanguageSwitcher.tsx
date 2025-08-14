// 'use client';

// import { useState } from 'react';
// import { useTranslation } from 'react-i18next';
// import { ChevronDown } from 'lucide-react';

// // Developer Note: To add more languages, simply add a new object to this array.
// // The emoji flags are a simple way to add a visual cue without extra assets.
// const languages = [
//     { code: 'en', name: 'English', flag: '🇺🇸' },
//     { code: 'es', name: 'Español', flag: '🇪🇸' },
//     // { code: 'fr', name: 'Français', flag: '🇫🇷' }, // Example for a future language
// ];

// export const LanguageSwitcher = () => {
//     const { i18n } = useTranslation();
//     const [isOpen, setIsOpen] = useState(false);

//     const changeLanguage = (lng: string) => {
//         i18n.changeLanguage(lng);
//         setIsOpen(false);
//     };

//     const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

//     return (
//         <div className="relative">
//             {/* Custom Dropdown Button */}
//             <button
//                 type="button"
//                 onClick={() => setIsOpen(!isOpen)}
//                 className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[140px]"
//                 aria-label="Select language"
//                 aria-expanded={isOpen}
//                 aria-haspopup="listbox"
//             >
//                 <span className="text-sm font-medium text-gray-700">
//                     {currentLanguage.flag} {currentLanguage.name}
//                 </span>
//                 <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
//             </button>

//             {/* Dropdown Menu */}
//             {isOpen && (
//                 <>
//                     {/* Backdrop */}
//                     <div 
//                         className="fixed inset-0 z-10" 
//                         onClick={() => setIsOpen(false)}
//                         aria-hidden="true"
//                     />
                    
//                     {/* Dropdown Content */}
//                     <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
//                         <div className="py-1" role="listbox">
//                             {languages.map((lang) => (
//                                 <button
//                                     key={lang.code}
//                                     type="button"
//                                     onClick={() => changeLanguage(lang.code)}
//                                     className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 flex items-center gap-2 ${
//                                         i18n.language === lang.code
//                                             ? 'bg-blue-50 text-blue-700 font-medium'
//                                             : 'text-gray-700 hover:bg-gray-50'
//                                     }`}
//                                     role="option"
//                                     aria-selected={i18n.language === lang.code}
//                                 >
//                                     <span className="text-base">{lang.flag}</span>
//                                     <span>{lang.name}</span>
//                                     {i18n.language === lang.code && (
//                                         <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
//                                     )}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>
//                 </>
//             )}
//         </div>
//     );
// };


'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/app/i18n';
import { Globe, ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
    setLanguage: (language: string) => void;
    className?: string; 
    variant?: 'sidebar' | 'dropdown';
}

export const LanguageSwitcher = ({ 
    setLanguage, 
    className = '', 
    variant = 'dropdown' 
}: LanguageSwitcherProps) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setLanguage(lng);
        
        // Guardar en localStorage para persistencia
        localStorage.setItem('i18nextLng', lng);
        
        // Cerrar dropdown si estamos en modo dropdown
        if (variant === 'dropdown') {
            setIsOpen(false);
        }
        
        console.log(`[LanguageSwitcher] Changed language to: ${lng}`);
    };

    const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language) || SUPPORTED_LANGUAGES[0];

    // Versión para sidebar (select simple)
    if (variant === 'sidebar') {
        return (
            <div className={`relative ${className}`}>
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                <select
                    value={i18n.language}
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-500 bg-gray-700 text-white rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    aria-label="Select language"
                >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-gray-800 text-white">
                            {`${lang.flag} ${lang.name}`}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    // Versión dropdown personalizada
    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm w-full"
                aria-label="Select language"
                aria-expanded={isOpen}
            >
                <Globe size={16} className="text-gray-400" />
                <span className="flex items-center gap-2 flex-1">
                    <span>{currentLanguage.flag}</span>
                    <span className="truncate">{currentLanguage.name}</span>
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Overlay para cerrar */}
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Dropdown */}
                    <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-gray-800 rounded-lg shadow-lg border border-gray-600 py-2 max-h-64 overflow-y-auto">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-600">
                            Select Language
                        </div>
                        
                        {SUPPORTED_LANGUAGES.map((language) => (
                            <button
                                key={language.code}
                                onClick={() => changeLanguage(language.code)}
                                className={`w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-3 transition-colors text-sm ${
                                    language.code === i18n.language 
                                        ? 'bg-gray-700 text-blue-400' 
                                        : 'text-gray-200'
                                }`}
                            >
                                <span>{language.flag}</span>
                                <span className="truncate">{language.name}</span>
                                <span className="text-xs text-gray-500 ml-auto">{language.code.toUpperCase()}</span>
                                {language.code === i18n.language && (
                                    <span className="text-blue-400 text-xs ml-1">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};