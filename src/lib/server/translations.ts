// // app/lib/server/translations.ts
// import path from 'path';
// import { readFile } from 'fs/promises';

// // Esta es la misma función que ya tenías, ahora en un lugar reutilizable.
// export async function getServerTranslations(language: string) {
//     const fallbackLang = 'es'; // Cambiamos el fallback a español
//     let langToTry = language;

//     try {
//         const filePath = path.resolve(process.cwd(), `public/locales/${langToTry}/translation.json`);
//         const data = await readFile(filePath, 'utf-8');
//         return JSON.parse(data);
//     } catch (error) {
//         console.warn(`Translation file for '${language}' not found. Falling back to '${fallbackLang}'.`);
//         try {
//             const fallbackPath = path.resolve(process.cwd(), `public/locales/${fallbackLang}/translation.json`);
//             const data = await readFile(fallbackPath, 'utf-8');
//             return JSON.parse(data);
//         } catch (fallbackError) {
//             console.error(`FATAL: Could not load fallback translation file.`);
//             // Devolvemos un objeto con valores por defecto en inglés como último recurso.
//             return {
//                 whatsapp: {
//                     welcome: "Hello! Welcome. To begin, what is your full name?",
//                     askEmail: "Thank you! Now, please tell me your email address.",
//                     chatReady: "Perfect, thank you! You can now start chatting. How can I help you today?"
//                 }
//             };
//         }
//     }
// }



// app/lib/server/translations.ts

import path from 'path';
import { readFile } from 'fs/promises';
import i18next, { TFunction } from 'i18next'; // <-- 1. IMPORTA i18next y el tipo TFunction

/**
 * Carga los archivos de traducción del sistema de archivos.
 * @param language - El código del idioma a cargar (ej: 'es').
 * @returns Un objeto con los recursos de traducción o un objeto de fallback en caso de error.
 */
async function loadTranslationResources(language: string) {
    const fallbackLang = 'es';
    let langToTry = language;

    try {
        const filePath = path.resolve(process.cwd(), `public/locales/${langToTry}/translation.json`);
        const data = await readFile(filePath, 'utf-8');
        return { lang: langToTry, resources: JSON.parse(data) };
    } catch (error) {
        console.warn(`Translation file for '${language}' not found. Falling back to '${fallbackLang}'.`);
        try {
            const fallbackPath = path.resolve(process.cwd(), `public/locales/${fallbackLang}/translation.json`);
            const data = await readFile(fallbackPath, 'utf-8');
            return { lang: fallbackLang, resources: JSON.parse(data) };
        } catch (fallbackError) {
            console.error(`FATAL: Could not load fallback English translation file.`);
            // Devolvemos un objeto con valores por defecto como último recurso.
            const fallbackResources = {
                whatsapp: {
                    welcome: "¡Hola! Bienvenido. Para comenzar, ¿cuál es tu nombre completo?",
                    askEmail: "¡Gracias! Ahora, por favor, dime tu correo electrónico.",
                    chatReady: "¡Perfecto, gracias! Ya puedes comenzar a chatear. ¿En qué puedo ayudarte hoy?",
                    welcomeBack: "¡Hola de nuevo, {{name}}! ¿En qué puedo ayudarte hoy?",
                },
                chatbotUI: {
                    handoffMessage: "Entendido. Estoy buscando un agente para ayudarte. Por favor, espera."
                }
            };
            return { lang: fallbackLang, resources: fallbackResources };
        }
    }
}

/**
 * Obtiene una función de traducción `t` configurada para un idioma específico en el lado del servidor.
 * @param language - El código del idioma (ej: 'es').
 * @returns Una función `t` de i18next lista para usar.
 */
// --- 2. TU FUNCIÓN PRINCIPAL AHORA SE LLAMA getTranslations ---
export async function getTranslations(language: string): Promise<TFunction> {
    const { lang, resources } = await loadTranslationResources(language);

    // Inicializa una instancia de i18next con los recursos que cargamos del archivo
    const i18nInstance = i18next.createInstance();
    await i18nInstance.init({
        lng: lang, // Usa el idioma que realmente se cargó
        resources: {
            [lang]: {
                translation: resources
            }
        },
        interpolation: {
            // Permite el uso de {{variable}} en las traducciones
            escapeValue: false, 
        }
    });

    // Devuelve la función 't' de esta instancia, que ya está lista para traducir
    return i18nInstance.t;
}