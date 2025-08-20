// src/services/server/leadClassificationService.ts

import { supabaseAdmin } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from '@/types/chatbot';

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

// Carga configuración del workspace
async function loadConfig(workspaceId: string) {
  const { data, error } = await supabaseAdmin
    .from('workspaces')
    .select('ai_model, ai_api_key_name')
    .eq('id', workspaceId)
    .single();

  return error ? null : {
    ai_model: data.ai_model || 'gemini-2.0-flash',
    ai_api_key_name: data.ai_api_key_name
  };
}

// Análisis por reglas con keywords
function analyzeByRules(history: Message[], keywords: any) {
  const userMessages = history.filter(m => m.role === 'user');
  const text = userMessages.map(m => m.content.toLowerCase()).join(' ');
  
  let score = 0;
  const found = [];

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

  return { score: Math.max(0, score), reasoning };
}

// Análisis con IA
async function analyzeWithAI(history: Message[], language: string, config: any) {
  try {
    // Get API key
    let apiKey = process.env.GEMINI_API_KEY_DEFAULT;
    if (config.ai_api_key_name) apiKey = process.env[config.ai_api_key_name] || apiKey;
    if (!apiKey) return null;

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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: config.ai_model });
    const result = await model.generateContent(prompt);
    let response = result.response.text().trim();

    // Clean response
    response = response.replace(/```json\s*/g, '').replace(/```\s*$/g, '').replace(/```.*?\n/g, '').trim();
    
    const aiResult = JSON.parse(response);
    return {
      score: aiResult.score,
      classification: aiResult.classification,
      reasoning: aiResult.reasoning
    };
  } catch (error) {
    console.error('[AI] Error:', error);
    return null;
  }
}

// Función principal de clasificación
async function classifyLead(workspaceId: string, chatSessionId: string): Promise<ClassificationResult | null> {
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
    const language = detectLanguage(history);
    const [keywords, config] = await Promise.all([
      loadKeywords(workspaceId, language),
      loadConfig(workspaceId)
    ]);

    // 3. Analyze by rules
    const rulesResult = analyzeByRules(history, keywords);
    let finalScore = rulesResult.score;
    let finalClassification: 'HOT' | 'WARM' | 'COLD' = 'COLD';
    let reasoning = rulesResult.reasoning;

    // 4. Analyze with AI if available
    if (config) {
      const aiResult = await analyzeWithAI(history, language, config);
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