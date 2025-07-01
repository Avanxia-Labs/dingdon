// next-auth.d.ts

import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

/**
 * Define los roles que un usuario puede tener dentro de la aplicación.
 * En un proyecto real, esto podría importarse desde tu archivo de tipos principal.
 */
export type AppRole = 'superadmin' | 'admin' | 'agent';

// Declara los módulos para "parchear" los tipos originales de NextAuth
declare module "next-auth" {
    /**
     * Extiende la interfaz User para que incluya nuestras propiedades personalizadas.
     */
    interface User extends DefaultUser {
        id: string;
        role: AppRole;
        workspaceId?: string;
        workspaceRole?: 'admin' | 'agent';
    }

    /**
     * Extiende la interfaz Session para que el objeto `session.user`
     * coincida con nuestra interfaz `User` aumentada.
     */
    interface Session {
        user: User;
    }
}

declare module "next-auth/jwt" {
    /**
     * Extiende el token JWT para que contenga las mismas propiedades personalizadas.
     * Estos datos se pasan a la sesión del cliente.
     */
    interface JWT extends DefaultJWT {
        id: string;
        role: AppRole;
        workspaceId?: string;
        workspaceRole?: 'admin' | 'agent';
    }
}