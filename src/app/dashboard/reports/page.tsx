// app/dashboard/reports/page.tsx
'use client';

import { useState, useEffect, useMemo, FC, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { I18nProvider } from '@/providers/I18nProvider';
import { BarChart, Clock, Users, MessageSquare, AlertCircle, TrendingUp, Lightbulb, ListChecks, Loader2, LucideProps } from 'lucide-react';

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
    leadAnalysis?: any;
    topicsAndTrends?: any;
    actionableInsights?: any;
} 

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: FC<LucideProps>; // El tipo para un icono de Lucide
}

interface AnalysisCardProps {
    title: string;
    children: ReactNode; // El tipo para cualquier contenido de React
    icon: FC<LucideProps>;
}

// Componente para una tarjeta de métrica individual
const MetricCard: FC<MetricCardProps> = ({ title, value, icon: Icon })=> (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-start">
        <div className="bg-blue-100 text-blue-600 rounded-full p-2 mr-4">
            <Icon size={20} />
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

// Componente para una tarjeta de análisis de IA
const AnalysisCard: FC<AnalysisCardProps> = ({ title, children, icon: Icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-3">
            <Icon className="mr-2 text-blue-600" size={20} />
            {title}
        </h3>
        <div className="text-gray-600 space-y-2 prose prose-sm max-w-none">
            {children}
        </div>
    </div>
);

function ReportsPageContent() {
    const { t, i18n } = useTranslation();
    const { data: session } = useSession();
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

    return (
        <div className='p-4'>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{t('reports.pageTitle')}</h1>
                    <p className="text-gray-500 mt-1">{t('reports.pageSubtitle')}</p>
                </div>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            {isLoading ? (
                 <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                 </div>
            ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
                    <p className="font-bold">{t('common.errorPrefix')}</p>
                    <p>{error}</p>
                </div>
            ) : report && (
                <div className="space-y-6">
                    {/* Resumen Ejecutivo */}
                    <AnalysisCard title={t('reports.summary.title')} icon={BarChart}>
                        <p>{report.executiveSummary}</p>
                    </AnalysisCard>
                    
                    {/* Métricas Clave (Responsive Grid) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                       {metrics.map(metric => (
                           <MetricCard key={metric.title} title={metric.title} value={metric.value} icon={metric.icon} />
                       ))}
                    </div>

                    {/* Análisis Detallado (Responsive Grid) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <AnalysisCard title={t('reports.topics.title')} icon={TrendingUp}>
                                <p>{report.topicsAndTrends}</p>
                            </AnalysisCard>
                            <AnalysisCard title={t('reports.actions.title')} icon={Lightbulb}>
                                <p>{report.actionableInsights}</p>
                            </AnalysisCard>
                        </div>
                        <div className="lg:col-span-1">
                             <AnalysisCard title={t('reports.leads.title')} icon={Users}>
                                <p>{report.leadAnalysis}</p>
                            </AnalysisCard>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ReportsPage() {
    return (
        <I18nProvider>
            <ReportsPageContent />
        </I18nProvider>
    );
}