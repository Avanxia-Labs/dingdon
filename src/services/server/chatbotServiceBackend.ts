// app/lib/chatbot/chatbotServiceBackend.ts

import axios from 'axios';
import { ChatbotConfig, Message } from '@/types/chatbot';
import { supabaseAdmin } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- CONFIGURACIÓN DE LA IA ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn("CRITICAL: GEMINI_API_KEY is not defined.");
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);


/**
 * Obtiene la configuración de conocimiento específica de un workspace desde Supabase.
 * @param {string} workspaceId - El ID del workspace.
 * @returns {Promise<ChatbotConfig | null>} La configuración o null si no se encuentra.
 */
async function getWorkspaceConfig(workspaceId: string): Promise<ChatbotConfig | null> {
  const { data, error } = await supabaseAdmin
    .from('workspaces')
    .select('knowledge_base')
    .eq('id', workspaceId)
    .single();

  if (error || !data?.knowledge_base) {
    console.error(`No se pudo obtener la configuración para el workspace ${workspaceId}:`, error);
    return null;
  }
  // La columna 'knowledge_base' es de tipo JSONB, por lo que es un objeto directamente.
  return data.knowledge_base as ChatbotConfig;
}

/**
 * Busca una respuesta predefinida en la base de conocimiento cargada.
 * @param {string} userQuery - La pregunta del usuario.
 * @param {ChatbotConfig} config - La configuración del workspace.
 * @returns {string | null} La respuesta encontrada o null.
 */
function findLocalAnswer(userQuery: string, config: ChatbotConfig): string | null {
  const normalizedQuery = userQuery.toLowerCase().trim();
  for (const qa of config.commonQuestions) {
    // Mantenemos la búsqueda simple por ahora.
    if (normalizedQuery.includes(qa.question.toLowerCase().substring(0, 20))) {
      return qa.answer;
    }
  }
  return null;
}

/**
 * Genera el prompt de contexto para la IA usando la configuración dinámica.
 * @param {ChatbotConfig} config - La configuración del workspace.
 * @param {string} userPrompt - La pregunta del usuario.
 * @returns {string} El prompt completo para la IA.
 */
function generateAIContext(config: ChatbotConfig, userPrompt: string, language: string, history: Message[]): string {
  const formattedQA = config.commonQuestions.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n');

  const conversationHistory = history.map(msg => {
      if (msg.role === 'user') return `User: ${msg.content}`;
      if (msg.role === 'assistant') return `Assistant: ${msg.content}`;
      return ''; // Ignorar otros roles
  }).filter(Boolean).join(`\n`);

  console.log("HISTORY:", conversationHistory)

  const languageInstructions: Record<string, string> = {
    en: `You are a professional and friendly virtual assistant for ${config.companyName}. Your goal is to provide excellent customer support in English.`,
    es: `Eres un asistente virtual profesional y amigable para ${config.companyName}. Tu objetivo es proporcionar un excelente soporte al cliente en Español.`,
    ru: `Вы — профессиональный и дружелюбный виртуальный ассистент для ${config.companyName}. Ваша цель — оказывать превосходную поддержку клиентам на русском языке.`,
    ar: `أنت مساعد افتراضي محترف وودود لشركة ${config.companyName}. هدفك هو تقديم دعم عملاء ممتاز باللغة العربية.`,
    zh: `您是${config.companyName}的专业友好虚拟助手。您的目标是用中文提供卓越的客户支持。`,
  };

  const languageResponseInstruction: Record<string, string> = {
    en: "Your Answer (in English):",
    es: "Tu Respuesta (en Español):",
    ru: "Ваш Ответ (на русском языке):",
    ar: "إجابتك (باللغة العربية):",
    zh: "您的回答 (用中文):",
  };

  const selectedInstruction = languageInstructions[language] || languageInstructions.en;
  const selectedResponseInstruction = languageResponseInstruction[language] || languageResponseInstruction.en;

  // Este es el prompt principal que guía a la IA.
  return `
    ${selectedInstruction}

    Our services include:
    ${config.services.map(service => `- ${service}`).join('\n')}

    --- KNOWLEDGE BASE ---
    ${formattedQA}
    --- END KNOWLEDGE BASE ---

    --- CURRENT CONVERSATION HISTORY ---
        ${conversationHistory}
    --- END CONVERSATION HISTORY ---

    BEHAVIORAL INSTRUCTIONS (Examples for english but take into account the other language if applies):

    1. **Analyze the FULL conversation history**: Your primary goal is to provide a relevant and contextual response. The user's latest question might be a direct follow-up to your previous answer.

    2. **Maintain the thread**: If the user's question is "yes," "why?," or a short phrase, look at your last message to understand the context and answer accordingly. Do not say you don't understand.
    
    3. **Be natural and conversational**: Respond in a friendly and professional manner, like an experienced human agent would.

    4. **Interpret intent**: If a user says "hi," "hello," "good afternoon," or similar greetings, respond cordially and offer help. Do not say you don't have that information. But do not respond hi or hello, etc in every message you send

    5. **Use your knowledge base intelligently**:
        - Paraphrase and adapt information without copying it verbatim.
        - Connect related concepts from different parts of the knowledge base.
        - Provide additional context when helpful.

    6. **Be proactive in your guidance**:
        - Anticipate follow-up questions.
        - Suggest relevant next steps.
        - Offer supplementary information that might be useful.

    7. **Acknowledge limitations appropriately**:
        - For very specific, technical, or personalized details.
        - For cases that require access to internal systems.
        - For unique situations not covered in the documentation.

    8. **Never invent information**: If you don't have specific data, be honest but helpful. Offer what you *can* provide.

    APPROPRIATE RESPONSE EXAMPLES:
      - User: "Hi" → "Hello! Welcome to ${config.companyName}. How can I help you today?"
      - User: "How much does it cost?" → Provide general price ranges if available, or explain factors that affect the cost.
      - User: "How does it work?" → Explain the general process based on the documentation.
      - User: "I have a specific problem with my account" → Offer general troubleshooting steps and suggest contacting support for specific details.

    Respond in a natural, professional, and helpful manner based on the available knowledge. If you need to escalate to a specialist, do so in a positive and specific way, explaining what kind of additional help they can offer.

    User Question: "${userPrompt}"
    
    ${selectedResponseInstruction};
  `;
}

/**
 * Genera una respuesta al prompt del usuario, usando la configuración dinámica del workspace.
 */
async function generateChatbotResponse(workspaceId: string, userPrompt: string, sessionId: string, language: string, history: Message[] = []): Promise<string | { handoff: true }> {
  console.log(`[Backend] Generating response for workspace: ${workspaceId} in language: ${language}`);

  // --- Detección de Handoff ---
  const normalizedQuery = userPrompt.toLowerCase();
  const handOffKeywords: Record<string, string[]> = {
    en: ['agent', 'human', 'speak to', 'talk to', 'representative'],
    es: ['agente', 'persona', 'humano', 'hablar con', 'representante'],
    ru: ['агент', 'человек', 'поговорить с', 'оператор'],
    ar: ['وكيل', 'شخص', 'أتحدث مع', 'إنسان', 'ممثل خدمة'],
    zh: ['人工', '客服', '真人', '谈谈', '接线员'],
  };
  const keywordsForLang = handOffKeywords[language] || handOffKeywords.en;
  if (keywordsForLang.some(keyword => normalizedQuery.includes(keyword))) {
    return { handoff: true };
  }

  // 1. Cargar la configuración específica para este workspace desde la base de datos.
  const config = await getWorkspaceConfig(workspaceId);
  const errorMessages: Record<string, string> = {
    en: "I'm sorry, I'm having some technical difficulties. Please try again later.",
    es: "Lo siento, estoy teniendo algunas dificultades técnicas. Por favor, inténtalo de nuevo más tarde.",
    ru: "Извините, у меня возникли технические трудности. Пожалуйста, повторите попытку позже.",
    ar: "أنا آسف، أواجه بعض الصعوبات الفنية. يرجى المحاولة مرة أخرى لاحقًا.",
    zh: "抱歉，我遇到了一些技术问题。请稍后再试。",
  };
  const selectedErrorMessage = errorMessages[language] || errorMessages.en;
  if (!config) {
    return selectedErrorMessage;
  }

  // 2. Búsqueda local usando la configuración dinámica.
  const localAnswer = findLocalAnswer(userPrompt, config);
  if (localAnswer) {
    console.log(`[Local Answer] Respuesta encontrada en la configuración del workspace ${workspaceId}.`);
    return localAnswer;
  }

  // 3. Si no hay respuesta local, llamar a la IA con el contexto dinámico.
  console.log(`[AI Fallback] Llamando a Gemini para workspace ${workspaceId}.`);
  if (!GEMINI_API_KEY) {
    return selectedErrorMessage;
  }

  const fullPrompt = generateAIContext(config, userPrompt, language, history);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const textResponse = response.text();

    if (textResponse) {
      return textResponse.trim();
    }
    throw new Error('Invalid response structure from Gemini API');
  } catch (error) {
    console.error('Error llamando a la API de Gemini:', error);
    return selectedErrorMessage;
  }
}

/**
 * El objeto de servicio del backend.
 */
export const chatbotServiceBackend = {
  generateChatbotResponse,
};



