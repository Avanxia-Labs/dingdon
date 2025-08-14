import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    { params }: { params: { workspaceId: string } }
) {
    try {
        const { workspaceId } = params;
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');

        if (!agentId) {
            return NextResponse.json(
                { error: 'agentId is required' },
                { status: 400 }
            );
        }

        console.log(`[API] Loading active chats for agent ${agentId} in workspace ${workspaceId}`);

        // Obtener todos los chats asignados a este agente que están en progreso
        console.log(`[API] Querying chats for agent ${agentId} in workspace ${workspaceId}`);
        
        const { data: chats, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('assigned_agent_id', agentId)
            .in('status', ['in_progress', 'pending']) // Solo chats activos
            .order('created_at', { ascending: false });
            
        console.log(`[API] Query result - chats:`, chats?.length, 'error:', error?.message);

        if (error) {
            console.error('[API] Error loading active chats:', error);
            return NextResponse.json(
                { 
                    error: 'Failed to load active chats',
                    details: error.message,
                    code: error.code 
                },
                { status: 500 }
            );
        }

        console.log(`[API] Found ${chats?.length || 0} active chats for agent ${agentId}`);

        return NextResponse.json({
            success: true,
            chats: chats || []
        });

    } catch (error) {
        console.error('[API] Error in my-active-chats:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}