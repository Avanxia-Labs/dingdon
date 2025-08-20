// src/app/api/workspaces/[workspaceId]/chat-sessions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET: Obtener chats del workspace para clasificación
 * Query params:
 * - unclassified=true: Solo chats sin clasificar
 * - classified=true: Solo chats ya clasificados (siempre vacío ya que se almacena en memoria)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const { searchParams } = new URL(request.url);
    const unclassified = searchParams.get('unclassified') === 'true';
    const classified = searchParams.get('classified') === 'true';

    if (unclassified) {
      // Obtener chats con conversación real (mínimo 2 mensajes)
      const { data: chats, error } = await supabaseAdmin
        .from('chat_sessions')
        .select('id, created_at, history, status')
        .eq('workspace_id', workspaceId)
        .not('history', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error obteniendo chats:', error);
        return NextResponse.json({ error: 'Error obteniendo chats' }, { status: 500 });
      }

      // Filtrar chats con al menos 2 mensajes
      const validChats = (chats || []).filter(chat => 
        Array.isArray(chat.history) && chat.history.length >= 2
      );

      return NextResponse.json({
        success: true,
        chats: validChats,
        total: validChats.length
      });
    }

    if (classified) {
      // Los resultados se almacenan en memoria, no en BD
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

    // Estadísticas por defecto
    const { data: totalChats, error: totalError } = await supabaseAdmin
      .from('chat_sessions')
      .select('history')
      .eq('workspace_id', workspaceId)
      .not('history', 'is', null);

    if (totalError) {
      return NextResponse.json({ error: 'Error calculando estadísticas' }, { status: 500 });
    }

    const chatsWithConversation = (totalChats || []).filter(chat => 
      Array.isArray(chat.history) && chat.history.length >= 2
    ).length;

    return NextResponse.json({
      success: true,
      statistics: {
        totalChats: chatsWithConversation,
        classifiedChats: 0,
        hotLeads: 0,
        warmLeads: 0,
        coldLeads: 0,
      }
    });

  } catch (error) {
    console.error('Error en endpoint chat-sessions:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}