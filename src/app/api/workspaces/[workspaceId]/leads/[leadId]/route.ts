// app/api/workspaces/[workspaceId]/leads/[leadId]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(
    request: Request,
    context: {
        params: Promise<{
            workspaceId: string,
            leadId: string
        }>
    }
) {
    const session = await getServerSession(authOptions);
    const { workspaceId, leadId } = await context.params;

    // Seguridad: El usuario debe pertenecer al workspace
    if (session?.user?.workspaceId !== workspaceId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { error } = await supabaseAdmin
            .from('leads')
            .delete()
            .eq('id', leadId)
            .eq('workspace_id', workspaceId);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Lead deleted.' });

    } catch (error: any) {
        console.error(`Error deleting lead ${leadId}:`, error);
        return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
    }
}