<<<<<<< HEAD
// app/dashboard/page.tsx
'use client';

import React from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { useSession } from 'next-auth/react'; 

const DashboardHomePage: React.FC = () => {
    // Obtenemos la sesión para pasar el workspaceId al panel de chat.
    const { data: session } = useSession();
    const workspaceId = session?.user?.workspaceId;

    console.log("[DashboardPage] Pasando workspaceId al ChatPanel:", workspaceId);

    if (!workspaceId) {
        return <div className="p-6">Initializing workspace...</div>;
    }

    return <ChatPanel workspaceId={workspaceId} />;
};

=======
// app/dashboard/page.tsx
'use client';

import React from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { useSession } from 'next-auth/react';

const DashboardHomePage: React.FC = () => {
    // Obtenemos la sesión para pasar el workspaceId al panel de chat.
    const { data: session } = useSession();
    const workspaceId = session?.user?.workspaceId;

    console.log("[DashboardPage] Pasando workspaceId al ChatPanel:", workspaceId);

    if (!workspaceId) {
        return <div className="p-6">Initializing workspace...</div>;
    }

    return <ChatPanel workspaceId={workspaceId} />;
};

>>>>>>> samuel-dev
export default DashboardHomePage;