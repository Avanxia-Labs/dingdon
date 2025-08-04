// app/dashboard/components/SuperAdminPanel.tsx
'use client';

import { useState, useEffect } from 'react';

// Define una interfaz para la estructura de un workspace para un tipado fuerte
interface Workspace {
    id: string;
    name: string;
    created_at: string;
    owner_id: string;

    ai_model?: string;
    ai_api_key?: string;
}

export const SuperAdminPanel = () => {
    // Estado para almacenar la lista de workspaces obtenidos de la API
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    // Estado para controlar la visualización del loader
    const [isLoading, setIsLoading] = useState(true);
    // Estado para manejar los mensajes de error o éxito
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    // Estados para los campos del formulario de creación
    const [workspaceName, setWorkspaceName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');

    // Estados de configuracion de modelo IA y API
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [aiModel, setAiModel] = useState('');
    const [aiApiKey, setAiApiKey] = useState('');

    // Función para obtener la lista de workspaces desde nuestra API
    const fetchWorkspaces = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/superadmin/workspaces');
            if (!response.ok) {
                throw new Error('Failed to fetch workspaces');
            }
            const data = await response.json();
            setWorkspaces(data);
        } catch (error) {
            console.error(error);
            setFeedbackMessage('Error: Could not load workspaces.');
        } finally {
            setIsLoading(false);
        }
    };

    // useEffect para cargar los workspaces cuando el componente se monta
    useEffect(() => {
        fetchWorkspaces();
    }, []);

    // Manejador para el envío del formulario de creación
    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedbackMessage('Creating workspace...');

        try {
            const response = await fetch('/api/superadmin/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspaceName, adminName, adminEmail, adminPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create workspace.');
            }

            setFeedbackMessage('Workspace created successfully!');
            fetchWorkspaces(); // Recargar la lista para mostrar el nuevo workspace

            // Limpiar los campos del formulario
            setWorkspaceName('');
            setAdminName('');
            setAdminEmail('');
            setAdminPassword('');

        } catch (error: any) {
            setFeedbackMessage(`Error: ${error.message}`);
        }
    };

    // Función para abrir el modal con los datos del workspace seleccionado
    const handleOpenAiModal = (workspace: Workspace) => {
        setSelectedWorkspace(workspace);
        // Usamos los valores existentes o placeholders
        setAiModel(workspace.ai_model || 'gemini-1.5-flash');
        setAiApiKey(workspace.ai_api_key || '');
        setIsAiModalOpen(true);
    };

    // Función para guardar la nueva configuración de IA
    const handleSaveAiConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWorkspace) return;

        setFeedbackMessage('Updating AI configuration...');

        try {
            const response = await fetch(`/api/superadmin/workspaces/${selectedWorkspace.id}/ai-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ai_model: aiModel, ai_api_key: aiApiKey }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update AI config.');
            }

            setFeedbackMessage('AI configuration updated successfully!');
            fetchWorkspaces(); // Recargar la lista para reflejar los cambios
            setIsAiModalOpen(false); // Cerrar el modal

        } catch (error: any) {
            setFeedbackMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Superadmin Panel</h1>

            {/* Formulario para crear un nuevo workspace */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Create New Client Workspace</h2>
                <form onSubmit={handleCreateWorkspace} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-2">
                        <label htmlFor="workspaceName" className="block text-sm font-medium text-gray-600">Workspace Name</label>
                        <input
                            id="workspaceName"
                            type="text"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="adminName" className="block text-sm font-medium text-gray-600">Admin Full Name</label>
                        <input
                            id="adminName"
                            type="text"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-600">Admin Email</label>
                        <input
                            id="adminEmail"
                            type="email"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-600">Admin Password</label>
                        <input
                            id="adminPassword"
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            required
                            minLength={8}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div className="lg:col-span-5">
                        <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Create Workspace and Admin
                        </button>
                    </div>
                </form>
                {feedbackMessage && <p className="mt-4 text-sm text-gray-600">{feedbackMessage}</p>}
            </div>

            {/* Tabla de workspaces existentes */}
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Existing Workspaces</h2>
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Workspace Name</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Workspace ID</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={3} className="text-center p-4">Loading...</td></tr>
                        ) : (
                            workspaces.map((ws) => (
                                <tr key={ws.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{ws.name}</p>
                                    </td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                        <p className="text-gray-600 whitespace-no-wrap font-mono text-xs">{ws.id}</p>
                                    </td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{new Date(ws.created_at).toLocaleDateString()}</p>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>aqui
        </div>
    );
};