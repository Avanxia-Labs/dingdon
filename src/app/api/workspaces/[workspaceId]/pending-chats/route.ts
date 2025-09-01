// app/api/workspaces/[workspaceId]/pending-chats/route.ts
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

        // Seguridad: El usuario debe estar logueado y pertenecer al workspace que solicita
        if (!session || session.user.workspaceId !== workspaceId) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 403});
        }

        // Hacemos la consulta la base de datos
        const {data, error} = await supabaseAdmin
            .from('chat_sessions')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('status', 'pending')
            .order('created_at', {ascending: true}); // Trae los mas antiguos primero

        if (error) {
            console.error("Error fetching pending chats:", error);
            throw error;
        }

        // 2. Formateamos los datos para que coincidan con lo que espera el frontend
        //    (Esto es crucial para que el componente pueda renderizarlos sin problemas)
        const formattedData = data.map(chat => {
            const initialMessage = chat.history?.[0] || { content: 'No initial message found' };
            return {
                sessionId: chat.id,
                initialMessage: initialMessage,
            };
        });

        return NextResponse.json(formattedData);



    } catch (error) {
        console.error("Error in GET /pending-chats:", error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}