// app/api/public/config/[workspaceId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

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
            return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
        }

        console.log('[API Route] Querying Supabase for workspace:', workspaceId);
        
        const { data, error } = await supabaseAdmin
            .from('workspaces')
            .select('bot_name, bot_color')
            .eq('id', workspaceId)
            .single();

        if (error) {
            console.error('[API Route] Supabase error:', error);
            return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
        }

        if (!data) {
            console.log('[API Route] No data found for workspace:', workspaceId);
            return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
        }

        console.log('[API Route] Successfully retrieved config:', data);
        return NextResponse.json(data);

    } catch (e) {
        console.error('[API Route] Unexpected error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

