-- Script para actualizar keywords SOLO EN INGLÉS según especificaciones del cliente
-- Ejecutar en Supabase SQL Editor

-- Primero, eliminar las keywords existentes para tu workspace
DELETE FROM lead_keywords WHERE workspace_id = 'e524d0ba-1cb9-45bd-bc8c-726485474bcb';

-- Insertar nuevas keywords HOT SOLO EN INGLÉS
INSERT INTO lead_keywords (workspace_id, keyword, category, created_by) VALUES
-- Cotización/Presupuesto específico
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'quote', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'budget', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'estimate', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'need a quote', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'need budget', 'hot', NULL),

-- Disponibilidad inmediata
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'available now', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'immediate availability', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'right now', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'immediately', 'hot', NULL),

-- Urgencia específica
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'need it tomorrow', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'urgent', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'fast', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'quick', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'rush', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'asap', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'today', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'this week', 'hot', NULL),

-- Información de contacto voluntaria
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'my phone', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'my number', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'my email', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'contact me', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'call me', 'hot', NULL),

-- Formas de pago/financiamiento
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'payment options', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'how can i pay', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'financing', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'credit', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'payment methods', 'hot', NULL),

-- Intención clara de compra
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'want to buy', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'how can i buy', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'need to buy', 'hot', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'going to buy', 'hot', NULL),

-- Keywords WARM SOLO EN INGLÉS
-- Preguntas específicas sobre productos/servicios
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'features', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'specifications', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'product details', 'warm', NULL),

-- Interés en beneficios
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'benefits', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'advantages', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'what includes', 'warm', NULL),

-- Comparaciones
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'compare', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'differences', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'best option', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'which is better', 'warm', NULL),

-- Precios sin cotización formal
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'how much does it cost', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'price', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cost', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'price range', 'warm', NULL),

-- Solicitud de información adicional
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'more information', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'catalog', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'brochure', 'warm', NULL),

-- Interés específico
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'interested', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'tell me more', 'warm', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'how does it work', 'warm', NULL),

-- Keywords COLD SOLO EN INGLÉS
-- Preguntas generales/informativas
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'what is', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'general info', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'just asking', 'cold', NULL),

-- Exploración sin compromiso
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'just browsing', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'exploring options', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'looking around', 'cold', NULL),

-- Consultas de soporte
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'problem with', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'not working', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'support', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'help with', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'technical issue', 'cold', NULL),

-- Sin intención inmediata
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'maybe', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'in the future', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'someday', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'perhaps', 'cold', NULL),

-- Primera interacción básica
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'hello', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'good morning', 'cold', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'basic information', 'cold', NULL)

ON CONFLICT (workspace_id, keyword, category) DO NOTHING;