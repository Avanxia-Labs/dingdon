// // app/api/workspaces/[workspaceId]/chats/route.ts

// import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import { supabaseAdmin } from '@/lib/supabase/server';

// export async function GET(
//     request: Request,
//     //{ params }: { params: { workspaceId: string } }
//     context: {
//         params: Promise<{ workspaceId: string }>
//     }
// ) {

//     console.warn('--- INICIANDO GET /CHATS - VERSIÓN DE CÓDIGO 29-JULIO ---');


//     const session = await getServerSession(authOptions);
//     const { workspaceId } = await context.params;

//     // Seguridad: Solo un admin de este workspace puede ver el historial
//     if (session?.user?.workspaceId !== workspaceId || session.user.workspaceRole !== 'admin') {
//         return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
//     }

//     try {
//         // Consulta para obtener las sesiones cerradas, ordenadas por la más reciente
//         const { data, error } = await supabaseAdmin
//             .from('chat_sessions')
//             .select(`
//                 id,
//                 created_at,
//                 ended_at,
//                 assigned_agent_id,
//                 history,
//                 profiles!inner ( name )
//             `)
//             .eq('workspace_id', workspaceId)
//             .eq('status', 'closed')
//             .order('created_at', { ascending: false });

//         if (error) throw error;


//         const mappeoData = data.map(chat => ({

//         }))

//         // Formatear los datos para que sean más fáciles de usar en el frontend
//         const formattedData = data.map(chat => ({
//             id: chat.id,
//             startTime: chat.created_at,
//             endTime: chat.ended_at,
//             // agentName: chat.profiles?.name || 'Unassigned',  25 julio 2025 Tenia esto sin .[0]
//             agentName: chat.profiles?.[0]?.name || 'Unassigned',
//             messageCount: chat.history?.length || 0,
//             firstMessage: chat.history?.[0]?.content || 'No messages'
//         }));

//         // ============= DIAGNÓSTICO ===================
//         for (let i = 0; i < formattedData.length; i++) {
//             console.warn(`[DIAGNÓSTICO] Procesando chat ID: ${formattedData[i].id}. Contenido completo del chat:`, formattedData[i])

//         }

//         // ============= DIAGNÓSTICO ===================
//         for (const chat of formattedData) {
//             // Usamos JSON.stringify para asegurarnos de que el objeto se expanda bien en los logs
//             console.warn(`[DIAGNÓSTICO] Objeto formateado:`, JSON.stringify(chat, null, 2));
//         }

//         return NextResponse.json(formattedData);

//     } catch (error: any) {
//         console.error("Error fetching chat history:", error);
//         return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
//     }
// }


// export async function DELETE(
//     request: Request,
//     //{ params }: { params: { workspaceId: string } }
//     context: {
//         params: Promise<{ workspaceId: string }>
//     }
// ) {
//     try {
//         const session = await getServerSession(authOptions);
//         const { workspaceId } = await context.params;

//         // Seguridad: Solo un admin del workspace puede borrar todo el historial
//         if (session?.user?.workspaceId !== workspaceId || session.user.workspaceRole !== 'admin') {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
//         }

//         // Ejecutamos la operación de borrado en la tabla 'chat_sessions'
//         // filtrando por el workspaceId.
//         const { error } = await supabaseAdmin
//             .from('chat_sessions')
//             .delete()
//             .eq('workspace_id', workspaceId);

//         if (error) {
//             console.error("Error deleting all chat histories:", error);
//             throw new Error(error.message);
//         }

//         return NextResponse.json({ success: true, message: 'All chat histories for this workspace have been deleted.' });

//     } catch (error: any) {
//         console.error("Unexpected error in DELETE /api/workspaces/[workspaceId]/chats:", error);
//         return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
//     }
// }




// app/api/workspaces/[workspaceId]/chats/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';


type Profile = {
    name: string;
} | {
    name: string;
}[];

export async function GET(
    request: Request,
    //{ params }: { params: { workspaceId: string } }
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {

    console.warn('--- INICIANDO GET /CHATS - VERSIÓN DE CÓDIGO 29-JULIO ---');


    const session = await getServerSession(authOptions);
    const { workspaceId } = await context.params;

    // Seguridad: Solo un admin de este workspace puede ver el historial
    if (session?.user?.workspaceId !== workspaceId || session.user.workspaceRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        // Consulta para obtener las sesiones cerradas, ordenadas por la más reciente
        const { data, error } = await supabaseAdmin
            .from('chat_sessions')
            .select(`
                id,
                created_at,
                ended_at,
                assigned_agent_id,
                history,
                profiles:assigned_agent_id ( name )
            `)
            .eq('workspace_id', workspaceId)
            .eq('status', 'closed')
            .order('created_at', { ascending: false });

        if (error) throw error;


        const mappeoData = data.map(chat => ({

        }))

        // Formatear los datos para que sean más fáciles de usar en el frontend
        const formattedData = data.map(chat => {

            const profileData = chat.profiles as Profile;

            const agentName = Array.isArray(profileData)
                ? profileData[0]?.name          // Si es un array, toma el nombre del primer elemento
                : profileData?.name             // Si es un objeto, toma el nombre directamente
                || (chat.assigned_agent_id === null ? 'BOT' : 'Unassigned'); // NULL = BOT

            return {
                id: chat.id,
                startTime: chat.created_at,
                endTime: chat.ended_at,
                agentName: agentName,
                messageCount: chat.history?.length || 0,
                firstMessage: chat.history?.[0]?.content || 'No messages'
            };
        });

        // --- AÑADIMOS UN LOG MUY DETALLADO DE LOS DATOS CRUDOS ---
        console.warn("[DIAGNÓSTICO CRUDO] Datos recibidos de Supabase:", JSON.stringify(data, null, 2));

        return NextResponse.json(formattedData);

    } catch (error: any) {
        console.error("Error fetching chat history:", error);
        return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }
}


export async function DELETE(
    request: Request,
    //{ params }: { params: { workspaceId: string } }
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {
    try {
        const session = await getServerSession(authOptions);
        const { workspaceId } = await context.params;

        // Seguridad: Solo un admin del workspace puede borrar todo el historial
        if (session?.user?.workspaceId !== workspaceId || session.user.workspaceRole !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Ejecutamos la operación de borrado en la tabla 'chat_sessions'
        // filtrando por el workspaceId.
        const { error } = await supabaseAdmin
            .from('chat_sessions')
            .delete()
            .eq('workspace_id', workspaceId);

        if (error) {
            console.error("Error deleting all chat histories:", error);
            throw new Error(error.message);
        }

        return NextResponse.json({ success: true, message: 'All chat histories for this workspace have been deleted.' });

    } catch (error: any) {
        console.error("Unexpected error in DELETE /api/workspaces/[workspaceId]/chats:", error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}