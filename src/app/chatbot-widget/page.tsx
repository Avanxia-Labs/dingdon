// app/chatbot-widget/page.tsx
'use client';

import { ChatbotUI } from '@/components/chatbot/ChatbotUI';
import { useChatStore } from '@/stores/chatbotStore';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Un componente interno para poder usar los hooks de cliente
function WidgetContent() {
    const searchParams = useSearchParams();
    const setWorkspaceId = useChatStore((state) => state.setWorkspaceId);

    useEffect(() => {
        const handleWorkspaceIdFromUrl = async () => {
            // Leemos el workspaceId de los parámetros de la URL
            const workspaceId = searchParams.get('workspaceId');
            if (workspaceId) {
                // Lo guardamos en nuestro store global de Zustand
                await setWorkspaceId(workspaceId);
            } else {
                console.error("Chatbot Widget Error: workspaceId is missing from URL parameters.");
                // En producción, podríamos mostrar un mensaje de error en la UI del chat
            }
        };

        handleWorkspaceIdFromUrl();
    }, [searchParams, setWorkspaceId]);

    return <ChatbotUI />;
}


// El componente de página que se exporta
const ChatbotWidgetPage = () => {
    return (
        // Suspense es necesario porque useSearchParams puede suspender el renderizado
        <Suspense fallback={<div>Loading...</div>}>
            <WidgetContent />
        </Suspense>
    );
};

export default ChatbotWidgetPage;