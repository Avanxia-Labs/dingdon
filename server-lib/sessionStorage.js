// server-lib/sessionStore.js

/**
 * Este módulo simula una base de datos en memoria para gestionar las sesiones de chat.
 * En una aplicación de producción, esto sería reemplazado por una conexión
 * a una base de datos real como Redis o MongoDB.
 */

const sessions = new Map();

/**
 * Obtiene una sesion por su ID
 * @param {string} sessionId - El ID de la sesion a obtener
 * @returns {object | undefined} - La sesión encontrada o undefined si no existe
 */
function getSession(sessionId) {
    return sessions.get(sessionId);
}

/**
 * Inicia una nueva sesion de handoff o la marca como pendiente
 * @param {string} sessionId - El ID de la sesion a iniciar o marcar como pendiente
 */
function startHandoff(sessionId) {

    if (!sessions.has(sessionId)) {
        // Si la sesion no existe, la creamos
        sessions.set(sessionId, {
            status: 'pending',
            history: [],
            assignatedAgent: null,
        })
    } else {
        // Si ya existe, la marcamos como pendiente
        sessions.get(sessionId).status = 'pending';
    }
}


/**
 * Añade un mensaje al historial de una sesion
 * @param {string} sessionId - El ID de la sesion a la que añadir el mensaje
 * @param {object} message - El mensaje a añadir al historial
 */
function addMessage(sessionId, message) {
    if(sessions.has(sessionId)) {
        sessions.get(sessionId).history.push(message)
    }
}


/**
 * Intenta asignar un agente a una sesión. Devuelve la sesión si tiene éxito.
 * @param {string} sessionId
 * @param {string} agentSocketId
 * @returns {object | null} La sesión si la asignación fue exitosa, o null si ya estaba tomada.
 */
function assignAgent(sessionId, agentSocketId) {
    const session = sessions.get(sessionId);
    if (session && session.status === 'pending') {
        session.status = 'in_progress';
        session.assignedAgentId = agentSocketId;
        return session;
    }
    return null; // El chat no estaba disponible para ser tomado.
}


/**
 * Cierra una sesión.
 * @param {string} sessionId 
 */
function closeSession(sessionId) {
    if (sessions.has(sessionId)) {
        sessions.get(sessionId).status = 'closed';
        
    }
}

// Exportamos las funciones para que puedan ser usadas en otros archivos.
module.exports = {
    getSession,
    startHandoff,
    addMessage,
    assignAgent,
    closeSession,
};