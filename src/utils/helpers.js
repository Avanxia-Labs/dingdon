const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');


// --- 1. HELPER DE IA GENÉRICO Y DINÁMICO ---
// Este helper puede ser usado para cualquier tarea de IA (resumir, clasificar, etc.)
export async function generateAiResponse(prompt, aiConfig) {
    if (!aiConfig || !aiConfig.model || !aiConfig.apiKey) {
        throw new Error("AI configuration is missing.");
    }

    if (aiConfig.model.startsWith('gemini')) {
        const genAI = new GoogleGenerativeAI(aiConfig.apiKey);
        const model = genAI.getGenerativeModel({ model: aiConfig.model });
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } 
    
    if (aiConfig.model.startsWith('moonshot')) {
        const response = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
            model: aiConfig.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7, // Un poco más creativo para los reportes
        }, {
            headers: { 'Authorization': `Bearer ${aiConfig.apiKey}` }
        });
        return response.data.choices[0].message.content.trim();
    }

    throw new Error(`Unsupported model provided: ${aiConfig.model}`);
}