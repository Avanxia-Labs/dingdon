// lib/chatHistoryService.ts

import { supabaseAdmin } from '@/lib/supabase/server';
import { Message } from '@/types/chatbot';

/**
 * Guarda el historial de chat antes del reinicio del store,
 * marcando la conversación como manejada por el BOT
 */
export async function saveHistoryBeforeReset(
  sessionId: string | null,
  workspaceId: string | null,
  history: Message[]
): Promise<boolean> {
  
  // Validar que tenemos los datos necesarios
  if (!sessionId || !workspaceId || !history || history.length === 0) {
    console.log('[ChatHistory] No hay datos suficientes para guardar el historial');
    return false;
  }

  // Solo guardamos si hay más mensajes que el mensaje inicial
  const meaningfulMessages = history.filter(msg => msg.id !== 'init-1');
  if (meaningfulMessages.length === 0) {
    console.log('[ChatHistory] Solo hay mensaje inicial, no se guarda historial');
    return false;
  }

  try {
    console.log(`[ChatHistory] Guardando historial de sesión ${sessionId} antes del reinicio`);
    
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
      console.error('[ChatHistory] Error al guardar historial:', error.message);
      return false;
    }

    console.log(`[ChatHistory] ✅ Historial guardado exitosamente para sesión ${sessionId}`);
    return true;
    
  } catch (error) {
    console.error('[ChatHistory] Error inesperado al guardar historial:', error);
    return false;
  }
}

/**
 * Función para llamar desde el cliente (usando fetch)
 */
export async function saveHistoryBeforeResetClient(
  sessionId: string | null,
  workspaceId: string | null,
  history: Message[]
): Promise<boolean> {
  
  if (!sessionId || !workspaceId || !history || history.length === 0) {
    return false;
  }

  try {
    const response = await fetch('/api/save-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        workspaceId,
        history
      })
    });

    const result = await response.json();
    return result.success === true;
    
  } catch (error) {
    console.error('[ChatHistory] Error al guardar historial (cliente):', error);
    return false;
  }
}