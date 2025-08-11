// src/app/api/workspaces/[workspaceId]/classify-lead/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { leadClassificationService } from '@/services/server/leadClassificationService';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST: Clasificar un lead basado en el historial de chat
 * Body: { chatSessionId: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = params;
    const { chatSessionId } = await request.json();

    if (!chatSessionId) {
      return NextResponse.json(
        { error: 'chatSessionId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el chat pertenece al workspace
    const { data: chatSession, error: chatError } = await supabaseAdmin
      .from('chat_sessions')
      .select('workspace_id')
      .eq('id', chatSessionId)
      .single();

    if (chatError || chatSession?.workspace_id !== workspaceId) {
      return NextResponse.json(
        { error: 'Chat no encontrado en este workspace' },
        { status: 404 }
      );
    }

    // Realizar clasificación
    const result = await leadClassificationService.classifyLead(workspaceId, chatSessionId);

    if (!result) {
      return NextResponse.json(
        { error: 'No se pudo clasificar el lead' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Error en clasificación de lead:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET: Obtener clasificación existente de un chat
 * Query: ?chatSessionId=uuid
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = params;
    const { searchParams } = new URL(request.url);
    const chatSessionId = searchParams.get('chatSessionId');

    if (!chatSessionId) {
      return NextResponse.json(
        { error: 'chatSessionId es requerido' },
        { status: 400 }
      );
    }

    const { data: score, error } = await supabaseAdmin
      .from('lead_scores')
      .select('*')
      .eq('chat_session_id', chatSessionId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Clasificación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      score
    });

  } catch (error) {
    console.error('Error obteniendo clasificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}