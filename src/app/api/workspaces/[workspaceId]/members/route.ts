// app/api/workspaces/[workspaceId]/members/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { TeamMember, WorkspaceRole } from '@/types/chatbot';


// Describe la forma exacta de los datos que devuelve la consulta
interface MemberFromDB {
    role: WorkspaceRole;
    profiles: { 
        id: string;
        name: string | null;
        email: string | null;
    } | null; // Puede ser nulo si el join no encuentra nada (aunque !inner lo previene)
}

export async function GET(
    request: Request,
    //{ params }: { params: { workspaceId: string } }
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {
    try {
        const session = await getServerSession(authOptions);
        const { workspaceId } = await context.params;

        if (!session || session.user.workspaceId !== workspaceId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // --- CONSULTA CON TIPADO GENÉRICO ---
        // Le decimos a Supabase qué forma esperamos que tengan los datos.
        const { data, error } = await supabaseAdmin
            .from('workspace_members')
            .select<string, MemberFromDB>(`
                role,
                profiles!inner ( id, name, email )
            `) // Usamos .select<string, MemberFromDB>(...)
            .eq('workspace_id', workspaceId);

        if (error) {
            console.error("Error fetching workspace members:", error);
            return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
        }

        // Ahora, TypeScript sabe que 'data' es un array de 'MemberFromDB'
        const members: TeamMember[] = data
            .filter(item => item.profiles !== null) // Filtro de seguridad
            .map(item => ({
                id: item.profiles!.id,
                name: item.profiles!.name,
                email: item.profiles!.email,
                role: item.role,
            }));

        return NextResponse.json(members);

    } catch (e) {
        console.error("Unexpected error in GET /api/workspaces/[workspaceId]/members:", e);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}