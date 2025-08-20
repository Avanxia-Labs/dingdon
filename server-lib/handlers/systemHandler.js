// System events and utilities handler
module.exports = (socket, appState, io) => {
    const { agentSockets } = appState;

    // Bot control events
    socket.on('bot_control', ({ workspaceId, sessionId, action, agentName }) => {
        if (!workspaceId || !sessionId || !action) return;
        
        console.log(`[Bot Control] ${action} for session ${sessionId}`);
        io.to(sessionId).emit('bot_control', { action, agentName });
    });

    // Heartbeat for connection maintenance
    const heartbeatInterval = setInterval(() => {
        if (socket.connected) {
            socket.emit('heartbeat', { timestamp: Date.now() });
        }
    }, 30000);

    socket.on('heartbeat_response', () => {
        // Client responded to heartbeat - connection is alive
    });

    // Clean up heartbeat on disconnect
    socket.on('disconnect', () => {
        clearInterval(heartbeatInterval);
    });
};

// Cleanup function for disconnected sockets
module.exports.cleanup = (socketId, appState) => {
    const { agentSockets, sessionSockets } = appState;
    
    // Remove from agent mapping
    agentSockets.delete(socketId);

    // Remove from all sessions
    for (const [sessionId, sockets] of sessionSockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
            sessionSockets.delete(sessionId);
        }
    }
};