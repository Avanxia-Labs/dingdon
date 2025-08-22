// app/dashboard/history/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { HistoryPanel } from '@/components/HistoryPanel';
import { useDashboardStore } from '@/stores/useDashboardStore';

const ChatHistoryPage = () => {
    const { data: session } = useSession();
    const workspaceId = session?.user?.workspaceId;
    const { activeBotConfig } = useDashboardStore();

    if (!workspaceId) {
        return <div>Loading...</div>;
    }

    return <HistoryPanel workspaceId={workspaceId} botConfig={activeBotConfig || undefined}/>;
};

export default ChatHistoryPage;