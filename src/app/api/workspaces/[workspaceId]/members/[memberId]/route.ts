// app/api/workspaces/[workspaceId]/members/[memberId]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(
    request: Request,
    { params }: { params: { workspaceId: string, memberId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const { workspaceId, memberId } = params;

        // 1. Verificación de Seguridad:
        // - El usuario que hace la petición debe ser un 'admin' de este workspace.
        // - No se puede eliminar a sí mismo.
        // - No se puede eliminar al dueño del workspace (owner_id).
        if (
            !session ||
            session.user.workspaceId !== workspaceId ||
            session.user.workspaceRole !== 'admin'
        ) {
            return NextResponse.json({ error: 'Unauthorized: Not an admin of this workspace.' }, { status: 403 });
        }
        
        if (session.user.id === memberId) {
            return NextResponse.json({ error: "You cannot remove yourself from the workspace." }, { status: 400 });
        }

        // Obtener el dueño del workspace para evitar su eliminación
        const { data: workspaceData, error: ownerError } = await supabaseAdmin
            .from('workspaces')
            .select('owner_id')
            .eq('id', workspaceId)
            .single();
        
        if (ownerError || !workspaceData) {
            return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
        }

        if (workspaceData.owner_id === memberId) {
            return NextResponse.json({ error: "You cannot remove the workspace owner." }, { status: 400 });
        }


        // 2. Borrar la membresía. Gracias a las cascadas, esto también borrará el perfil y el usuario de Auth.
        // Es más seguro borrar la membresía que el perfil directamente.
        const { error: deleteMemberError } = await supabaseAdmin
            .from('workspace_members')
            .delete()
            .eq('workspace_id', workspaceId)
            .eq('user_id', memberId);

        if (deleteMemberError) {
            throw new Error(`Failed to remove member: ${deleteMemberError.message}`);
        }

        // 3. Ahora borramos el perfil (la cascada desde aquí también funciona)
        const { error: deleteProfileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', memberId);
        
        if (deleteProfileError) console.warn(`Could not delete profile for ${memberId}, it might have been removed by cascade.`);

        // 4. Finalmente, borramos el usuario del sistema de autenticación de Supabase
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(memberId);

        if (deleteAuthError && deleteAuthError.message !== 'User not found') {
            console.warn(`Could not delete user ${memberId} from auth system: ${deleteAuthError.message}`);
        }

        return NextResponse.json({ success: true, message: 'Member removed successfully.' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}