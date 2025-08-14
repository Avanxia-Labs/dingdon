// app/api/save-history/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Message } from '@/types/chatbot';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, workspaceId, history }: {
      sessionId: string;
      workspaceId: string;
      history: Message[];
    } = await request.json();

    // Validar que tenemos los datos necesarios
    if (!sessionId || !workspaceId || !history || history.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Datos insuficientes' },
        { status: 400 }
      );
    }

    // Solo guardamos si hay más mensajes que el mensaje inicial
    const meaningfulMessages = history.filter(msg => msg.id !== 'init-1');
    if (meaningfulMessages.length === 0) {
      return NextResponse.json(
        { success: true, message: 'Solo mensaje inicial, no se guardó' }
      );
    }

    console.log(`[API SaveHistory] Guardando historial de sesión ${sessionId} antes del reinicio`);
    
    // Guardar en la base de datos marcando como conversación del BOT
    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .upsert({
        id: sessionId,
        workspace_id: workspaceId,
        status: 'closed',
        history: history,
        assigned_agent_id: null, // NULL = conversación del BOT
        ended_at: new Date().toISOString(),
        created_at: new Date().toISOString() // Por si es una inserción nueva
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('[API SaveHistory] Error al guardar historial:', error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`[API SaveHistory] ✅ Historial guardado exitosamente para sesión ${sessionId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Historial guardado exitosamente'
    });
    
  } catch (error) {
    console.error('[API SaveHistory] Error inesperado:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}