'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

/**
 * @file Sets up the providers for the application, specifically React Query.
 * @description This client component ensures that the QueryClient is only
 * created once and provided to all child components.
 */

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}