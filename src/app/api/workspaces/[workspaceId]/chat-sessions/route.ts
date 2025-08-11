// src/app/api/workspaces/[workspaceId]/chat-sessions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET: Obtener chats del workspace para clasificación
 * Query params:
 * - unclassified=true: Solo chats sin clasificar
 * - classified=true: Solo chats ya clasificados con sus resultados
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = params;
    const { searchParams } = new URL(request.url);
    const unclassified = searchParams.get('unclassified') === 'true';
    const classified = searchParams.get('classified') === 'true';

    if (unclassified) {
      // Obtener todos los chats cerrados (sin verificar lead_classification porque no la usamos)
      const { data: chats, error } = await supabaseAdmin
        .from('chat_sessions')
        .select('id, created_at, ended_at, history')
        .eq('workspace_id', workspaceId)
        .eq('status', 'closed') // Solo chats terminados
        .not('history', 'is', null) // Que tengan historial
        .order('created_at', { ascending: false })
        .limit(50); // Limitar para no sobrecargar

      if (error) {
        console.error('Error obteniendo chats sin clasificar:', error);
        return NextResponse.json(
          { error: 'Error obteniendo chats' },
          { status: 500 }
        );
      }

      // Filtrar chats que tengan al menos 2 mensajes
      const validChats = (chats || []).filter(chat => {
        if (!chat.history || !Array.isArray(chat.history)) return false;
        return chat.history.length >= 2; // Al menos user + bot
      });

      return NextResponse.json({
        success: true,
        chats: validChats,
        total: validChats.length
      });
    }

    if (classified) {
      // Como trabajamos en memoria, no hay chats "clasificados" permanentemente
      // Devolvemos array vacío
      return NextResponse.json({
        success: true,
        results: [],
        statistics: {
          totalChats: 0,
          classifiedChats: 0,
          hotLeads: 0,
          warmLeads: 0,
          coldLeads: 0,
        }
      });
    }

    // Por defecto, obtener solo el total de chats cerrados
    const { data: totalChats, error: totalError } = await supabaseAdmin
      .from('chat_sessions')
      .select('id', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .eq('status', 'closed');

    if (totalError) {
      return NextResponse.json(
        { error: 'Error calculando estadísticas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      statistics: {
        totalChats: totalChats?.length || 0,
        classifiedChats: 0, // En memoria, siempre 0 al iniciar
        hotLeads: 0,
        warmLeads: 0,
        coldLeads: 0,
      }
    });

  } catch (error) {
    console.error('Error en endpoint chat-sessions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}