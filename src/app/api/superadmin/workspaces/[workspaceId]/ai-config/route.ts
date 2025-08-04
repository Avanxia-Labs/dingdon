// app/api/superadmin/workspaces/[workspaceId]/ai-config/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";


export async function PUT(
    request: Request,
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {

    const session = await getServerSession(authOptions)

    // Security check: Solo el superadmin puede hacer esto
    if (session?.user?.role !== 'superadmin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    try {
        const { ai_model, ai_api_key_name } = await request.json();
        
        const { workspaceId } = await context.params;

        if (typeof ai_model === 'undefined' || typeof ai_api_key_name === 'undefined') {
            return NextResponse.json({ error: 'Model and API Key name are required' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('workspaces')
            .update({ ai_model, ai_api_key_name })
            .eq('id', workspaceId)

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            message: 'AI configuration updated successfully.'
        })

    } catch (error) {
        console.error("Error updating AI config:", error);
        return NextResponse.json({ error: 'Failed to update AI configuration' }, { status: 500 });
    }

}