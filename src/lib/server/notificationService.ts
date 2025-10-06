// // app/lib/server/notificationService.ts

// import { io } from 'socket.io-client';
// import { Message } from '@/types/chatbot';

// // La URL de tu servidor de WebSockets, obtenida de las variables de entorno.
// const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'http://localhost:3001';

// // Creamos una única instancia del cliente para reutilizarlo
// const socket = io(WEBSOCKET_URL, {
//     // Opciones para asegurar que la connexion se mantenga desde el backend
//     reconnection: true,
//     reconnectionAttempts: 5,
//     reconnectionDelay: 1000,
// })

// socket.on('connect', () => {
//     console.log(`[NotificationService] Conectado al servidor de Websockets para notificaciones: ${WEBSOCKET_URL}`);
// })

// socket.on('connect_error', (err) => {
//     console.error(`[NotificationService] Error de conexión con WebSockets: ${err.message}`);
// });


// /**
//  * Notifica al dashboard de agentes que hay una nueva solicitud de chat
//  * @param workspaceId - El ID del workspace al que pertenece la solicitud. <-- CAMBIO
//  * @param requestData - Un objeto que contiene el sessionId y el initialMessage. <-- CAMBIO
//  */
// function notifyNewHandoffRequest(
//     workspaceId: string,
//     requestData: { sessionId: string; initialMessage: Message }
// ) {
//     if (socket.connected) {
//         // El payload del evento ahora incluye el workspaceId
//         // para que el servidor de sockets sepa a qué "carril" de agentes notificar.
//         socket.emit('new_handoff_request', {
//             workspaceId,
//             requestData
//         });
//         console.log(`[NotificationService] Notificación de handoff enviada para workspace: ${workspaceId}, sesión: ${requestData.sessionId}`);
//     } else {
//         console.error('[NotificationService] No se pudo enviar la notificación: Socket no conectado.');
//     }
// }

// export const notificationService = {
//     notifyNewHandoffRequest,
// }




// app/lib/server/notificationService.ts

import io from '../../../server-lib/socketInstance'
import { Message } from '@/types/chatbot';

/**
 * Notifica al dashboard de agentes que hay una nueva solicitud de chat
 * @param workspaceId - El ID del workspace al que pertenece la solicitud. 
 * @param requestData - Un objeto que contiene el sessionId y el initialMessage. 
 */
function notifyNewHandoffRequest(
    workspaceId: string,
    requestData: { sessionId: string; initialMessage: Message }
) {
    // ---> Usar la instancia `io` del servidor directamente <---
    // Emitimos el evento a la sala correcta. Esto es ahora una llamada a función
    // interna, no una petición de red. Es instantáneo y 100% fiable.
    io.to(`dashboard_${workspaceId}`).emit('new_handoff_request', {
        workspaceId,
        requestData
    });
    
    console.log(`[NotificationService] Notificación de handoff enviada DIRECTAMENTE para workspace: ${workspaceId}, sesión: ${requestData.sessionId}`);
}

export const notificationService = {
    notifyNewHandoffRequest,
};