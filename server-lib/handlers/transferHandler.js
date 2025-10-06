// Chat transfer between agents handler
module.exports = (socket, appState, io, supabase) => {
    const { workspacesData, agentSockets } = appState;

    socket.on('transfer_chat', async ({ workspaceId, sessionId, targetAgentId, targetAgentEmail, targetAgentName }) => {
        console.log(`[Transfer] Starting: ${sessionId} -> ${targetAgentId}`);
        
        try {
            // Get session data
            const { data: sessionData, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('id', sessionId)
                .eq('workspace_id', workspaceId)
                .single();
            
            if (error || !sessionData) {
                socket.emit('transfer_failed', { sessionId, message: 'Sesión no encontrada' });
                return;
            }
            
            // Get current agent info
            const currentAgentInfo = agentSockets.get(socket.id);
            const currentAgentId = currentAgentInfo?.agentId || sessionData.assigned_agent_id;
            
            // Create transfer info
            const transferInfo = {
                transferredBy: socket.id,
                transferredFrom: currentAgentId,
                transferredTo: targetAgentId,
                transferredAt: new Date().toISOString(),
                targetAgentName: targetAgentName || targetAgentEmail
            };
            
            // Update memory if exists
            if (workspacesData[workspaceId]?.[sessionId]) {
                workspacesData[workspaceId][sessionId].transferInfo = transferInfo;
            }
            
            // Create transfer message
            const transferMessage = {
                id: `system-transfer-${Date.now()}`,
                content: `📤 Chat transferido a ${targetAgentName || targetAgentEmail}`,
                role: 'system',
                timestamp: new Date().toISOString(),
                metadata: {
                    type: 'transfer',
                    fromAgent: currentAgentId,
                    toAgent: targetAgentId
                }
            };
            
            const updatedHistory = [...(sessionData.history || []), transferMessage];
            
            // Update database
            const { error: updateError } = await supabase
                .from('chat_sessions')
                .update({ 
                    history: updatedHistory,
                    status: 'pending',
                    assigned_agent_id: targetAgentId,
                    transfer_info: transferInfo
                })
                .eq('id', sessionId);
            
            if (updateError) {
                socket.emit('transfer_failed', { sessionId, message: 'Error al actualizar la transferencia' });
                return;
            }
            
            // Emit system message
            io.to(sessionId).emit('agent_message', transferMessage);
            
            // Find target agent socket
            let targetSocketId = null;
            for (const [socketId, agentInfo] of agentSockets.entries()) {
                if (agentInfo.agentId === targetAgentId && agentInfo.workspaceId === workspaceId) {
                    targetSocketId = socketId;
                    break;
                }
            }
            
            // Create transfer request
            const transferRequest = {
                sessionId: sessionId,
                initialMessage: {
                    content: sessionData.history?.[sessionData.history.length - 1]?.content || 'Chat transferido',
                    role: 'user',
                    timestamp: new Date().toISOString()
                },
                fullHistory: updatedHistory,
                transferInfo: transferInfo,
                transferredFrom: currentAgentInfo?.agentName || 'otro agente'
            };
            
            // Send to target agent
            if (targetSocketId) {
                io.to(targetSocketId).emit('personal_transfer_received', transferRequest);
                console.log(`[Transfer] Sent to agent ${targetAgentId}`);
            } else {
                console.log(`[Transfer] Agent ${targetAgentId} not connected`);
            }
            
            // Remove from current agent
            socket.emit('transfer_success', { 
                sessionId,
                message: `Chat transferido exitosamente a ${targetAgentName || targetAgentEmail}`
            });
            
            socket.leave(sessionId);
            if (currentAgentInfo) {
                currentAgentInfo.sessionId = null;
                agentSockets.set(socket.id, currentAgentInfo);
            }
            
            console.log(`[Transfer] Completed: ${sessionId}`);
            
        } catch (error) {
            console.error(`[Transfer] Error:`, error);
            socket.emit('transfer_failed', { sessionId, message: 'Error inesperado en la transferencia' });
        }
    });
};