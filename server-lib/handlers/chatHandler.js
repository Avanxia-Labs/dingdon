// Chat message and session management handlers
module.exports = (socket, appState, io, supabase, sendWhatsAppMessage) => {
    const { workspacesData, agentSockets, sessionSockets } = appState;

    // Handle handoff requests
    socket.on('new_handoff_request', async ({ workspaceId, requestData }) => {
        if (!workspaceId || !requestData?.sessionId) return;

        const sessionInMemory = workspacesData[workspaceId]?.[requestData.sessionId];
        if (sessionInMemory) {
            sessionInMemory.status = 'pending';

            const { error } = await supabase.from('chat_sessions').upsert({
                id: requestData.sessionId,
                workspace_id: workspaceId,
                status: 'pending',
                history: sessionInMemory.history || [],
            }, { onConflict: 'id' });

            if (error) {
                console.error(`[DB] Handoff upsert error:`, error.message);
            }

            io.to(`dashboard_${workspaceId}`).emit('new_chat_request', requestData);
        }
    });

    // Handle agent joining session
    socket.on('agent_joined', async ({ workspaceId, sessionId, agentId, agentName }) => {
        if (!workspaceId || !sessionId || !agentId) return;

        let sessionInMemory = workspacesData[workspaceId]?.[sessionId];

        // Load from database if not in memory
        if (!sessionInMemory) {
            const { data: sessionData, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('id', sessionId)
                .eq('workspace_id', workspaceId)
                .single();
                
            if (!error && sessionData) {
                if (!workspacesData[workspaceId]) workspacesData[workspaceId] = {};
                sessionInMemory = {
                    status: sessionData.status || 'pending',
                    history: sessionData.history || [],
                    assignedAgentId: sessionData.assigned_agent_id,
                };
                workspacesData[workspaceId][sessionId] = sessionInMemory;
            }
        }

        const canJoin = sessionInMemory && (
            sessionInMemory.status === 'pending' || 
            sessionInMemory.status === 'in_progress'
        );

        if (canJoin) {
            const isFirstTime = sessionInMemory.status === 'pending';
            
            if (isFirstTime) {
                sessionInMemory.status = 'in_progress';
                sessionInMemory.assignedAgentId = agentId;
            } else if (sessionInMemory.assignedAgentId !== agentId) {
                sessionInMemory.assignedAgentId = agentId;
            }

            // Update agent info
            const agentInfo = agentSockets.get(socket.id) || {};
            agentInfo.agentId = agentId;
            agentInfo.workspaceId = workspaceId;
            agentInfo.sessionId = sessionId;
            agentSockets.set(socket.id, agentInfo);

            // Join session room
            socket.join(sessionId);
            addSocketToSession(sessionId, socket.id, sessionSockets);

            // Update database
            await supabase
                .from('chat_sessions')
                .update({ status: 'in_progress', assigned_agent_id: agentId })
                .eq('id', sessionId);

            // Get bot config
            const { data: workspaceConfig } = await supabase
                .from('workspaces')
                .select('bot_name, bot_avatar_url')
                .eq('id', workspaceId)
                .single();

            // Emit events with delays
            setTimeout(() => {
                io.to(sessionId).emit('status_change', 'in_progress');
            }, 100);

            setTimeout(() => {
                socket.emit('assignment_success', {
                    sessionId,
                    history: sessionInMemory.history,
                    botConfig: {
                        name: workspaceConfig?.bot_name,
                        avatarUrl: workspaceConfig?.bot_avatar_url
                    }
                });
            }, 200);

            setTimeout(() => {
                socket.to(`dashboard_${workspaceId}`).emit('chat_taken', { sessionId });
            }, 250);

            // Add waiting message for first-time joins
            if (isFirstTime) {
                setTimeout(() => {
                    const waitingMessage = {
                        id: `system-waiting-${Date.now()}`,
                        content: `⏳ Esperando respuesta de ${agentName || 'Agente de Soporte'}...`,
                        role: 'system',
                        timestamp: new Date().toISOString()
                    };
                    
                    sessionInMemory.history.push(waitingMessage);
                    
                    supabase.from('chat_sessions')
                        .update({ history: sessionInMemory.history })
                        .eq('id', sessionId);
                    
                    io.to(sessionId).emit('agent_message', waitingMessage);
                }, 300);
            }
        } else {
            socket.emit('assignment_failure', { message: "Chat no disponible." });
        }
    });

    // Handle user messages
    socket.on('user_message', async ({ workspaceId, sessionId, message }) => {
        if (!workspaceId || !sessionId) return;

        if (!workspacesData[workspaceId]) workspacesData[workspaceId] = {};
        if (!workspacesData[workspaceId][sessionId]) {
            workspacesData[workspaceId][sessionId] = {
                status: 'bot',
                history: [],
                assignedAgentId: null,
            };
        }
        workspacesData[workspaceId][sessionId].history.push(message);

        await supabase
            .from('chat_sessions')
            .update({ history: workspacesData[workspaceId][sessionId].history })
            .eq('id', sessionId);

        io.to(`dashboard_${workspaceId}`).emit('incoming_user_message', { sessionId, message });
    });

    // Handle agent messages
    socket.on('agent_message', async ({ workspaceId, sessionId, message }) => {
        try {
            const { data: sessionData, error } = await supabase
                .from('chat_sessions')
                .select(`
                    history,
                    channel,
                    user_identifier,
                    workspaces ( twilio_configs ( * ) )
                `)
                .eq('id', sessionId)
                .single();

            if (error || !sessionData) {
                console.error(`[DB] Failed to get session ${sessionId}`);
                return;
            }

            const updatedHistory = [...(sessionData.history || []), message];

            await supabase
                .from('chat_sessions')
                .update({ history: updatedHistory })
                .eq('id', sessionId);

            // Route message based on channel
            if (sessionData.channel === 'whatsapp') {
                const twilioConfig = sessionData.workspaces?.twilio_configs;
                if (twilioConfig && sessionData.user_identifier) {
                    await sendWhatsAppMessage(sessionData.user_identifier, message.content, twilioConfig);
                }
            } else {
                io.to(sessionId).emit('agent_message', message);
            }

            io.to(`dashboard_${workspaceId}`).emit('agent_message_sent', { sessionId, message });

        } catch (error) {
            console.error(`[Agent Message] Error:`, error);
        }
    });

    // Handle chat closing
    socket.on('close_chat', async ({ workspaceId, sessionId }) => {
        if (workspacesData[workspaceId]?.[sessionId]) {
            workspacesData[workspaceId][sessionId].status = 'closed';
        }

        await supabase
            .from('chat_sessions')
            .update({ status: 'closed', ended_at: new Date().toISOString() })
            .eq('id', sessionId);

        io.to(sessionId).emit('status_change', 'closed');
        sessionSockets.delete(sessionId);

        // Cleanup after 1 minute
        setTimeout(() => {
            if (workspacesData[workspaceId]?.[sessionId]) {
                delete workspacesData[workspaceId][sessionId];
            }
        }, 60000);
    });
};

// Helper function
function addSocketToSession(sessionId, socketId, sessionSockets) {
    if (!sessionSockets.has(sessionId)) {
        sessionSockets.set(sessionId, new Set());
    }
    sessionSockets.get(sessionId).add(socketId);
}