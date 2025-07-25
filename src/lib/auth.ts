// lib/auth.ts

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/supabase/client"; 
import { supabaseAdmin } from "@/lib/supabase/server"; 

export const authOptions: NextAuthOptions = {
    providers: [
        // --- Proveedor de Google ---
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        // --- Proveedor de Credenciales (Email/Password) ---
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: {label: "Email", type: "text"},
                password: {label: "Password", type: "password"}
            },
            async authorize(credentials) {
                // --- Validamos que las credenciales no estén vacías ---
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // 1. Usamos el cliente PÚBLICO para el intento de login.
                const {data: authData, error: authError} = await supabase.auth.signInWithPassword({
                    email: credentials.email,
                    password: credentials.password
                })
                
                if (authError || !authData.user) {
                    console.error("Fallo el login en Supabase:", authError?.message);
                    return null
                }

                const {data: profileData, error: profileError} = await supabaseAdmin
                        .from('profiles')
                        .select(`app_role,
                                 workspace_members (
                                    workspace_id,
                                    role
                                 )`)
                        .eq('id', authData.user.id)
                        .limit(1)
                        .single();

                // Validamos que el perfil exista
                if (profileError || !profileData) {
                    console.error("No se encontró perfil o membresía para el usuario:", profileError?.message);
                    return null;
                }

                // La membresía puede no existir (ej. para un superadmin)
                const membership = profileData.workspace_members[0];

                // 3. Retornamos el usuario y su rol
                return {
                    id: authData.user.id,
                    email: authData.user.email!,
                    name: authData.user.user_metadata.name || authData.user.email,
                    role: profileData.app_role,
                    workspaceId: membership?.workspace_id,
                    workspaceRole: membership?.role
                }

            }
        })
    ],

    // Los callbacks se ejecutan en diferentes puntos del ciclo de vida de la autenticación
    callbacks: {
         // Se ejecuta después de un inicio de sesión exitoso con cualquier proveedor
         async signIn({user, account}) {
            // Si el login es con un proveedor OAuth como Google, nos aseguramos de que su perfil exista en nuestra DB
            if (account?.provider === 'google' && user.email) {
                try {
                    // Usamos el cliente de Admin para esta operación de backend
                    await supabaseAdmin
                        .from('profiles')
                        .upsert({
                            id: user.id,
                            email: user.email,
                            name: user.name
                        }, {onConflict: 'id'}) // 'upsert' crea el perfil si no existe
                } catch (error) {
                    console.error("Error al crear/actualizar perfil de Google:", error);
                    return false; // Bloquear el inicio de sesión si hay un error de base de datos
                }
            }

            return true;
         },

         // Se ejecuta al crear o actualizar un JSON Web Token (JWT)
        async jwt({ token, user }) {
            // Si es el primer login (el objeto `user` está disponible), añadimos nuestros datos al token
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.workspaceId = user.workspaceId;
                token.workspaceRole = user.workspaceRole;
            }
            return token;
        },

        // Se ejecuta para crear o actualizar la sesión del cliente a partir del token JWT
        async session({ session, token }) {
            // Pasamos las propiedades personalizadas del token a la sesión que usa el cliente
            session.user.id = token.id;
            session.user.role = token.role;
            session.user.workspaceId = token.workspaceId;
            session.user.workspaceRole = token.workspaceRole;
            return session;
        },
    },

    // Configuración de páginas y sesión
    pages: {
        signIn: '/login', // Ruta a nuestra página de login personalizada
    },
    session: {
        strategy: "jwt", // Usar JWT para gestionar las sesiones (sin estado en el servidor)
    },
    secret: process.env.NEXTAUTH_SECRET, // Clave secreta para firmar los JWT
}

