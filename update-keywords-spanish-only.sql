-- Script para actualizar keywords SOLO EN ESPAÑOL según especificaciones del cliente
-- Ejecutar en Supabase SQL Editor

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
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'disponibilidad inmediata', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'disponible ahora', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'ahora mismo', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'de inmediato', 'hot', NULL),

-- Urgencia específica
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'necesito para mañana', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'es urgente', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'urgente', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'rapido', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'prisa', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'ya', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'hoy mismo', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'esta semana', 'hot', NULL),

-- Información de contacto voluntaria
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mi telefono', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mi numero', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mi email', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mi correo', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'contactarme', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'pueden llamarme', 'hot', NULL),

-- Formas de pago/financiamiento
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'formas de pago', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'como puedo pagar', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'financiamiento', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'credito', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'metodos de pago', 'hot', NULL),

-- Intención clara de compra
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'quiero comprar', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'como puedo adquirir', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'necesito comprar', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'voy a comprar', 'hot', NULL),

-- Keywords WARM SOLO EN ESPAÑOL
-- Preguntas específicas sobre productos/servicios
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'caracteristicas', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'especificaciones', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'detalles del producto', 'warm', NULL),

-- Interés en beneficios
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'beneficios', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'ventajas', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'que incluye', 'warm', NULL),

-- Comparaciones
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'comparar', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'diferencias', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mejor opcion', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cual es mejor', 'warm', NULL),

-- Precios sin cotización formal
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cuanto cuesta', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'precio', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'range de precios', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'precio aproximado', 'warm', NULL),

-- Solicitud de información adicional
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mas informacion', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'catalogo', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'folleto', 'warm', NULL),

-- Interés específico
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'me interesa', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'explicame', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'como funciona', 'warm', NULL),

-- Keywords COLD SOLO EN ESPAÑOL
-- Preguntas generales/informativas
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'que es', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'informacion general', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'solo pregunto', 'cold', NULL),

-- Exploración sin compromiso
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'solo navegando', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'explorando opciones', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'viendo que hay', 'cold', NULL),

-- Consultas de soporte
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'problema con', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'no funciona', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'soporte', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'ayuda con', 'cold', NULL),

-- Sin intención inmediata
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'tal vez', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'en el futuro', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'algun dia', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'quiza', 'cold', NULL),

-- Primera interacción básica
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'hola', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'buenos dias', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'informacion basica', 'cold', NULL)

ON CONFLICT (workspace_id, keyword, category) DO NOTHING;