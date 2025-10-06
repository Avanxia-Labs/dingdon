// app/dashboard/monitoring/page.tsx
'use client';

import React from 'react';
import { MonitoringPanel } from '@/components/MonitoringPanel'; 
import { useSession } from 'next-auth/react'; 

const MonitoringPage: React.FC = () => {
    const { data: session } = useSession();
    const workspaceId = session?.user?.workspaceId;

    if (!workspaceId) {
        return <div className="p-6">Initializing monitoring workspace...</div>;
    }

    // 2. Renderizamos el nuevo panel, pasándole el workspaceId
    return <MonitoringPanel workspaceId={workspaceId} />;
};

export default MonitoringPage;