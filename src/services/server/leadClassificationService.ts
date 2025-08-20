// src/services/server/leadClassificationService.ts

import { supabaseAdmin } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from '@/types/chatbot';
import axios from 'axios';

interface ClassificationResult {
  chatSessionId: string;
  score: number;
  classification: 'HOT' | 'WARM' | 'COLD';
  reasoning: string;
  createdAt: string;
  messageCount: number;
}

// Detecta idioma basado en palabras comunes
function detectLanguage(history: Message[]): 'es' | 'en' {
  const text = history.filter(m => m.role === 'user').map(m => m.content.toLowerCase()).join(' ');
  const esWords = ['hola', 'como', 'que', 'el', 'la', 'es', 'quiero', 'necesito'];
  const enWords = ['hello', 'how', 'what', 'the', 'of', 'to', 'you', 'have'];
  
  const esCount = esWords.filter(w => text.includes(w)).length;
  const enCount = enWords.filter(w => text.includes(w)).length;
  
  return esCount > enCount ? 'es' : 'en';
}

// Carga keywords desde BD
async function loadKeywords(workspaceId: string, language: string) {
  const { data, error } = await supabaseAdmin
    .from('lead_keywords')
    .select('keyword, category')
    .eq('workspace_id', workspaceId)
    .eq('language', language);

  if (error || !data) return { hot: [], warm: [], cold: [] };

  return {
    hot: data.filter(k => k.category === 'hot').map(k => k.keyword),
    warm: data.filter(k => k.category === 'warm').map(k => k.keyword),
    cold: data.filter(k => k.category === 'cold').map(k => k.keyword)
  };
}

// Configuración de workspace con modelo de IA
interface WorkspaceAIConfig {
  ai_model: string;
  ai_api_key_name: string | null;
}

// Carga configuración del workspace
async function loadConfig(workspaceId: string): Promise<WorkspaceAIConfig | null> {
  const { data, error } = await supabaseAdmin
    .from('workspaces')
    .select('ai_model, ai_api_key_name')
    .eq('id', workspaceId)
    .single();

  if (error || !data) {
    console.error(`Error loading workspace config for ${workspaceId}:`, error);
    return null;
  }

  return {
    ai_model: data.ai_model || 'gemini-2.0-flash',
    ai_api_key_name: data.ai_api_key_name
  };
}

// Análisis por reglas con keywords
function analyzeByRules(history: Message[], keywords: any, language: string) {
  const userMessages = history.filter(m => m.role === 'user');
  const text = userMessages.map(m => m.content.toLowerCase()).join(' ');
  
  let score = 0;
  const found: string[] = [];

  // Keywords scoring
  keywords.hot.forEach((k: string) => {
    if (text.includes(k.toLowerCase())) { score += 30; found.push(`HOT: ${k}`); }
  });
  keywords.warm.forEach((k: string) => {
    if (text.includes(k.toLowerCase())) { score += 15; found.push(`WARM: ${k}`); }
  });
  keywords.cold.forEach((k: string) => {
    if (text.includes(k.toLowerCase())) { score -= 10; found.push(`COLD: ${k}`); }
  });

  // Engagement bonuses
  if (userMessages.length >= 5) score += 10;
  if (userMessages.some(m => m.content.includes('?'))) score += 5;
  if (userMessages.length < 3) score -= 10;

  // Generate reasoning
  const hotCount = found.filter(f => f.startsWith('HOT')).length;
  const warmCount = found.filter(f => f.startsWith('WARM')).length;
  const coldCount = found.filter(f => f.startsWith('COLD')).length;
  
  let reasoning = '';
  
  if (language === 'es') {
    if (hotCount > 0) reasoning += `${hotCount} señales de compra inmediata. `;
    if (warmCount > 0) reasoning += `${warmCount} indicadores de consideración. `;
    if (coldCount > 0) reasoning += `${coldCount} señales de exploración. `;
    if (!found.length) reasoning = 'Sin keywords específicas detectadas. ';
    
    const engagement = [];
    if (userMessages.length >= 5) engagement.push('conversación extensa');
    if (userMessages.some(m => m.content.includes('?'))) engagement.push('hace preguntas');
    if (userMessages.length < 3) engagement.push('interacción limitada');
    
    if (engagement.length) reasoning += `Características: ${engagement.join(', ')}. `;
    reasoning += `Recomendación: ${score >= 60 ? 'Seguimiento prioritario' : score >= 30 ? 'Seguimiento regular' : 'Nutrición de lead'}.`;
  } else {
    // English version
    if (hotCount > 0) reasoning += `${hotCount} immediate buying signals. `;
    if (warmCount > 0) reasoning += `${warmCount} consideration indicators. `;
    if (coldCount > 0) reasoning += `${coldCount} exploration signals. `;
    if (!found.length) reasoning = 'No specific keywords detected. ';
    
    const engagement = [];
    if (userMessages.length >= 5) engagement.push('extensive conversation');
    if (userMessages.some(m => m.content.includes('?'))) engagement.push('asks questions');
    if (userMessages.length < 3) engagement.push('limited interaction');
    
    if (engagement.length) reasoning += `Characteristics: ${engagement.join(', ')}. `;
    reasoning += `Recommendation: ${score >= 60 ? 'Priority follow-up' : score >= 30 ? 'Regular follow-up' : 'Lead nurturing'}.`;
  }

  return { score: Math.max(0, score), reasoning };
}

// --- FUNCIONES ESPECÍFICAS PARA CADA PROVEEDOR DE IA ---
async function generateGeminiAnalysis(prompt: string, apiKey: string, modelName: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function generateKimiAnalysis(prompt: string, apiKey: string, modelName: string) {
  const response = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
    model: modelName,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  });
  return response.data.choices[0].message.content.trim();
}

// Análisis con IA - Dinámico por modelo
async function analyzeWithAI(history: Message[], language: string, config: WorkspaceAIConfig) {
  try {
    // 1. Determinar qué clave API usar
    let apiKey: string | undefined;
    if (config.ai_api_key_name) {
      apiKey = process.env[config.ai_api_key_name];
    }

    // Si no se encontró una clave específica, usar la del sistema por defecto
    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY_DEFAULT;
    }

    if (!apiKey) {
      console.warn(`API Key not found. Reference name: ${config.ai_api_key_name || 'default'}`);
      return null;
    }

    const userText = history.filter(m => m.role === 'user').map(m => m.content).join('\n');
    
    const prompt = language === 'es' 
      ? `Analiza esta conversación y clasifica al lead:

${userText}

Clasifica como HOT (90-100): interés inmediato, WARM (60-89): interés moderado, COLD (0-59): exploración.

JSON:
{
  "score": número_0_100,
  "classification": "HOT|WARM|COLD",
  "reasoning": "Análisis del comportamiento, intenciones, señales de compra y recomendación de seguimiento (max 200 chars)"
}`
      : `Analyze this conversation and classify the lead:

${userText}

Classify as HOT (90-100): immediate interest, WARM (60-89): moderate interest, COLD (0-59): exploration.

JSON:
{
  "score": number_0_100,
  "classification": "HOT|WARM|COLD",
  "reasoning": "Behavior analysis, intentions, buying signals and follow-up recommendation (max 200 chars)"
}`;

    const modelName = config.ai_model;
    let textResponse: string;

    // 2. Enrutador de Modelos
    if (modelName.startsWith('gemini')) {
      console.log(`[Lead Classification] Routing to Gemini with model: ${modelName}`);
      textResponse = await generateGeminiAnalysis(prompt, apiKey, modelName);
    } else if (modelName.startsWith('moonshot')) {
      console.log(`[Lead Classification] Routing to Kimi (Moonshot) with model: ${modelName}`);
      textResponse = await generateKimiAnalysis(prompt, apiKey, modelName);
    } else {
      // Fallback si el modelo no es reconocido
      console.warn(`[Lead Classification] Unknown model '${modelName}'. Falling back to default Gemini.`);
      const defaultApiKey = process.env.GEMINI_API_KEY_DEFAULT;
      if (!defaultApiKey) throw new Error("Default Gemini API Key is not configured.");
      textResponse = await generateGeminiAnalysis(prompt, defaultApiKey, 'gemini-2.0-flash');
    }

    // 3. Clean and parse response
    let response = textResponse
      .replace(/```json\s*/g, '')
      .replace(/```\s*$/g, '')
      .replace(/```.*?\n/g, '')
      .replace(/^[^{]*/, '') // Remove any text before first {
      .replace(/[^}]*$/, '') // Remove any text after last }
      .replace(/\n/g, ' ') // Replace line breaks with spaces
      .replace(/\r/g, ' ') // Replace carriage returns with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    console.log(`[Lead Classification] Raw AI response: ${textResponse}`);
    console.log(`[Lead Classification] Cleaned response: ${response}`);
    
    let aiResult;
    try {
      aiResult = JSON.parse(response);
    } catch (parseError) {
      console.error(`[Lead Classification] JSON parse error:`, parseError);
      console.error(`[Lead Classification] Failed to parse response: "${response}"`);
      
      // Fallback: try to extract data manually with better regex
      const scoreMatch = textResponse.match(/"?score"?\s*:\s*(\d+)/i);
      const classMatch = textResponse.match(/"?classification"?\s*:\s*"?(HOT|WARM|COLD)"?/i);
      // More flexible reasoning match that handles line breaks and quotes
      const reasonMatch = textResponse.match(/"?reasoning"?\s*:\s*"([^"]*(?:\\.[^"]*)*)"/i) || 
                         textResponse.match(/"?reasoning"?\s*:\s*"([^"]+)"/i) ||
                         textResponse.match(/reasoning[^:]*:\s*([^,}]+)/i);
      
      if (scoreMatch && classMatch) {
        let reasoning = 'AI analysis completed';
        if (reasonMatch) {
          reasoning = reasonMatch[1]
            .replace(/\\"/g, '"') // Unescape quotes
            .replace(/\n/g, ' ') // Replace line breaks
            .replace(/\s+/g, ' ') // Clean multiple spaces
            .trim();
        }
        
        aiResult = {
          score: parseInt(scoreMatch[1]),
          classification: classMatch[1].toUpperCase(),
          reasoning: reasoning
        };
        console.log(`[Lead Classification] Fallback parsing successful:`, aiResult);
      } else {
        throw new Error(`Unable to parse AI response. Score found: ${!!scoreMatch}, Class found: ${!!classMatch}. Response: ${textResponse.substring(0, 200)}...`);
      }
    }
    
    // Validate parsed result
    if (!aiResult || typeof aiResult.score !== 'number' || !aiResult.classification) {
      throw new Error(`Invalid AI result structure: ${JSON.stringify(aiResult)}`);
    }
    
    return {
      score: Math.min(100, Math.max(0, aiResult.score)), // Ensure score is 0-100
      classification: aiResult.classification,
      reasoning: aiResult.reasoning || 'AI analysis completed'
    };

  } catch (error) {
    console.error('[AI Analysis] Error:', error);
    return null;
  }
}

// Función principal de clasificación
async function classifyLead(workspaceId: string, chatSessionId: string, dashboardLanguage?: string): Promise<ClassificationResult | null> {
  try {
    // 1. Get chat history
    const { data: chat, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('history')
      .eq('id', chatSessionId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !chat?.history || !Array.isArray(chat.history) || chat.history.length < 2) {
      return null;
    }

    const history = chat.history as Message[];
    
    // 2. Detect language and load data in parallel
    // Use dashboard language for AI response, but auto-detect for keywords
    const detectedLanguage = detectLanguage(history);
    const keywordLanguage = detectedLanguage;  // For keywords from DB
    const responseLanguage = dashboardLanguage || detectedLanguage;  // For AI response language
    const [keywords, config] = await Promise.all([
      loadKeywords(workspaceId, keywordLanguage),
      loadConfig(workspaceId)
    ]);

    // 3. Analyze by rules
    const rulesResult = analyzeByRules(history, keywords, responseLanguage);
    let finalScore = rulesResult.score;
    let finalClassification: 'HOT' | 'WARM' | 'COLD' = 'COLD';
    let reasoning = rulesResult.reasoning;

    // 4. Analyze with AI if available
    if (config) {
      const aiResult = await analyzeWithAI(history, responseLanguage, config);
      if (aiResult) {
        // Combine: 70% AI + 30% rules
        finalScore = Math.round(aiResult.score * 0.7 + rulesResult.score * 0.3);
        finalClassification = aiResult.classification as 'HOT' | 'WARM' | 'COLD';
        reasoning = aiResult.reasoning;
      }
    }

    // 5. Final classification
    if (finalScore >= 80) finalClassification = 'HOT';
    else if (finalScore >= 50) finalClassification = 'WARM';
    else finalClassification = 'COLD';

    return {
      chatSessionId,
      score: finalScore,
      classification: finalClassification,
      reasoning,
      createdAt: new Date().toISOString(),
      messageCount: history.filter(m => m.role === 'user').length
    };

  } catch (error) {
    console.error('[Classification] Error:', error);
    return null;
  }
}

export const leadClassificationService = { classifyLead };