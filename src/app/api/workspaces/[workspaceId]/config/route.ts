// app/api/workspaces/[workspaceId]/config/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// --- FUNCIÓN GET: Obtener la configuración actual del workspace ---
export async function GET(
    request: Request,
    //{ params }: { params: { workspaceId: string } }
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {
    const session = await getServerSession(authOptions);

    const { workspaceId } = await context.params;

    // Seguridad: Solo un miembro del workspace puede ver su configuración.
    if (!session || session.user.workspaceId !== workspaceId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
        .from('workspaces')
        .select('bot_name, bot_color, bot_avatar_url, bot_introduction')
        .eq('id', workspaceId)
        .single();

    if (error) {
        console.error("Error fetching workspace config:", error);
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
    return NextResponse.json(data);
}


// --- FUNCIÓN PUT: Actualizar la configuración del workspace ---
export async function PUT(
    request: Request,
    //{ params }: { params: { workspaceId: string } }
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {
    const session = await getServerSession(authOptions);

    const { workspaceId } = await context.params;

    // Seguridad: Solo un admin del workspace puede cambiar la configuración.
    if (session?.user?.workspaceId !== workspaceId || session.user.workspaceRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { bot_name, bot_color, bot_avatar_url, bot_introduction } = await request.json();
    
    // Validación simple
    if (typeof bot_name !== 'string' || typeof bot_color !== 'string') {
        return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from('workspaces')
        .update({ bot_name, bot_color, bot_avatar_url, bot_introduction })
        .eq('id', workspaceId)
        .select()
        .single();

    if (error) {
        console.error("Error updating workspace config:", error);
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
}