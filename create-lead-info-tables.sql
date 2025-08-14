-- Tabla para notas internas de los agentes en las sesiones de chat
CREATE TABLE IF NOT EXISTS chat_session_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR NOT NULL,
  workspace_id VARCHAR NOT NULL,
  agent_id VARCHAR NOT NULL,
  agent_name VARCHAR NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_chat_session_notes_session_id ON chat_session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_session_notes_workspace_id ON chat_session_notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chat_session_notes_created_at ON chat_session_notes(created_at);

-- NOTA: Las etiquetas se manejan en tiempo real por socket, no necesitan tabla persistente

-- Comentarios para documentación
COMMENT ON TABLE chat_session_notes IS 'Notas internas de los agentes para cada sesión de chat';

COMMENT ON COLUMN chat_session_notes.session_id IS 'ID de la sesión de chat';
COMMENT ON COLUMN chat_session_notes.workspace_id IS 'ID del workspace';
COMMENT ON COLUMN chat_session_notes.agent_id IS 'ID del agente que creó la nota';
COMMENT ON COLUMN chat_session_notes.agent_name IS 'Nombre del agente que creó la nota';
COMMENT ON COLUMN chat_session_notes.content IS 'Contenido de la nota';