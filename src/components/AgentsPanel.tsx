// // app/dashboard/components/AgentsPanel.tsx
// 'use client';

// import { useState, useEffect, FormEvent } from 'react';
// import { TeamMember, WorkspaceRole } from '@/types/chatbot';
// import { Trash2 } from 'lucide-react';

// interface AgentsPanelProps {
//     workspaceId: string;
// }

// export const AgentsPanel: React.FC<AgentsPanelProps> = ({ workspaceId }) => {
//     const [agents, setAgents] = useState<TeamMember[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [feedback, setFeedback] = useState<string | null>(null);
//     const [isSubmitting, setIsSubmitting] = useState(false);

//     // Estados para los campos del formulario
//     const [name, setName] = useState('');
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [role, setRole] = useState<WorkspaceRole>('agent');

//     // Función para obtener la lista de agentes (sin cambios)
//     const fetchAgents = async () => {
//         setIsLoading(true);
//         try {
//             const response = await fetch(`/api/workspaces/${workspaceId}/members`);
//             if (!response.ok) throw new Error('Failed to fetch team members');
//             const data = await response.json();
//             setAgents(data);
//         } catch (error) {
//             console.error("Error fetching agents:", error);
//             // Opcional: mostrar un feedback de error al cargar
//             setFeedback("Could not load team members.");
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // Cargar los agentes cuando el componente se monta o el workspaceId cambia
//     useEffect(() => {
//         if (workspaceId) {
//             fetchAgents();
//         }
//     }, [workspaceId]);


//     // Manejador para el formulario de invitación
//     const handleInviteAgent = async (e: FormEvent) => {
//         e.preventDefault();
//         setIsSubmitting(true);
//         setFeedback('Sending invitation...');

//         try {
//             const response = await fetch(`/api/workspaces/${workspaceId}/invite`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ name, email, password, role }),
//             });

//             const data = await response.json();
//             if (!response.ok) {
//                 throw new Error(data.error || 'Failed to invite agent');
//             }

//             setFeedback('Agent invited successfully!');


//             // Se ha descomentado esta línea para que la tabla se actualice con el nuevo miembro.
//             fetchAgents();

//             // Limpiar el formulario para la siguiente invitación
//             setName('');
//             setEmail('');
//             setPassword('');
//             setRole('agent');

//         } catch (error: any) {
//             setFeedback(`Error: ${error.message}`);
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     const handleDeleteAgent = async (agentId: string, agentName: string | null) => {
//         const agentDisplayName = agentName || 'this agent';
//         if (!confirm(`Are you sure you want to remove ${agentDisplayName} from this workspace? This will delete their account.`)) {
//             return;
//         }

//         setFeedback('Removing agent...');
//         try {
//             const response = await fetch(`/api/workspaces/${workspaceId}/members/${agentId}`, {
//                 method: 'DELETE',
//             });

//             const data = await response.json();
//             if (!response.ok) throw new Error(data.error || 'Failed to remove agent');

//             setFeedback('Agent removed successfully!');
//             fetchAgents();

//         } catch (error: any) {
//             setFeedback(`Error: ${error.message}`);
//         }
//     };

//     if (isLoading) {
//         return <div className="p-6">Loading team members...</div>;
//     }

//     return (
//         <div className="p-6">
//             <h2 className="text-2xl font-bold text-gray-800 mb-6">Team Members</h2>

//             {/* Formulario de invitación */}
//             <div className="bg-white p-6 rounded-lg shadow-md mb-8">
//                 <h3 className="text-lg font-semibold mb-4 text-gray-700">Invite New Member</h3>
//                 <form onSubmit={handleInviteAgent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
//                     <div>
//                         <label htmlFor="name" className="block text-sm font-medium text-gray-600">Full Name</label>
//                         <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
//                     </div>
//                     <div>
//                         <label htmlFor="email" className="block text-sm font-medium text-gray-600">Email</label>
//                         <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
//                     </div>
//                     <div>
//                         <label htmlFor="password" className="block text-sm font-medium text-gray-600">Initial Password</label>
//                         <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
//                     </div>
//                     <div>
//                         <label htmlFor="role" className="block text-sm font-medium text-gray-600">Role</label>
//                         <select id="role" value={role} onChange={e => setRole(e.target.value as WorkspaceRole)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-blue-500">
//                             <option value="agent">Agent</option>
//                             <option value="admin">Admin</option>
//                         </select>
//                     </div>
//                     <div className="lg:col-span-4">
//                         <button type="submit" disabled={isSubmitting} className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
//                             {isSubmitting ? 'Sending...' : '+ Invite Member'}
//                         </button>
//                     </div>
//                 </form>
//                 {feedback && <p className="mt-4 text-sm text-center text-gray-600">{feedback}</p>}
//             </div>

//             {/* Tabla de miembros existentes */}
//             <div className="bg-white shadow rounded-lg overflow-hidden">
//                 <table className="min-w-full leading-normal">
//                     <thead>
//                         <tr>
//                             <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
//                             <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
//                             <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
//                             <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                                 Actions
//                             </th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {agents.map(agent => (
//                             <tr key={agent.id}>
//                                 <td className="px-5 py-4 border-b border-gray-200 text-sm">{agent.name || '-'}</td>
//                                 <td className="px-5 py-4 border-b border-gray-200 text-sm">{agent.email}</td>
//                                 <td className="px-5 py-4 border-b border-gray-200 text-sm">
//                                     <span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${agent.role === 'admin' ? 'text-green-900 bg-green-200' : 'text-gray-700 bg-gray-200'}`}>
//                                         {agent.role.charAt(0).toUpperCase() + agent.role.slice(1)}
//                                     </span>
//                                 </td>
//                                 <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">
//                                     <button
//                                         onClick={() => handleDeleteAgent(agent.id, agent.name)}
//                                         className="text-red-600 hover:text-red-900"
//                                         title="Remove Agent"
//                                     >
//                                         <Trash2 size={18} />
//                                     </button>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// };


'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { TeamMember, WorkspaceRole } from '@/types/chatbot';
import { Trash2 } from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSyncLanguage } from '@/hooks/useSyncLanguage';

interface AgentsPanelProps {
    workspaceId: string;
}

export const AgentsPanel: React.FC<AgentsPanelProps> = ({ workspaceId }) => {
    const { t } = useTranslation();
    const language = useDashboardStore((state) => state.language);
    useSyncLanguage(language);

    const [agents, setAgents] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<WorkspaceRole>('agent');

    const fetchAgents = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/members`);
            if (!response.ok) throw new Error('Failed to fetch team members');
            const data = await response.json();
            setAgents(data);
        } catch (error) { console.error("Error fetching agents:", error); setFeedback("Could not load team members."); } finally { setIsLoading(false); }
    };

    useEffect(() => { if (workspaceId) { fetchAgents(); } }, [workspaceId]);

    const handleInviteAgent = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFeedback(t('agents.feedback.inviting'));
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/invite`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, role }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to invite agent');
            setFeedback(t('agents.feedback.invitedSuccess'));
            fetchAgents();
            setName(''); setEmail(''); setPassword(''); setRole('agent');
        } catch (error: any) { setFeedback(`${t('common.errorPrefix')}: ${error.message}`); } finally { setIsSubmitting(false); }
    };

    const handleDeleteAgent = async (agentId: string, agentName: string | null) => {
        const agentDisplayName = agentName || 'this agent';
        if (!confirm(t('agents.deleteConfirm', { name: agentDisplayName }))) { return; }
        setFeedback(t('agents.feedback.removing'));
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/members/${agentId}`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to remove agent');
            setFeedback(t('agents.feedback.removedSuccess'));
            fetchAgents();
        } catch (error: any) { setFeedback(`${t('common.errorPrefix')}: ${error.message}`); }
    };

    if (isLoading) { return <div className="p-6">{t('common.loading')}</div>; }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('agents.pageTitle')}</h2>
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">{t('agents.inviteTitle')}</h3>
                <form onSubmit={handleInviteAgent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-600">{t('agents.fullNameLabel')}</label>
                        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-600">{t('common.email')}</label>
                        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-600">{t('agents.initialPasswordLabel')}</label>
                        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-600">{t('common.role')}</label>
                        <select id="role" value={role} onChange={e => setRole(e.target.value as WorkspaceRole)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-blue-500">
                            <option value="agent">{t('agents.roleAgent')}</option>
                            <option value="admin">{t('agents.roleAdmin')}</option>
                        </select>
                    </div>
                    <div className="lg:col-span-4">
                        <button type="submit" disabled={isSubmitting} className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                            {isSubmitting ? t('agents.invitingButton') : `+ ${t('agents.inviteButton')}`}
                        </button>
                    </div>
                </form>
                {feedback && <p className="mt-4 text-sm text-center text-gray-600">{feedback}</p>}
            </div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('common.name')}</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('common.email')}</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('common.role')}</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map(agent => (
                            <tr key={agent.id}>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">{agent.name || '-'}</td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">{agent.email}</td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm"><span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${agent.role === 'admin' ? 'text-green-900 bg-green-200' : 'text-gray-700 bg-gray-200'}`}>{agent.role === 'admin' ? t('agents.roleAdmin') : t('agents.roleAgent')}</span></td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm text-center"><button onClick={() => handleDeleteAgent(agent.id, agent.name)} className="text-red-600 hover:text-red-900" title={t('common.delete')}><Trash2 size={18} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};