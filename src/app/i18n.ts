'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: 'en', // Idioma por defecto
    fallbackLng: 'en', // Idioma de respaldo si el actual no está disponible
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: '/locales/{{lng}}/translation.json', // Ruta simplificada
    },
    interpolation: {
      escapeValue: false, // React ya se encarga de la protección contra XSS
    },
  });

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