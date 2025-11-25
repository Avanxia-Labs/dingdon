// app/lib/server/summaryService.js

const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Funciones de Ayuda para llamar a las APIs de IA ---

async function generateGeminiResponse(prompt, apiKey, modelName) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

async function generateKimiResponse(prompt, apiKey, modelName) {
    const response = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
    }, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return response.data.choices[0].message.content.trim();
}

async function generateDeepSeekResponse(prompt, apiKey, modelName) {
    const response = await axios.post('https://api.deepseek.com/chat/completions', {
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


// --- La Función Principal del Servicio ---

async function summarizeConversation(history, language, aiConfig) {
    console.log('[SummaryService] Iniciando generación de resumen...');
    console.log('[SummaryService] Idioma:', language);
    console.log('[SummaryService] Modelo:', aiConfig?.model);

    if (!history || history.length === 0) {
        console.log('[SummaryService] No hay historial para resumir');
        return "No hay conversación para resumir.";
    }
    if (!aiConfig || !aiConfig.model || !aiConfig.apiKey) {
        console.error('[SummaryService] Configuración de IA faltante');
        throw new Error("AI configuration is missing for summarization.");
    }

    const conversationText = history
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

    console.log('[SummaryService] Longitud del texto de conversación:', conversationText.length);

    const languageInstructions = {
        en: `You are an expert support conversation summarizer. Your task is to generate a concise summary in English.`,
        es: `Eres un asistente experto en resumir conversaciones de soporte. Tu tarea es generar un resumen conciso en Español.`,
        ru: `Вы — экспертный ассистент по подведению итогов разговоров в поддержке. Ваша задача — составить краткую сводку на русском языке.`,
        ar: `أنت مساعد خبير في تلخيص محادثات الدعم. مهمتك هي إنشاء ملخص موجز باللغة العربية.`,
        zh: `你是一位专业的客服对话摘要专家。你的任务是生成一份简明的中文摘要。`
    };

    const prompt = `
        ${languageInstructions[language] || languageInstructions.es}

        Resume the following conversation in 5-6 concise bullet points. Focus on the customer's main issue, the key information provided, and the last action taken or question asked.

        Finally, give some ideas to the agent about what to do next.

        CONVERSATION:
        ---
        ${conversationText}
        ---

        Summary (in ${language}):

        Please, use proper styling for keywords, like bolding important terms, etc...also use saltos de lineas, etc (Keep in mind this is going to be shown in a chat interface).
    `;

    try {
        // Enrutador de modelos
        console.log('[SummaryService] Llamando a la API de IA...');
        let result;

        if (aiConfig.model.startsWith('gemini')) {
            console.log('[SummaryService] Usando Gemini');
            result = await generateGeminiResponse(prompt, aiConfig.apiKey, aiConfig.model);
        } else if (aiConfig.model.startsWith('moonshot')) {
            console.log('[SummaryService] Usando Kimi (Moonshot)');
            result = await generateKimiResponse(prompt, aiConfig.apiKey, aiConfig.model);
        } else if (aiConfig.model.startsWith('deepseek')) {
            console.log('[SummaryService] Usando DeepSeek');
            result = await generateDeepSeekResponse(prompt, aiConfig.apiKey, aiConfig.model);
        } else {
            // Fallback a DeepSeek si está disponible, sino intenta Gemini
            console.warn(`[SummaryService] Modelo desconocido: ${aiConfig.model}. Intentando con DeepSeek como fallback.`);
            result = await generateDeepSeekResponse(prompt, aiConfig.apiKey, 'deepseek-chat');
        }

        console.log('[SummaryService] Resumen generado exitosamente');
        return result;

    } catch (error) {
        console.error('[SummaryService] Error al generar resumen:', error);
        throw new Error(`Failed to generate summary: ${error.message}`);
    }
}

// Exportamos la función para que `server.js` pueda usarla
module.exports = {
    summarizeConversation,
};