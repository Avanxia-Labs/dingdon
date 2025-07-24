// // server.js

// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors');
// const supabase = require('./server-lib/supabaseClient');

// // Cargar variables de entorno
// require('dotenv').config();

// const CLIENT_ORIGIN_URL = process.env.CLIENT_ORIGIN_URL || 'http://localhost:3000';
// const PORT = process.env.PORT || 3001;

// const app = express();
// const server = http.createServer(app);

// app.use(cors({ origin: CLIENT_ORIGIN_URL }));
// app.use(express.json());

// // La "DB en memoria" para el estado de las sesiones activas
// const workspacesData = {};

// // 🔧 NUEVO: Mapa para rastrear agentes por socket
// const agentSockets = new Map(); // socketId -> { agentId, workspaceId, sessionId }

// // 🔧 NUEVO: Mapa para rastrear sesiones por socket
// const sessionSockets = new Map(); // sessionId -> Set of socketIds

// // API para obtener historial
// app.get('/api/history/:workspaceId/:sessionId', async (req, res) => {
//     const { workspaceId, sessionId } = req.params;
//     const { data, error } = await supabase
//         .from('chat_sessions')
//         .select('history')
//         .eq('id', sessionId)
//         .eq('workspace_id', workspaceId)
//         .single();

//     if (error || !data) {
//         return res.status(404).json({ error: 'History not found.' });
//     }
//     res.json({ history: data.history || [] });
// });

// // 🔧 CONFIGURACIÓN MEJORADA: Socket.IO con mejor gestión de reconexión
// const io = new Server(server, { 
//     cors: { origin: CLIENT_ORIGIN_URL },
//     pingTimeout: 60000,
//     pingInterval: 25000,
//     reconnection: true,
//     reconnectionAttempts: 5,
//     reconnectionDelay: 1000,
//     transports: ['websocket', 'polling']
// });

// // 🔧 NUEVO: Función helper para limpiar referencias de socket
// const cleanupSocketReferences = (socketId) => {
//     // Remover del mapa de agentes
//     agentSockets.delete(socketId);

//     // Remover de todas las sesiones
//     for (const [sessionId, sockets] of sessionSockets) {
//         sockets.delete(socketId);
//         if (sockets.size === 0) {
//             sessionSockets.delete(sessionId);
//         }
//     }
// };

// // 🔧 NUEVO: Función helper para agregar socket a sesión
// const addSocketToSession = (sessionId, socketId) => {
//     if (!sessionSockets.has(sessionId)) {
//         sessionSockets.set(sessionId, new Set());
//     }
//     sessionSockets.get(sessionId).add(socketId);
// };

// io.on('connection', (socket) => {
//     console.log(`[Socket.IO] Cliente conectado: ${socket.id}`);

//     // 🔧 NUEVO: Manejar información del agente
//     socket.on('agent_info', ({ agentId, workspaceId }) => {
//         agentSockets.set(socket.id, { agentId, workspaceId, sessionId: null });
//         console.log(`[Socket.IO] Agent info registered: ${agentId} in workspace ${workspaceId}`);
//     });

//     socket.on('join_session', (sessionId) => {
//         console.log(`[Socket.IO] Socket ${socket.id} joining session: ${sessionId}`);
//         socket.join(sessionId);
//         addSocketToSession(sessionId, socket.id);

//         // Actualizar la información del agente si existe
//         const agentInfo = agentSockets.get(socket.id);
//         if (agentInfo) {
//             agentInfo.sessionId = sessionId;
//             agentSockets.set(socket.id, agentInfo);
//         }

//         console.log(`[Socket.IO] Socket ${socket.id} joined session: ${sessionId}`);
//     });

//     socket.on('join_agent_dashboard', ({ workspaceId }) => {
//         if (workspaceId) {
//             const dashboardRoom = `dashboard_${workspaceId}`;
//             socket.join(dashboardRoom);
//             console.log(`[Socket.IO] Socket ${socket.id} joined dashboard: ${dashboardRoom}`);

//             // Registrar o actualizar la información del agente
//             const agentInfo = agentSockets.get(socket.id) || {};
//             agentInfo.workspaceId = workspaceId;
//             agentSockets.set(socket.id, agentInfo);
//         }
//     });

//     socket.on('new_handoff_request', async ({ workspaceId, requestData }) => {
//         if (!workspaceId || !requestData?.sessionId) return;

//         console.log(`[Socket.IO] New handoff request for session: ${requestData.sessionId}`);

//         const sessionInMemory = workspacesData[workspaceId]?.[requestData.sessionId];
//         if (sessionInMemory) {
//             sessionInMemory.status = 'pending';

//             // Insertar o actualizar la sesión en la base de datos
//             const { error } = await supabase.from('chat_sessions').upsert({
//                 id: requestData.sessionId,
//                 workspace_id: workspaceId,
//                 status: 'pending',
//                 history: sessionInMemory.history || [],
//             }, { onConflict: 'id' });

//             if (error) {
//                 console.error(`[DB Error] Upsert fallido para sesión ${requestData.sessionId}:`, error.message);
//             } else {
//                 console.log(`[DB Success] Sesión ${requestData.sessionId} creada/actualizada en la DB.`);
//             }

//             io.to(`dashboard_${workspaceId}`).emit('new_chat_request', requestData);
//         }
//     });

//     socket.on('agent_joined', async ({ workspaceId, sessionId, agentId }) => {
//         if (!workspaceId || !sessionId || !agentId) return;

//         console.log(`[Socket.IO] Agent ${agentId} (${socket.id}) attempting to join session ${sessionId}`);

//         const sessionInMemory = workspacesData[workspaceId]?.[sessionId];

//         if (sessionInMemory && sessionInMemory.status === 'pending') {
//             sessionInMemory.status = 'in_progress';
//             sessionInMemory.assignedAgentId = agentId;

//             // 🔧 MEJORADO: Registrar que este socket maneja esta sesión
//             const agentInfo = agentSockets.get(socket.id) || {};
//             agentInfo.agentId = agentId;
//             agentInfo.workspaceId = workspaceId;
//             agentInfo.sessionId = sessionId;
//             agentSockets.set(socket.id, agentInfo);

//             // El agente se une a la sala
//             socket.join(sessionId);
//             addSocketToSession(sessionId, socket.id);
//             console.log(`[Socket.IO] Agent ${agentId} (${socket.id}) joined session room ${sessionId}`);

//             // Actualizar DB
//             const { error } = await supabase
//                 .from('chat_sessions')
//                 .update({ status: 'in_progress', assigned_agent_id: agentId })
//                 .eq('id', sessionId);
//             if (error) {
//                 console.error(`[DB Error] No se pudo actualizar ${sessionId} a 'in_progress':`, error.message);
//             }

//             // 🔧 MEJORADO: Secuencia de emisión con delays y mejor logging
//             setTimeout(() => {
//                 // Emitir status_change a toda la sala
//                 const sessionSockets = io.sockets.adapter.rooms.get(sessionId);
//                 console.log(`[Socket.IO] Session ${sessionId} has ${sessionSockets?.size || 0} connected sockets`);

//                 io.to(sessionId).emit('status_change', 'in_progress');
//                 console.log(`[Socket.IO] Status change 'in_progress' emitido a sala ${sessionId}`);
//             }, 100);

//             setTimeout(() => {
//                 // Enviar historial al agente
//                 socket.emit('assignment_success', { sessionId, history: sessionInMemory.history });
//                 console.log(`[Socket.IO] Assignment success enviado para sesión ${sessionId}`);
//             }, 200);

//             setTimeout(() => {
//                 // Notificar a otros agentes que el chat fue tomado
//                 socket.to(`dashboard_${workspaceId}`).emit('chat_taken', { sessionId });
//                 console.log(`[Socket.IO] Chat taken notificado para sesión ${sessionId}`);
//             }, 300);

//         } else {
//             console.log(`[Socket.IO] Assignment failed for session ${sessionId} - not available`);
//             socket.emit('assignment_failure', { message: "Chat no disponible." });
//         }
//     });

//     socket.on('user_message', async ({ workspaceId, sessionId, message }) => {
//         if (!workspaceId || !sessionId) return;

//         console.log(`[Socket.IO] User message received for session ${sessionId}`);

//         if (!workspacesData[workspaceId]) workspacesData[workspaceId] = {};
//         if (!workspacesData[workspaceId][sessionId]) {
//             workspacesData[workspaceId][sessionId] = {
//                 status: 'bot',
//                 history: [],
//                 assignedAgentId: null,
//             };
//         }
//         workspacesData[workspaceId][sessionId].history.push(message);

//         // Actualizar el historial en la DB
//         const { error } = await supabase
//             .from('chat_sessions')
//             .update({ history: workspacesData[workspaceId][sessionId].history })
//             .eq('id', sessionId);
//         if (error) {
//             console.error(`[DB Error] No se pudo actualizar historial de ${sessionId}:`, error.message);
//         }

//         // 🔧 MEJORADO: Emitir a agentes en el dashboard
//         io.to(`dashboard_${workspaceId}`).emit('incoming_user_message', { sessionId, message });
//     });

//     socket.on('agent_message', async ({ workspaceId, sessionId, message }) => {
//         console.log(`[Socket.IO] Agent message received for session ${sessionId}`);
//         console.log(`[Socket.IO] Message content: "${message.content}"`);

//         // 🔧 MEJORADO: Verificar que la sala existe y tiene miembros
//         const sessionRoom = io.sockets.adapter.rooms.get(sessionId);
//         console.log(`[Socket.IO] Session room ${sessionId} has ${sessionRoom?.size || 0} members`);

//         if (sessionRoom && sessionRoom.size > 0) {
//             console.log(`[Socket.IO] Room members:`, Array.from(sessionRoom));
//         }

//         if (!workspaceId || !sessionId || !workspacesData[workspaceId]?.[sessionId]) {
//             console.error(`[Socket.IO] Missing data - workspaceId: ${workspaceId}, sessionId: ${sessionId}`);
//             return;
//         }

//         workspacesData[workspaceId][sessionId].history.push(message);

//         // Actualizar el historial en la DB
//         const { error } = await supabase
//             .from('chat_sessions')
//             .update({ history: workspacesData[workspaceId][sessionId].history })
//             .eq('id', sessionId);
//         if (error) {
//             console.error(`[DB Error] No se pudo actualizar historial de ${sessionId}:`, error.message);
//         }

//         // 🔧 MEJORADO: Emitir a la sala con mejor logging
//         console.log(`[Socket.IO] Emitting agent_message to session ${sessionId}`);

//         // Emitir a todos los miembros de la sala
//         io.to(sessionId).emit('agent_message', message);

//         // También emitir confirmación al dashboard
//         io.to(`dashboard_${workspaceId}`).emit('agent_message_sent', { sessionId, message });

//         console.log(`[Socket.IO] Agent message successfully emitted to session ${sessionId}`);
//     });

//     socket.on('close_chat', async ({ workspaceId, sessionId }) => {
//         console.log(`[Socket.IO] Closing chat for session ${sessionId}`);

//         if (workspacesData[workspaceId]?.[sessionId]) {
//             workspacesData[workspaceId][sessionId].status = 'closed';
//         }

//         // Actualizar la sesión en la DB a 'closed'
//         const { error } = await supabase
//             .from('chat_sessions')
//             .update({ status: 'closed', ended_at: new Date().toISOString() })
//             .eq('id', sessionId);
//         if (error) {
//             console.error(`[DB Error] No se pudo cerrar la sesión ${sessionId}:`, error.message);
//         }

//         // Emitir cambio de estado a toda la sala
//         io.to(sessionId).emit('status_change', 'closed');

//         // Limpiar referencias de la sesión
//         sessionSockets.delete(sessionId);

//         // Opcional: Limpiar de la memoria después de un tiempo
//         setTimeout(() => {
//             if (workspacesData[workspaceId]?.[sessionId]) {
//                 delete workspacesData[workspaceId][sessionId];
//             }
//         }, 60000); // Limpiar después de 1 minuto
//     });

//     // 🔧 NUEVO: Manejar eventos de reconexión
//     socket.on('reconnect', () => {
//         console.log(`[Socket.IO] Socket ${socket.id} reconectado`);

//         // Recuperar información del agente si existe
//         const agentInfo = agentSockets.get(socket.id);
//         if (agentInfo) {
//             // Re-join al workspace dashboard
//             if (agentInfo.workspaceId) {
//                 socket.join(`dashboard_${agentInfo.workspaceId}`);
//                 console.log(`[Socket.IO] Re-joined dashboard for workspace ${agentInfo.workspaceId}`);
//             }

//             // Re-join a la sesión activa
//             if (agentInfo.sessionId) {
//                 socket.join(agentInfo.sessionId);
//                 addSocketToSession(agentInfo.sessionId, socket.id);
//                 console.log(`[Socket.IO] Re-joined session ${agentInfo.sessionId}`);
//             }
//         }
//     });

//     // 🔧 MEJORADO: Cleanup al desconectar
//     socket.on('disconnect', (reason) => {
//         console.log(`[Socket.IO] Cliente desconectado: ${socket.id}, razón: ${reason}`);

//         // Limpiar todas las referencias de este socket
//         cleanupSocketReferences(socket.id);

//         // Si era un agente, podrías querer notificar que se desconectó
//         // (opcional, dependiendo de tus necesidades)
//     });

//     // 🔧 NUEVO: Heartbeat para mantener conexión activa
//     const heartbeatInterval = setInterval(() => {
//         if (socket.connected) {
//             socket.emit('heartbeat', { timestamp: Date.now() });
//         }
//     }, 30000); // Cada 30 segundos

//     socket.on('heartbeat_response', () => {
//         // El cliente responde al heartbeat
//         console.log(`[Socket.IO] Heartbeat response from ${socket.id}`);
//     });

//     // Limpiar el intervalo cuando el socket se desconecta
//     socket.on('disconnect', () => {
//         clearInterval(heartbeatInterval);
//     });
// });

// // 🔧 NUEVO: Middleware para logging de eventos
// io.use((socket, next) => {
//     console.log(`[Socket.IO] Nueva conexión desde: ${socket.handshake.address}`);
//     next();
// });

// // 🔧 NUEVO: Manejo de errores del servidor
// io.engine.on('connection_error', (err) => {
//     console.error('[Socket.IO] Connection error:', err);
// });

// server.listen(PORT, () => {
//     console.log(`🚀 Servidor de WebSockets escuchando en el puerto ${PORT}`);
//     console.log(`📡 Permitidas conexiones desde el origen: ${CLIENT_ORIGIN_URL}`);
// });

// // 🔧 NUEVO: Manejo de errores del servidor
// process.on('unhandledRejection', (reason, promise) => {
//     console.error('Unhandled Rejection at:', promise, 'reason:', reason);
// });

// process.on('uncaughtException', (error) => {
//     console.error('Uncaught Exception:', error);
//     process.exit(1);
// });








// DESPLIEGUE

// server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const supabase = require('./server-lib/supabaseClient');
const next = require('next')
const io = require('./server-lib/socketInstance');

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

    app.use(cors({ origin: CLIENT_ORIGIN_URL }));
    app.use(express.json());

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

    // 🔧 CONFIGURACIÓN MEJORADA: Socket.IO con mejor gestión de reconexión
    // const io = new Server(server, {
    //     cors: { origin: CLIENT_ORIGIN_URL },
    //     pingTimeout: 60000,
    //     pingInterval: 25000,
    //     reconnection: true,
    //     reconnectionAttempts: 5,
    //     reconnectionDelay: 1000,
    //     transports: ['websocket', 'polling']
    // });

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
                    socket.emit('assignment_success', { sessionId, history: sessionInMemory.history });
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

            if (!workspacesData[workspaceId]) workspacesData[workspaceId] = {};
            if (!workspacesData[workspaceId][sessionId]) {
                workspacesData[workspaceId][sessionId] = {
                    status: 'bot',
                    history: [],
                    assignedAgentId: null,
                };
            }
            workspacesData[workspaceId][sessionId].history.push(message);

            // Actualizar el historial en la DB
            const { error } = await supabase
                .from('chat_sessions')
                .update({ history: workspacesData[workspaceId][sessionId].history })
                .eq('id', sessionId);
            if (error) {
                console.error(`[DB Error] No se pudo actualizar historial de ${sessionId}:`, error.message);
            }

            // 🔧 MEJORADO: Emitir a agentes en el dashboard
            io.to(`dashboard_${workspaceId}`).emit('incoming_user_message', { sessionId, message });
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

            if (!workspaceId || !sessionId || !workspacesData[workspaceId]?.[sessionId]) {
                console.error(`[Socket.IO] Missing data - workspaceId: ${workspaceId}, sessionId: ${sessionId}`);
                return;
            }

            workspacesData[workspaceId][sessionId].history.push(message);

            // Actualizar el historial en la DB
            const { error } = await supabase
                .from('chat_sessions')
                .update({ history: workspacesData[workspaceId][sessionId].history })
                .eq('id', sessionId);
            if (error) {
                console.error(`[DB Error] No se pudo actualizar historial de ${sessionId}:`, error.message);
            }

            // 🔧 MEJORADO: Emitir a la sala con mejor logging
            console.log(`[Socket.IO] Emitting agent_message to session ${sessionId}`);

            // Emitir a todos los miembros de la sala
            io.to(sessionId).emit('agent_message', message);

            // También emitir confirmación al dashboard
            io.to(`dashboard_${workspaceId}`).emit('agent_message_sent', { sessionId, message });

            console.log(`[Socket.IO] Agent message successfully emitted to session ${sessionId}`);
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
    app.all('*', (req, res) => {
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