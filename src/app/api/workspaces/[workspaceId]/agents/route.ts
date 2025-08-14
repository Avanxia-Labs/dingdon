import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ workspaceId: string }> }
) {
    try {
        // Verificar autenticación
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workspaceId } = await context.params;

        // Temporal: traer todos los miembros del workspace sin filtros restrictivos
        const { data: agents, error: agentsError } = await supabase
            .from('workspace_members')
            .select(`
                profiles!inner (
                    id, 
                    email, 
                    name, 
                    app_role
                )
            `)
            .eq('workspace_id', workspaceId);

        if (agentsError) {
            console.error('Error fetching agents:', agentsError);
            return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
        }

        // Debug temporal - eliminar después de verificar funcionamiento
        console.log('DEBUG: Miembros del workspace encontrados:', agents?.length || 0);
        console.log('DEBUG: Usuario actual:', session.user.id);

        // Procesar los datos ya que ahora vienen anidados
        const processedAgents = agents?.map(member => member.profiles).filter(Boolean) || [];
        
        // Filtrar para no incluir al usuario actual en la lista
        const filteredAgents = processedAgents.filter(agent => agent.id !== session.user.id);

        return NextResponse.json({ 
            agents: filteredAgents.map(agent => ({
                id: agent.id,
                email: agent.email,
                name: agent.name,
                role: agent.app_role || 'member' // Mapear app_role a role para compatibilidad
            })),
            currentAgentId: session.user.id
        });

    } catch (error) {
        console.error('Error in agents API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}