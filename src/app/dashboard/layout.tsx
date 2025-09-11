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
import { MessageSquare, Users, Settings, History, Star, UserCircle, Target, BarChart3, Monitor, Menu, X } from 'lucide-react';
import { SocketProvider } from '@/providers/SocketContext';
import { I18nProvider } from '@/providers/I18nProvider';
import { useTranslation } from 'react-i18next';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSyncLanguage } from '@/hooks/useSyncLanguage';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import ThemeToggle  from '@/components/ThemeToggle';
import { useTheme } from '@/providers/ThemeProvider';


function DashboardUI({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    const { data: session } = useSession();
    const pathname = usePathname();
    const { language, setLanguage, requests } = useDashboardStore();
    useSyncLanguage(language);
    const { theme } = useTheme();

    const [workspaceName, setWorkspaceName] = useState('Loading...');
    const [agentName, setAgentName] = useState(session?.user?.name || 'Loading...');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Estado para controlar si hay requests pendientes
    const hasRequestsPending = requests.length > 0;

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

    // Cerrar menú móvil cuando cambia la ruta
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

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
        { href: '/dashboard/monitoring', label: "Monitoring", icon: <Monitor className="mr-3 h-5 w-5" />, requiredRole: ['admin', 'agent'] },
        { href: '/dashboard/lead-classification', label: t('dashboardLayout.leadClassification'), icon: <Target className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
        { href: '/dashboard/reports', label: t('dashboardLayout.reports'), icon: <BarChart3 className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
        { href: '/dashboard/settings', label: t('dashboardLayout.settingsAndBot'), icon: <Settings className="mr-3 h-5 w-5" />, requiredRole: ['admin'] }
    ];

    const mainBg = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
    const sidebarBg = theme === 'dark' ? 'bg-gray-950' : 'bg-gray-800';
    const sidebarBorderColor = theme === 'dark' ? 'border-gray-800' : 'border-gray-700';
    const headerBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const headerBorderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
    const headerTextColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';
    const buttonBg = theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200';
    const navItemActive = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-900';
    const navItemHover = theme === 'dark' ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-300 hover:bg-gray-700';
    const overlayBg = theme === 'dark' ? 'bg-gray-900 bg-opacity-75' : 'bg-gray-600 bg-opacity-75';

    return (
        <div className={`flex h-screen ${mainBg}`}>
            {/* Mobile Header - Solo visible en móvil hasta 1024px */}
            <div className={`lg:hidden fixed top-0 left-0 right-0 ${headerBg} border-b ${headerBorderColor} px-4 py-3 flex justify-between items-center z-50`}>
                <h1 className={`font-bold text-lg ${headerTextColor} truncate max-w-[200px]`}>{workspaceName}</h1>
                <ThemeToggle/>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className={`p-2 rounded-lg ${buttonBg} transition-colors`}
                >
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Menu - Drawer que se muestra en móvil */}
            <div className={`lg:hidden fixed inset-0 z-40 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
                <div className={`fixed inset-0 ${overlayBg}`} onClick={() => setIsMobileMenuOpen(false)}></div>
                <aside className={`fixed top-0 left-0 bottom-0 w-64 sm:w-72 md:w-80 ${sidebarBg} text-white flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className={`p-4 font-bold text-lg sm:text-xl border-b ${sidebarBorderColor}`}>{workspaceName}</div>
                    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                        {navItems.map(item => (
                            workspaceRole && item.requiredRole.includes(workspaceRole) && (
                                <Link 
                                    key={item.href} 
                                    href={item.href} 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === item.href ? navItemActive : navItemHover}`}
                                >
                                    {item.icon}<span>{item.label}</span>
                                    
                                    {/* Bolita de Live Chats */}
                                    {item.href === '/dashboard' && hasRequestsPending && <span className="ml-auto inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse" title={t('dashboardLayout.online')}></span>}
                                </Link>
                            )
                        ))}
                    </nav>
                    <div className={`p-4 border-t ${sidebarBorderColor} space-y-4`}>
                        <div>
                            <p className="text-sm font-semibold truncate">{agentName}</p>
                            <p className="text-xs text-gray-400 mb-2 truncate">{email}</p>
                            <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full py-2 bg-red-600 rounded-lg text-sm font-medium hover:bg-red-500">{t('dashboardLayout.signOut')}</button>
                        </div>
                        <LanguageSwitcher setLanguage={setLanguage} />
                    </div>
                </aside>
            </div>

            {/* Desktop Sidebar - Solo visible desde 1024px */}
            <aside className={`hidden lg:flex w-64 ${sidebarBg} text-white flex-col flex-shrink-0`}>
                <div className={`p-4 font-bold text-xl border-b ${sidebarBorderColor} flex items-center justify-between`}>
                    <span>{workspaceName}</span>
                    <ThemeToggle/>
                </div>
                <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        workspaceRole && item.requiredRole.includes(workspaceRole) && (
                            <Link key={item.href} href={item.href} className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === item.href ? navItemActive : navItemHover}`}>
                                {item.icon}<span>{item.label}</span>
                                
                                {/* Bolita de Live Chats */}
                                {item.href === '/dashboard' && hasRequestsPending && <span className="ml-auto inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse" title={t('dashboardLayout.online')}></span>}
                            </Link>
                        )
                    ))}
                </nav>
                <div className={`p-4 border-t ${sidebarBorderColor} space-y-4`}>
                    <div>
                        <p className="text-sm font-semibold">{agentName}</p>
                        <p className="text-xs text-gray-400 mb-2">{email}</p>
                        <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full py-2 bg-red-600 rounded-lg text-sm font-medium hover:bg-red-500">{t('dashboardLayout.signOut')}</button>
                    </div>
                    <LanguageSwitcher setLanguage={setLanguage} />
                </div>
            </aside>
            
            {/* Main Content - Con padding-top en móvil para el header */}
            <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">{children}</main>
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




