// app/api/workspaces/[workspaceId]/leads/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// --- FUNCIÓN GET: Obtener todos los leads de un workspace ---
export async function GET(
    request: NextRequest,
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {
    const session = await getServerSession(authOptions);
    const { workspaceId } = await context.params;

    // Seguridad: El usuario debe pertenecer al workspace que solicita
    if (session?.user?.workspaceId !== workspaceId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {

        // Logica de paginacion
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabaseAdmin
            .from('leads')
            .select('*', {count: 'exact'})
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        
        return NextResponse.json({data, count});

    } catch (error: any) {
        console.error("Error fetching leads:", error);
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }
}

// --- FUNCIÓN DELETE: Borrar TODOS los leads de un workspace ---
export async function DELETE(
    request: Request,
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {
    const session = await getServerSession(authOptions);
    const { workspaceId } = await context.params;

    // Seguridad: Solo los admins pueden realizar esta acción masiva
    if (session?.user?.workspaceId !== workspaceId || session.user.workspaceRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { error } = await supabaseAdmin
            .from('leads')
            .delete()
            .eq('workspace_id', workspaceId);

        if (error) throw error;
        
        return NextResponse.json({ success: true, message: 'All leads have been deleted.' });

    } catch (error: any) {
        console.error("Error deleting all leads:", error);
        return NextResponse.json({ error: 'Failed to delete leads' }, { status: 500 });
    }
}