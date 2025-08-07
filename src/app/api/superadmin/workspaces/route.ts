// app/api/superadmin/workspaces/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// --- FUNCIÓN GET: Obtener todos los workspaces ---
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    // Seguridad: Solo el superadmin puede ver todos los workspaces
    if (session?.user?.role !== 'superadmin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
        .from('workspaces')
        .select('id, name, created_at, owner_id'); // Podríamos hacer un join para traer el nombre del owner

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// --- FUNCIÓN POST: Crear un nuevo workspace y su admin ---
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    // Seguridad: Solo el superadmin puede crear workspaces
    if (session?.user?.role !== 'superadmin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { workspaceName, adminName, adminEmail, adminPassword } = await request.json();

    if (!workspaceName || !adminName || !adminEmail || !adminPassword) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Crear el usuario Admin en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Lo confirmamos automáticamente
        user_metadata: { full_name: adminName }
    });

    if (authError) {
        return NextResponse.json({ error: `Failed to create admin user: ${authError.message}` }, { status: 500 });
    }
    const adminUser = authData.user;

    // El trigger se encargará de crear el perfil en `public.profiles`
    // Ahora, actualizamos ese perfil para darle el rol de 'admin'
    await supabaseAdmin
        .from('profiles')
        .update({ app_role: 'admin' })
        .eq('id', adminUser.id);

    // 2. Crear el Workspace
    const { data: workspaceData, error: workspaceError } = await supabaseAdmin
        .from('workspaces')
        .insert({ name: workspaceName, owner_id: adminUser.id })
        .select()
        .single();
    
    if (workspaceError) {
        // Si esto falla, deberíamos borrar el usuario creado para mantener la consistencia (rollback)
        await supabaseAdmin.auth.admin.deleteUser(adminUser.id);
        return NextResponse.json({ error: `Failed to create workspace: ${workspaceError.message}` }, { status: 500 });
    }

    // 3. Añadir el admin como miembro del nuevo workspace
    const { error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .insert({
            workspace_id: workspaceData.id,
            user_id: adminUser.id,
            role: 'admin'
        });
    
    if (memberError) {
        // Rollback
        await supabaseAdmin.auth.admin.deleteUser(adminUser.id);
        await supabaseAdmin.from('workspaces').delete().eq('id', workspaceData.id);
        return NextResponse.json({ error: `Failed to add member to workspace: ${memberError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, workspace: workspaceData });
}