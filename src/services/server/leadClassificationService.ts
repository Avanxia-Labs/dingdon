// src/services/server/leadClassificationService.ts

import { supabaseAdmin } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from '@/types/chatbot';

interface ClassificationResult {
  score: number;
  classification: 'HOT' | 'WARM' | 'COLD';
  reasoning: string;
  analysisDetails: {
    messageCount: number;
    conversationDuration: number;
    keywordsFound: string[];
    engagementLevel: string;
  };
}

interface LeadScoringConfig {
  enabled: boolean;
  scoring_rules: {
    keywords: {
      hot: string[];
      warm: string[];
      cold: string[];
    };
    engagement: {
      message_count_weight: number;
      question_count_weight: number;
      response_time_weight: number;
    };
  };
  hot_threshold: number;
  warm_threshold: number;
  ai_enabled: boolean;
  ai_model: string;
}

/**
 * Obtiene la configuración por defecto (sin base de datos)
 */
function getDefaultScoringConfig(): LeadScoringConfig {
  return {
    enabled: true, // Siempre habilitado
    scoring_rules: {
      keywords: {
        hot: [
          // Cotización/Presupuesto
          "cotizacion", "cotización", "presupuesto", "quote", "budget", "precio exacto",
          // Disponibilidad inmediata
          "disponibilidad", "inmediato", "availability", "ahora", "hoy", "ya",
          // Urgencia
          "urgente", "urgent", "mañana", "esta semana", "rapido", "rápido", "prisa",
          // Intención de compra
          "quiero comprar", "como comprar", "cómo comprar", "quiero adquirir", "want to buy", "adquirir",
          // Pago/Financiamiento  
          "formas de pago", "financiamiento", "payment", "financing", "credito", "crédito", "contado",
          // Información de contacto (indicadores)
          "mi numero", "mi número", "mi email", "mi telefono", "mi teléfono", "contactarme"
        ],
        warm: [
          // Preguntas específicas
          "caracteristicas", "características", "beneficios", "features", "funciona como", "incluye",
          // Comparaciones
          "diferencia", "comparar", "vs", "mejor opcion", "mejor opción", "compare", "options",
          // Precios sin cotización
          "cuanto cuesta", "cuánto cuesta", "precio", "cost", "range de precio", "aproximado",
          // Información adicional
          "mas informacion", "más información", "catalogo", "catálogo", "brochure", "detalles", "specs",
          // Interés específico
          "me interesa", "interested", "tell me more", "explain", "como funciona", "cómo funciona"
        ],
        cold: [
          // Consultas generales
          "solo pregunta", "just asking", "curiosidad", "exploring", "navegando", "viendo opciones",
          // Primera interacción básica
          "que es", "qué es", "what is", "general info", "informacion basica", "información básica",
          // Soporte técnico
          "problema con", "no funciona", "support", "ayuda con", "technical issue", "falla",
          // Sin compromiso
          "maybe", "tal vez", "quiza", "quizá", "futuro", "future", "eventually", "someday"
        ]
      },
      engagement: {
        message_count_weight: 2, // Reducido de 10 a 2
        question_count_weight: 5, // Reducido de 15 a 5  
        response_time_weight: 1 // Reducido de 5 a 1
      }
    },
    hot_threshold: 50, // Aumentado de 70 a 50 (necesita más keywords HOT)
    warm_threshold: 20, // Reducido de 40 a 20
    ai_enabled: true, // Usar IA por defecto
    ai_model: 'gemini-2.0-flash'
  };
}

/**
 * Análisis básico por reglas (sin IA)
 */
function analyzeByRules(history: Message[], config: LeadScoringConfig): ClassificationResult {
  const userMessages = history.filter(msg => msg.role === 'user');
  const conversationText = userMessages.map(msg => msg.content.toLowerCase()).join(' ');
  
  console.log('[DEBUG] Analyzing text:', conversationText);
  
  let score = 0;
  const keywordsFound: string[] = [];

  // Análisis de keywords
  config.scoring_rules.keywords.hot.forEach(keyword => {
    if (conversationText.includes(keyword.toLowerCase())) {
      score += 20;
      keywordsFound.push(keyword);
      console.log(`[DEBUG] Found HOT keyword: ${keyword}, score: ${score}`);
    }
  });

  config.scoring_rules.keywords.warm.forEach(keyword => {
    if (conversationText.includes(keyword.toLowerCase())) {
      score += 12;
      keywordsFound.push(keyword);
      console.log(`[DEBUG] Found WARM keyword: ${keyword}, score: ${score}`);
    }
  });

  config.scoring_rules.keywords.cold.forEach(keyword => {
    if (conversationText.includes(keyword.toLowerCase())) {
      score -= 15;
      keywordsFound.push(keyword);
      console.log(`[DEBUG] Found COLD keyword: ${keyword}, score: ${score}`);
    }
  });

  // Análisis de engagement basado en longitud de conversación
  const messageCount = userMessages.length;
  let engagementScore = 0;
  
  // Bonificación por conversación prolongada (WARM)
  if (messageCount >= 5) {
    engagementScore += 15; // Bonus por conversación larga (criterio WARM)
    console.log(`[DEBUG] Long conversation bonus: 15 points`);
  } else if (messageCount >= 3) {
    engagementScore += 5; // Conversación media
  }
  // Conversaciones muy cortas (<3 mensajes) son indicador de COLD (no suman)
  
  score += engagementScore;
  console.log(`[DEBUG] Engagement score: ${engagementScore}, total: ${score}`);

  // Preguntas del usuario (indicador de interés específico)
  const questionCount = userMessages.filter(msg => msg.content.includes('?')).length;
  const questionScore = Math.min(questionCount * config.scoring_rules.engagement.question_count_weight, 10);
  score += questionScore;
  console.log(`[DEBUG] Question score: ${questionScore}, total: ${score}`);

  // Limitar score entre 0-100
  const originalScore = score;
  score = Math.max(0, Math.min(100, score));
  console.log(`[DEBUG] Original score: ${originalScore}, final score: ${score}`);

  // Clasificación basada principalmente en keywords
  let classification: 'HOT' | 'WARM' | 'COLD';
  
  // Contar keywords por tipo
  const hotKeywords = keywordsFound.filter(keyword => 
    config.scoring_rules.keywords.hot.includes(keyword)).length;
  const warmKeywords = keywordsFound.filter(keyword => 
    config.scoring_rules.keywords.warm.includes(keyword)).length;
  const coldKeywords = keywordsFound.filter(keyword => 
    config.scoring_rules.keywords.cold.includes(keyword)).length;
    
  console.log(`[DEBUG] Keywords - HOT: ${hotKeywords}, WARM: ${warmKeywords}, COLD: ${coldKeywords}`);
  
  // Lógica de clasificación mejorada
  if (hotKeywords >= 2) {
    // Si tiene 2+ keywords HOT, es HOT sin importar el score
    classification = 'HOT';
  } else if (hotKeywords >= 1 && score >= 60) {
    // Si tiene 1 keyword HOT y score alto, es HOT
    classification = 'HOT';
  } else if (warmKeywords >= 2 && hotKeywords === 0) {
    // Si tiene 2+ keywords WARM y ninguna HOT, es WARM
    classification = 'WARM';
  } else if (coldKeywords >= 2) {
    // Si tiene 2+ keywords COLD, es COLD
    classification = 'COLD';
  } else {
    // Fallback al sistema de score original
    if (score >= config.hot_threshold) {
      classification = 'HOT';
    } else if (score >= config.warm_threshold) {
      classification = 'WARM';
    } else {
      classification = 'COLD';
    }
  }
  
  console.log(`[DEBUG] Final classification: ${classification}`);

  return {
    score,
    classification,
    reasoning: `Análisis basado en reglas: ${keywordsFound.length} keywords encontradas, ${messageCount} mensajes`,
    analysisDetails: {
      messageCount,
      conversationDuration: 0,
      keywordsFound,
      engagementLevel: messageCount > 5 ? 'Alto' : messageCount > 2 ? 'Medio' : 'Bajo'
    }
  };
}

/**
 * Genera el prompt para clasificación con IA
 */
function generateClassificationPrompt(history: Message[], language: string = 'es'): string {
  const conversationHistory = history.map(msg => {
    if (msg.role === 'user') return `Usuario: ${msg.content}`;
    if (msg.role === 'assistant') return `Bot: ${msg.content}`;
    if (msg.role === 'agent') return `Agente: ${msg.content}`;
    return '';
  }).filter(Boolean).join('\n');

  const promptInstructions = {
    es: `Eres un experto en análisis de leads y clasificación de clientes potenciales. 
    
Analiza la siguiente conversación de chat y clasifica al cliente potencial en una de estas categorías:

**CALIENTE (HOT) - 70-100 puntos:**
- Intención clara de compra inmediata
- Solicita precios, cotizaciones, presupuestos
- Palabras como: "comprar", "contratar", "precio", "cotizar", "urgente"
- Alto engagement, muchas preguntas específicas
- Disponibilidad inmediata para proceder

**TIBIO (WARM) - 40-69 puntos:**
- Interés genuino pero sin urgencia inmediata
- Solicita información, demos, pruebas
- Palabras como: "interesado", "información", "demo", "futuro"
- Engagement moderado, algunas preguntas
- Necesita más nurturing antes de decidir

**FRÍO (COLD) - 0-39 puntos:**
- Consulta general o exploratoria
- Sin intención de compra aparente
- Palabras como: "solo pregunta", "comparar", "tal vez"
- Bajo engagement, pocas preguntas
- No muestra urgencia o compromiso

RESPONDE ÚNICAMENTE en este formato JSON:
{
  "score": [número del 0-100],
  "classification": "[HOT/WARM/COLD]",
  "reasoning": "[breve explicación de 1-2 líneas]"
}`,
    en: `You are an expert in lead analysis and potential customer classification.
    
Analyze the following chat conversation and classify the potential customer into one of these categories:

**HOT - 70-100 points:**
- Clear intention to buy immediately
- Requests prices, quotes, budgets
- Keywords: "buy", "hire", "price", "quote", "urgent"
- High engagement, many specific questions
- Immediate availability to proceed

**WARM - 40-69 points:**
- Genuine interest but no immediate urgency
- Requests information, demos, trials
- Keywords: "interested", "information", "demo", "future"
- Moderate engagement, some questions
- Needs more nurturing before deciding

**COLD - 0-39 points:**
- General or exploratory inquiry
- No apparent purchase intention
- Keywords: "just asking", "compare", "maybe"
- Low engagement, few questions
- Shows no urgency or commitment

RESPOND ONLY in this JSON format:
{
  "score": [number 0-100],
  "classification": "[HOT/WARM/COLD]",
  "reasoning": "[brief explanation in 1-2 lines]"
}`
  };

  const instruction = promptInstructions[language as keyof typeof promptInstructions] || promptInstructions.es;

  return `${instruction}

--- CONVERSACIÓN A ANALIZAR ---
${conversationHistory}
--- FIN CONVERSACIÓN ---

Análisis JSON:`;
}

/**
 * Análisis con IA usando el mismo patrón que chatbot-service-backend
 */
async function analyzeWithAI(history: Message[], config: LeadScoringConfig, workspaceId: string): Promise<ClassificationResult> {
  const prompt = generateClassificationPrompt(history);

  try {
    // Determinar qué clave API usar (mismo patrón que chatbot-service-backend)
    let apiKey: string | undefined = process.env.GEMINI_API_KEY_DEFAULT;

    if (!apiKey) {
      throw new Error(`API Key not found for lead classification`);
    }

    // Usar Gemini (mismo patrón que el chatbot)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: config.ai_model });
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    // Parsear respuesta JSON
    const aiResult = JSON.parse(response);

    const userMessages = history.filter(msg => msg.role === 'user');
    
    return {
      score: aiResult.score,
      classification: aiResult.classification,
      reasoning: aiResult.reasoning,
      analysisDetails: {
        messageCount: userMessages.length,
        conversationDuration: 0,
        keywordsFound: [],
        engagementLevel: 'AI Analysis'
      }
    };

  } catch (error) {
    console.error('Error en análisis con IA:', error);
    // Fallback a análisis por reglas
    console.log('Fallback a análisis por reglas...');
    return analyzeByRules(history, config);
  }
}

/**
 * Función principal de clasificación
 */
async function classifyLead(workspaceId: string, chatSessionId: string): Promise<ClassificationResult | null> {
  console.log(`[Lead Classification] Iniciando análisis para chat ${chatSessionId} en workspace ${workspaceId}`);

  try {
    // 1. Usar configuración por defecto (sin base de datos)
    const config = getDefaultScoringConfig();

    // 2. Obtener historial del chat
    const { data: chatSession, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('history')
      .eq('id', chatSessionId)
      .single();

    if (error || !chatSession?.history) {
      console.error(`Error obteniendo historial de chat ${chatSessionId}:`, error);
      return null;
    }

    const history = chatSession.history as Message[];
    if (history.length === 0) {
      console.log(`[Lead Classification] Sin mensajes para analizar en chat ${chatSessionId}`);
      return null;
    }

    // 3. Realizar análisis
    let result: ClassificationResult;
    if (config.ai_enabled) {
      console.log(`[Lead Classification] Usando IA para análisis`);
      result = await analyzeWithAI(history, config, workspaceId);
    } else {
      console.log(`[Lead Classification] Usando reglas para análisis`);
      result = analyzeByRules(history, config);
    }

    // 4. NO guardamos en base de datos - solo devolvemos el resultado en memoria

    console.log(`[Lead Classification] Clasificación completada: ${result.classification} (${result.score})`);
    return result;

  } catch (error) {
    console.error(`[Lead Classification] Error en clasificación:`, error);
    return null;
  }
}

export const leadClassificationService = {
  classifyLead,
  analyzeByRules,
  analyzeWithAI,
  generateClassificationPrompt
};