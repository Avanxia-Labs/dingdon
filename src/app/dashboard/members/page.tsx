// app/dashboard/members/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { AgentsPanel } from '@/components/AgentsPanel'; 

const MembersPage = () => {
    const { data: session } = useSession();
    const workspaceId = session?.user?.workspaceId;

    if (!workspaceId) {
        return <div>Loading workspace...</div>;
    }

    return <AgentsPanel workspaceId={workspaceId} />;
};

export default MembersPage;