// lib/crypto/server.ts
import crypto from 'crypto';

// Algoritmo de encriptación. AES-256-GCM es el estándar moderno y seguro.
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64; // Usaremos un salt para derivar la clave
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // La clave derivada debe tener 32 bytes para AES-256

// Usamos la nueva variable de entorno. Ahora puede ser cualquier cadena secreta larga.
const ENCRYPTION_SECRET = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_SECRET || ENCRYPTION_SECRET.length < 32) {
    // Mantenemos la recomendación de una clave larga para mayor seguridad.
    throw new Error('La variable de entorno ENCRYPTION_KEY es requerida y debe tener al menos 32 caracteres.');
}

// Función para derivar una clave de 32 bytes a partir de nuestro secreto y un salt.
// Esto es una KDF (Key Derivation Function) y es una buena práctica de seguridad.
const getKey = (salt: Buffer): Buffer => {
    return crypto.pbkdf2Sync(ENCRYPTION_SECRET, salt, 100000, KEY_LENGTH, 'sha512');
};

export const cryptoService = {
    /**
     * Encripta un texto usando AES-265-GCM con una clave derivada.
     * @param {string} text - El texto plano a encriptar.
     * @returns {string} El texto encriptado, codificado en hexadecimal, incluyendo salt, iv y tag.
     */
    encrypt: (text: string): string => {
        const salt = crypto.randomBytes(SALT_LENGTH);
        const key = getKey(salt);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();

        // Juntamos todo en un solo buffer para guardarlo en la DB: [salt][iv][tag][encrypted]
        return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
    },

    /**
     * Desencripta un texto que fue encriptado con la función encrypt.
     * @param {string} encryptedText - El texto encriptado en formato hexadecimal.
     * @returns {string} El texto plano original, o un string vacío si la desencriptación falla.
     */
    decrypt: (encryptedText: string): string => {
        try {
            const data = Buffer.from(encryptedText, 'hex');
            
            // Extraemos las partes en el mismo orden en que las guardamos.
            const salt = data.subarray(0, SALT_LENGTH);
            const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
            const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
            const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
            
            // Derivamos la misma clave usando el salt que guardamos.
            const key = getKey(salt);
            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            decipher.setAuthTag(tag);

            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final(),
            ]);
            
            return decrypted.toString('utf8');

        } catch (error) {
            console.error("[Crypto Service] La desencriptación falló.", error);
            return ''; 
        }
    }
};