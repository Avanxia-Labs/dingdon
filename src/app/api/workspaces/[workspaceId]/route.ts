// app/api/workspaces/[workspaceId]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
    request: Request,
    { params }: { params: { workspaceId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const { workspaceId } = params;

        // Verificación de Seguridad: El usuario logueado solo puede pedir datos de su propio workspace.
        if (!session || session.user.workspaceId !== workspaceId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Consulta simple para obtener los detalles del workspace
        const { data: workspace, error } = await supabaseAdmin
            .from('workspaces')
            .select('id, name')
            .eq('id', workspaceId)
            .single();

        if (error || !workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        return NextResponse.json(workspace);

    } catch (e) {
        console.error("Error fetching workspace details:", e);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}