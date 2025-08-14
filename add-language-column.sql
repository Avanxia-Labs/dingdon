-- Script para agregar columna 'language' a la tabla lead_keywords
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar la columna language
ALTER TABLE lead_keywords ADD COLUMN language VARCHAR(2) DEFAULT 'es';

-- 2. Crear índice para mejorar performance de consultas por idioma
CREATE INDEX IF NOT EXISTS idx_lead_keywords_language ON lead_keywords(language);

-- 3. Crear índice compuesto para consultas comunes
CREATE INDEX IF NOT EXISTS idx_lead_keywords_workspace_language_category 
ON lead_keywords(workspace_id, language, category);

-- 4. Actualizar las keywords existentes basándose en el contenido
-- Detectar keywords en inglés y marcarlas como 'en'
UPDATE lead_keywords 
SET language = 'en' 
WHERE keyword IN (
    'quote', 'budget', 'estimate', 'need a quote', 'need budget',
    'available now', 'immediate availability', 'right now', 'immediately',
    'need it tomorrow', 'urgent', 'fast', 'quick', 'rush', 'asap', 'today', 'this week',
    'my phone', 'my number', 'my email', 'contact me', 'call me',
    'payment options', 'how can i pay', 'financing', 'credit', 'payment methods',
    'want to buy', 'how can i buy', 'need to buy', 'going to buy',
    'features', 'specifications', 'product details',
    'benefits', 'advantages', 'what includes',
    'compare', 'differences', 'best option', 'which is better',
    'how much does it cost', 'price', 'cost', 'price range',
    'more information', 'catalog', 'brochure',
    'interested', 'tell me more', 'how does it work',
    'what is', 'general info', 'just asking',
    'just browsing', 'exploring options', 'looking around',
    'problem with', 'not working', 'support', 'help with', 'technical issue',
    'maybe', 'in the future', 'someday', 'perhaps',
    'hello', 'good morning', 'basic information'
);

-- 5. Las demás keywords ya quedan como 'es' (valor por defecto)

-- 6. Verificar los resultados
SELECT language, category, COUNT(*) as count 
FROM lead_keywords 
WHERE workspace_id = 'e524d0ba-1cb9-45bd-bc8c-726485474bcb'
GROUP BY language, category 
ORDER BY language, category;