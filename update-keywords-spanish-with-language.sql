-- Script para actualizar keywords SOLO EN ESPAÑOL con columna language
-- Ejecutar en Supabase SQL Editor DESPUÉS de ejecutar add-language-column.sql

-- Primero, eliminar las keywords existentes para tu workspace
DELETE FROM lead_keywords WHERE workspace_id = 'e524d0ba-1cb9-45bd-bc8c-726485474bcb';

-- Insertar nuevas keywords HOT SOLO EN ESPAÑOL
INSERT INTO lead_keywords (workspace_id, keyword, category, language, created_by) VALUES
-- Cotización/Presupuesto específico
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cotizacion', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'presupuesto', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'quiero cotizacion', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'necesito presupuesto', 'hot', 'es', NULL),

-- Disponibilidad inmediata
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'disponibilidad inmediata', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'disponible ahora', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'ahora mismo', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'de inmediato', 'hot', 'es', NULL),

-- Urgencia específica
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'necesito para mañana', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'es urgente', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'urgente', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'rapido', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'prisa', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'ya', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'hoy mismo', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'esta semana', 'hot', 'es', NULL),

-- Información de contacto voluntaria
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mi telefono', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mi numero', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mi email', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mi correo', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'contactarme', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'pueden llamarme', 'hot', 'es', NULL),

-- Formas de pago/financiamiento
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'formas de pago', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'como puedo pagar', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'financiamiento', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'credito', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'metodos de pago', 'hot', 'es', NULL),

-- Intención clara de compra
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'quiero comprar', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'como puedo adquirir', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'necesito comprar', 'hot', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'voy a comprar', 'hot', 'es', NULL),

-- Keywords WARM SOLO EN ESPAÑOL
-- Preguntas específicas sobre productos/servicios
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'caracteristicas', 'warm', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'especificaciones', 'warm', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'detalles del producto', 'warm', 'es', NULL),

-- Interés en beneficios
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'beneficios', 'warm', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'ventajas', 'warm', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'que incluye', 'warm', 'es', NULL),

-- Comparaciones
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'comparar', 'warm', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'diferencias', 'warm', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mejor opcion', 'warm', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cual es mejor', 'warm', 'es', NULL),

-- Precios sin cotización formal
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cuanto cuesta', 'warm', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'precio', 'warm', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'range de precios', 'warm', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'precio aproximado', 'warm', 'es', NULL),

-- Solicitud de información adicional
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mas informacion', 'warm', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'catalogo', 'warm', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'folleto', 'warm', 'es', NULL),

-- Interés específico
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'me interesa', 'warm', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'explicame', 'warm', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'como funciona', 'warm', 'es', NULL),

-- Keywords COLD SOLO EN ESPAÑOL
-- Preguntas generales/informativas
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'que es', 'cold', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'informacion general', 'cold', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'solo pregunto', 'cold', 'es', NULL),

-- Exploración sin compromiso
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'solo navegando', 'cold', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'explorando opciones', 'cold', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'viendo que hay', 'cold', 'es', NULL),

-- Consultas de soporte
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'problema con', 'cold', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'no funciona', 'cold', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'soporte', 'cold', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'ayuda con', 'cold', 'es', NULL),

-- Sin intención inmediata
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'tal vez', 'cold', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'en el futuro', 'cold', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'algun dia', 'cold', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'quiza', 'cold', 'es', NULL),

-- Primera interacción básica
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'hola', 'cold', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'buenos dias', 'cold', 'es', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'informacion basica', 'cold', 'es', NULL)

ON CONFLICT (workspace_id, keyword, category) DO NOTHING;