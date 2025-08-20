// Connection and session management handlers
module.exports = (socket, appState, io) => {
    const { agentSockets, sessionSockets } = appState;

    // Register agent information
    socket.on('agent_info', ({ agentId, agentName, workspaceId }) => {
        agentSockets.set(socket.id, { 
            agentId, 
            agentName: agentName || 'Unknown Agent', 
            workspaceId, 
            sessionId: null 
        });
        console.log(`[Agent] Registered: ${agentId} in workspace ${workspaceId}`);
    });

    // Join specific session
    socket.on('join_session', (sessionId) => {
        socket.join(sessionId);
        addSocketToSession(sessionId, socket.id, sessionSockets);
        
        const agentInfo = agentSockets.get(socket.id);
        if (agentInfo) {
            agentInfo.sessionId = sessionId;
            agentSockets.set(socket.id, agentInfo);
        }
        console.log(`[Session] ${socket.id} joined ${sessionId}`);
    });

    // Join agent dashboard
    socket.on('join_agent_dashboard', ({ workspaceId }) => {
        if (workspaceId) {
            const dashboardRoom = `dashboard_${workspaceId}`;
            socket.join(dashboardRoom);
            
            const agentInfo = agentSockets.get(socket.id) || {};
            agentInfo.workspaceId = workspaceId;
            agentSockets.set(socket.id, agentInfo);
            
            console.log(`[Dashboard] ${socket.id} joined ${dashboardRoom}`);
        }
    });

    // Handle reconnection
    socket.on('reconnect', () => {
        const agentInfo = agentSockets.get(socket.id);
        if (agentInfo) {
            if (agentInfo.workspaceId) {
                socket.join(`dashboard_${agentInfo.workspaceId}`);
            }
            if (agentInfo.sessionId) {
                socket.join(agentInfo.sessionId);
                addSocketToSession(agentInfo.sessionId, socket.id, sessionSockets);
            }
        }
        console.log(`[Reconnect] ${socket.id} restored`);
    });
};

// Helper function to add socket to session
function addSocketToSession(sessionId, socketId, sessionSockets) {
    if (!sessionSockets.has(sessionId)) {
        sessionSockets.set(sessionId, new Set());
    }
    sessionSockets.get(sessionId).add(socketId);
}