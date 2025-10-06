
// server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const supabase = require('./server-lib/supabaseClient.js');
const next = require('next')
const io = require('./server-lib/socketInstance.js');
const { sendWhatsAppMessage } = require('./src/lib/twilio.js');
const { summarizeConversation } = require('./src/services/server/summaryService.js');

// Cargar variables de entorno
require('dotenv').config();


// Preparar la aplicación Next.js
//    - `dev`: Indica si estamos en modo desarrollo o producción. 
//    - `nextApp`: Es la instancia de la aplicación Next.js.
//    - `handle`: Es el manejador de peticiones de Next.js. Él sabe cómo servir las páginas.
const dev = process.env.NODE_ENV !== 'production';


/** @type {import('next/dist/server/next-server').default} */
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();


const CLIENT_ORIGIN_URL = process.env.CLIENT_ORIGIN_URL || 'http://localhost:3000';
const PORT = process.env.PORT || 3001;



// Envolver toda la lógica del servidor dentro de `nextApp.prepare()`.
//    Esto asegura que Next.js esté completamente compilado y listo para recibir peticiones
//    antes de que nuestro servidor Express/Socket.IO empiece a escuchar.
//    Esto reemplaza la necesidad de ejecutar `next start` por separado
nextApp.prepare().then(() => {

    const app = express();
    const server = http.createServer(app);

    // Middleware de CORS
    app.use((req, res, next) => {
        // Si es una API pública, permite cualquier origen
        if (req.path.startsWith('/api/public/') || req.path.startsWith('/api/chat') || req.path.startsWith('/api/leads')) {
            cors({ origin: '*' })(req, res, next);
        } else {
            // Para todo lo demás, solo permite CLIENT_ORIGIN_URL
            cors({ origin: CLIENT_ORIGIN_URL })(req, res, next);
        }
    });

    //app.use(cors({ origin: CLIENT_ORIGIN_URL }));
    //app.use(express.json());

    // La "DB en memoria" para el estado de las sesiones activas
    const workspacesData = {};

    // 🔧 NUEVO: Mapa para rastrear agentes por socket
    const agentSockets = new Map(); // socketId -> { agentId, workspaceId, sessionId }

    // 🔧 NUEVO: Mapa para rastrear sesiones por socket
    const sessionSockets = new Map(); // sessionId -> Set of socketIds

    // API para obtener historial
    app.get('/api/history/:workspaceId/:sessionId', async (req, res) => {
        const { workspaceId, sessionId } = req.params;
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('history')
            .eq('id', sessionId)
            .eq('workspace_id', workspaceId)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'History not found.' });
        }
        res.json({ history: data.history || [] });
    });

    // --- Ruta interna para manejar notificaciones de handoff ---
    app.post('/api/internal/notify-handoff', express.json(), async (req, res) => {
        // Usamos express.json() solo para esta ruta
        const { workspaceId, sessionId, initialMessage, history } = req.body;
        const secret = req.headers['x-internal-secret'];

        // Medida de seguridad simple
        if (secret !== process.env.INTERNAL_API_SECRET) {
            console.warn('[Handoff Notifier] Petición rechazada por secreto inválido.');
            return res.status(401).send('Unauthorized');
        }

        if (!workspaceId || !sessionId || !initialMessage) {
            return res.status(400).send('Missing workspaceId or requestData');
        }

        // --- Guardar la sesión en la base de datos  ---
        const { error: dbError } = await supabase
            .from('chat_sessions')
            .upsert({
                id: sessionId,
                workspace_id: workspaceId,
                status: 'pending', // Estado inicial
                history: history || [initialMessage], // Guardamos el historial completo
            }, {
                onConflict: 'id' // Si ya existe, actualiza
            });

        if (dbError) {
            console.error(`[DB Error] Fallo al hacer upsert de la sesión de handoff ${sessionId}:`, dbError.message);
            // Podríamos devolver un error 500, pero por ahora solo lo logueamos para no detener la notificación
        }

        // =========== CREAR LA SESIÓN EN LA MEMORIA ===============
        if (!workspacesData[workspaceId]) {
            workspacesData[workspaceId] = {};
        }
        workspacesData[workspaceId][sessionId] = {
            status: 'pending',
            history: history || [initialMessage],
            assignedAgentId: null,
        };

        // Usamos la instancia REAL de 'io' para emitir al dashboard
        // El objeto que el frontend espera es { sessionId, initialMessage }
        io.to(`dashboard_${workspaceId}`).emit('new_chat_request', { sessionId, initialMessage });

        // --- CORRECCIÓN CLAVE ---
        // Usamos 'sessionId' directamente, no 'requestData.sessionId'
        console.log(`[Handoff Notifier] Notificación enviada para workspace: ${workspaceId}, sesión: ${sessionId}`);

        res.status(200).send('Notification sent');
    });

    // --- Ruta interna para reenviar mensajes de WhatsApp al dashboard ---
    app.post('/api/internal/forward-message', express.json(), (req, res) => {
        const { workspaceId, sessionId, message } = req.body;
        const secret = req.headers['x-internal-secret'];

        if (secret !== process.env.INTERNAL_API_SECRET) {
            return res.status(401).send('Unauthorized');
        }

        if (!workspaceId || !sessionId || !message) {
            return res.status(400).send('Missing data');
        }

        // Usamos la instancia REAL de 'io' para emitir al dashboard.
        // Usamos el evento que el frontend ya espera: 'incoming_user_message'
        io.to(`dashboard_${workspaceId}`).emit('incoming_user_message', { sessionId, message });

        console.log(`[Forwarder] Mensaje de sesión ${sessionId} reenviado al dashboard.`);
        res.status(200).send('Message forwarded');
    });

    // --- NUEVA RUTA INTERNA PARA NOTIFICAR ACTUALIZACIONES DE CHATS DE BOT ---
    app.post('/api/internal/bot-chat-update', express.json(), (req, res) => {
        const { workspaceId, chatData } = req.body;
        const secret = req.headers['x-internal-secret'];

        if (secret !== process.env.INTERNAL_API_SECRET) {
            return res.status(401).send('Unauthorized');
        }
        if (!workspaceId || !chatData) {
            return res.status(400).send('Missing data');
        }

        // Emitimos un evento a todos los dashboards de ese workspace
        io.to(`dashboard_${workspaceId}`).emit('bot_chat_updated', chatData);

        console.log(`[Bot Monitor] Actualización de chat ${chatData.sessionId} enviada al dashboard.`);
        res.status(200).send('Update forwarded');
    });

    io.attach(server, {
        cors: { origin: CLIENT_ORIGIN_URL },
        pingTimeout: 60000,
        pingInterval: 25000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling']
    })

    // 🔧 NUEVO: Función helper para limpiar referencias de socket
    const cleanupSocketReferences = (socketId) => {
        // Remover del mapa de agentes
        agentSockets.delete(socketId);

        // Remover de todas las sesiones
        for (const [sessionId, sockets] of sessionSockets) {
            sockets.delete(socketId);
            if (sockets.size === 0) {
                sessionSockets.delete(sessionId);
            }
        }
    };

    // 🔧 NUEVO: Función helper para agregar socket a sesión
    const addSocketToSession = (sessionId, socketId) => {
        if (!sessionSockets.has(sessionId)) {
            sessionSockets.set(sessionId, new Set());
        }
        sessionSockets.get(sessionId).add(socketId);
    };

    io.on('connection', (socket) => {
        console.log(`[Socket.IO] Cliente conectado: ${socket.id}`);

        // 🔧 NUEVO: Manejar información del agente
        socket.on('agent_info', ({ agentId, workspaceId }) => {
            agentSockets.set(socket.id, { agentId, workspaceId, sessionId: null });
            console.log(`[Socket.IO] Agent info registered: ${agentId} in workspace ${workspaceId}`);
        });

        socket.on('join_session', (sessionId) => {
            console.log(`[Socket.IO] Socket ${socket.id} joining session: ${sessionId}`);
            socket.join(sessionId);
            addSocketToSession(sessionId, socket.id);

            // Actualizar la información del agente si existe
            const agentInfo = agentSockets.get(socket.id);
            if (agentInfo) {
                agentInfo.sessionId = sessionId;
                agentSockets.set(socket.id, agentInfo);
            }

            console.log(`[Socket.IO] Socket ${socket.id} joined session: ${sessionId}`);
        });

        socket.on('join_agent_dashboard', ({ workspaceId }) => {
            if (workspaceId) {
                const dashboardRoom = `dashboard_${workspaceId}`;
                socket.join(dashboardRoom);
                console.log(`[Socket.IO] Socket ${socket.id} joined dashboard: ${dashboardRoom}`);

                // Registrar o actualizar la información del agente
                const agentInfo = agentSockets.get(socket.id) || {};
                agentInfo.workspaceId = workspaceId;
                agentSockets.set(socket.id, agentInfo);
            }
        });

        socket.on('new_handoff_request', async ({ workspaceId, requestData }) => {
            if (!workspaceId || !requestData?.sessionId) return;

            console.log(`[Socket.IO] New handoff request for session: ${requestData.sessionId}`);

            const sessionInMemory = workspacesData[workspaceId]?.[requestData.sessionId];
            if (sessionInMemory) {
                sessionInMemory.status = 'pending';

                // Insertar o actualizar la sesión en la base de datos
                const { error } = await supabase.from('chat_sessions').upsert({
                    id: requestData.sessionId,
                    workspace_id: workspaceId,
                    status: 'pending',
                    history: sessionInMemory.history || [],
                }, { onConflict: 'id' });

                if (error) {
                    console.error(`[DB Error] Upsert fallido para sesión ${requestData.sessionId}:`, error.message);
                } else {
                    console.log(`[DB Success] Sesión ${requestData.sessionId} creada/actualizada en la DB.`);
                }

                io.to(`dashboard_${workspaceId}`).emit('new_chat_request', requestData);
            }
        });

        socket.on('agent_joined', async ({ workspaceId, sessionId, agentId }) => {
            if (!workspaceId || !sessionId || !agentId) return;

            console.log(`[Socket.IO] Agent ${agentId} (${socket.id}) attempting to join session ${sessionId}`);

            const sessionInMemory = workspacesData[workspaceId]?.[sessionId];

            if (sessionInMemory && sessionInMemory.status === 'pending') {
                sessionInMemory.status = 'in_progress';
                sessionInMemory.assignedAgentId = agentId;

                // 🔧 MEJORADO: Registrar que este socket maneja esta sesión
                const agentInfo = agentSockets.get(socket.id) || {};
                agentInfo.agentId = agentId;
                agentInfo.workspaceId = workspaceId;
                agentInfo.sessionId = sessionId;
                agentSockets.set(socket.id, agentInfo);

                // El agente se une a la sala
                socket.join(sessionId);
                addSocketToSession(sessionId, socket.id);
                console.log(`[Socket.IO] Agent ${agentId} (${socket.id}) joined session room ${sessionId}`);

                // Actualizar DB
                const { error } = await supabase
                    .from('chat_sessions')
                    .update({ status: 'in_progress', assigned_agent_id: agentId })
                    .eq('id', sessionId);
                if (error) {
                    console.error(`[DB Error] No se pudo actualizar ${sessionId} a 'in_progress':`, error.message);
                }

                // 1. Obtén la configuración MÁS RECIENTE del bot desde la base de datos
                const { data: workspaceConfig } = await supabase
                    .from('workspaces')
                    .select('bot_name, bot_avatar_url')
                    .eq('id', workspaceId)
                    .single();


                // 🔧 MEJORADO: Secuencia de emisión con delays y mejor logging
                setTimeout(() => {
                    // Emitir status_change a toda la sala
                    const sessionSockets = io.sockets.adapter.rooms.get(sessionId);
                    console.log(`[Socket.IO] Session ${sessionId} has ${sessionSockets?.size || 0} connected sockets`);

                    io.to(sessionId).emit('status_change', 'in_progress');
                    console.log(`[Socket.IO] Status change 'in_progress' emitido a sala ${sessionId}`);
                }, 100);

                setTimeout(() => {
                    // Enviar historial al agente
                    socket.emit('assignment_success', {
                        sessionId,
                        history: sessionInMemory.history,
                        botConfig: {
                            name: workspaceConfig?.bot_name,
                            avatarUrl: workspaceConfig?.bot_avatar_url
                        }
                    });
                    console.log(`[Socket.IO] Assignment success enviado para sesión ${sessionId}`);
                }, 200);

                setTimeout(() => {
                    // Notificar a otros agentes que el chat fue tomado
                    socket.to(`dashboard_${workspaceId}`).emit('chat_taken', { sessionId });
                    console.log(`[Socket.IO] Chat taken notificado para sesión ${sessionId}`);
                }, 300);

            } else {
                console.log(`[Socket.IO] Assignment failed for session ${sessionId} - not available`);
                socket.emit('assignment_failure', { message: "Chat no disponible." });
            }
        });

        socket.on('user_message', async ({ workspaceId, sessionId, message }) => {
            if (!workspaceId || !sessionId) return;

            console.log(`[Socket.IO] User message received for session ${sessionId}`);

            try {
                // 1. Obtener el historial ACTUAL de la base de datos
                const { data: sessionData, error: fetchError } = await supabase
                    .from('chat_sessions')
                    .select('history')
                    .eq('id', sessionId)
                    .single();

                if (fetchError || !sessionData) {
                    console.error(`[DB Error] No se pudo obtener la sesión ${sessionId} para guardar mensaje de usuario.`);
                    return;
                }

                // 2. Añadir el nuevo mensaje del usuario
                const currentHistory = sessionData.history || [];
                const updatedHistory = [...currentHistory, message];

                // 3. Guardar el historial COMPLETO de vuelta en la DB
                const { error: updateError } = await supabase
                    .from('chat_sessions')
                    .update({ history: updatedHistory })
                    .eq('id', sessionId);

                if (updateError) {
                    console.error(`[DB Error] No se pudo actualizar el historial de ${sessionId} con mensaje de usuario:`, updateError.message);
                }

                // Sincroniza la memoria local también, para que `agent_joined` funcione
                if (workspacesData[workspaceId]?.[sessionId]) {
                    workspacesData[workspaceId][sessionId].history = updatedHistory;
                }

                // 4. Emitir el mensaje al dashboard del agente
                io.to(`dashboard_${workspaceId}`).emit('incoming_user_message', { sessionId, message });

                console.log(`[Socket.IO] Mensaje de usuario de la sesión ${sessionId} procesado y guardado.`);

            } catch (error) {
                console.error(`[Critical Error] en user_message para sesión ${sessionId}:`, error);
            }
        });

        socket.on('agent_message', async ({ workspaceId, sessionId, message }) => {
            console.log(`[Socket.IO] Agent message received for session ${sessionId}`);
            console.log(`[Socket.IO] Message content: "${message.content}"`);

            // 🔧 MEJORADO: Verificar que la sala existe y tiene miembros
            const sessionRoom = io.sockets.adapter.rooms.get(sessionId);
            console.log(`[Socket.IO] Session room ${sessionId} has ${sessionRoom?.size || 0} members`);

            if (sessionRoom && sessionRoom.size > 0) {
                console.log(`[Socket.IO] Room members:`, Array.from(sessionRoom));
            }

            try {
                // 1. Obtener el historial actual y la info de enrutamiento desde la DB
                const { data: sessionData, error: fetchError } = await supabase
                    .from('chat_sessions')
                    .select(`
                        history,
                        channel,
                        user_identifier,
                        workspaces ( twilio_configs ( * ) )
                    `)
                    .eq('id', sessionId)
                    .single();

                if (fetchError || !sessionData) {
                    console.error(`[DB Error] No se pudo obtener la sesión ${sessionId} para actualizar el historial.`, fetchError?.message);
                    return;
                }

                // 2. Añadir el nuevo mensaje del agente al historial que acabamos de obtener
                const currentHistory = sessionData.history || [];
                const updatedHistory = [...currentHistory, message];

                console.log(`[DIAGNÓSTICO] Historial actualizado ahora tiene ${updatedHistory.length} mensajes. Intentando guardar...`);

                // 3. Guardar el historial COMPLETO y actualizado de vuelta en la DB
                const { error: updateError } = await supabase
                    .from('chat_sessions')
                    .update({ history: updatedHistory })
                    .eq('id', sessionId);

                if (updateError) {
                    console.error(`[DB Error] No se pudo actualizar el historial de ${sessionId}:`, updateError.message);
                } else {
                    console.log(`[DIAGNÓSTICO] ¡ÉXITO! Historial guardado en la DB.`);
                }

                // 4. Enrutar el mensaje al canal correcto usando los datos que ya obtuvimos
                if (sessionData.channel === 'whatsapp') {
                    const twilioConfig = sessionData.workspaces?.twilio_configs;
                    if (twilioConfig && sessionData.user_identifier) {
                        console.log(`[Router] La sesión es de WhatsApp. Enviando a ${sessionData.user_identifier}`);
                        await sendWhatsAppMessage(sessionData.user_identifier, message.content, twilioConfig);
                    } else {
                        console.error(`[Router] Faltan datos para enviar a WhatsApp para la sesión ${sessionId}.`);
                    }
                } else {
                    // Si es 'web' o cualquier otro canal, usamos Socket.IO
                    console.log(`[Router] La sesión es web. Emitiendo a la sala de socket ${sessionId}`);
                    io.to(sessionId).emit('agent_message', message);
                }

                // Notificar al dashboard que el mensaje fue enviado (esto no cambia)
                io.to(`dashboard_${workspaceId}`).emit('agent_message_sent', { sessionId, message });

                console.log(`[Socket.IO] Procesamiento de agent_message para sesión ${sessionId} completado.`);

            } catch (error) {
                console.error(`[Critical Error] Error en el manejador de agent_message para la sesión ${sessionId}:`, error);
            }
        });

        socket.on('toggle_bot_status', async ({ workspaceId, sessionId }) => {

            if (!workspaceId || !sessionId) {
                console.log(`[Socket.IO] toggle_bot_status: workspaceId o sessionId no proporcionados.`);
                return;
            }

            try {
                // 1. Obtiene el estado actual de la sesión
                const { data: currentSession, error: fetchError } = await supabase
                    .from('chat_sessions')
                    .select('status, assigned_agent_id')
                    .eq('id', sessionId)
                    .single();

                if (fetchError || !currentSession) {
                    throw new Error("Session not found");
                }

                // Seguridad: Solo el agente asignado puede cambiar el estado
                // const agentInfo = agentSockets.get(socket.id);

                // if (agentInfo?.agentId !== currentSession.assigned_agent_id) {
                //     console.warn(`[Bot Control] Intento no autorizado de cambiar estado por agente ${agentInfo?.agentId}`);
                //     socket.emit('bot_control_error', { sessionId, message: 'Not authorized.' });
                //     return;
                // }

                // 2. Determina el nuevo estado
                const newStatus = currentSession.status === 'bot' ? 'in_progress' : 'bot';

                // 3. Actualiza la base de datos
                const { error: updateError } = await supabase
                    .from('chat_sessions')
                    .update({ status: newStatus })
                    .eq('id', sessionId);

                if (updateError) throw updateError;

                console.log(`[Bot Control] Estado de la sesión ${sessionId} cambiado a: ${newStatus}`);

                // 4. Notifica al panel para que actualice la UI
                io.to(`dashboard_${workspaceId}`).emit('session_status_changed', { sessionId, newStatus });

                // 5. Notifica al cliente (ChatbotUI) que el estado ha cambiado
                io.to(sessionId).emit('status_change', newStatus);

            } catch (error) {
                console.error("Error toggling bot status:", error);
                socket.emit('bot_control_error', { sessionId, message: 'Failed to change status.' });
            }
        });

        // --- Manejador para re-encolar un chat y que lo tome otro agente ---
        socket.on('transfer_to_queue', async ({ workspaceId, sessionId }) => {

            if (!workspaceId || !sessionId) {
                console.warn(`[Socket.IO] Workspace or Session not found`)
                return
            }

            try {
                console.log(`[Transfer] Agente solicitó transferir la sesión ${sessionId} a la cola.`);

                // 1. Actualiza el estado de la sesión en la DB de vuelta a 'pending'.
                // Mantenemos el 'assigned_agent_id' por si queremos saber quién lo atendió antes.
                await supabase
                    .from('chat_sessions')
                    .update({ status: 'pending' })
                    .eq('id', sessionId);

                // Actualizar el estado en memoria
                if (workspacesData[workspaceId] && workspacesData[workspaceId][sessionId]) {
                    workspacesData[workspaceId][sessionId].status = 'pending';
                }

                // 2. Obtiene el mensaje inicial para darle contexto a otro agente
                const { data: sessionData } = await supabase
                    .from('chat_sessions')
                    .select('history')
                    .eq('id', sessionId)
                    .single();

                // 3. Usamos el primer mensaje del historial como mensaje inicial
                const initialMessage = sessionData?.history?.[0] || { content: 'Chat Transferido' }

                // 4. Emite el evento 'new_chat_request' a TODOS los agentes del dashboard.
                io.to(`dashboard_${workspaceId}`).emit('new_chat_request', {
                    sessionId,
                    initialMessage,
                    isTransfer: true // Flag para que el frontend sepa que es una transferencia
                })

                // 5. Libera agente actual de la session
                const agentInfo = agentSockets.get(socket.id);
                if (agentInfo) {
                    agentInfo.sessionId = null;
                    agentSockets.set(socket.id, agentInfo)
                }


            } catch (error) {
                console.error(`Error al transferir la sesión ${sessionId} a la cola:`, error);
                socket.emit('command_error', { message: 'Failed to transfer chat.' });
            }

        });

        socket.on('get_summary', async ({ workspaceId, sessionId, language }) => {
            if (!workspaceId || !sessionId) return;

            try {
                console.log(`[Summary] Solicitud de resumen para la sesión ${sessionId}`);

                // 1. Obtiene el historial y la configuración de IA de la DB
                const { data: sessionData, error } = await supabase
                    .from('chat_sessions')
                    .select(`
                    history,
                    workspaces ( ai_model, ai_api_key_name, knowledge_base )
                `)
                    .eq('id', sessionId)
                    .single();

                if (error || !sessionData) throw new Error("Session not found");

                const workspaceConfig = sessionData.workspaces;
                const history = sessionData.history;

                // 2. Determina la clave API a usar
                const apiKey = process.env[workspaceConfig.ai_api_key_name] || process.env.GEMINI_API_KEY_DEFAULT;
                if (!apiKey) throw new Error("API Key not found");

                const aiConfig = {
                    model: workspaceConfig.ai_model,
                    apiKey: apiKey,
                };

                // 3. Llama a la nueva función de resumen del servicio dedicado
                const summary = await summarizeConversation(
                    history,
                    language || 'es', // O el idioma que prefieras
                    aiConfig
                );

                // 4. Envía el resumen de vuelta SOLO al agente que lo pidió
                socket.emit('summary_received', { sessionId, summary });

            } catch (error) {
                console.error("Error al generar el resumen:", error.message);
                socket.emit('command_error', { message: 'Failed to generate summary.' });
            }
        });

        socket.on('agent_intervene', async ({ workspaceId, sessionId, agentId }) => {
            console.log(`[AUDITORÍA] Intento de 'agent_intervene' recibido. Agente: ${agentId}, Sesión: ${sessionId}`);
            if (!workspaceId || !sessionId || !agentId) return;

            try {
                // 1. Verificamos que el chat todavía está en estado 'bot'
                const { data: currentSession, error: fetchError } = await supabase
                    .from('chat_sessions')
                    .select(`
                        status,
                        history,
                        workspaces ( bot_name, bot_avatar_url )
                    `)
                    .eq('id', sessionId)
                    .single();

                if (fetchError || !currentSession || currentSession.status !== 'bot') {
                    console.warn(`[Intervención] RECHAZADA para sesión ${sessionId}. Estado actual: ${currentSession?.status}.`);
                    socket.emit('assignment_failure', { message: "Este chat ya no está disponible para intervención." });
                    // Notificar a este agente que lo quite de su lista
                    socket.emit('remove_from_monitoring', { sessionId });
                    return;
                }

                // 2. Si está disponible, lo actualizamos a 'in_progress' y asignamos el agente
                const { error: updateError } = await supabase
                    .from('chat_sessions')
                    .update({ status: 'in_progress', assigned_agent_id: agentId })
                    .eq('id', sessionId);

                if (updateError) throw updateError;
                console.log(`[Intervención] APROBADA para sesión ${sessionId}. Asignando a agente ${agentId}.`);

                // 3. El agente que interviene se une a la sala
                socket.join(sessionId);
                addSocketToSession(sessionId, socket.id);
                console.log(`[Intervención] Agente ${agentId} (${socket.id}) se unió a la sala ${sessionId}`);

                const botConfigData = currentSession.workspaces;

                // 4. Notificamos al agente que la asignación fue exitosa (igual que en agent_joined)
                socket.emit('assignment_success', {
                    sessionId,
                    history: currentSession.history,
                    botConfig: {
                        name: botConfigData?.bot_name,
                        avatarUrl: botConfigData?.bot_avatar_url
                    }
                });
                console.log(`[Intervención] 'assignment_success' enviado al agente ${agentId}.`);

                // 5. Notificamos al cliente (ChatbotUI) que el estado ha cambiado a 'in_progress'
                io.to(sessionId).emit('status_change', 'in_progress');
                console.log(`[Intervención] 'status_change' a 'in_progress' enviado al cliente en la sala ${sessionId}.`);

                // 6. Notificamos a TODOS los dashboards que este chat ya no debe ser monitoreado
                io.to(`dashboard_${workspaceId}`).emit('remove_from_monitoring', { sessionId });
                console.log(`[Intervención] 'remove_from_monitoring' enviado a todos los dashboards.`);

            } catch (error) {
                console.error(`[Critical Error] en agent_intervene para sesión ${sessionId}:`, error);
                socket.emit('assignment_failure', { message: "Ocurrió un error al intervenir el chat." });
            }
        });

        socket.on('close_chat', async ({ workspaceId, sessionId }) => {
            console.log(`[Socket.IO] Closing chat for session ${sessionId}`);

            if (workspacesData[workspaceId]?.[sessionId]) {
                workspacesData[workspaceId][sessionId].status = 'closed';
            }

            // Actualizar la sesión en la DB a 'closed'
            const { error } = await supabase
                .from('chat_sessions')
                .update({ status: 'closed', ended_at: new Date().toISOString() })
                .eq('id', sessionId);
            if (error) {
                console.error(`[DB Error] No se pudo cerrar la sesión ${sessionId}:`, error.message);
            }

            // Emitir cambio de estado a toda la sala
            io.to(sessionId).emit('status_change', 'closed');

            // Limpiar referencias de la sesión
            sessionSockets.delete(sessionId);

            // Opcional: Limpiar de la memoria después de un tiempo
            setTimeout(() => {
                if (workspacesData[workspaceId]?.[sessionId]) {
                    delete workspacesData[workspaceId][sessionId];
                }
            }, 60000); // Limpiar después de 1 minuto
        });

        // 🔧 NUEVO: Manejar eventos de reconexión
        socket.on('reconnect', () => {
            console.log(`[Socket.IO] Socket ${socket.id} reconectado`);

            // Recuperar información del agente si existe
            const agentInfo = agentSockets.get(socket.id);
            if (agentInfo) {
                // Re-join al workspace dashboard
                if (agentInfo.workspaceId) {
                    socket.join(`dashboard_${agentInfo.workspaceId}`);
                    console.log(`[Socket.IO] Re-joined dashboard for workspace ${agentInfo.workspaceId}`);
                }

                // Re-join a la sesión activa
                if (agentInfo.sessionId) {
                    socket.join(agentInfo.sessionId);
                    addSocketToSession(agentInfo.sessionId, socket.id);
                    console.log(`[Socket.IO] Re-joined session ${agentInfo.sessionId}`);
                }
            }
        });

        // 🔧 MEJORADO: Cleanup al desconectar
        socket.on('disconnect', (reason) => {
            console.log(`[Socket.IO] Cliente desconectado: ${socket.id}, razón: ${reason}`);

            // Limpiar todas las referencias de este socket
            cleanupSocketReferences(socket.id);

            // Si era un agente, podrías querer notificar que se desconectó
            // (opcional, dependiendo de tus necesidades)
        });

        // 🔧 NUEVO: Heartbeat para mantener conexión activa
        const heartbeatInterval = setInterval(() => {
            if (socket.connected) {
                socket.emit('heartbeat', { timestamp: Date.now() });
            }
        }, 30000); // Cada 30 segundos

        socket.on('heartbeat_response', () => {
            // El cliente responde al heartbeat
            console.log(`[Socket.IO] Heartbeat response from ${socket.id}`);
        });

        // Limpiar el intervalo cuando el socket se desconecta
        socket.on('disconnect', () => {
            clearInterval(heartbeatInterval);
        });
    });

    // 🔧 NUEVO: Middleware para logging de eventos
    io.use((socket, next) => {
        console.log(`[Socket.IO] Nueva conexión desde: ${socket.handshake.address}`);
        next();
    });

    // 🔧 NUEVO: Manejo de errores del servidor
    io.engine.on('connection_error', (err) => {
        console.error('[Socket.IO] Connection error:', err);
    });

    // 4. La ruta "catch-all". Debe ser la última ruta que Express maneja.
    // Pasa cualquier petición que no haya sido manejada antes (como tu API)
    // al manejador de Next.js para que sirva las páginas de tu frontend.
    app.all('/{*splat}', (req, res) => {
        return handle(req, res);
    });

    server.listen(PORT, () => {
        console.log(`🚀 Servidor de WebSockets escuchando en el puerto ${PORT}`);
        console.log(`📡 Permitidas conexiones desde el origen: ${CLIENT_ORIGIN_URL}`);
    });


}).catch(err => {
    // Manejo de errores si Next.js falla al prepararse
    console.error('Error al preparar Next.js:', err.stack);
    process.exit(1);
})

// 🔧 NUEVO: Manejo de errores del servidor
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});