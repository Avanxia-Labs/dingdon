// // app/dashboard/settings/page.tsx
// 'use client';

// import React from 'react';

// const SettingsPage = () => {
//     return (
//         <div className="p-6">
//             <h2 className="text-2xl font-bold text-gray-800 mb-4">Settings & Bot Configuration</h2>
//             <div className="bg-white p-6 rounded-lg shadow">
//                 <h3 className="text-lg font-semibold mb-2">Chatbot Appearance</h3>
//                 <p className="text-gray-600">Here you will be able to change the bot's color, title, and welcome message.</p>
//                 {/* Aquí irían los inputs para los colores, etc. */}
//             </div>
//             <div className="bg-white p-6 rounded-lg shadow mt-6">
//                 <h3 className="text-lg font-semibold mb-2">Knowledge Base</h3>
//                 <p className="text-gray-600">Here you will be able to upload PDF or TXT files to train your bot.</p>
//                 {/* Aquí iría el componente de subida de archivos. */}
//             </div>
//         </div>
//     );
// };

// export default SettingsPage;



// app/dashboard/settings/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { SettingsPanel } from '@/components/SettingsPanel';

const SettingsPage = () => {
    const { data: session } = useSession();
    const workspaceId = session?.user?.workspaceId;

    // Solo un admin puede ver esta página, el layout ya lo protege.
    if (!workspaceId) {
        return <div>Loading workspace...</div>;
    }

    return <SettingsPanel workspaceId={workspaceId} />;
};

export default SettingsPage;