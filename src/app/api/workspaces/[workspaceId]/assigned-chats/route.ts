// app/api/workspaces/[workspaceId]/assigned-chats/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {
    try {
        const session = await getServerSession(authOptions);
        const {workspaceId} = await context.params;

        // Obtener agentId del query parameter
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');

        if (!agentId) {
            return NextResponse.json({error: 'agentId is required'}, {status: 400});
        }

        // Seguridad: El usuario debe estar logueado y pertenecer al workspace que solicita
        if (!session || session.user.workspaceId !== workspaceId) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 403});
        }

        // Consultar chats asignados a este agente que están en progreso
        const {data, error} = await supabaseAdmin
            .from('chat_sessions')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('assigned_agent_id', agentId)
            .eq('status', 'in_progress')
            .order('created_at', {ascending: true});

        if (error) {
            console.error("Error fetching assigned chats:", error);
            throw error;
        }

        // Formatear los datos para el frontend
        const formattedData = data.map(chat => {
            const initialMessage = chat.history?.[0] || { content: 'No initial message found' };
            return {
                sessionId: chat.id,
                initialMessage: initialMessage,
                assignedAgentId: chat.assigned_agent_id,
            };
        });

        return NextResponse.json(formattedData);

    } catch (error) {
        console.error("Error in GET /assigned-chats:", error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}
