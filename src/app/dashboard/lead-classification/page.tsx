'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { Target, TrendingUp, TrendingDown, Minus, Loader2, Settings, Plus, X, Save } from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';

interface ClassificationResult {
  chatSessionId: string;
  score: number;
  classification: 'HOT' | 'WARM' | 'COLD';
  reasoning: string;
  createdAt: string;
  messageCount: number;
}

interface Statistics {
  totalChats: number;
  classifiedChats: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
}

interface KeywordComponentProps {
  type: 'hot' | 'warm' | 'cold';
  keywords: string[];
  newKeyword: string;
  setNewKeyword: (value: string) => void;
  onAdd: (type: 'hot' | 'warm' | 'cold', keyword: string) => void;
  onRemove: (type: 'hot' | 'warm' | 'cold', keyword: string) => void;
  title: string;
  color: string;
  placeholder: string;
}

// Componente reutilizable para keywords
const KeywordSection: React.FC<KeywordComponentProps> = ({
  type, keywords, newKeyword, setNewKeyword, onAdd, onRemove, title, color, placeholder
}) => (
  <div>
    <h4 className={`font-semibold mb-3 text-${color}-800`}>{title}</h4>
    <div className="flex gap-1 mb-2">
      <input
        type="text"
        value={newKeyword}
        onChange={(e) => setNewKeyword(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && onAdd(type, newKeyword)}
        placeholder={placeholder}
        className={`flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-${color}-500`}
      />
      <button
        onClick={() => onAdd(type, newKeyword)}
        className={`px-2 py-1 bg-${color}-600 text-white rounded text-sm hover:bg-${color}-700`}
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
    <div className="space-y-1 max-h-40 overflow-y-auto">
      {keywords.map((keyword, index) => (
        <div key={index} className={`flex items-center justify-between bg-${color}-50 px-2 py-1 rounded text-sm`}>
          <span className={`text-${color}-800`}>{keyword}</span>
          <button
            onClick={() => onRemove(type, keyword)}
            className={`text-${color}-600 hover:text-${color}-800`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  </div>
);

export default function LeadClassificationPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { language } = useDashboardStore();
  
  // Estados principales
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalChats: 0, classifiedChats: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0
  });
  const [isClassifying, setIsClassifying] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Estados para keywords
  const [hotKeywords, setHotKeywords] = useState<string[]>([]);
  const [warmKeywords, setWarmKeywords] = useState<string[]>([]);
  const [coldKeywords, setColdKeywords] = useState<string[]>([]);
  const [keywordsLoaded, setKeywordsLoaded] = useState(false);
  
  // Estados para nuevas keywords
  const [newHotKeyword, setNewHotKeyword] = useState('');
  const [newWarmKeyword, setNewWarmKeyword] = useState('');
  const [newColdKeyword, setNewColdKeyword] = useState('');

  const currentLang = language || 'es';

  // Función helper para mostrar feedback temporal
  const showFeedback = (messageKey: string, fallback?: string, duration = 3000) => {
    const message = safeTranslate(messageKey, fallback || messageKey);
    setFeedback(message);
    setTimeout(() => setFeedback(''), duration);
  };

  // Función helper para traducciones seguras
  const safeTranslate = (key: string, fallback = key) => {
    try {
      const translated = t(key);
      return translated === key ? fallback : translated;
    } catch {
      return fallback;
    }
  };

  // Cargar datos al inicializar
  useEffect(() => {
    if (session?.user?.workspaceId) {
      loadExistingClassifications();
      loadKeywordsFromDatabase();
    }
  }, [session?.user?.workspaceId]);

  // Recargar keywords y limpiar resultados cuando cambie el idioma
  useEffect(() => {
    if (session?.user?.workspaceId && keywordsLoaded) {
      loadKeywordsFromDatabase();
      // Clear classification results when language changes
      // This forces user to re-classify in the new language
      setResults([]);
      // Also reset statistics to show only unclassified chats
      setStatistics(prev => ({
        ...prev,
        classifiedChats: 0,
        hotLeads: 0,
        warmLeads: 0,
        coldLeads: 0
      }));
    }
  }, [currentLang, session?.user?.workspaceId]);

  const loadExistingClassifications = async () => {
    try {
      const response = await fetch(`/api/workspaces/${session!.user.workspaceId}/chat-sessions?classified=true`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setStatistics(data.statistics || statistics);
      }
    } catch (error) {
      console.error('Error cargando clasificaciones:', error);
    }
  };

  const loadKeywordsFromDatabase = async () => {
    if (!session?.user?.workspaceId) return;
    
    try {
      const response = await fetch(`/api/workspaces/${session.user.workspaceId}/lead-keywords?language=${currentLang}`);
      
      if (response.ok) {
        const data = await response.json();
        const keywords = data.keywords || { hot: [], warm: [], cold: [] };
        
        setHotKeywords(keywords.hot);
        setWarmKeywords(keywords.warm);
        setColdKeywords(keywords.cold);
        setKeywordsLoaded(true);
        
        console.log(`[KEYWORDS] Loaded ${keywords.hot.length + keywords.warm.length + keywords.cold.length} keywords for language ${currentLang}`);
      } else {
        console.log(`[KEYWORDS] No keywords found for language ${currentLang}`);
        // Solo limpiar arrays, no usar defaults hardcodeados
        setHotKeywords([]);
        setWarmKeywords([]);
        setColdKeywords([]);
        setKeywordsLoaded(true);
      }
    } catch (error) {
      console.error('Error cargando keywords desde BD:', error);
      setHotKeywords([]);
      setWarmKeywords([]);
      setColdKeywords([]);
      setKeywordsLoaded(true);
      showFeedback('leadClassification.errors.loadKeywords', 'Error cargando palabras clave');
    }
  };

  const handleClassifyAllChats = async () => {
    if (!session?.user?.workspaceId) return;

    setIsClassifying(true);
    showFeedback('leadClassification.classification.starting', 'Iniciando clasificación...');

    try {
      const chatsResponse = await fetch(`/api/workspaces/${session.user.workspaceId}/chat-sessions?unclassified=true`);
      
      if (!chatsResponse.ok) throw new Error('Error obteniendo chats');

      const chatsData = await chatsResponse.json();
      const chats = chatsData.chats || [];
      
      if (chats.length === 0) {
        showFeedback('leadClassification.classification.noChats', 'No hay chats por clasificar');
        setIsClassifying(false);
        return;
      }

      const newResults: ClassificationResult[] = [];
      let processed = 0;

      for (const chat of chats) {
        try {
          const response = await fetch(`/api/workspaces/${session.user.workspaceId}/classify-lead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              chatSessionId: chat.id,
              language: currentLang  // Pass current dashboard language to AI
            })
          });

          if (response.ok) {
            const result = await response.json();
            newResults.push(result);
          }
        } catch (error) {
          console.error(`Error clasificando chat ${chat.id}:`, error);
        }

        processed++;
        showFeedback('leadClassification.classification.processing', `Procesando: ${processed}/${chats.length} chats`, 999999); // Keep visible until end
      }

      // Reemplazar resultados completamente para evitar duplicados
      setResults(newResults);
      
      // Actualizar estadísticas
      const newStats = newResults.reduce((acc, result) => {
        acc.classifiedChats++;
        if (result.classification === 'HOT') acc.hotLeads++;
        else if (result.classification === 'WARM') acc.warmLeads++;
        else acc.coldLeads++;
        return acc;
      }, { ...statistics });
      
      setStatistics(newStats);
      showFeedback('leadClassification.classification.completed', `Clasificación completada: ${newResults.length} chats procesados`);

    } catch (error) {
      console.error('Error en clasificación masiva:', error);
      showFeedback('leadClassification.errors.classification', 'Error en la clasificación');
    } finally {
      setIsClassifying(false);
    }
  };

  const addKeyword = async (type: 'hot' | 'warm' | 'cold', keyword: string) => {
    if (!keyword.trim()) {
      showFeedback('leadClassification.keywords.emptyKeyword', 'Por favor ingresa una palabra clave');
      return;
    }
    
    const normalizedKeyword = keyword.trim().toLowerCase();
    const currentKeywords = type === 'hot' ? hotKeywords : type === 'warm' ? warmKeywords : coldKeywords;
    
    if (currentKeywords.includes(normalizedKeyword)) {
      showFeedback('leadClassification.keywords.duplicate', 'Esta palabra clave ya existe');
      return;
    }

    try {
      const response = await fetch(`/api/workspaces/${session!.user.workspaceId}/lead-keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: normalizedKeyword,
          category: type,
          language: currentLang
        })
      });

      if (response.ok) {
        const updatedKeywords = [...currentKeywords, normalizedKeyword];
        
        if (type === 'hot') {
          setHotKeywords(updatedKeywords);
          setNewHotKeyword('');
        } else if (type === 'warm') {
          setWarmKeywords(updatedKeywords);
          setNewWarmKeyword('');
        } else {
          setColdKeywords(updatedKeywords);
          setNewColdKeyword('');
        }
        
        showFeedback('leadClassification.keywords.added', 'Palabra clave agregada exitosamente');
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error agregando keyword:', error);
      showFeedback('leadClassification.errors.addKeyword', 'Error al agregar palabra clave');
    }
  };

  const removeKeyword = async (type: 'hot' | 'warm' | 'cold', keyword: string) => {
    try {
      const response = await fetch(`/api/workspaces/${session!.user.workspaceId}/lead-keywords`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword,
          category: type
        })
      });

      if (response.ok) {
        if (type === 'hot') {
          setHotKeywords(prev => prev.filter(k => k !== keyword));
        } else if (type === 'warm') {
          setWarmKeywords(prev => prev.filter(k => k !== keyword));
        } else {
          setColdKeywords(prev => prev.filter(k => k !== keyword));
        }
        
        showFeedback('leadClassification.keywords.removed', 'Palabra clave eliminada exitosamente');
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error eliminando keyword:', error);
      showFeedback('leadClassification.errors.removeKeyword', 'Error al eliminar palabra clave');
    }
  };

  const saveKeywordsConfig = () => {
    showFeedback('leadClassification.keywords.configSaved', 'Configuración guardada (las palabras clave se guardan automáticamente)');
  };


  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'HOT': return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'WARM': return <Minus className="h-4 w-4 text-yellow-600" />;
      case 'COLD': return <TrendingDown className="h-4 w-4 text-blue-600" />;
      default: return null;
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'HOT': return 'text-red-600 bg-red-50';
      case 'WARM': return 'text-yellow-600 bg-yellow-50';
      case 'COLD': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {safeTranslate('leadClassification.title', 'Clasificación de Leads')}
        </h1>
        <p className="text-gray-600">
          {safeTranslate('leadClassification.description', 'Analiza automáticamente las conversaciones para identificar leads calientes, tibios y fríos')}
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">{feedback}</p>
        </div>
      )}

      {/* Estadísticas */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { labelKey: 'leadClassification.stats.totalChats', fallback: 'Total Chats', value: statistics.totalChats, color: 'gray' },
          { labelKey: 'leadClassification.stats.classified', fallback: 'Clasificados', value: statistics.classifiedChats, color: 'blue' },
          { labelKey: 'leadClassification.stats.hot', fallback: 'HOT 🔥', value: statistics.hotLeads, color: 'red' },
          { labelKey: 'leadClassification.stats.warm', fallback: 'WARM 🟡', value: statistics.warmLeads, color: 'yellow' },
          { labelKey: 'leadClassification.stats.cold', fallback: 'COLD ❄️', value: statistics.coldLeads, color: 'blue' }
        ].map((stat, index) => (
          <div key={index} className={`bg-${stat.color}-50 p-4 rounded-lg border border-${stat.color}-200`}>
            <h3 className={`text-${stat.color}-800 text-sm font-medium`}>{safeTranslate(stat.labelKey, stat.fallback)}</h3>
            <p className={`text-${stat.color}-900 text-xl font-bold`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Botones de Acción */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={handleClassifyAllChats}
          disabled={isClassifying}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isClassifying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Target className="h-4 w-4" />
          )}
          {isClassifying 
            ? safeTranslate('leadClassification.buttons.classifying', 'Clasificando...')
            : safeTranslate('leadClassification.buttons.classifyAll', 'Clasificar Todos los Chats')
          }
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          <Settings className="h-4 w-4" />
          {safeTranslate('leadClassification.buttons.configureKeywords', 'Configurar Palabras Clave')}
        </button>

      </div>

      {/* Modal de Configuración de Keywords */}
      {showSettings && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {safeTranslate('leadClassification.keywords.configuration', 'Configuración de Palabras Clave')} ({currentLang.toUpperCase()})
            </h2>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KeywordSection
              type="hot"
              keywords={hotKeywords}
              newKeyword={newHotKeyword}
              setNewKeyword={setNewHotKeyword}
              onAdd={addKeyword}
              onRemove={removeKeyword}
              title={safeTranslate('leadClassification.keywords.hot', 'CALIENTE 🔥')}
              color="red"
              placeholder={safeTranslate('leadClassification.keywords.hotPlaceholder', 'Nueva palabra caliente...')}
            />
            
            <KeywordSection
              type="warm"
              keywords={warmKeywords}
              newKeyword={newWarmKeyword}
              setNewKeyword={setNewWarmKeyword}
              onAdd={addKeyword}
              onRemove={removeKeyword}
              title={safeTranslate('leadClassification.keywords.warm', 'TIBIA 🟡')}
              color="yellow"
              placeholder={safeTranslate('leadClassification.keywords.warmPlaceholder', 'Nueva palabra tibia...')}
            />
            
            <KeywordSection
              type="cold"
              keywords={coldKeywords}
              newKeyword={newColdKeyword}
              setNewKeyword={setNewColdKeyword}
              onAdd={addKeyword}
              onRemove={removeKeyword}
              title={safeTranslate('leadClassification.keywords.cold', 'FRÍA ❄️')}
              color="blue"
              placeholder={safeTranslate('leadClassification.keywords.coldPlaceholder', 'Nueva palabra fría...')}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveKeywordsConfig}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Save className="h-4 w-4" />
              {safeTranslate('leadClassification.buttons.saveConfig', 'Guardar Configuración')}
            </button>
          </div>
        </div>
      )}

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{safeTranslate('leadClassification.results.title', 'Resultados de Clasificación')}</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {safeTranslate('leadClassification.table.classification', 'Clasificación')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {safeTranslate('leadClassification.table.analysis', 'Análisis del Lead')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {safeTranslate('leadClassification.table.date', 'Fecha')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium ${getClassificationColor(result.classification)}`}>
                      {getClassificationIcon(result.classification)}
                      {result.classification}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-lg">
                      {result.reasoning}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(result.createdAt).toLocaleDateString(
                      currentLang === 'en' ? 'en-US' : 'es-ES', 
                      {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {safeTranslate('leadClassification.results.noResults', 'No hay resultados de clasificación disponibles')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}