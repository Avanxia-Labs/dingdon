// app/dashboard/layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect, usePathname } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Users, Settings, History } from 'lucide-react';
import { SocketProvider } from '@/providers/SocketContext';
import { I18nProvider } from '@/providers/I18nProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated: () => redirect('/login'),
    });

    if (status === 'loading' || !session) {
        return <div className="flex h-screen items-center justify-center">Loading session...</div>;
    }

    if (session.user.role === 'superadmin') {
        if (usePathname() !== '/dashboard/superadmin/workspaces') {
            redirect('/dashboard/superadmin/workspaces');
        }
        return <>{children}</>;
    }

    
    return (
        <I18nProvider>
            <SocketProvider>
                <DashboardUI>{children}</DashboardUI>
            </SocketProvider>
        </I18nProvider>
    );
}

function DashboardUI({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [workspaceName, setWorkspaceName] = useState('Loading...');

    const [agentName, setAgentName] = useState(session?.user?.name || 'Loading...');

    // Efecto para cargar el nombre del workspace
    useEffect(() => {
        if (session?.user?.workspaceId) {
            const fetchWorkspaceName = async () => {
                try {
                    const response = await fetch(`/api/workspaces/${session.user.workspaceId}`);
                    if (!response.ok) throw new Error('Failed to fetch workspace name');
                    const data = await response.json();
                    setWorkspaceName(data.name || 'My Workspace');
                } catch (error) {
                    console.error("Failed to fetch workspace name:", error);
                    setWorkspaceName('My Workspace');
                }
            };
            fetchWorkspaceName();
        } else if (session?.user?.role !== 'superadmin') {
            setWorkspaceName('No Workspace');
        }
    }, [session?.user?.workspaceId, session?.user?.role]);

    // --- USEEFFECT PARA EL NOMBRE DEL PERFIL! ---
    useEffect(() => {
        // Si el nombre en la sesión parece un email (lo que indica el problema)
        if (session?.user?.name === session?.user?.email) {
            const fetchProfileName = async () => {
                try {
                    const response = await fetch('/api/me/profile');
                    if (response.ok) {
                        const data = await response.json();
                        // Actualizamos el estado solo con el nombre correcto
                        setAgentName(data.name || session?.user.email); // Fallback al email si el nombre es nulo
                    }
                } catch (error) {
                    console.error("Failed to fetch profile name, using session default.", error);
                    // Si falla, nos quedamos con el nombre que ya teníamos
                }
            };
            fetchProfileName();
        } else {
            // Si el nombre en la sesión no es un email, probablemente es correcto.
            setAgentName(session?.user?.name || '');
        }
    }, [session?.user?.name, session?.user?.email]);

    const { workspaceRole, name, email } = session!.user;

    const navItems = [
        { href: '/dashboard', label: 'Live Chats', icon: <MessageSquare className="mr-3 h-5 w-5" />, requiredRole: ['admin', 'agent'] },
        { href: '/dashboard/members', label: 'Team Members', icon: <Users className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
        { href: '/dashboard/history', label: 'Chat History', icon: <History className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
        { href: '/dashboard/settings', label: 'Settings & Bot', icon: <Settings className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="p-4 font-bold text-xl border-b border-gray-700">
                    {workspaceName}
                </div>
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {navItems.map(item => (
                        workspaceRole && item.requiredRole.includes(workspaceRole) && (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === item.href
                                        ? 'bg-gray-900'
                                        : 'text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        )
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-700">
                    <p className="text-sm font-semibold">{agentName}</p>
                    <p className="text-xs text-gray-400 mb-2">{email}</p>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full py-2 bg-red-600 rounded-lg text-sm font-medium hover:bg-red-500"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}