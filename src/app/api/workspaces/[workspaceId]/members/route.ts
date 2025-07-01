// app/api/workspaces/[workspaceId]/members/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase/server';
import { TeamMember, WorkspaceRole } from '@/types/chatbot';

/**
 * Maneja las peticiones GET para obtener los miembros de un workspace específico.
 * Realiza una consulta a la base de datos uniendo las tablas 'workspace_members' y 'profiles'
 * para devolver una lista completa de los miembros del equipo.
 * 
 * @param request - El objeto de la petición entrante (no se usa directamente).
 * @param params - Un objeto que contiene los parámetros de la ruta, en este caso { workspaceId: string }.
 * @returns Una respuesta JSON con la lista de miembros o un objeto de error.
 */
export async function GET(
    request: Request,
    { params }: { params: { workspaceId: string } }
) {
    try {
        // 1. Obtener la sesión del servidor para verificar la autenticación y autorización.
        const session = await getServerSession(authOptions);
        const { workspaceId } = params;

        // 2. Comprobación de seguridad:
        // El usuario debe estar logueado y solo puede solicitar los miembros de su propio workspace.
        if (!session || session.user.workspaceId !== workspaceId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 3. Consulta a Supabase para obtener los miembros del workspace.
        // Hacemos un "join" implícito gracias a las claves foráneas que hemos definido.
        const { data, error } = await supabaseAdmin
            .from('workspace_members')
            .select(`
                role,
                profiles ( id, name, email )
            `)
            .eq('workspace_id', workspaceId);

        // Si hay un error en la consulta a la base de datos, lo registramos y devolvemos un error 500.
        if (error) {
            console.error("Error fetching workspace members:", error);
            return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
        }

        // 4. Formatear los datos de la respuesta para que coincidan con nuestro tipo `TeamMember`.
        const members: TeamMember[] = data
            // Filtramos por si algún perfil asociado fue borrado o si la relación devuelve un array vacío.
            .filter(item => item.profiles && Array.isArray(item.profiles) && item.profiles.length > 0) 
            .map(item => {
                // Supabase devuelve la relación como un array, accedemos al primer (y único) elemento.
                const profile = item.profiles[0]; 
                
                return {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    role: item.role as WorkspaceRole, // Aseguramos el tipo para el rol.
                };
            });

        // 5. Devolver la lista de miembros formateada con un estado 200 OK.
        return NextResponse.json(members);

    } catch (e) {
        // Captura de cualquier error inesperado durante el proceso.
        console.error("Unexpected error in GET /api/workspaces/[workspaceId]/members:", e);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}