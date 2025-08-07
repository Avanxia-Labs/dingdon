// // app/dashboard/superadmin/layout.tsx
// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { signOut, useSession } from 'next-auth/react';
// import { redirect } from 'next/navigation';
// import { Building2, PlusCircle } from 'lucide-react';

// export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
//     const { data: session, status } = useSession();
//     const pathname = usePathname();

//     // Seguridad: Este layout solo debe ser renderizado para el superadmin.
//     // Aunque el layout principal ya lo verifica, una doble comprobación es buena práctica.
//     if (status === 'loading') {
//         return <div className="flex h-screen items-center justify-center">Loading...</div>;
//     }
//     if (session?.user?.role !== 'superadmin') {
//         return redirect('/dashboard'); // Si no es superadmin, lo sacamos de aquí.
//     }

//     const navItems = [
//         { href: '/dashboard/superadmin/workspaces', label: 'Manage Workspaces', icon: <Building2 className="mr-3 h-5 w-5" /> },
//         // El enlace para crear se puede integrar en la página de 'Manage', por lo que podemos quitarlo del menú principal.
//     ];

//     return (
//         <div className="flex h-screen bg-gray-100">
//             <aside className="w-64 bg-slate-900 text-white flex flex-col">
//                 <div className="p-4 font-bold text-xl border-b border-slate-700">
//                     Superadmin
//                 </div>
//                 <nav className="flex-1 px-2 py-4 space-y-1">
//                     {navItems.map(item => (
//                         <Link
//                             key={item.href}
//                             href={item.href}
//                             className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
//                                 pathname.startsWith(item.href) 
//                                     ? 'bg-slate-700' 
//                                     : 'hover:bg-slate-700'
//                             }`}
//                         >
//                             {item.icon}
//                             <span>{item.label}</span>
//                         </Link>
//                     ))}
//                 </nav>
//                 <div className="p-4 border-t border-slate-700">
//                     <p className="text-sm font-semibold">{session.user.name}</p>
//                     <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full mt-2 py-2 bg-red-600 rounded-lg text-sm hover:bg-red-500">
//                         Sign Out
//                     </button>
//                 </div>
//             </aside>
//             <main className="flex-1 overflow-y-auto p-6 md:p-8">
//                 {children}
//             </main>
//         </div>
//     );
// }


'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { I18nProvider } from '@/providers/I18nProvider';
import { useTranslation } from 'react-i18next';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSyncLanguage } from '@/hooks/useSyncLanguage';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function SuperAdminUI({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    const { data: session } = useSession();
    const pathname = usePathname();
    const { language, setLanguage } = useDashboardStore();
    useSyncLanguage(language);

    const navItems = [
        { href: '/dashboard/superadmin/workspaces', label: t('superadmin.pageTitle'), icon: <Building2 className="mr-3 h-5 w-5" /> },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-4 font-bold text-xl border-b border-slate-700">Superadmin</div>
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {navItems.map(item => (
                        <Link key={item.href} href={item.href} className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${ pathname.startsWith(item.href) ? 'bg-slate-700' : 'hover:bg-slate-700'}`}>
                            {item.icon}<span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-700 space-y-4">
                    <div>
                        <p className="text-sm font-semibold">{session?.user.name}</p>
                        <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full mt-2 py-2 bg-red-600 rounded-lg text-sm hover:bg-red-500">{t('dashboardLayout.signOut')}</button>
                    </div>
                    <LanguageSwitcher setLanguage={setLanguage} className="!border-slate-600 !bg-slate-700" />
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
        </div>
    );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    if (status === 'loading') { return <div className="flex h-screen items-center justify-center">Loading...</div>; }
    if (session?.user?.role !== 'superadmin') { return redirect('/dashboard'); }
    return (<I18nProvider><SuperAdminUI>{children}</SuperAdminUI></I18nProvider>);
}