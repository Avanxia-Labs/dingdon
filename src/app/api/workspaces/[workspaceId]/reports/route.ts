// app/api/workspaces/[workspaceId]/reports/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateDailyReport } from '@/services/server/reportingService';

export async function GET(
    req: NextRequest,
    context: {
        params: Promise<{ workspaceId: string }>
    }
) {

    const session = await getServerSession(authOptions);
    const { workspaceId } = await context.params;

    // Seguridad: El usuario debe pertenecer al workspace
    if (session?.user?.workspaceId !== workspaceId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {

        // 1. Obtener la fecha y el idioma de los parámetros de la URL
        const searchParams = req.nextUrl.searchParams;
        const date = searchParams.get('date'); // ej: '2025-08-23'
        const language = searchParams.get('lang') || 'es'; // ej: 'es'

        if (!date) {
            return NextResponse.json({ error: 'Date parameter is required.' }, { status: 400 });
        }

        // 2. Lógica de Caché: Buscar si el reporte ya existe en la DB
        console.log(`[Reports API] Buscando reporte en caché para ${workspaceId} en la fecha ${date}`);
        const { data: cachedReport } = await supabaseAdmin
            .from('daily_reports')
            .select('report_data')
            .eq('workspace_id', workspaceId)
            .eq('report_date', date)
            .maybeSingle();

        if (cachedReport) {
            console.log(`[Reports API] ¡Reporte encontrado en caché! Devolviendo.`);
            return NextResponse.json(cachedReport.report_data);
        }

        // 3. Si no está en caché, generarlo
        console.log(`[Reports API] Reporte no encontrado. Generando uno nuevo...`);

        // Obtenemos la configuración de IA para pasarla al servicio
        const { data: workspaceConfig } = await supabaseAdmin
            .from('workspaces')
            .select('ai_model, ai_api_key_name')
            .eq('id', workspaceId)
            .single();

        if (!workspaceConfig) throw new Error("Workspace config not found.");

        const apiKey = process.env[workspaceConfig.ai_api_key_name || ''] || process.env.GEMINI_API_KEY_DEFAULT;
        if (!apiKey) throw new Error("API Key not found for reporting.");

        const aiConfig = { model: workspaceConfig.ai_model, apiKey };

        // Llamamos al "cerebro" para que haga el trabajo pesado
        const newReportData = await generateDailyReport(workspaceId, date, language, aiConfig);

        // 4. Guardar el nuevo reporte en la base de datos para la caché
        console.log(`[Reports API] Guardando nuevo reporte en la base de datos...`);
        const { error: insertError } = await supabaseAdmin
            .from('daily_reports')
            .insert({
                workspace_id: workspaceId,
                report_date: date,
                report_data: newReportData,
            });

        if (insertError) {
            // Si falla el guardado, no es crítico. Aún podemos devolver el reporte.
            console.error("Error al guardar el reporte en la caché:", insertError);
        }

        // 5. Devolver el reporte recién generado
        return NextResponse.json(newReportData);

    } catch (error) {
        console.error("Error en la API de reportes:", error);
        return NextResponse.json({ error: 'Failed to generate report.' }, { status: 500 });
    }

}