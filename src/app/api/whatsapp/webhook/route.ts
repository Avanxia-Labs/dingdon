// app/api/whatsapp/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { supabaseAdmin } from "@/lib/supabase/server";
import { chatbotServiceBackend } from "@/services/server/chatbotServiceBackend";
import { getServerTranslations } from "@/lib/server/translations"
import { Message } from "@/types/chatbot";



export async function POST(req: NextRequest) {

    try {

        // 1- Leer el workspace desde los parametros de la url
        const workspaceId = req.nextUrl.searchParams.get('workspaceId');

        if (!workspaceId) {
            console.error("Webhook Error: El 'workspaceId' falta en la URL del webhook.");
            return NextResponse.json({ error: 'Webhook configuration error' }, { status: 400 });
        }

        // 2- Leer los datos del formulario en Twilio. Twilio envia los datos como 'form-data', no JSON
        const body = await req.formData()
        const userPhone = body.get('From') as string
        const userMessage = body.get('Body') as string

        if (!userPhone || !userMessage) {
            return NextResponse.json({ error: 'Invalid Twilio request' }, { status: 400 });
        }

        console.log(`Mensaje de ${userPhone} para workspace ${workspaceId}: "${userMessage}"`);

        // - DETERMINAR EL IDIOMA Y CARGAR TRADUCCIONES -
        // En el futuro, este 'language' podría venir de la configuración del workspace en la DB.
        const language = 'es';
        const translations = await getServerTranslations(language);

        // 3- Buscar o crear una sesion de chat activa
        let { data: session } = await supabaseAdmin
            .from('chat_sessions')
            .select('*')
            .eq('user_identifier', userPhone)
            .eq('workspace_id', workspaceId)
            .in('status', ['bot', 'pending'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // 4- Si no hay sesion activa, crear una nueva
        if (!session) {
            console.log(`No se encontró sesión activa para ${userPhone}. Creando una nueva...`);
            const { data: newSession, error } = await supabaseAdmin
                .from('chat_sessions')
                .insert({
                    workspace_id: workspaceId,
                    user_identifier: userPhone,
                    channel: 'whatsapp',
                    status: 'bot',
                    conversation_state: 'collecting_name', // El primer paso del formulario
                    history: [],
                })
                .select()
                .single();

            if (error) throw error;

            session = newSession;

            await sendWhatsAppMessage(userPhone, translations.whatsapp.welcome);
            return new NextResponse('OK', { status: 200 })
        }

        // 5- Procesar el mensaje del usuario
        const currentHistory = (session.history || []) as Message[];
        const updatedHistory: Message[] = [
            ...currentHistory,
            {
                role: 'user',
                content: userMessage,
                id: `user-${Date.now()}`,
                timestamp: new Date()
            }
        ];

        let botReply: string | null = null;

        switch (session.conversation_state) {

            case 'collecting_name':
                await supabaseAdmin
                    .from('leads')
                    .insert({
                        workspace_id: workspaceId,
                        name: userMessage,
                        email: '',
                        phone: userPhone.replace('whatsapp:', ''), // Eliminar el prefijo 'whatsapp:'
                    });

                await supabaseAdmin
                    .from('chat_sessions')
                    .update({
                        conversation_state: 'collecting_email'
                    })
                    .eq('id', session.id);

                botReply = translations.whatsapp.askEmail;

                break;

            case 'collecting_email':
                const lastUserMessage = [...currentHistory].reverse().find(m => m.role === 'user');
                const leadName = lastUserMessage?.content || 'Unknown'

                await supabaseAdmin
                    .from('leads')
                    .update({
                        email: userMessage
                    })
                    .eq('workspace_id', workspaceId)
                    .eq('name', leadName);

                await supabaseAdmin
                    .from('chat_sessions')
                    .update({
                        conversation_state: 'chatting'
                    })
                    .eq('id', session.id);

                botReply = translations.whatsapp.chatReady;

                break;

            case 'chatting':
                const aiResponse = await chatbotServiceBackend.generateChatbotResponse(
                    workspaceId,
                    userMessage,
                    session.id,
                    language,
                    updatedHistory
                );

                if (typeof aiResponse === 'object' && aiResponse.handoff) {
                    botReply = translations.chatbotUI.handoffMessage;

                    // Obtener el primer mensaje del usuario para darle contexto al agente
                    const firstUserMessage = updatedHistory?.find(
                        (msg: Message) => msg.role === 'user'
                    )

                    // Lógica para notificar al panel de agentes.
                    await supabaseAdmin
                        .from('chat_sessions')
                        .update({ status: 'pending' })
                        .eq('id', session.id)

                    // Notifica al panel de agentes a traves de la ruta interna
                    const isDev = process.env.NODE_ENV !== 'production';
                    const internalApiUrl = isDev
                        ? 'http://localhost:3001/api/internal/notify-handoff'  // Express server en desarrollo
                        : `http://localhost:${process.env.PORT || 3001}/api/internal/notify-handoff`; // Mismo servidor en producción

                    console.log("INTERNALURL: ", internalApiUrl)

                    fetch(internalApiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-internal-secret': process.env.INTERNAL_API_SECRET || ''
                        },
                        body: JSON.stringify({
                            workspaceId: workspaceId,
                            sessionId: session.id,
                            history: updatedHistory,
                            initialMessage: firstUserMessage
                        })
                    }).catch(err => {
                        console.error('[API Route] Error llamando al notificador interno de handoff:', err);
                    });

                    // Informar al usuario que se le contactará con un agente
                } else if (typeof aiResponse === 'string') {
                    botReply = aiResponse;
                }

                break;

        }

        if (botReply) {
            // Creamos el objeto de mensaje del bot
            const botMessage: Message = {
                id: `asst-${Date.now()}`,
                role: 'assistant',
                content: botReply,
                timestamp: new Date()
            }

            // Enviamos la respuesta por whatsapp
            await sendWhatsAppMessage(userPhone, botReply);

            // Actualizamos el historial en la base de datos con la respuesta del bot
            const finalHistory = [...updatedHistory, botMessage];
            await supabaseAdmin
                .from('chat_sessions')
                .update({ history: finalHistory })
                .eq('id', session.id);
        }

        // Siempre respondemos 200 OK a Twilio para que no reintente.
        return new NextResponse('', { status: 200 });

    } catch (error) {
        console.error("Error en el webhook de WhatsApp:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}