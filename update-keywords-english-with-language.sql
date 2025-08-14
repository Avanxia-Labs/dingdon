-- Script para actualizar keywords SOLO EN INGLÉS con columna language
-- Ejecutar en Supabase SQL Editor DESPUÉS de ejecutar add-language-column.sql

-- Insertar nuevas keywords HOT SOLO EN INGLÉS
INSERT INTO lead_keywords (workspace_id, keyword, category, language, created_by) VALUES
-- Cotización/Presupuesto específico
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'quote', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'budget', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'estimate', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'need a quote', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'need budget', 'hot', 'en', NULL),

-- Disponibilidad inmediata
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'available now', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'immediate availability', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'right now', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'immediately', 'hot', 'en', NULL),

-- Urgencia específica
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'need it tomorrow', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'urgent', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'fast', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'quick', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'rush', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'asap', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'today', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'this week', 'hot', 'en', NULL),

-- Información de contacto voluntaria
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'my phone', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'my number', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'my email', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'contact me', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'call me', 'hot', 'en', NULL),

-- Formas de pago/financiamiento
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'payment options', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'how can i pay', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'financing', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'credit', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'payment methods', 'hot', 'en', NULL),

-- Intención clara de compra
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'want to buy', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'how can i buy', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'need to buy', 'hot', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'going to buy', 'hot', 'en', NULL),

-- Keywords WARM SOLO EN INGLÉS
-- Preguntas específicas sobre productos/servicios
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'features', 'warm', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'specifications', 'warm', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'product details', 'warm', 'en', NULL),

-- Interés en beneficios
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'benefits', 'warm', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'advantages', 'warm', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'what includes', 'warm', 'en', NULL),

-- Comparaciones
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'compare', 'warm', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'differences', 'warm', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'best option', 'warm', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'which is better', 'warm', 'en', NULL),

-- Precios sin cotización formal
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'how much does it cost', 'warm', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'price', 'warm', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'cost', 'warm', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'price range', 'warm', 'en', NULL),

-- Solicitud de información adicional
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'more information', 'warm', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'catalog', 'warm', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'brochure', 'warm', 'en', NULL),

-- Interés específico
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'interested', 'warm', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'tell me more', 'warm', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'how does it work', 'warm', 'en', NULL),

-- Keywords COLD SOLO EN INGLÉS
-- Preguntas generales/informativas
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'what is', 'cold', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'general info', 'cold', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'just asking', 'cold', 'en', NULL),

-- Exploración sin compromiso
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'just browsing', 'cold', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'exploring options', 'cold', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'looking around', 'cold', 'en', NULL),

-- Consultas de soporte
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'problem with', 'cold', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'not working', 'cold', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'support', 'cold', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'help with', 'cold', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'technical issue', 'cold', 'en', NULL),

-- Sin intención inmediata
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'maybe', 'cold', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'in the future', 'cold', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'someday', 'cold', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'perhaps', 'cold', 'en', NULL),

-- Primera interacción básica
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'hello', 'cold', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'good morning', 'cold', 'en', NULL),
('e524d0ba-1cb9-45bd-bc8c-726485474bcb', 'basic information', 'cold', 'en', NULL)

ON CONFLICT (workspace_id, keyword, category) DO NOTHING;