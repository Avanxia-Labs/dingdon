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
 * Detecta el idioma predominante de una conversación
 */
function detectConversationLanguage(history: Message[]): 'es' | 'en' {
  const userMessages = history.filter(msg => msg.role === 'user');
  const conversationText = userMessages.map(msg => msg.content.toLowerCase()).join(' ');
  
  const spanishWords = [
    'hola', 'como', 'que', 'el', 'la', 'los', 'las', 'de', 'en', 'con', 'por', 'para',
    'es', 'son', 'esta', 'esta', 'tengo', 'quiero', 'necesito', 'puedo', 'donde',
    'cuando', 'porque', 'si', 'no', 'tambien', 'muy', 'mas', 'menos', 'sobre',
    'hasta', 'desde', 'entre', 'sin', 'tras', 'durante', 'mediante', 'según'
  ];

  const englishWords = [
    'hello', 'how', 'what', 'the', 'of', 'to', 'and', 'a', 'in', 'is', 'it',
    'you', 'that', 'he', 'was', 'for', 'on', 'are', 'as', 'with', 'his',
    'they', 'i', 'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had',
    'by', 'word', 'but', 'not', 'what', 'all', 'were', 'we', 'when', 'your'
  ];

  const spanishMatches = spanishWords.filter(word => 
    conversationText.includes(word)
  ).length;
  
  const englishMatches = englishWords.filter(word => 
    conversationText.includes(word)
  ).length;

  console.log(`[LANGUAGE] Detected - Spanish matches: ${spanishMatches}, English matches: ${englishMatches}`);
  
  return spanishMatches > englishMatches ? 'es' : 'en';
}

/**
 * Obtiene la configuración de keywords desde la base de datos
 */
async function getScoringConfigFromDB(workspaceId: string, language?: 'es' | 'en'): Promise<LeadScoringConfig> {
  try {
    // Construir query con filtro por idioma si se especifica
    let query = supabaseAdmin
      .from('lead_keywords')
      .select('keyword, category, language')
      .eq('workspace_id', workspaceId)
      .order('category', { ascending: true });

    // Filtrar por idioma usando la columna language
    if (language) {
      query = query.eq('language', language);
    }

    const { data: keywords, error } = await query;

    if (error) {
      console.error('Error obteniendo keywords de BD:', error);
      return getDefaultScoringConfig(language);
    }

    // Si no hay keywords, usar por defecto
    if (!keywords || keywords.length === 0) {
      console.log(`[KEYWORDS] No keywords found in DB for language ${language || 'all'}, using defaults`);
      return getDefaultScoringConfig(language);
    }

    // Organizar keywords por categoría
    const keywordsByCategory = {
      hot: keywords.filter(k => k.category === 'hot').map(k => k.keyword),
      warm: keywords.filter(k => k.category === 'warm').map(k => k.keyword),
      cold: keywords.filter(k => k.category === 'cold').map(k => k.keyword)
    };

    console.log(`[KEYWORDS] Loaded from DB for language ${language || 'all'} - Hot: ${keywordsByCategory.hot.length}, Warm: ${keywordsByCategory.warm.length}, Cold: ${keywordsByCategory.cold.length}`);

    return {
      enabled: true,
      scoring_rules: {
        keywords: keywordsByCategory,
        engagement: {
          message_count_weight: 2,
          question_count_weight: 5,
          response_time_weight: 1
        }
      },
      hot_threshold: 50,
      warm_threshold: 20,
      ai_enabled: true,
      ai_model: 'gemini-2.0-flash'
    };

  } catch (error) {
    console.error('Error en getScoringConfigFromDB:', error);
    return getDefaultScoringConfig(language);
  }
}

/**
 * Obtiene la configuración por defecto (fallback) con keywords separadas por idioma
 */
function getDefaultScoringConfig(language: 'es' | 'en' = 'es'): LeadScoringConfig {
  // Keywords por defecto separadas por idioma - sin repetidas
  const defaultKeywords = {
    es: {
      hot: [
        // Cotización/Presupuesto específico
        "cotización", "cotizacion", "presupuesto", "quiero cotización", "necesito presupuesto",
        
        // Disponibilidad inmediata
        "disponibilidad inmediata", "disponible ahora", "ahora mismo", "de inmediato",
        
        // Urgencia específica
        "necesito para mañana", "es urgente", "urgente", "rápido", "rapido", "prisa", "ya", "hoy mismo", "esta semana",
        
        // Información de contacto voluntaria
        "mi teléfono", "mi telefono", "mi número", "mi numero", "mi email", "mi correo", "contactarme", "pueden llamarme",
        
        // Formas de pago/financiamiento
        "formas de pago", "como puedo pagar", "financiamiento", "crédito", "credito", "métodos de pago",
        
        // Intención clara de compra
        "quiero comprar", "cómo puedo adquirir", "como puedo adquirir", "necesito comprar", "voy a comprar"
      ],
      warm: [
        // Preguntas específicas sobre productos/servicios
        "características", "caracteristicas", "especificaciones", "detalles del producto",
        
        // Interés en beneficios
        "beneficios", "ventajas", "qué incluye", "que incluye",
        
        // Comparaciones
        "comparar", "diferencias", "mejor opción", "mejor opcion", "cuál es mejor", "cual es mejor",
        
        // Precios sin cotización formal
        "cuánto cuesta", "cuanto cuesta", "precio", "range de precios", "precio aproximado",
        
        // Solicitud de información adicional
        "más información", "mas informacion", "catálogo", "catalogo", "folleto",
        
        // Interés específico
        "me interesa", "explícame", "explicame", "cómo funciona", "como funciona"
      ],
      cold: [
        // Preguntas generales/informativas
        "qué es", "que es", "información general", "informacion general", "solo pregunto",
        
        // Exploración sin compromiso
        "solo navegando", "explorando opciones", "viendo qué hay", "viendo que hay",
        
        // Consultas de soporte
        "problema con", "no funciona", "soporte", "ayuda con",
        
        // Sin intención inmediata
        "tal vez", "en el futuro", "algún día", "algun dia", "quizá", "quiza",
        
        // Primera interacción básica
        "hola", "buenos días", "información básica", "informacion basica"
      ]
    },
    en: {
      hot: [
        // Cotización/Presupuesto específico
        "quote", "budget", "quotation", "estimate", "need a quote", "need budget",
        
        // Disponibilidad inmediata
        "available now", "immediate availability", "right now", "immediately",
        
        // Urgencia específica
        "need it tomorrow", "it's urgent", "urgent", "fast", "quick", "rush", "asap", "today", "this week",
        
        // Información de contacto voluntaria
        "my phone", "my number", "my email", "contact me", "you can call me", "call me",
        
        // Formas de pago/financiamiento
        "payment options", "how can I pay", "financing", "credit", "payment methods",
        
        // Intención clara de compra
        "want to buy", "how can I acquire", "how can I buy", "need to buy", "going to buy"
      ],
      warm: [
        // Preguntas específicas sobre productos/servicios
        "features", "specifications", "specs", "product details",
        
        // Interés en beneficios
        "benefits", "advantages", "what includes",
        
        // Comparaciones
        "compare", "differences", "vs", "best option", "which is better",
        
        // Precios sin cotización formal
        "how much does it cost", "price", "cost", "price range", "ballpark price",
        
        // Solicitud de información adicional
        "more information", "catalog", "brochure",
        
        // Interés específico
        "interested", "tell me more", "explain", "how does it work"
      ],
      cold: [
        // Preguntas generales/informativas
        "what is", "general info", "just asking",
        
        // Exploración sin compromiso
        "just browsing", "exploring options", "looking around",
        
        // Consultas de soporte
        "problem with", "not working", "support", "help with", "technical issue",
        
        // Sin intención inmediata
        "maybe", "in the future", "someday", "perhaps",
        
        // Primera interacción básica
        "hello", "good morning", "basic information"
      ]
    }
  };

  // Usar keywords del idioma especificado
  const keywords = defaultKeywords[language];

  return {
    enabled: true, // Siempre habilitado
    scoring_rules: {
      keywords: keywords,
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

  // Análisis de engagement basado en longitud de conversación según especificaciones del cliente
  const messageCount = userMessages.length;
  let engagementScore = 0;
  
  // Criterios específicos del cliente:
  if (messageCount > 5) {
    // Interacción prolongada (más de 5 mensajes intercambiados) = WARM
    engagementScore += 20; // Bonus por conversación larga (criterio WARM específico)
    console.log(`[DEBUG] Prolonged interaction bonus (>5 messages): 20 points`);
  } else if (messageCount >= 3) {
    // Conversación media (3-5 mensajes)
    engagementScore += 8; 
  } else {
    // Interacción muy breve (menos de 3 mensajes) = COLD según cliente
    engagementScore -= 10; // Penalización por conversación muy corta (criterio COLD específico)
    console.log(`[DEBUG] Brief interaction penalty (<3 messages): -10 points`);
  }
  
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
    
Analiza la siguiente conversación de chat y clasifica al cliente potencial según estos criterios específicos:

**CALIENTE (HOT) - 70-100 puntos:**
- Solicitó específicamente una cotización o presupuesto
- Preguntó sobre disponibilidad inmediata
- Mencionó urgencia ("necesito para mañana", "es urgente")
- Proporcionó información de contacto voluntariamente
- Preguntó sobre formas de pago o financiamiento
- Expresó intención clara de compra ("quiero comprar", "cómo puedo adquirir")

**TIBIO (WARM) - 40-69 puntos:**
- Hizo preguntas específicas sobre productos/servicios
- Mostró interés en características o beneficios
- Comparó opciones o modelos
- Preguntó sobre precios sin solicitar cotización formal
- Interacción prolongada (más de 5 mensajes intercambiados)
- Solicitó información adicional o catálogos

**FRÍO (COLD) - 0-39 puntos:**
- Preguntas generales o informativas
- Primera interacción sin señales de compra
- Solo navegando o explorando opciones
- Consultas de soporte sobre productos ya adquiridos
- Interacción muy breve (menos de 3 mensajes)

RESPONDE ÚNICAMENTE en este formato JSON:
{
  "score": [número del 0-100],
  "classification": "[HOT/WARM/COLD]",
  "reasoning": "[breve explicación de 1-2 líneas]"
}`,
    en: `You are an expert in lead analysis and potential customer classification.
    
Analyze the following chat conversation and classify the potential customer according to these specific criteria:

**HOT - 70-100 points:**
- Specifically requested a quote or budget
- Asked about immediate availability
- Mentioned urgency ("need it tomorrow", "it's urgent")
- Voluntarily provided contact information
- Asked about payment methods or financing
- Expressed clear purchase intention ("want to buy", "how can I acquire")

**WARM - 40-69 points:**
- Asked specific questions about products/services
- Showed interest in features or benefits
- Compared options or models
- Asked about prices without requesting formal quote
- Prolonged interaction (more than 5 exchanged messages)
- Requested additional information or catalogs

**COLD - 0-39 points:**
- General or informative questions
- First interaction without purchase signals
- Just browsing or exploring options
- Support inquiries about already purchased products
- Very brief interaction (less than 3 messages)

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
    // 1. Obtener historial del chat primero para detectar idioma
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

    // 2. Detectar idioma de la conversación
    const detectedLanguage = detectConversationLanguage(history);
    console.log(`[Lead Classification] Idioma detectado: ${detectedLanguage}`);

    // 3. Obtener configuración desde la base de datos con idioma detectado
    const config = await getScoringConfigFromDB(workspaceId, detectedLanguage);

    // 4. Realizar análisis
    let result: ClassificationResult;
    if (config.ai_enabled) {
      console.log(`[Lead Classification] Usando IA para análisis con idioma ${detectedLanguage}`);
      result = await analyzeWithAI(history, config, workspaceId);
    } else {
      console.log(`[Lead Classification] Usando reglas para análisis con idioma ${detectedLanguage}`);
      result = analyzeByRules(history, config);
    }

    // 5. NO guardamos en base de datos - solo devolvemos el resultado en memoria

    console.log(`[Lead Classification] Clasificación completada: ${result.classification} (${result.score}) con keywords en ${detectedLanguage}`);
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