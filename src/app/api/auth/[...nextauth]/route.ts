// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";


// Base de datos temporal de agentes autorizados
const authorizedAgents = [
    { id: "1", email: "agent1@example.com", password: "password123", name: "Agent Smith" },
    { id: "2", email: "agent2@example.com", password: "password123", name: "Agent Jones" },
]

const handler = NextAuth({

    providers: [
        // Opcion 1: Login con Email y Contraseña
        CredentialsProvider({
            name: "Credentials",
            
            credentials: {
                email: { label: "Email", type: "text"},
                password: {label: "Password", type: "password"}
            },
            
            async authorize(credentials) {
                if (!credentials) return null;

                const agent = authorizedAgents.find(a => a.email === credentials.email);

                if (agent && agent.password === credentials.password) {
                    // Devuelve el objeto del usuario si la autenticacion es exitosa
                    return {
                        id: agent.id,
                        name: agent.name,
                        email: agent.email
                    }
                }

                // Devuelve null si las credenciales son incorrectas
                return null
            }
        }),
    
        // Opción 2: Login con Google
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        })
    ],

    // Opcional: definir una pagina de login personalizada
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 días
        // maxAge: 60 * 60, // Solo 1 hora
    }
});

export {handler as GET, handler as POST}