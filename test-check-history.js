// Script para verificar si el historial se guardó en la base de datos
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSavedHistory() {
  console.log('🔍 Buscando historial guardado en la base de datos...\n');

  try {
    // Buscar todas las sesiones guardadas para el workspace de prueba
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('workspace_id', 'e524d0ba-1cb9-45bd-bc8c-726485474bcb')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error al consultar la base de datos:', error.message);
      return;
    }

    if (!sessions || sessions.length === 0) {
      console.log('📭 No se encontraron sesiones guardadas para este workspace.');
      console.log('ℹ️  Esto es normal - el historial solo se guarda cuando:');
      console.log('   - Han pasado 24 horas de inactividad');
      console.log('   - Se cambia de workspace');
      console.log('   - Se hace clic en "Start New Chat"');
      return;
    }

    console.log(`📝 Se encontraron ${sessions.length} sesión(es) guardada(s):\n`);

    sessions.forEach((session, index) => {
      console.log(`Session ${index + 1}:`);
      console.log(`  📧 ID: ${session.id}`);
      console.log(`  🏢 Workspace: ${session.workspace_id}`);
      console.log(`  👤 Agente: ${session.assigned_agent_id || 'BOT (NULL)'}`);
      console.log(`  📊 Status: ${session.status}`);
      console.log(`  📅 Creado: ${session.created_at}`);
      console.log(`  ⏰ Terminado: ${session.ended_at || 'N/A'}`);
      
      if (session.history && session.history.length > 0) {
        console.log(`  💬 Mensajes: ${session.history.length}`);
        console.log(`  📜 Último mensaje: "${session.history[session.history.length - 1]?.content?.substring(0, 50)}..."`);
      } else {
        console.log(`  💬 Mensajes: Sin historial`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

// Ejecutar
checkSavedHistory().then(() => {
  process.exit(0);
});