// app/api/public/config/[workspaceId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// --- AÑADIDO: Helper para crear respuestas con cabeceras CORS ---
function createCorsResponse(body: any, status: number = 200) {
    const response = NextResponse.json(body, { status });
    response.headers.set('Access-Control-Allow-Origin', '*'); // Permite cualquier origen
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS'); // Métodos permitidos
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type'); // Cabeceras permitidas
    return response;
}

export async function GET(
    request: NextRequest,
    //{ params }: { params: Promise<{ workspaceId: string }> }
    context: { params: Promise<{ workspaceId: string }> }
) {
    console.log('[API Route] GET /api/public/config/[workspaceId] called');
    
    try {
        // 🔧 CAMBIO PRINCIPAL: Await params antes de destructuring
        const { workspaceId } = await context.params;
        console.log('[API Route] workspaceId:', workspaceId);

        if (!workspaceId) {
            console.log('[API Route] No workspaceId provided');
            return createCorsResponse({ error: 'Workspace ID is required' }, 400);
        }

        console.log('[API Route] Querying Supabase for workspace:', workspaceId);
        
        const { data, error } = await supabaseAdmin
            .from('workspaces')
            .select('bot_name, bot_color, bot_avatar_url, bot_introduction')
            .eq('id', workspaceId)
            .single();

        if (error) {
            console.error('[API Route] Supabase error:', error);
            return createCorsResponse({ error: 'Configuration not found' }, 400);
        }

        if (!data) {
            console.log('[API Route] No data found for workspace:', workspaceId);
            return createCorsResponse({ error: 'Configuration not found' }, 400);
        }

        console.log('[API Route] Successfully retrieved config:', data);
        return createCorsResponse(data);

    } catch (e) {
        console.error('[API Route] Unexpected error:', e);
        return createCorsResponse({ error: 'Internal server error' }, 400);
    }
}

