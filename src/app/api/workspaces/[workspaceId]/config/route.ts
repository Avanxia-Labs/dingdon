// app/api/workspaces/[workspaceId]/config/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { cryptoService } from '@/lib/crypto/server';

// --- FUNCIÓN GET: Obtener la configuración actual del workspace ---
export async function GET(
    request: Request,
    //{ params }: { params: { workspaceId: string } }
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {
    const session = await getServerSession(authOptions);

    const { workspaceId } = await context.params;

    // Seguridad: Solo un miembro del workspace puede ver su configuración.
    if (!session || session.user.workspaceId !== workspaceId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
        .from('workspaces')
        .select('bot_name, bot_color, bot_avatar_url, bot_introduction, notification_email, resend_from_email')
        .eq('id', workspaceId)
        .single();

    if (error) {
        console.error("Error fetching workspace config:", error);
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
    return NextResponse.json(data);
}


// --- FUNCIÓN PUT: Actualizar la configuración del workspace ---
export async function PUT(
    request: Request,
    //{ params }: { params: { workspaceId: string } }
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {
    const session = await getServerSession(authOptions);

    const { workspaceId } = await context.params;

    // Seguridad: Solo un admin del workspace puede cambiar la configuración.
    if (session?.user?.workspaceId !== workspaceId || session.user.workspaceRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    // 1. Creamos un objeto vacío para los datos que SÍ vamos a actualizar.
    const updateData: { [key: string]: any } = {};

    // 2. Llenamos el objeto solo con los campos que tienen un valor real.
    //    Usamos 'body.campo' para acceder a las propiedades del objeto parseado.
    if (body.bot_name) updateData.bot_name = body.bot_name;
    if (body.bot_color) updateData.bot_color = body.bot_color;
    if (body.bot_avatar_url !== undefined) updateData.bot_avatar_url = body.bot_avatar_url;
    if (body.bot_introduction !== undefined) updateData.bot_introduction = body.bot_introduction;
    if (body.notification_email !== undefined) updateData.notification_email = body.notification_email;
    if (body.resend_from_email !== undefined) updateData.resend_from_email = body.resend_from_email;

    // 3. Si se envió una nueva Resend API Key, la encriptamos y guardamos.
    if (body.resend_api_key && typeof body.resend_api_key === 'string') {
        updateData.resend_api_key = cryptoService.encrypt(body.resend_api_key);
    }

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ success: true, message: 'No data to update.' });
    }

    // 5. Ejecutamos la actualización solo con los campos que hemos añadido a 'updateData'.
    const { data, error } = await supabaseAdmin
        .from('workspaces')
        .update(updateData)
        .eq('id', workspaceId)
        .select()
        .single();


    if (error) {
        console.error("Error updating workspace config:", error);
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
}