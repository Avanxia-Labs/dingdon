// app/api/superadmin/workspaces/[workspaceId]/twilio-config/route.ts

/**
 * Esta es la API que llamará el modal cuando el superadmin seleccione una configuración de Twilio para un workspace y haga clic en "Guardar".
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// --- FUNCIÓN PUT: Actualizar (asignar) la config de Twilio de un workspace ---
export async function PUT(
    req: Request,
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'superadmin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { twilio_config_id } = await req.json();
        const { workspaceId } = await context.params;

        // Si se envía un string vacío, lo convertimos a null para desasignar.
        const newConfigId = twilio_config_id === '' ? null : twilio_config_id;

        const { error } = await supabaseAdmin
            .from('workspaces')
            .update({ twilio_config_id: newConfigId })
            .eq('id', workspaceId);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Twilio configuration assigned successfully.' });

    } catch (error: any) {
        console.error("Error assigning Twilio config:", error);
        return NextResponse.json({ error: 'Failed to assign Twilio configuration' }, { status: 500 });
    }
}