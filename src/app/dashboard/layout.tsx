// // app/dashboard/layout.tsx
// 'use client';

// import React, {useState, useEffect} from 'react';
// import { useSession, signOut } from 'next-auth/react';
// import { redirect } from 'next/navigation';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { MessageSquare, Users, Settings } from 'lucide-react';
// import {SuperAdminPanel} from '@/components/SuperAdminPanel';


// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//     const { data: session, status } = useSession({
//         required: true,
//         onUnauthenticated: () => redirect('/login'),
//     });
//     const pathname = usePathname();
//     const [workspaceName, setWorkspaceName] = useState('Loading...');

//     useEffect(() => {
//         // Only run if we have a session and workspaceId
//         if (session?.user?.workspaceId) {
//             const fetchWorkspaceName = async () => {
//                 try {
//                     const response = await fetch(`/api/workspaces/${session.user.workspaceId}`);
//                     if (!response.ok) {
//                         setWorkspaceName('My Workspace'); // Fallback
//                         return;
//                     }
//                     const data = await response.json();
//                     setWorkspaceName(data.name || 'My Workspace');
//                 } catch (error) {
//                     console.error("Failed to fetch workspace name:", error);
//                     setWorkspaceName('My Workspace'); // Fallback
//                 }
//             };

//             fetchWorkspaceName();
//         }
//     }, [session?.user?.workspaceId]); 

//     //  Now the early return comes AFTER all hooks
//     if (status === 'loading' || !session) {
//         return <div className="flex h-screen items-center justify-center">Loading session...</div>;
//     }

//     // Si es superadmin, renderizamos su panel y detenemos la ejecución aquí.
//     if (session.user.role === 'superadmin') {
        
//         return <SuperAdminPanel />;
//     }

//     // Extraemos los datos del usuario de la sesión para usarlos en la UI
//     const { workspaceId, workspaceRole, name, email } = session.user;

//     // Definimos los items de navegación en un array para un código más limpio y escalable
//     const navItems = [
//         { href: '/dashboard', label: 'Live Chats', icon: <MessageSquare className="mr-3 h-5 w-5" />, requiredRole: ['admin', 'agent'] },
//         { href: '/dashboard/members', label: 'Team Members', icon: <Users className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
//         { href: '/dashboard/settings', label: 'Settings & Bot', icon: <Settings className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
//     ];

//     return (
//         <div className="flex h-screen bg-gray-50">
//             {/* --- Barra Lateral de Navegación --- */}
//             <aside className="w-64 bg-gray-800 text-white flex flex-col">
//                 <div className="p-4 font-bold text-xl border-b border-gray-700">
//                     {workspaceName}
//                 </div>
//                 <nav className="flex-1 px-2 py-4 space-y-1">
//                     {navItems.map(item => (
//                         // Renderizar el enlace solo si el rol del usuario en el workspace está permitido
//                         workspaceRole && item.requiredRole.includes(workspaceRole) && (
//                             <Link
//                                 key={item.href}
//                                 href={item.href}
//                                 className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
//                                     // Compara la ruta actual con la del enlace para aplicar el estilo "activo"
//                                     pathname === item.href 
//                                         ? 'bg-gray-900 text-white' 
//                                         : 'text-gray-300 hover:bg-gray-700 hover:text-white'
//                                 }`}
//                             >
//                                 {item.icon}
//                                 <span>{item.label}</span>
//                             </Link>
//                         )
//                     ))}
//                 </nav>
//                 <div className="p-4 border-t border-gray-700">
//                     <p className="text-sm font-semibold">{name}</p>
//                     <p className="text-xs text-gray-400 mb-2">{email}</p>
//                     <button 
//                         onClick={() => signOut({ callbackUrl: '/login' })} 
//                         className="w-full py-2 bg-red-600 rounded-lg text-sm font-medium hover:bg-red-500 transition-colors"
//                     >
//                         Sign Out
//                     </button>
//                 </div>
//             </aside>

//             {/* --- Contenido Principal que se renderiza según la ruta --- */}
//             <main className="flex-1 overflow-y-auto">
//                 {children}
//             </main>
//         </div>
//     );
// }


// app/dashboard/layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect, usePathname } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Users, Settings } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated: () => redirect('/login'),
    });
    const pathname = usePathname();
    const [workspaceName, setWorkspaceName] = useState('Loading...');

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
            // Si no es superadmin y no tiene workspace, algo está mal.
            setWorkspaceName('No Workspace');
        }
    }, [session?.user?.workspaceId, session?.user?.role]);

    if (status === 'loading' || !session) {
        return <div className="flex h-screen items-center justify-center">Loading session...</div>;
    }
    
    // Si el usuario es superadmin, redirigimos a su panel específico.
    // El layout de superadmin se encargará de renderizar el resto.
    if (session.user.role === 'superadmin') {
        // Usamos redirect para asegurarnos de que el superadmin siempre termine en su panel.
        if(pathname !== '/dashboard/superadmin/workspaces'){
           redirect('/dashboard/superadmin/workspaces');
        }
        return <>{children}</>;
    }

    // A partir de aquí, es solo la lógica para agentes y admins.
    const { workspaceRole, name, email } = session.user;
    const navItems = [
        { href: '/dashboard', label: 'Live Chats', icon: <MessageSquare className="mr-3 h-5 w-5" />, requiredRole: ['admin', 'agent'] },
        { href: '/dashboard/members', label: 'Team Members', icon: <Users className="mr-3 h-5 w-5" />, requiredRole: ['admin'] },
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
                <div className="p-4 border-t border-gray-700">
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-gray-400 mb-2">{email}</p>
                    <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full py-2 bg-red-600 rounded-lg text-sm font-medium hover:bg-red-500">
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