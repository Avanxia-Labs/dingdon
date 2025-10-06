'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

// Lista de idiomas soportados - Solo inglés y español activos por ahora
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  // Idiomas para implementar después:
  // { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  // { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  // { code: 'zh', name: '中文', flag: '🇨🇳' },
  // { code: 'fr', name: 'Français', flag: '🇫🇷' },
  // { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  // { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  // { code: 'pt', name: 'Português', flag: '🇵🇹' },
  // { code: 'ja', name: '日本語', flag: '🇯🇵' },
  // { code: 'ko', name: '한국어', flag: '🇰🇷' },
  // { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  // { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  // { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  // { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  // { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  // { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  // { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
  // { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  // { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  // { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
  // { code: 'ro', name: 'Română', flag: '🇷🇴' },
  // { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  // { code: 'he', name: 'עברית', flag: '🇮🇱' },
  // { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  // { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  // { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  // { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  // { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
  // { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  // { code: 'bg', name: 'Български', flag: '🇧🇬' },
  // { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
  // { code: 'sr', name: 'Српски', flag: '🇷🇸' },
  // { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  // { code: 'sl', name: 'Slovenščina', flag: '🇸🇮' },
  // { code: 'et', name: 'Eesti', flag: '🇪🇪' },
  // { code: 'lv', name: 'Latviešu', flag: '🇱🇻' },
  // { code: 'lt', name: 'Lietuvių', flag: '🇱🇹' },
  // { code: 'ca', name: 'Català', flag: '🏴󠁥󠁳󠁣󠁴󠁿' },
  // { code: 'eu', name: 'Euskera', flag: '🏴󠁥󠁳󠁰󠁶󠁿' },
  // { code: 'gl', name: 'Galego', flag: '🏴󠁥󠁳󠁧󠁡󠁿' }
];

// Solo usar códigos de idiomas que están soportados
const SUPPORTED_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map(lang => lang.code);

// Función para detectar idioma del navegador
const detectBrowserLanguage = (): string => {
  if (typeof window === 'undefined') return 'en';
  
  // Intentar diferentes fuentes de detección
  const sources = [
    () => localStorage.getItem('i18nextLng'),
    () => navigator.language,
    () => (navigator as any).userLanguage,
    () => document.documentElement.lang,
    () => 'en' // fallback final
  ];
  
  for (const source of sources) {
    try {
      const detected = source();
      if (detected) {
        // Simplificar el código de idioma (ej: en-US -> en)
        const simplified = detected.split('-')[0].toLowerCase();
        
        // Si está soportado, usarlo
        if (SUPPORTED_LANGUAGE_CODES.includes(simplified)) {
          return simplified;
        }
      }
    } catch (error) {
      // Continuar con la siguiente fuente si hay error
      continue;
    }
  }
  
  return 'en'; // fallback final
};

// Solo inicializar si estamos en el navegador
if (typeof window !== 'undefined') {
  const initialLanguage = detectBrowserLanguage();
  
  i18n
    .use(HttpBackend)
    .use(initReactI18next)
    .init({
      // Idioma inicial detectado
      lng: initialLanguage,
      fallbackLng: 'en', // Idioma de respaldo
      
      // Lista de idiomas soportados
      supportedLngs: SUPPORTED_LANGUAGE_CODES,
      
      // No cargar idiomas no soportados
      nonExplicitSupportedLngs: false,
      
      // Namespaces
      ns: ['translation'],
      defaultNS: 'translation',
      
      // Backend configuration
      backend: {
        loadPath: '/locales/{{lng}}/translation.json',
        
        // Reintentos si falla la carga
        requestOptions: {
          cache: 'default', // Usar cache del navegador
        },
        
        // Opciones de error
        allowMultiLoading: false,
      },
      
      // Configuración de interpolación
      interpolation: {
        escapeValue: false, // React ya se encarga de la protección contra XSS
      },
      
      // Configuración de desarrollo
      debug: process.env.NODE_ENV === 'development',
      
      // Configuración de carga
      load: 'languageOnly', // Solo cargar idioma sin región (en lugar de en-US)
      
      // Configuración de actualización
      updateMissing: false, // No enviar claves faltantes al backend
      
      // Configuración de recursos
      partialBundledLanguages: true, // Permitir carga parcial
      
      // Configuración de cache
      initImmediate: false, // No esperar a que se carguen todos los recursos
      
      // Configuración de reactividad
      react: {
        useSuspense: true, // Usar Suspense para la carga
        bindI18n: 'languageChanged loaded',
        bindI18nStore: 'added removed',
        transEmptyNodeValue: '', // Valor para nodos vacíos
        transSupportBasicHtmlNodes: true, // Soporte básico para HTML
        transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'b', 'u'], // Tags HTML permitidos
      }
    });
}

export default i18n;




// // app/i18n.ts

// 'use client'; // Es una buena práctica añadir esto también aquí

// import i18n from 'i18next';
// import { initReactI18next } from 'react-i18next';
// import HttpBackend from 'i18next-http-backend';

// // --- LA SOLUCIÓN DEFINITIVA ---
// // Solo inicializamos i18next si estamos en un entorno de navegador.
// // Esto evita que se ejecute durante el build del servidor de Next.js.
// if (typeof window !== 'undefined') {
//   i18n
//     .use(HttpBackend)
//     .use(initReactI18next)
//     .init({
//       lng: 'en', // Idioma por defecto
//       fallbackLng: 'en', // Idioma de respaldo si el actual no está disponible
//       ns: ['translation'],
//       defaultNS: 'translation',
//       backend: {
//         loadPath: '/locales/{{lng}}/translation.json', // Ruta simplificada
//       },
//       interpolation: {
//         escapeValue: false, // React ya se encarga de la protección contra XSS
//       },
//     });
// }

// export default i18n;