-- Script para agregar la columna transfer_info a la tabla chat_sessions

-- Verificar si la columna existe
DO $$
BEGIN
    -- Intentar agregar la columna si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chat_sessions' 
        AND column_name = 'transfer_info'
    ) THEN
        -- Agregar la columna como JSONB para almacenar información de transferencia
        ALTER TABLE chat_sessions 
        ADD COLUMN transfer_info JSONB DEFAULT NULL;
        
        RAISE NOTICE 'Columna transfer_info agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna transfer_info ya existe';
    END IF;
END $$;

-- Verificar la estructura actual de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'chat_sessions'
ORDER BY ordinal_position;