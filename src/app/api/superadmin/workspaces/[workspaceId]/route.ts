// app/api/superadmin/workspaces/[workspaceId]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// --- FUNCIÓN PUT: Actualizar un workspace específico ---
export async function PUT(
    request: Request,
    //{ params }: { params: { workspaceId: string } }
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'superadmin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { name } = await request.json();
        const { workspaceId } = await context.params;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('workspaces')
            .update({ name })
            .eq('id', workspaceId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


// --- FUNCIÓN DELETE: Eliminar un workspace y todos sus datos asociados ---
export async function DELETE(
    request: Request, 
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'superadmin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const { workspaceId } = await context.params;

    try {
        // --- INICIAMOS UNA TRANSACCIÓN LÓGICA ---

        // 1. Obtener todos los IDs de los usuarios que son miembros de este workspace.
        // Necesitamos esto para borrarlos del sistema de autenticación de Supabase.
        const { data: members, error: membersError } = await supabaseAdmin
            .from('workspace_members')
            .select('user_id')
            .eq('workspace_id', workspaceId);

        if (membersError) {
            throw new Error(`Failed to fetch members for cleanup: ${membersError.message}`);
        }
        
        const userIdsToDelete = members ? members.map(m => m.user_id) : [];

        // 2. Borrar el workspace.
        // Gracias a tu configuración 'ON DELETE CASCADE', al borrar el workspace,
        // Supabase borrará automáticamente todas las filas en 'workspace_members' que lo referencian.
        const { error: workspaceError } = await supabaseAdmin
            .from('workspaces')
            .delete()
            .eq('id', workspaceId);

        if (workspaceError) {
            throw new Error(`Failed to delete workspace: ${workspaceError.message}`);
        }

        // 3. Borrar los perfiles de los usuarios asociados.
        // Al borrar los perfiles, la cascada que configuraste en 'workspace_members' también actuaría si no se hubiera borrado ya.
        if (userIdsToDelete.length > 0) {
            const { error: profilesError } = await supabaseAdmin
                .from('profiles')
                .delete()
                .in('id', userIdsToDelete);

            if (profilesError) {
                // No lanzamos un error fatal aquí, pero lo registramos.
                console.warn(`Could not delete all profiles: ${profilesError.message}`);
            }
        }

        // 4. Borrar los usuarios del sistema de autenticación de Supabase.
        // Este es el paso más crítico y debe hacerse al final.
        for (const userId of userIdsToDelete) {
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
            // Si el usuario ya no existía, no es un error fatal.
            if (authError && authError.message !== 'User not found') {
                console.warn(`Could not delete user ${userId} from auth system: ${authError.message}`);
            }
        }
        
        // 5. (Futuro) Aquí iría la llamada para borrar los datos de la base de datos vectorial:
        // await vectorDB.delete({ filter: { workspaceId: workspaceId } });

        return NextResponse.json({ success: true, message: 'Workspace and all associated data have been deleted.' });

    } catch (error: any) {
        console.error("Error during workspace deletion process:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}