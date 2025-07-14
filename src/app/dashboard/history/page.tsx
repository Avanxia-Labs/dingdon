// app/dashboard/history/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { HistoryPanel } from '@/components/HistoryPanel';

const ChatHistoryPage = () => {
    const { data: session } = useSession();
    const workspaceId = session?.user?.workspaceId;

    if (!workspaceId) {
        return <div>Loading...</div>;
    }

    return <HistoryPanel workspaceId={workspaceId} />;
};

export default ChatHistoryPage;