// // app/dashboard/layout.tsx
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useSession, signOut } from 'next-auth/react';
// import { redirect, usePathname } from 'next/navigation';
// import Link from 'next/link';
// import { MessageSquare, Users, Settings, History, Star, Target, Menu, X, UserCircle } from 'lucide-react';
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
//     const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

//     // Cerrar menú móvil cuando cambia la ruta
//     useEffect(() => {
//         setIsMobileMenuOpen(false);
//     }, [pathname]);

//     const { workspaceRole, email } = session!.user;

//     const navItems = [
//         { href: '/dashboard', label: t('dashboardLayout.liveChats'), icon: <MessageSquare className="mr-3 h-5 w-5" />, requiredRole: ['admin', 'agent'] },
//         { href: '/dashboard/members', label: t('dashboardLayout.teamMembers'), icon: <Users className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
//         { href: '/dashboard/history', label: t('dashboardLayout.chatHistory'), icon: <History className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
//         { href: '/dashboard/leads', label: t('dashboardLayout.leads'), icon: <Star className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
//         { href: '/dashboard/profile', label: t('dashboardLayout.profile'), icon: <UserCircle className="mr-3 h-5 w-5" />, requiredRole: ['admin', 'agent'] },
//         { href: '/dashboard/lead-classification', label: t('dashboardLayout.leadClassification'), icon: <Target className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
//         { href: '/dashboard/settings', label: t('dashboardLayout.settingsAndBot'), icon: <Settings className="mr-3 h-5 w-5" />, requiredRole: ['admin'] }
//     ];

//     return (
//         <div className="flex h-screen bg-gray-50 dashboard-layout">
//             {/* Mobile Header - Solo visible en móvil */}
//             <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center z-40">
//                 <h1 className="font-bold text-lg text-gray-800 truncate">{workspaceName}</h1>
//                 <button 
//                     onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//                     className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
//                 >
//                     {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
//                 </button>
//             </div>

//             {/* Sidebar - Responsive: oculto en móvil, colapsado en tablet */}
//             <aside className="hidden md:flex md:w-16 lg:w-64 bg-gray-800 text-white flex-col">
//                 <div className="p-2 lg:p-4 font-bold text-xs lg:text-xl border-b border-gray-700 truncate">
//                     <span className="hidden lg:inline">{workspaceName}</span>
//                     <span className="lg:hidden">WS</span>
//                 </div>
//                 <nav className="flex-1 px-1 lg:px-2 py-2 lg:py-4 space-y-1">
//                     {navItems.map(item => (
//                         workspaceRole && item.requiredRole.includes(workspaceRole) && (
//                             <Link 
//                                 key={item.href} 
//                                 href={item.href} 
//                                 className={`flex items-center px-2 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-colors ${
//                                    pathname === item.href ? 'bg-gray-900' : 'text-gray-300 hover:bg-gray-700'
//                                }`}
//                                 title={item.label}
//                             >
//                                 {item.icon}
//                                 <span className="hidden lg:inline ml-3">{item.label}</span>
//                             </Link>
//                         )
//                     ))}
//                 </nav>
//                 <div className="p-2 lg:p-4 border-t border-gray-700 space-y-2 lg:space-y-4">
//                     <div>
//                         <p className="text-xs lg:text-sm font-semibold truncate">{agentName}</p>
//                         <p className="text-xs text-gray-400 mb-2 truncate hidden lg:block">{email}</p>
//                         <button 
//                             onClick={() => signOut({ callbackUrl: '/login' })} 
//                             className="w-full py-1 lg:py-2 bg-red-600 rounded-lg text-xs lg:text-sm font-medium hover:bg-red-500"
//                         >
//                             <span className="hidden lg:inline">{t('dashboardLayout.signOut')}</span>
//                             <span className="lg:hidden">Exit</span>
//                         </button>
//                     </div>
//                     <div className="hidden lg:block">
//                         <LanguageSwitcher setLanguage={setLanguage} variant="sidebar" />
//                     </div>
//                 </div>
//             </aside>

//             <main className="flex-1 overflow-y-auto pt-16 md:pt-0">{children}</main>
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
import { MessageSquare, Users, Settings, History, Star, UserCircle, Target, BarChart3 } from 'lucide-react';
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

    useEffect(() => {
        if (session?.user?.workspaceId) {
            const fetchWorkspaceName = async () => {
                try {
                    const response = await fetch(`/api/workspaces/${session.user.workspaceId}`);
                    if (!response.ok) throw new Error('Failed to fetch workspace name');
                    const data = await response.json();
                    setWorkspaceName(data.name || 'My Workspace');
                } catch (error) { console.error("Error fetching workspace name:", error); setWorkspaceName('My Workspace'); }
            };
            fetchWorkspaceName();
        } else if (session?.user?.role !== 'superadmin') { setWorkspaceName('No Workspace'); }
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
                } catch (error) { console.error("Error fetching profile name:", error); }
            };
            fetchProfileName();
        } else { setAgentName(session?.user?.name || ''); }
    }, [session?.user?.name, session?.user?.email]);

    const { workspaceRole, email } = session!.user;

    const navItems = [
        { href: '/dashboard', label: t('dashboardLayout.liveChats'), icon: <MessageSquare className="mr-3 h-5 w-5" />, requiredRole: ['admin', 'agent'] },
        { href: '/dashboard/members', label: t('dashboardLayout.teamMembers'), icon: <Users className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
        { href: '/dashboard/history', label: t('dashboardLayout.chatHistory'), icon: <History className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
        { href: '/dashboard/leads', label: t('dashboardLayout.leads'), icon: <Star className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
        { href: '/dashboard/profile', label: t('dashboardLayout.profile'), icon: <UserCircle className="mr-3 h-5 w-5" />, requiredRole: ['admin', 'agent'] },
        { href: '/dashboard/lead-classification', label: t('dashboardLayout.leadClassification'), icon: <Target className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
        { href: '/dashboard/reports', label: t('dashboardLayout.reports'), icon: <BarChart3 className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
        { href: '/dashboard/settings', label: t('dashboardLayout.settingsAndBot'), icon: <Settings className="mr-3 h-5 w-5" />, requiredRole: ['admin'] }
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="p-4 font-bold text-xl border-b border-gray-700">{workspaceName}</div>
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {navItems.map(item => (
                        workspaceRole && item.requiredRole.includes(workspaceRole) && (
                            <Link key={item.href} href={item.href} className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === item.href ? 'bg-gray-900' : 'text-gray-300 hover:bg-gray-700'}`}>
                                {item.icon}<span>{item.label}</span>
                            </Link>
                        )
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-700 space-y-4">
                    <div>
                        <p className="text-sm font-semibold">{agentName}</p>
                        <p className="text-xs text-gray-400 mb-2">{email}</p>
                        <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full py-2 bg-red-600 rounded-lg text-sm font-medium hover:bg-red-500">{t('dashboardLayout.signOut')}</button>
                    </div>
                    <LanguageSwitcher setLanguage={setLanguage} />
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession({ required: true, onUnauthenticated: () => redirect('/login') });

    if (status === 'loading' || !session) { return <div className="flex h-screen items-center justify-center">Loading session...</div>; }

    if (session.user.role === 'superadmin') {

        const allowedPaths = [
            '/dashboard/superadmin/workspaces',
            '/dashboard/superadmin/configs'
        ];

        const currentPath = usePathname();

        if (!allowedPaths.includes(currentPath)) {
            redirect('/dashboard/superadmin/workspaces'); // Solo redirige si no está en una ruta permitida
        }

        return <>{children}</>;
    }

    return (<I18nProvider><SocketProvider><DashboardUI>{children}</DashboardUI></SocketProvider></I18nProvider>);
}




