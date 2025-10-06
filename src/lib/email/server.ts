// lib/email/server.ts
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase/server';
import { cryptoService } from '@/lib/crypto/server';

interface LeadData {
    name: string;
    email: string;
    phone?: string;
}

/**
 * Obtiene la configuración de notificación y la API key desencriptada para un workspace.
 * @param workspaceId - El ID del workspace.
 * @returns Un objeto con la configuración necesaria para enviar un correo, o null si no está configurado.
 */
async function getNotificationConfig(workspaceId: string) {
    const { data: workspace, error } = await supabaseAdmin
        .from('workspaces')
        .select('notification_email, resend_from_email, resend_api_key')
        .eq('id', workspaceId)
        .single();

    // Si falta alguna de las 3 configuraciones, no se pueden enviar correos.
    if (error || !workspace || !workspace.notification_email || !workspace.resend_from_email || !workspace.resend_api_key) {
        console.log(`[Email Service] Notificaciones no configuradas o incompletas para el workspace ${workspaceId}`);
        return null;
    }

    const apiKey = cryptoService.decrypt(workspace.resend_api_key);

    if (!apiKey) {
        console.error(`[Email Service] Falló la desencriptación de la API key para el workspace ${workspaceId}.`);
        return null;
    }

    return {
        recipient: workspace.notification_email,
        from: workspace.resend_from_email,
        resend: new Resend(apiKey), // Creamos una instancia de Resend con la clave del cliente
    };
}

export const emailService = {
    /**
     * Envía una notificación de un nuevo lead capturado.
     */
    sendNewLeadNotification: async (workspaceId: string, lead: LeadData) => {
        const config = await getNotificationConfig(workspaceId);
        if (!config) return; // Si no hay config, no hace nada.

        try {
            await config.resend.emails.send({
                from: `Notificación de Lead <${config.from}>`,
                to: config.recipient,
                subject: `Lead Nuevo Capturado: ${lead.name}`,
                html: `
                    <h1>¡Nuevo Lead!</h1>
                    <p>Se ha capturado un nuevo lead a través del chatbot.</p>
                    <ul>
                        <li><strong>Nombre:</strong> ${lead.name}</li>
                        <li><strong>Email:</strong> ${lead.email}</li>
                        <li><strong>Teléfono:</strong> ${lead.phone || 'No proporcionado'}</li>
                    </ul>
                `,
            });
            console.log(`[Email Service] Notificación de nuevo lead enviada a ${config.recipient}`);
        } catch (error) {
            console.error("[Email Service] Error enviando notificación de lead:", error);
        }
    },

    /**
     * Envía una notificación de una nueva solicitud de handoff.
     */
    sendHandoffNotification: async (workspaceId: string, sessionId: string, initialMessage: string) => {
        const config = await getNotificationConfig(workspaceId);
        if (!config) return;

        try {
            await config.resend.emails.send({
                from: `Solicitud de Agente <${config.from}>`,
                to: config.recipient,
                subject: `Un usuario solicita un agente (Sesión: ...${sessionId.slice(-6)})`,
                html: `
                    <h1>¡Solicitud de Agente!</h1>
                    <p>Un usuario ha solicitado hablar con un agente.</p>
                    <p><strong>Sesión ID:</strong> ${sessionId}</p>
                    <p><strong>Primer Mensaje:</strong></p>
                    <blockquote style="border-left: 4px solid #ccc; padding-left: 1em; margin: 1em 0;">${initialMessage}</blockquote>
                    <p>Por favor, ingresa al dashboard para atenderlo.</p>
                `,
            });
            console.log(`[Email Service] Notificación de handoff enviada a ${config.recipient}`);
        } catch (error) {
            console.error("[Email Service] Error enviando notificación de handoff:", error);
        }
    }
};