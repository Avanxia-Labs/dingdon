// app/api/superadmin/twilio-configs/[configId]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(
    req: Request,
    context: { params: Promise<{ configId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'superadmin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { configId } = await context.params;
        const { error } = await supabaseAdmin
            .from('twilio_configs')
            .delete()
            .eq('id', configId);

        if (error) throw error;
        
        return NextResponse.json({ success: true, message: 'Configuration deleted.' });

    } catch (error: any) {
        // Manejar el caso de que la config esté en uso
        if (error.code === '23503') { // Violación de llave foránea
            return NextResponse.json({ error: 'Cannot delete: this configuration is currently assigned to one or more workspaces.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to delete configuration.' }, { status: 500 });
    }
}