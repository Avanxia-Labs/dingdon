// app/dashboard/components/SettingsPanel.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';

interface SettingsPanelProps {
    workspaceId: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ workspaceId }) => {
    const [botName, setBotName] = useState('');
    const [botColor, setBotColor] = useState('#007bff');
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<string | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Cargar la configuración actual al montar el componente
    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/workspaces/${workspaceId}/config`);
                const data = await response.json();
                if (response.ok) {
                    setBotName(data.bot_name || 'Virtual Assistant');
                    setBotColor(data.bot_color || '#007bff');
                } else {
                    throw new Error(data.error || 'Failed to load settings');
                }
            } catch (error: any) {
                setFeedback(`Error: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, [workspaceId]);

    const handleSaveSettings = async (e: FormEvent) => {
        e.preventDefault();
        setFeedback('Saving...');
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bot_name: botName, bot_color: botColor }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to save settings');
            setFeedback('Settings saved successfully!');
        } catch (error: any) {
            setFeedback(`Error: ${error.message}`);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleKnowledgeUpload = async () => {
        if (!file) {
            setFeedback('Please select a file first.');
            return;
        }
        setIsUploading(true);
        setFeedback('Uploading and processing file...');

        // Usaremos FormData para enviar el archivo
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspaceId', workspaceId);

        console.log(file)
        console.log(workspaceId)

        try {
            // Llamaremos a una nueva API para manejar la subida
            const response = await fetch(`/api/workspaces/${workspaceId}/knowledge`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Upload failed');
            setFeedback('Knowledge base updated successfully!');
        } catch (error: any) {
            setFeedback(`Error: ${error.message}`);
        } finally {
            setIsUploading(false);
            setFile(null);
        }
    };

    if (isLoading) return <div className="p-6">Loading settings...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings & Bot Customization</h1>
            <form onSubmit={handleSaveSettings} className="bg-white p-8 rounded-lg shadow-md max-w-2xl">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="botName" className="block text-sm font-medium text-gray-700">Chatbot Name</label>
                        <p className="text-xs text-gray-500 mb-1">This name will appear in the chat header.</p>
                        <input
                            id="botName"
                            type="text"
                            value={botName}
                            onChange={(e) => setBotName(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label htmlFor="botColor" className="block text-sm font-medium text-gray-700">Chatbot Main Color</label>
                        <p className="text-xs text-gray-500 mb-1">This color will be used for the header and user messages.</p>
                        <div className="flex items-center gap-4 mt-1">
                            <input
                                id="botColor"
                                type="color"
                                value={botColor}
                                onChange={(e) => setBotColor(e.target.value)}
                                className="h-10 w-10 p-1 border border-gray-300 rounded-md cursor-pointer"
                            />
                            <input
                                type="text"
                                value={botColor}
                                onChange={(e) => setBotColor(e.target.value)}
                                className="block w-full max-w-xs p-2 border border-gray-300 rounded-md"
                                placeholder="#007bff"
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button type="submit" className="py-2 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                        Save Settings
                    </button>
                </div>
                {feedback && <p className="mt-4 text-sm text-center">{feedback}</p>}
            </form>

            {/* --- SECCIÓN PARA LA BASE DE CONOCIMIENTO --- */}
            <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Knowledge Base</h3>
                <p className="text-xs text-gray-500 mb-4">Upload a PDF, TXT, or DOCX file containing your company's information, FAQs, policies, etc.</p>
                <div className="flex items-center gap-4">
                    <input type="file" onChange={handleFileChange} accept=".pdf,.txt,.docx" className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    <button onClick={handleKnowledgeUpload} disabled={!file || isUploading} className="py-2 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                        {isUploading ? 'Processing...' : 'Upload'}
                    </button>
                </div>
                {feedback && <p className="mt-4 text-sm text-center">{feedback}</p>}
            </div>

            {/* --- SECCIÓN DESHABILITADA PARA SCRAPING --- */}
            <div className="bg-gray-100 p-8 rounded-lg shadow-inner max-w-2xl mt-8 opacity-60">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-500 mb-2">Train from Website</h3>
                    <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-full">COMING SOON</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">Enter the main URL of your website to automatically build the knowledge base.</p>
                <div className="flex items-center gap-4">
                    <input
                        type="url"
                        placeholder="https://www.example.com"
                        className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-200 cursor-not-allowed"
                        disabled
                    />
                    <button disabled className="py-2 px-6 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed">
                        Fetch & Train
                    </button>
                </div>
            </div>

        </div>
    );
};