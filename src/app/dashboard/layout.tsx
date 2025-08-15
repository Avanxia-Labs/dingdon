// // app/dashboard/layout.tsx
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useSession, signOut } from 'next-auth/react';
// import { redirect, usePathname } from 'next/navigation';
// import Link from 'next/link';
// import { MessageSquare, Users, Settings, History, Star, UserCircle } from 'lucide-react';
// import { SocketProvider } from '@/providers/SocketContext';
// import { I18nProvider } from '@/providers/I18nProvider';
// import { useTranslation } from 'react-i18next';
// import { useDashboardStore } from '@/stores/useDashboardStore';
// import { useSyncLanguage } from '@/hooks/useSyncLanguage';
// import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// function DashboardUI({ children }: { children: React.ReactNode }) {
//     const { t } = useTranslation();
//     const { data: session } = useSession();
//     const pathname = usePathname();
//     const { language, setLanguage } = useDashboardStore();
//     useSyncLanguage(language);

//     const [workspaceName, setWorkspaceName] = useState('Loading...');
//     const [agentName, setAgentName] = useState(session?.user?.name || 'Loading...');

//     useEffect(() => {
//         if (session?.user?.workspaceId) {
//             const fetchWorkspaceName = async () => {
//                 try {
//                     const response = await fetch(`/api/workspaces/${session.user.workspaceId}`);
//                     if (!response.ok) throw new Error('Failed to fetch workspace name');
//                     const data = await response.json();
//                     setWorkspaceName(data.name || 'My Workspace');
//                 } catch (error) { console.error("Error fetching workspace name:", error); setWorkspaceName('My Workspace'); }
//             };
//             fetchWorkspaceName();
//         } else if (session?.user?.role !== 'superadmin') { setWorkspaceName('No Workspace'); }
//     }, [session?.user?.workspaceId, session?.user?.role]);

//     useEffect(() => {
//         if (session?.user?.name === session?.user?.email) {
//             const fetchProfileName = async () => {
//                 try {
//                     const response = await fetch('/api/me/profile');
//                     if (response.ok) {
//                         const data = await response.json();
//                         setAgentName(data.name || session?.user.email);
//                     }
//                 } catch (error) { console.error("Error fetching profile name:", error); }
//             };
//             fetchProfileName();
//         } else { setAgentName(session?.user?.name || ''); }
//     }, [session?.user?.name, session?.user?.email]);

//     const { workspaceRole, email } = session!.user;

//     const navItems = [
//         { href: '/dashboard', label: t('dashboardLayout.liveChats'), icon: <MessageSquare className="mr-3 h-5 w-5" />, requiredRole: ['admin', 'agent'] },
//         { href: '/dashboard/members', label: t('dashboardLayout.teamMembers'), icon: <Users className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
//         { href: '/dashboard/history', label: t('dashboardLayout.chatHistory'), icon: <History className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
//         { href: '/dashboard/leads', label: t('dashboardLayout.leads'), icon: <Star className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
//         { href: '/dashboard/profile', label: t('dashboardLayout.profile'), icon: <UserCircle className="mr-3 h-5 w-5" />, requiredRole: ['admin', 'agent'] },
//         { href: '/dashboard/settings', label: t('dashboardLayout.settingsAndBot'), icon: <Settings className="mr-3 h-5 w-5" />, requiredRole: ['admin'] }
//     ];

//     return (
//         <div className="flex h-screen bg-gray-50">
//             <aside className="w-64 bg-gray-800 text-white flex flex-col">
//                 <div className="p-4 font-bold text-xl border-b border-gray-700">{workspaceName}</div>
//                 <nav className="flex-1 px-2 py-4 space-y-1">
//                     {navItems.map(item => (
//                         workspaceRole && item.requiredRole.includes(workspaceRole) && (
//                             <Link key={item.href} href={item.href} className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === item.href ? 'bg-gray-900' : 'text-gray-300 hover:bg-gray-700'}`}>
//                                 {item.icon}<span>{item.label}</span>
//                             </Link>
//                         )
//                     ))}
//                 </nav>
//                 <div className="p-4 border-t border-gray-700 space-y-4">
//                     <div>
//                         <p className="text-sm font-semibold">{agentName}</p>
//                         <p className="text-xs text-gray-400 mb-2">{email}</p>
//                         <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full py-2 bg-red-600 rounded-lg text-sm font-medium hover:bg-red-500">{t('dashboardLayout.signOut')}</button>
//                     </div>
//                     <LanguageSwitcher setLanguage={setLanguage} />
//                 </div>
//             </aside>
//             <main className="flex-1 overflow-y-auto">{children}</main>
//         </div>
//     );
// }

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//     const { data: session, status } = useSession({ required: true, onUnauthenticated: () => redirect('/login') });

//     if (status === 'loading' || !session) { return <div className="flex h-screen items-center justify-center">Loading session...</div>; }

//     if (session.user.role === 'superadmin') {

//         const allowedPaths = [
//             '/dashboard/superadmin/workspaces',
//             '/dashboard/superadmin/configs'
//         ];

//         const currentPath = usePathname();

//         if (!allowedPaths.includes(currentPath)) {
//             redirect('/dashboard/superadmin/workspaces'); // Solo redirige si no está en una ruta permitida
//         }

//         return <>{children}</>;
//     }

//     return (<I18nProvider><SocketProvider><DashboardUI>{children}</DashboardUI></SocketProvider></I18nProvider>);
// }






// app/dashboard/layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect, usePathname } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Users, Settings, History, Star, UserCircle, Menu, X } from 'lucide-react';
import { SocketProvider } from '@/providers/SocketContext';
import { I18nProvider } from '@/providers/I18nProvider';
import { useTranslation } from 'react-i18next';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSyncLanguage } from '@/hooks/useSyncLanguage';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function DashboardUI({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    const { data: session } = useSession();
    const pathname = usePathname();
    const { language, setLanguage } = useDashboardStore();
    useSyncLanguage(language);

    const [workspaceName, setWorkspaceName] = useState('Loading...');
    const [agentName, setAgentName] = useState(session?.user?.name || 'Loading...');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detectar si es móvil/tablet
    useEffect(() => {
        const checkIsMobile = () => {
            const mobile = window.innerWidth < 1024; // lg breakpoint
            setIsMobile(mobile);
            // En desktop, mantener el sidebar siempre abierto
            if (!mobile) {
                setIsSidebarOpen(false);
            }
        };
        
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // Cerrar sidebar al cambiar de ruta en móvil
    useEffect(() => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    }, [pathname, isMobile]);

    useEffect(() => {
        if (session?.user?.workspaceId) {
            const fetchWorkspaceName = async () => {
                try {
                    const response = await fetch(`/api/workspaces/${session.user.workspaceId}`);
                    if (!response.ok) throw new Error('Failed to fetch workspace name');
                    const data = await response.json();
                    setWorkspaceName(data.name || 'My Workspace');
                } catch (error) { 
                    console.error("Error fetching workspace name:", error); 
                    setWorkspaceName('My Workspace'); 
                }
            };
            fetchWorkspaceName();
        } else if (session?.user?.role !== 'superadmin') { 
            setWorkspaceName('No Workspace'); 
        }
    }, [session?.user?.workspaceId, session?.user?.role]);

    useEffect(() => {
        if (session?.user?.name === session?.user?.email) {
            const fetchProfileName = async () => {
                try {
                    const response = await fetch('/api/me/profile');
                    if (response.ok) {
                        const data = await response.json();
                        setAgentName(data.name || session?.user.email);
                    }
                } catch (error) { 
                    console.error("Error fetching profile name:", error); 
                }
            };
            fetchProfileName();
        } else { 
            setAgentName(session?.user?.name || ''); 
        }
    }, [session?.user?.name, session?.user?.email]);

    const { workspaceRole, email } = session!.user;

    const navItems = [
        { href: '/dashboard', label: t('dashboardLayout.liveChats'), icon: <MessageSquare className="mr-3 h-5 w-5" />, requiredRole: ['admin', 'agent'] },
        { href: '/dashboard/members', label: t('dashboardLayout.teamMembers'), icon: <Users className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
        { href: '/dashboard/history', label: t('dashboardLayout.chatHistory'), icon: <History className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
        { href: '/dashboard/leads', label: t('dashboardLayout.leads'), icon: <Star className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
        { href: '/dashboard/profile', label: t('dashboardLayout.profile'), icon: <UserCircle className="mr-3 h-5 w-5" />, requiredRole: ['admin', 'agent'] },
        { href: '/dashboard/settings', label: t('dashboardLayout.settingsAndBot'), icon: <Settings className="mr-3 h-5 w-5" />, requiredRole: ['admin'] }
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Overlay para móvil cuando sidebar está abierto */}
            {isMobile && isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 bg-opacity-50 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                ${isMobile 
                    ? `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
                        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                      }`
                    : 'w-64'
                } 
                bg-gray-800 text-white flex flex-col
            `}>
                {/* Header del sidebar con botón cerrar en móvil */}
                <div className="p-4 font-bold text-xl border-b border-gray-700 flex items-center justify-between">
                    <span className="truncate">{workspaceName}</span>
                    {isMobile && (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-1 rounded hover:bg-gray-700 flex-shrink-0 ml-2"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Navegación */}
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {navItems.map(item => (
                        workspaceRole && item.requiredRole.includes(workspaceRole) && (
                            <Link 
                                key={item.href} 
                                href={item.href} 
                                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    pathname === item.href 
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

                {/* Footer del sidebar */}
                <div className="p-4 border-t border-gray-700 space-y-4">
                    <div>
                        <p className="text-sm font-semibold truncate">{agentName}</p>
                        <p className="text-xs text-gray-400 mb-2 truncate">{email}</p>
                        <button 
                            onClick={() => signOut({ callbackUrl: '/login' })} 
                            className="w-full py-2 bg-red-600 rounded-lg text-sm font-medium hover:bg-red-500 transition-colors"
                        >
                            {t('dashboardLayout.signOut')}
                        </button>
                    </div>
                    <LanguageSwitcher setLanguage={setLanguage} />
                </div>
            </aside>

            {/* Contenido principal */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Header con botón hamburguesa en móvil */}
                {isMobile && (
                    <header className="bg-white border-b px-4 py-3 flex items-center justify-between lg:hidden">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                        <h1 className="font-semibold text-gray-900 truncate ml-2">
                            {navItems.find(item => item.href === pathname)?.label || 'Dashboard'}
                        </h1>
                        <div className="w-10" /> {/* Spacer para centrar el título */}
                    </header>
                )}

                {/* Contenido de la página */}
                <div className="flex-1 overflow-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession({ 
        required: true, 
        onUnauthenticated: () => redirect('/login') 
    });
    const pathname = usePathname();

    if (status === 'loading' || !session) { 
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading session...</p>
                </div>
            </div>
        ); 
    }

    if (session.user.role === 'superadmin') {
        const allowedPaths = [
            '/dashboard/superadmin/workspaces',
            '/dashboard/superadmin/configs'
        ];

        if (!allowedPaths.includes(pathname)) {
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