// app/lib/server/reportingService.js

const { supabaseAdmin } = require('@/lib/supabase/server'); 
const {generateAiResponse} = require('@/utils/helpers')

// --- 1. CÁLCULO DE MÉTRICAS ---

async function calculateKeyMetrics(workspaceId, startDate, endDate) {
    console.log(`[Reporting] Calculando métricas para workspace ${workspaceId}`);

    const { data: sessions, error } = await supabaseAdmin
        .from('chat_sessions')
        .select('history, created_at, status, assigned_agent_id')
        .eq('workspace_id', workspaceId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    if (error) {
        console.error("Error fetching sessions for metrics:", error);
        return { /* Devuelve ceros en caso de error */ };
    }

    let totalMessages = 0;
    let handoffsToAgent = 0;
    let resolvedByBot = 0;
    const responseTimes = [];

    for (const session of sessions) {
        totalMessages += session.history?.length || 0;
        
        if (session.assigned_agent_id) {
            handoffsToAgent++;
        }
        
        if (session.status === 'closed' && !session.assigned_agent_id) {
            resolvedByBot++;
        }

        // Calcular tiempo de primera respuesta del bot
        if (session.history && session.history.length > 1) {
            const firstUserMsg = new Date(session.history[0].timestamp);
            const firstBotMsg = new Date(session.history[1].timestamp);
            if (session.history[0].role === 'user' && session.history[1].role === 'assistant') {
                 responseTimes.push(firstBotMsg - firstUserMsg);
            }
        }
    }
    
    const avgResponseTimeMs = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;

    return {
        newConversations: sessions.length,
        totalMessages: totalMessages,
        avgResponseTime: `${(avgResponseTimeMs / 1000).toFixed(2)}s`,
        handoffsToAgent: handoffsToAgent,
        botResolutionRate: sessions.length > 0 ? `${((resolvedByBot / sessions.length) * 100).toFixed(1)}%` : '0%',
    };
}


// --- 2. FUNCIÓN PRINCIPAL DE GENERACIÓN DE REPORTE ---

async function generateDailyReport(workspaceId, date, language = 'es', aiConfig) {
    const startDate = `${date}T00:00:00.000Z`;
    const endDate = `${date}T23:59:59.999Z`;

    // 1. Calcular métricas numéricas
    const keyMetrics = await calculateKeyMetrics(workspaceId, startDate, endDate);
    
    // 2. Obtener los historiales de chat para el análisis de la IA
    const { data: conversations } = await supabaseAdmin
        .from('chat_sessions')
        .select('history')
        .eq('workspace_id', workspaceId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    // 3. Crear el "Mega-Prompt" para la IA
    const reportPrompts = {
        es: {
            analystPersona: "Eres un analista de datos experto en atención al cliente. Tu tarea es generar un reporte ejecutivo en Español basado en los siguientes datos.",
            instructions: "Basado en los datos, genera una respuesta en formato JSON con las siguientes claves: \"executiveSummary\", \"leadAnalysis\", \"topicsAndTrends\", \"actionableInsights\".",
            summary: "Un párrafo de 3-5 líneas resumiendo lo más importante del día. Menciona el volumen de consultas, los temas principales y cualquier evento notable.",
            leads: "Analiza los leads. Identifica cuántos leads son CALIENTES (intención clara de compra), TIBIOS (interesados) y FRÍOS (solo preguntan). Menciona los nombres de los leads calientes si los identificas.",
            topics: "Identifica los 3-5 temas o productos más consultados. Menciona si hay preguntas nuevas o quejas recurrentes.",
            insights: "Proporciona 2-3 acciones recomendadas. Por ejemplo, \"Hacer seguimiento a los leads calientes\", \"Actualizar la base de conocimiento sobre el tema X\".",
            responseFormat: "RESPUESTA (SOLO JSON):"
        },
        en: {
            analystPersona: "You are an expert customer support data analyst. Your task is to generate an executive report in English based on the following data.",
            instructions: "Based on the data, generate a JSON response with the following keys: \"executiveSummary\", \"leadAnalysis\", \"topicsAndTrends\", \"actionableInsights\".",
            summary: "A 3-5 line paragraph summarizing the most important events of the day. Mention consultation volume, main topics, and any notable events.",
            leads: "Analyze the leads. Identify how many are HOT (clear purchase intent), WARM (interested), and COLD (just asking). Mention the names of hot leads if you identify them.",
            topics: "Identify the top 3-5 most consulted topics or products. Mention any new questions or recurring complaints.",
            insights: "Provide 2-3 recommended actions. For example, \"Follow up with hot leads\", \"Update the knowledge base on topic X\".",
            responseFormat: "RESPONSE (JSON ONLY):"
        },
        ru: {
            analystPersona: "Вы являетесь экспертом по анализу данных в области обслуживания клиентов. Ваша задача - составить исполнительный отчет на русском языке на основе следующих данных.",
            instructions: "На основе данных создайте ответ в формате JSON с следующими ключами: \"executiveSummary\", \"leadAnalysis\", \"topicsAndTrends\", \"actionableInsights\".",
            summary: "Параграф из 3-5 строк, резюмирующий самые важные события дня. Упомяните объем консультаций, основные темы и любые заметные события.",
            leads: "Проанализируйте лиды. Определите, сколько из них ГОРЯЧИЕ (ясное намерение покупки), ТЕПЛЫЕ (заинтересованы) и ХОЛОДНЫЕ (просто спрашивают). Упомяните имена горячих лидов, если вы их идентифицируете.",
            topics: "Определите 3-5 наиболее часто запрашиваемых тем или продуктов. Упомяните любые новые вопросы или повторяющиеся жалобы.",
            insights: "Предоставьте 2-3 рекомендуемых действия. Например, \"Связаться с горячими лидами\", \"Обновить базу знаний по теме X\".",
            responseFormat: "ОТВЕТ (ТОЛЬКО JSON):"
        },
        ar: {
            analystPersona: "أنت محلل بيانات خبير في دعم العملاء. مهمتك هي إنشاء تقرير تنفيذي باللغة العربية بناءً على البيانات التالية.",
            instructions: "استنادًا إلى البيانات ، قم بإنشاء استجابة بتنسيق JSON مع المفاتيح التالية: \"executiveSummary\" و \"leadAnalysis\" و \"topicsAndTrends\" و \"actionableInsights\".",
            summary: "فقرة من 3-5 أسطر تلخص أهم أحداث اليوم. اذكر حجم الاستشارات والمواضيع الرئيسية وأي أحداث ملحوظة.",
            leads: "قم بتحليل العملاء المحتملين. حدد عدد العملاء المحتملين الذين هم حارون (نية شراء واضحة) ودافئون (مهتمون) وباردون (يسألون فقط). اذكر أسماء العملاء المحتملين الحارين إذا قمت بتحديدهم.",
            topics: "حدد 3-5 من أكثر المواضيع أو المنتجات استشارة. اذكر أي أسئلة جديدة أو شكاوى متكررة.",
            insights: "قدم 2-3 من الإجراءات الموصى بها. على سبيل المثال ، \"متابعة العملاء المحتملين الحارين\" ، \"تحديث قاعدة المعرفة حول الموضوع X\".",
            responseFormat: "الاستجابة (JSON فقط):" 
        },
        zh: {
            analystPersona: "您是客户支持数据分析的专家。您的任务是根据以下数据生成中文的执行报告。",
            instructions: "根据数据生成一个JSON格式的响应，包含以下键：\"executiveSummary\"，\"leadAnalysis\"，\"topicsAndTrends\"，\"actionableInsights\"。",
            summary: "3-5行的段落，总结当天最重要的事件。提及咨询量、主要主题和任何显著事件。",
            leads: "分析潜在客户。确定有多少是热（明确购买意图）、温（感兴趣）和冷（只是询问）。如果识别出热潜在客户，请提及他们的姓名。",
            topics: "确定3-5个最常咨询的主题或产品。提及任何新问题或重复投诉。",
            insights: "提供2-3个建议的行动。例如，\"跟进热潜在客户\"，\"更新关于主题X的知识库\"。",
            responseFormat: "响应（仅限JSON）："
        }
    };

    // Selecciona el prompt en el idioma correcto, con fallback a español
    const promptTemplate = reportPrompts[language] || reportPrompts.es;

    const conversationsText = conversations.map(c => JSON.stringify(c.history)).join('\n---\n');
    
    // --- 3. CONSTRUYE EL "MEGA-PROMPT" USANDO LA PLANTILLA ---
    const reportPrompt = `
        ${promptTemplate.analystPersona}

        RAW DATA:
        - Key Metrics for the Day: ${JSON.stringify(keyMetrics)}
        - Full Conversations for the Day: ${conversationsText}

        INSTRUCTIONS:
        ${promptTemplate.instructions}
        
        1.  **executiveSummary**: ${promptTemplate.summary}
        2.  **leadAnalysis**: ${promptTemplate.leads}
        3.  **topicsAndTrends**: ${promptTemplate.topics}
        4.  **actionableInsights**: ${promptTemplate.insights}

        ${promptTemplate.responseFormat}
    `;

    // 4. Llamar a la IA para el análisis cualitativo
    let analysisData = {};
    try {
        const aiAnalysisString = await generateAiResponse(reportPrompt, aiConfig);
        // Limpiamos la respuesta para quitar los ```json y ``` del principio y final
        const cleanedJsonString = aiAnalysisString
            .replace(/^```json\n/, '') // Quita el inicio
            .replace(/\n```$/, '');    // Quita el final

        analysisData = JSON.parse(cleanedJsonString);
    } catch (e) {
        console.error("Fallo al generar el análisis de IA para el reporte:", e);
    }

    // 5. Combinar todo en el reporte final
    const fullReport = {
        reportDate: date,
        keyMetrics,
        ...analysisData, // Fusiona los resultados de la IA
    };

    return fullReport;
}

module.exports = {
    generateDailyReport,
};