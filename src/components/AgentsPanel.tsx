// app/dashboard/components/AgentsPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { TeamMember } from '@/types/chatbot'; // Asegúrate de que este tipo exista en tus types

interface AgentsPanelProps {
    workspaceId: string;
}

export const AgentsPanel: React.FC<AgentsPanelProps> = ({ workspaceId }) => {
    const [agents, setAgents] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAgents = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/workspaces/${workspaceId}/members`);
                if (!response.ok) throw new Error('Failed to fetch team members');
                const data = await response.json();
                setAgents(data);
            } catch (error) {
                console.error("Error fetching agents:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (workspaceId) {
            fetchAgents();
        }
    }, [workspaceId]);

    if (isLoading) {
        return <div className="p-6">Loading team members...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Team Members</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    + Invite Agent
                </button>
            </div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map(agent => (
                            <tr key={agent.id}>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">{agent.name || '-'}</td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">{agent.email}</td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                    <span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${agent.role === 'admin' ? 'text-green-900 bg-green-200' : 'text-gray-700 bg-gray-200'}`}>
                                        {agent.role.charAt(0).toUpperCase() + agent.role.slice(1)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};