// server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io')
const cors = require('cors');

// Cargar variables de entorno desde un archivo .env si no estamos en producción
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const CLIENT_ORIGIN_URL = process.env.CLIENT_ORIGIN_URL || 'http://localhost:3000';
const PORT = 3001;  // Puerto para este servidor. Diferente al de Next.js

const app = express();
const server = http.createServer(app);



// Configuracion de Socket.IO
const io = new Server(server, {
    cors: {
        // Permitir conexiones desde la APP NEXT.JS
        origin: CLIENT_ORIGIN_URL,
        methods: ["GET", "POST"]
    }
});

// --- Nuestra "Base de Datos" en Memoria ---
const chatHistories = {};
// Un objeto para rastrear el estado de las sesiones de handoff.
const handoffSessions = {}; // Ej: { "sessionId-123": "pending" | "taken" }

// Middleware para que Express pueda leer JSON del body
app.use(express.json());

// Configuración de CORS para permitir solicitudes desde la aplicación Next.js
app.use(cors({
    origin: CLIENT_ORIGIN_URL,
}))

// --- API Endpoint para obtener el historial de un chat ---
app.get('/api/history/:sessionId', (req, res) => {
    const {sessionId} = req.params;
    const history = chatHistories[sessionId] || [];
    console.log(`[API History] Solicitud para ${sessionId}. Encontrados ${history.length} mensajes.`);
    res.json(history);
})



// Evento principal: se dispara cuando un nuevo cliente (navegador) se conecta
io.on('connection', (socket) => {
    console.log(`[Socket.IO] Un cliente se ha conectado: ${socket.id}`);

    // --- Listeners de Unión ---

    // Evento para que un chat de usuario se una a su propia sala privada
    socket.on('join_session', (sessionId) => {
        socket.join(sessionId);
        console.log(`[Socket.IO] Cliente ${socket.id} se unió a la sala de sesion: ${sessionId}`);
    })

    // Evento para que el dashboard de un agente se una a la sala de "agentes"
    socket.on('join_agent_dashboard', () => {
        socket.join('agent_dashboard')
        console.log(`[Socket.IO] Cliente ${socket.id} se unió al dashboard de agentes`)
    })

    // --- Listeners de Mensajes (con lógica de guardado) ---

    // Evento para recibir un mensaje de un usuario y reenviarlo al dashboard
    socket.on('user_message', ({sessionId, message}) => {
        // Guardamos el mensaje en la "base de datos" en memoria
        if (!chatHistories[sessionId]) {
            chatHistories[sessionId] = [];
        }
        chatHistories[sessionId].push(message);
        // Reenviamos el mensaje a todos los que estan en la sala 'agent_dashboard'
        console.log(`[DB] Mensaje de usuario guardado en ${sessionId}. Total: ${chatHistories[sessionId].length}`);

        // Emitimos el mensaje a la sala de agentes
        console.log(`[Socket.IO] Mensaje recibido del usuario en sesion ${sessionId}`)
        io.to('agent_dashboard').emit('incoming_user_message', {
            sessionId,
            message
        })
    })

    // Evento para recibir un mensaje de un agente y reenviarlo al usuario correcto
    socket.on('agent_message', ({sessionId, message}) => {

        // Guardamos el mensaje en la "base de datos" en memoria
        if(!chatHistories[sessionId]) {
            chatHistories[sessionId] = [];
        }
        chatHistories[sessionId].push(message);
        console.log(`[DB] Mensaje de agente guardado en ${sessionId}. Total: ${chatHistories[sessionId].length}`);

        // Reenviamos el mensaje solo a la sala de la sesion del usuario
        console.log(`[Socket.IO] Mensaje recibido del agente para la sesion ${sessionId}`)
        io.to(sessionId).emit('agent_message', message)
    })

    // --- Listeners de Estado ---

    // Evento para recibir una solicitud de handoff desde el backend
    socket.on('new_handoff_request', (requestData) => {
        console.log('[Socket.IO] Recibida notificación de handoff desde el backend.');

        const {sessionId} = requestData;

        // Marcamos la sesión como pendiente de ser tomada.
        handoffSessions[sessionId] = 'pending';

        // Ahora reenviamos esta notificacion a todos los clientes en la sala 'agent_dashboard'
        io.to('agent_dashboard').emit('new_handoff_request', requestData)
        console.log('[Socket.IO] Notificación de handoff reenviada a los dashboards de agentes.');
    })

    // Evento para notificar que un agente se ha unido a una sesión
    socket.on('agent_joined', ({sessionId}) => {
        console.log(`[Socket.IO] Agente ${socket.id} se ha unido al chat ${sessionId}. Actualizando estado del cliente.`);
       
        // --- Logica de Bloqueo
        if (handoffSessions[sessionId] === 'pending') {
            // El chat esta disponible. El agente puede tomarlo
            handoffSessions[sessionId] === 'taken'; // Marcar como tomado

            console.log(`[Assign] Agente ${socket.id} ha tomado el chat ${sessionId}.`);

            // Notifica al cliente que un agente se ha unido
            io.to(sessionId).emit('status_change', 'in_progress');

            // Notifica a TODOS los demás agentes en el dashboard que este chat ya no está disponible.
            // Usamos `socket.to(...)` para emitir a todos MENOS al socket actual que lo tomó.
            socket.to('agent_dashboard').emit('chat_taken', { sessionId });
        } else {
            // El chat ya fue tomado o no existe.
            console.log(`[Assign] Fallo al tomar chat ${sessionId}. Ya estaba tomado.`);
            // Opcional: podrías notificar al agente que intentó tomarlo que falló.
            // socket.emit('assignment_failure', { message: 'This chat was already taken.' });
        }
    })

    socket.on('close_chat', ({sessionId}) => {
        console.log(`[Socket.IO] Agente ha cerrado el chat ${sessionId}. Notificando al cliente.`);

        // Notifica al cliente que el chat se ha cerrado
        io.to(sessionId).emit('status_change', 'closed')
    })

    // Evento cuando un cliente se desconecta
    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`)
    })

})

server.listen(PORT, () => {
    console.log(`Servidor de Websockets escuchando en el puerto ${PORT}`)
    console.log(`Permitidas conexiones desde el origen: ${CLIENT_ORIGIN_URL}`);
})