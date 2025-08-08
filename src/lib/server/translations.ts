// app/lib/server/translations.ts
import path from 'path';
import { readFile } from 'fs/promises';

// Esta es la misma función que ya tenías, ahora en un lugar reutilizable.
export async function getServerTranslations(language: string) {
    const fallbackLang = 'es'; // Cambiamos el fallback a español
    let langToTry = language;

    try {
        const filePath = path.resolve(process.cwd(), `public/locales/${langToTry}/translation.json`);
        const data = await readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.warn(`Translation file for '${language}' not found. Falling back to '${fallbackLang}'.`);
        try {
            const fallbackPath = path.resolve(process.cwd(), `public/locales/${fallbackLang}/translation.json`);
            const data = await readFile(fallbackPath, 'utf-8');
            return JSON.parse(data);
        } catch (fallbackError) {
            console.error(`FATAL: Could not load fallback translation file.`);
            // Devolvemos un objeto con valores por defecto en inglés como último recurso.
            return {
                whatsapp: {
                    welcome: "Hello! Welcome. To begin, what is your full name?",
                    askEmail: "Thank you! Now, please tell me your email address.",
                    chatReady: "Perfect, thank you! You can now start chatting. How can I help you today?"
                }
            };
        }
    }
}