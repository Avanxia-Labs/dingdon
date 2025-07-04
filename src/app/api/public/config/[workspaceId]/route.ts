// app/api/public/config/[workspaceId]/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
    request: Request,
    { params }: { params: { workspaceId: string } }
) {
    const { workspaceId } = params;

    if (!workspaceId) {
        return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('workspaces')
            .select('bot_name, bot_color')
            .eq('id', workspaceId)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
        }

        return NextResponse.json(data);

    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}