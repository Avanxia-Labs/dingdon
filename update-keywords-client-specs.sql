-- Script para actualizar keywords según especificaciones del cliente
-- Ejecutar en Supabase SQL Editor

-- Primero, eliminar las keywords existentes para tu workspace
DELETE FROM lead_keywords WHERE workspace_id = 'e524d0ba-1cb9-45bd-bc8c-726485474bcb';

-- Insertar nuevas keywords HOT según especificaciones del cliente
INSERT INTO lead_keywords (workspace_id, keyword, category, created_by) VALUES
-- Cotización/Presupuesto específico
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cotización', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cotizacion', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'presupuesto', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'quote', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'budget', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'quiero cotización', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'necesito presupuesto', 'hot', NULL),

-- Disponibilidad inmediata
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'disponibilidad inmediata', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'disponible ahora', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'available now', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'immediate availability', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'ahora mismo', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'de inmediato', 'hot', NULL),

-- Urgencia específica
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'necesito para mañana', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'es urgente', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'urgent', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'urgente', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'rápido', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'rapido', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'prisa', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'ya', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'hoy mismo', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'esta semana', 'hot', NULL),

-- Información de contacto voluntaria
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mi teléfono', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mi telefono', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mi número', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mi numero', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mi email', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mi correo', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'contactarme', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'pueden llamarme', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'call me', 'hot', NULL),

-- Formas de pago/financiamiento
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'formas de pago', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'como puedo pagar', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'financiamiento', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'financing', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'crédito', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'credito', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'payment options', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'métodos de pago', 'hot', NULL),

-- Intención clara de compra
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'quiero comprar', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'want to buy', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cómo puedo adquirir', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'como puedo adquirir', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'how can I buy', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'necesito comprar', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'voy a comprar', 'hot', NULL),

-- Keywords WARM según especificaciones del cliente
-- Preguntas específicas sobre productos/servicios
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'características', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'caracteristicas', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'features', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'especificaciones', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'specs', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'detalles del producto', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'product details', 'warm', NULL),

-- Interés en beneficios
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'beneficios', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'benefits', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'ventajas', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'advantages', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'qué incluye', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'que incluye', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'what includes', 'warm', NULL),

-- Comparaciones
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'comparar', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'compare', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'diferencias', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'differences', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'vs', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mejor opción', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mejor opcion', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'best option', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cuál es mejor', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cual es mejor', 'warm', NULL),

-- Precios sin cotización formal
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cuánto cuesta', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cuanto cuesta', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'precio', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'price', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cost', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'range de precios', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'precio aproximado', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'ballpark price', 'warm', NULL),

-- Solicitud de información adicional
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'más información', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'mas informacion', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'more information', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'catálogo', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'catalogo', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'catalog', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'brochure', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'folleto', 'warm', NULL),

-- Interés específico
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'me interesa', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'interested', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'tell me more', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'explícame', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'explicame', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'how does it work', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cómo funciona', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'como funciona', 'warm', NULL),

-- Keywords COLD según especificaciones del cliente
-- Preguntas generales/informativas
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'qué es', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'que es', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'what is', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'información general', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'informacion general', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'general info', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'solo pregunto', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'just asking', 'cold', NULL),

-- Exploración sin compromiso
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'solo navegando', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'just browsing', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'explorando opciones', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'exploring options', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'viendo qué hay', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'viendo que hay', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'looking around', 'cold', NULL),

-- Consultas de soporte
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'problema con', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'problem with', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'no funciona', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'not working', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'soporte', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'support', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'ayuda con', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'help with', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'technical issue', 'cold', NULL),

-- Sin intención inmediata
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'tal vez', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'maybe', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'en el futuro', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'in the future', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'someday', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'algún día', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'algun dia', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'quizá', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'quiza', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'perhaps', 'cold', NULL),

-- Primera interacción básica
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'hola', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'hello', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'buenos días', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'good morning', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'información básica', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'informacion basica', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'basic information', 'cold', NULL)

ON CONFLICT (workspace_id, keyword, category) DO NOTHING;