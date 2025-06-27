// app/dashboard/layout.tsx
'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return <div>Loading...</div>; // Muestra un loader mientras se verifica la sesión
    }

    if (!session) {
        redirect('/login'); // Si no hay sesión, redirige a la página de login
    }

    // Si hay sesión, muestra el contenido del dashboard
    return <>{children}</>;
}