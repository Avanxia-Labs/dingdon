// app/api/workspaces/[workspaceId]/leads/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// --- FUNCIÓN GET: Obtener todos los leads de un workspace ---
export async function GET(
    request: Request,
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
        const { data, error } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return NextResponse.json(data);

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