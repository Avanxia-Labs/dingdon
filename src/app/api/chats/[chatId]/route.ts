// app/api/chats/[chatId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// --- FUNCIÓN GET: Obtener el historial completo de un chat ---
export async function GET(
    request: Request,
    { params }: { params: { chatId: string } }
) {
    const session = await getServerSession(authOptions);
    const { chatId } = params;

    if (!session?.user?.workspaceId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Consulta para obtener el historial y verificar que pertenece al workspace del usuario
    const { data, error } = await supabaseAdmin
        .from('chat_sessions')
        .select('history, workspace_id')
        .eq('id', chatId)
        .single();

    if (error || !data) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Seguridad: Asegurarse de que el chat pertenece al workspace del admin que lo solicita
    if (data.workspace_id !== session.user.workspaceId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json({ history: data.history || [] });
}

// --- FUNCIÓN DELETE: Eliminar un chat específico ---
export async function DELETE(
    request: Request,
    { params }: { params: { chatId: string } }
) {
    const session = await getServerSession(authOptions);
    const { chatId } = params;
    
    if (!session?.user?.workspaceId || session.user.workspaceRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verificamos que el chat a borrar pertenece al workspace del admin
    const { error: deleteError } = await supabaseAdmin
        .from('chat_sessions')
        .delete()
        .eq('id', chatId)
        .eq('workspace_id', session.user.workspaceId); // Doble seguridad

    if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Chat history deleted.' });
}