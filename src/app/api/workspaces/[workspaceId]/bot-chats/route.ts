// app/api/workspaces/[workspaceId]/bot-chats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Message } from '@/types/chatbot';

export async function GET(
    request: NextRequest,
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {
    try {
        const session = await getServerSession(authOptions);
        const {workspaceId} = await context.params;

        // El usuario debe estar logueado y pertenecer al workspace que solicita
        if (!session || session.user.workspaceId !== workspaceId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Hacemos la consulta la base de datos
        const {data, error} = await supabaseAdmin
            .from('chat_sessions')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('status', 'bot')
            .order('created_at', {ascending: true}); 
        
        if (error) throw error;

        // Formateamos los datos para que coincidan con lo que espera el frontend
        const formattedData = data.map(chat => {

            // Usamos el ultimo mensaje como preview que es mas relevante para monitorear
            const lastMessage: Message = chat.history?.[chat.history.length - 1] || {
                id: `fallback-${chat.id}`,
                content: 'Conversation started...',
                role: 'system',
                timestamp: new Date(chat.created_at)
            };

            return {
                sessionId: chat.id,
                initialMessage: lastMessage
            }
        });

        return NextResponse.json(formattedData);


    } catch (error) {
        console.error("Error in GET /bot-chats:", error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}