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

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

interface LanguageSwitcherProps {
    setLanguage: (language: string) => void;
    // Added for styling consistency in different sidebars
    className?: string; 
}

export const LanguageSwitcher = ({ setLanguage, className = '' }: LanguageSwitcherProps) => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setLanguage(lng);
    };

    return (
        <div className={`relative ${className}`}>
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-500 bg-gray-700 text-white rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Select language"
            >
                {languages.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-gray-800 text-white">
                        {`${lang.name} ${lang.flag}`}
                    </option>
                ))}
            </select>
        </div>
    );
};