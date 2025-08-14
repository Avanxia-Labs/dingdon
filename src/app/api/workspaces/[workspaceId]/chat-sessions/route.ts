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
      // NUEVA ESTRATEGIA: Obtener TODOS los chats con conversación real, sin importar el status
      console.log(`[CLASSIFY] Buscando TODOS los chats para workspace ${workspaceId}`);
      
      const { data: allChats, error } = await supabaseAdmin
        .from('chat_sessions')
        .select('id, created_at, ended_at, history, status')
        .eq('workspace_id', workspaceId)
        .not('history', 'is', null) // Que tengan historial
        .order('created_at', { ascending: false })
        .limit(100);

      console.log(`[CLASSIFY] Encontrados ${allChats?.length || 0} chats con historial`);

      if (error) {
        console.error('Error obteniendo chats sin clasificar:', error);
        return NextResponse.json(
          { error: 'Error obteniendo chats' },
          { status: 500 }
        );
      }

      // Filtrar chats que tengan al menos 2 mensajes, incluyendo TODOS los status
      const validChats = (allChats || []).filter(chat => {
        if (!chat.history || !Array.isArray(chat.history)) {
          console.log(`[CLASSIFY] Chat ${chat.id} sin historial válido`);
          return false;
        }
        
        // Ajustar requisitos según el status - RELAJADO para incluir más chats
        let minMessages = 2; // Mínimo universal
        // Ya no discriminamos por status - todos los chats con 2+ mensajes califican
        
        const hasEnoughMessages = chat.history.length >= minMessages;
        if (!hasEnoughMessages) {
          console.log(`[CLASSIFY] Chat ${chat.id} (${chat.status}) solo tiene ${chat.history.length} mensajes (necesita ${minMessages})`);
        }
        return hasEnoughMessages;
      });

      console.log(`[CLASSIFY] Chats válidos para clasificar: ${validChats.length}`);
      console.log(`[CLASSIFY] Por status:`, validChats.reduce((acc, chat) => {
        acc[chat.status] = (acc[chat.status] || 0) + 1;
        return acc;
      }, {}));
      console.log(`[CLASSIFY] IDs de ejemplo:`, validChats.map(c => `${c.id.slice(0, 8)}...(${c.status})`).slice(0, 5));

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

    // Por defecto, obtener el total de chats con conversación (terminados o con suficientes mensajes)
    const { data: totalChats, error: totalError } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, history, status', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .not('history', 'is', null);

    // Contar solo chats con conversación real
    const chatsWithConversation = (totalChats || []).filter(chat => {
      if (!chat.history || !Array.isArray(chat.history)) return false;
      return chat.history.length >= 2;
    }).length;

    if (totalError) {
      return NextResponse.json(
        { error: 'Error calculando estadísticas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      statistics: {
        totalChats: chatsWithConversation,
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