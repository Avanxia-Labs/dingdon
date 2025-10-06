// // app/dashboard/reports/page.tsx
// 'use client';

// import { useState, useEffect, useMemo, FC, ReactNode } from 'react';
// import { useSession } from 'next-auth/react';
// import { useTranslation } from 'react-i18next';
// import { I18nProvider } from '@/providers/I18nProvider';
// import { BarChart, Clock, Users, MessageSquare, AlertCircle, TrendingUp, Lightbulb, ListChecks, Loader2, LucideProps } from 'lucide-react';

// // Interfaz para el tipado de los datos del reporte
// interface ReportData {
//     reportDate: string;
//     executiveSummary?: string;
//     keyMetrics?: {
//         newConversations: number;
//         totalMessages: number;
//         avgResponseTime: string;
//         handoffsToAgent: number;
//         botResolutionRate: string;
//     };
//     leadAnalysis?: any;
//     topicsAndTrends?: any;
//     actionableInsights?: any;
// } 

// interface MetricCardProps {
//     title: string;
//     value: string | number;
//     icon: FC<LucideProps>; // El tipo para un icono de Lucide
// }

// interface AnalysisCardProps {
//     title: string;
//     children: ReactNode; // El tipo para cualquier contenido de React
//     icon: FC<LucideProps>;
// }

// // Componente para una tarjeta de métrica individual
// const MetricCard: FC<MetricCardProps> = ({ title, value, icon: Icon })=> (
//     <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-start">
//         <div className="bg-blue-100 text-blue-600 rounded-full p-2 mr-4">
//             <Icon size={20} />
//         </div>
//         <div>
//             <p className="text-sm text-gray-500">{title}</p>
//             <p className="text-2xl font-bold text-gray-800">{value}</p>
//         </div>
//     </div>
// );

// // Componente para una tarjeta de análisis de IA
// const AnalysisCard: FC<AnalysisCardProps> = ({ title, children, icon: Icon }) => (
//     <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
//         <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-3">
//             <Icon className="mr-2 text-blue-600" size={20} />
//             {title}
//         </h3>
//         <div className="text-gray-600 space-y-2 prose prose-sm max-w-none">
//             {children}
//         </div>
//     </div>
// );

// function ReportsPageContent() {
//     const { t, i18n } = useTranslation();
//     const { data: session } = useSession();
//     const [report, setReport] = useState<ReportData | null>(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
    
//     // El estado para el selector de fecha
//     const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

//     const workspaceId = session?.user?.workspaceId;

//     useEffect(() => {
//         if (!workspaceId) return;

//         const fetchReport = async () => {
//             setIsLoading(true);
//             setError(null);
//             try {
//                 const response = await fetch(`/api/workspaces/${workspaceId}/reports?date=${selectedDate}&lang=${i18n.language}`);
//                 if (!response.ok) {
//                     const data = await response.json();
//                     throw new Error(data.error || 'Failed to fetch report.');
//                 }
//                 const data = await response.json();
//                 setReport(data);
//             } catch (err: any) {
//                 setError(err.message);
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         fetchReport();
//     }, [workspaceId, selectedDate, i18n.language]);

//     // Usamos useMemo para evitar recalcular las métricas en cada render
//     const metrics = useMemo(() => report?.keyMetrics ? [
//         { title: t('reports.metrics.newConversations'), value: report.keyMetrics.newConversations, icon: MessageSquare },
//         { title: t('reports.metrics.totalMessages'), value: report.keyMetrics.totalMessages, icon: ListChecks },
//         { title: t('reports.metrics.avgResponseTime'), value: report.keyMetrics.avgResponseTime, icon: Clock },
//         { title: t('reports.metrics.handoffs'), value: report.keyMetrics.handoffsToAgent, icon: Users },
//         { title: t('reports.metrics.botResolution'), value: report.keyMetrics.botResolutionRate, icon: AlertCircle },
//     ] : [], [report, t]);

//     return (
//         <div className='p-4'>
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
//                 <div>
//                     <h1 className="text-3xl font-bold text-gray-800">{t('reports.pageTitle')}</h1>
//                     <p className="text-gray-500 mt-1">{t('reports.pageSubtitle')}</p>
//                 </div>
//                 <input
//                     type="date"
//                     value={selectedDate}
//                     onChange={(e) => setSelectedDate(e.target.value)}
//                     className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
//                 />
//             </div>

//             {isLoading ? (
//                  <div className="flex items-center justify-center py-20">
//                     <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
//                  </div>
//             ) : error ? (
//                 <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
//                     <p className="font-bold">{t('common.errorPrefix')}</p>
//                     <p>{error}</p>
//                 </div>
//             ) : report && (
//                 <div className="space-y-6">
//                     {/* Resumen Ejecutivo */}
//                     <AnalysisCard title={t('reports.summary.title')} icon={BarChart}>
//                         <p>{report.executiveSummary}</p>
//                     </AnalysisCard>
                    
//                     {/* Métricas Clave (Responsive Grid) */}
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
//                        {metrics.map(metric => (
//                            <MetricCard key={metric.title} title={metric.title} value={metric.value} icon={metric.icon} />
//                        ))}
//                     </div>

//                     {/* Análisis Detallado (Responsive Grid) */}
//                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                         <div className="lg:col-span-2 space-y-6">
//                             <AnalysisCard title={t('reports.topics.title')} icon={TrendingUp}>
//                                 <p>{report.topicsAndTrends}</p>
//                             </AnalysisCard>
//                             <AnalysisCard title={t('reports.actions.title')} icon={Lightbulb} theme={theme}>
//                                 <p>{report.actionableInsights}</p>
//                             </AnalysisCard>
//                         </div>
//                         <div className="lg:col-span-1">
//                              <AnalysisCard title={t('reports.leads.title')} icon={Users} theme={theme}>
//                                 <p>{report.leadAnalysis}</p>
//                             </AnalysisCard>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// export default function ReportsPage() {
//     return (
//         <I18nProvider>
//             <ReportsPageContent />
//         </I18nProvider>
//     );
// }





// app/dashboard/reports/page.tsx
'use client';

import { useState, useEffect, useMemo, FC, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { BarChart, Clock, Users, MessageSquare, AlertCircle, TrendingUp, Lightbulb, ListChecks, Loader2, LucideProps } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

// Interfaz para el tipado de los datos del reporte
interface ReportData {
    reportDate: string;
    executiveSummary?: string;
    keyMetrics?: {
        newConversations: number;
        totalMessages: number;
        avgResponseTime: string;
        handoffsToAgent: number;
        botResolutionRate: string;
    };
    leadAnalysis?: {
        HOT: string[];
        WARM: string[];
        COLD: string[];
    };
    topicsAndTrends?: string[];
    actionableInsights?: string[];
} 

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: FC<LucideProps>;
}

interface AnalysisCardProps {
    title: string;
    children: ReactNode;
    icon: FC<LucideProps>;
}

// Componente para una tarjeta de métrica individual
const MetricCard: FC<MetricCardProps & { theme: string }> = ({ title, value, icon: Icon, theme }) => {
    const cardBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-white';
    const borderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-gray-200';
    const iconBg = theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-100';
    const iconColor = theme === 'dark' ? 'text-blue-400' : 'text-blue-600';
    const titleColor = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-gray-500';
    const valueColor = theme === 'dark' ? 'text-[#EFF3F5]' : 'text-gray-800';
    
    return (
        <div className={`p-3 sm:p-4 rounded-lg shadow-sm border flex items-start ${cardBg} ${borderColor}`}>
            <div className={`rounded-full p-2 mr-3 sm:mr-4 ${iconBg} ${iconColor}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className={`text-xs sm:text-sm ${titleColor}`}>{title}</p>
                <p className={`text-xl sm:text-2xl font-bold ${valueColor}`}>{value}</p>
            </div>
        </div>
    );
};

// Componente para una tarjeta de análisis de IA
const AnalysisCard: FC<AnalysisCardProps & { theme: string }> = ({ title, children, icon: Icon, theme }) => {
    return (
        <div className={`p-4 sm:p-6 rounded-lg shadow-sm border ${
            theme === 'dark' 
                ? 'bg-[#212E36] border-[#2a3b47]' 
                : 'bg-white border-gray-200'
        }`}>
            <h3 className={`text-base sm:text-lg font-semibold flex items-center mb-3 ${
                theme === 'dark' ? 'text-[#EFF3F5]' : 'text-gray-800'
            }`}>
                <span className={`mr-2 ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}>
                    <Icon size={20} />
                </span>
                {title}
            </h3>
            <div className={`space-y-2 max-w-none ${
                theme === 'dark' ? 'text-[#C8CDD0]' : 'text-gray-600'
            }`}>
                {children}
            </div>
        </div>
    );
};

function ReportsPageContent() {
    const { t, i18n } = useTranslation();
    const { data: session } = useSession();
    const { theme } = useTheme();
    const [report, setReport] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // El estado para el selector de fecha
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const workspaceId = session?.user?.workspaceId;

    useEffect(() => {
        if (!workspaceId) return;

        const fetchReport = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/workspaces/${workspaceId}/reports?date=${selectedDate}&lang=${i18n.language}`);
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to fetch report.');
                }
                const data = await response.json();
                setReport(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [workspaceId, selectedDate, i18n.language]);

    // Usamos useMemo para evitar recalcular las métricas en cada render
    const metrics = useMemo(() => report?.keyMetrics ? [
        { title: t('reports.metrics.newConversations'), value: report.keyMetrics.newConversations, icon: MessageSquare },
        { title: t('reports.metrics.totalMessages'), value: report.keyMetrics.totalMessages, icon: ListChecks },
        { title: t('reports.metrics.avgResponseTime'), value: report.keyMetrics.avgResponseTime, icon: Clock },
        { title: t('reports.metrics.handoffs'), value: report.keyMetrics.handoffsToAgent, icon: Users },
        { title: t('reports.metrics.botResolution'), value: report.keyMetrics.botResolutionRate, icon: AlertCircle },
    ] : [], [report, t]);

    // Paleta de colores para modo claro y oscuro
    const mainBg = theme === 'dark' ? 'bg-[#192229]' : 'bg-[#FBFBFE]';
    const cardBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const borderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-[#EFF3F5]';
    const textPrimary = theme === 'dark' ? 'text-[#EFF3F5]' : 'text-[#2A3B47]';
    const textSecondary = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const inputBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const inputBorder = theme === 'dark' ? 'border-[#2a3b47]' : 'border-gray-300';
    const errorBg = theme === 'dark' ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-400 text-red-700';
    const loaderColor = theme === 'dark' ? 'text-blue-400' : 'text-blue-600';

    return (
        <div className={`p-4 sm:p-6 min-h-screen ${mainBg}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className={`text-2xl sm:text-3xl font-bold ${textPrimary}`}>{t('reports.pageTitle')}</h1>
                    <p className={`mt-1 text-sm sm:text-base ${textSecondary}`}>{t('reports.pageSubtitle')}</p>
                </div>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto ${inputBg} ${inputBorder} ${textPrimary}`}
                />
            </div>

            {isLoading ? (
                 <div className="flex items-center justify-center py-20">
                    <Loader2 className={`h-10 w-10 animate-spin ${loaderColor}`} />
                 </div>
            ) : error ? (
                <div className={`border-l-4 p-4 rounded ${errorBg}`}>
                    <p className="font-bold">{t('common.errorPrefix')}</p>
                    <p>{error}</p>
                </div>
            ) : report && (
                <div className="space-y-6">
                    {/* Resumen Ejecutivo */}
                    <AnalysisCard title={t('reports.summary.title')} icon={BarChart} theme={theme}>
                        <p>{report.executiveSummary}</p>
                    </AnalysisCard>
                    
                    {/* Métricas Clave (Responsive Grid) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                       {metrics.map(metric => (
                           <MetricCard key={metric.title} title={metric.title} value={metric.value} icon={metric.icon} theme={theme} />
                       ))}
                    </div>

                    {/* Análisis Detallado (Responsive Grid) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Temas y Tendencias */}
                            <AnalysisCard title={t('reports.topics.title')} icon={TrendingUp} theme={theme}>
                                <ul className="list-disc list-inside space-y-1">
                                    {Array.isArray(report.topicsAndTrends) ? 
                                        report.topicsAndTrends.map((topic, index) => (
                                            <li key={index}>{topic}</li>
                                        )) : 
                                        <p>{report.topicsAndTrends}</p>
                                    }
                                </ul>
                            </AnalysisCard>
                            
                            {/* Insights Accionables */}
                            <AnalysisCard title={t('reports.actions.title')} icon={Lightbulb} theme={theme}>
                                <div className="space-y-3">
                                    {Array.isArray(report.actionableInsights) ? 
                                        report.actionableInsights.map((insight, index) => (
                                            <div key={index} className={`p-3 border-l-4 rounded ${
                                                theme === 'dark' 
                                                ? 'bg-amber-900/20 border-amber-600 text-amber-400' 
                                                : 'bg-amber-50 border-amber-400 text-amber-800'
                                            }`}>
                                                <p className="text-sm">{insight}</p>
                                            </div>
                                        )) : 
                                        <p>{report.actionableInsights}</p>
                                    }
                                </div>
                            </AnalysisCard>
                        </div>
                        
                        {/* Análisis de Leads */}
                        <div className="lg:col-span-1">
                            <AnalysisCard title={t('reports.leads.title')} icon={Users} theme={theme}>
                                <div className="space-y-4">
                                    {/* Hot Leads */}
                                    <div>
                                        <h4 className={`font-medium mb-2 ${
                                            theme === 'dark' ? 'text-green-400' : 'text-green-600'
                                        }`}>
                                            🔥 Hot Leads ({report.leadAnalysis?.HOT?.length || 0})
                                        </h4>
                                        {report.leadAnalysis?.HOT && report.leadAnalysis.HOT.length > 0 ? (
                                            <ul className="text-sm text-gray-600 space-y-1">
                                                {report.leadAnalysis.HOT.map((lead, index) => (
                                                    <li key={index} className={`p-2 rounded ${
                                                        theme === 'dark' ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-gray-700'
                                                    }`}>{lead}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className={`text-sm italic ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            }`}>No hot leads today</p>
                                        )}
                                    </div>
                                    
                                    {/* Warm Leads */}
                                    <div>
                                        <h4 className={`font-medium mb-2 ${
                                            theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                                        }`}>
                                            🌟 Warm Leads ({report.leadAnalysis?.WARM?.length || 0})
                                        </h4>
                                        {report.leadAnalysis?.WARM && report.leadAnalysis.WARM.length > 0 ? (
                                            <ul className="text-sm text-gray-600 space-y-1">
                                                {report.leadAnalysis.WARM.map((lead, index) => (
                                                    <li key={index} className={`p-2 rounded ${
                                                        theme === 'dark' ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-50 text-gray-700'
                                                    }`}>{lead}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className={`text-sm italic ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            }`}>No warm leads today</p>
                                        )}
                                    </div>
                                    
                                    {/* Cold Leads */}
                                    <div>
                                        <h4 className={`font-medium mb-2 ${
                                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                        }`}>
                                            ❄️ Cold Leads ({report.leadAnalysis?.COLD?.length || 0})
                                        </h4>
                                        {report.leadAnalysis?.COLD && report.leadAnalysis.COLD.length > 0 ? (
                                            <div>
                                                <ul className="text-sm text-gray-600 space-y-1">
                                                    {report.leadAnalysis.COLD.slice(0, 3).map((lead, index) => (
                                                        <li key={index} className={`p-2 rounded ${
                                                            theme === 'dark' ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-gray-700'
                                                        }`}>{lead}</li>
                                                    ))}
                                                </ul>
                                                {report.leadAnalysis.COLD.length > 3 && (
                                                    <p className={`text-xs mt-2 ${
                                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                    }`}>
                                                        +{report.leadAnalysis.COLD.length - 3} more cold leads
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className={`text-sm italic ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            }`}>No cold leads today</p>
                                        )}
                                    </div>
                                </div>
                            </AnalysisCard>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ReportsPage() {
    return <ReportsPageContent />;
}