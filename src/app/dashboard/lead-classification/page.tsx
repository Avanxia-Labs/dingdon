'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { Target, TrendingUp, TrendingDown, Minus, Loader2, Settings, Plus, X, Save, RotateCcw } from 'lucide-react';
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

export default function LeadClassificationPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  // Función helper para traducciones con fallback
  const safeTranslate = (key: string, fallbackText?: string, options?: any) => {
    try {
      const translated = t(key, options);
      // Si la traducción devuelve el mismo key, usar el fallback
      if (translated === key && fallbackText) {
        return fallbackText;
      }
      return translated;
    } catch (error) {
      console.error('Translation error for key:', key, error);
      return fallbackText || key;
    }
  };

  // Mapas temporales de traducción mientras se arregla i18n
  const translations = {
    hotTitle: {
      es: 'CALIENTE 🔥',
      en: 'HOT 🔥'
    },
    warmTitle: {
      es: 'TIBIO 🌡️', 
      en: 'WARM 🌡️'
    },
    coldTitle: {
      es: 'FRÍO ❄️',
      en: 'COLD ❄️'
    },
    resetButton: {
      es: 'Restaurar por Defecto',
      en: 'Reset to Defaults'
    }
  };

  // Detectar idioma actual usando store o fallback
  const { language } = useDashboardStore();
  const currentLang = language === 'en' ? 'en' : 'es'; // Default a español
  const [isClassifying, setIsClassifying] = useState(false);
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalChats: 0,
    classifiedChats: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0
  });
  const [feedback, setFeedback] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Estados para configuración de keywords - inicializados vacíos
  const [hotKeywords, setHotKeywords] = useState<string[]>([]);
  const [warmKeywords, setWarmKeywords] = useState<string[]>([]);
  const [coldKeywords, setColdKeywords] = useState<string[]>([]);
  const [keywordsLoaded, setKeywordsLoaded] = useState(false);
  const [newHotKeyword, setNewHotKeyword] = useState('');
  const [newWarmKeyword, setNewWarmKeyword] = useState('');
  const [newColdKeyword, setNewColdKeyword] = useState('');
  const [keywordAddedMessage, setKeywordAddedMessage] = useState('');
  const [cachedResults, setCachedResults] = useState<Map<string, ClassificationResult>>(new Map());
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingCachedResults, setIsLoadingCachedResults] = useState(false);

  // Cargar datos existentes y keywords guardadas
  useEffect(() => {
    if (session?.user?.workspaceId) {
      loadExistingClassifications();
      loadKeywordsFromDatabase();
      loadCachedResults();
    }
  }, [session?.user?.workspaceId]);

  // Recargar keywords cuando cambie el idioma
  useEffect(() => {
    if (session?.user?.workspaceId && keywordsLoaded) {
      console.log(`[KEYWORDS] Language changed to ${currentLang}, reloading keywords`);
      loadKeywordsFromDatabase();
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

  // Cargar resultados cacheados desde localStorage
  const loadCachedResults = async () => {
    if (!session?.user?.workspaceId) return;
    
    setIsLoadingCachedResults(true);
    try {
      const cacheKey = `classification-cache-${session.user.workspaceId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { results: cachedResultsArray, timestamp } = JSON.parse(cachedData);
        
        // Verificar si el cache no es muy viejo (1 hora)
        const oneHour = 60 * 60 * 1000;
        const isRecent = Date.now() - timestamp < oneHour;
        
        if (isRecent && cachedResultsArray?.length > 0) {
          console.log(`[CACHE] Cargando ${cachedResultsArray.length} resultados del cache`);
          
          // Crear Map para cache interno
          const newCache = new Map<string, ClassificationResult>();
          const validResults: ClassificationResult[] = [];
          
          cachedResultsArray.forEach((result: ClassificationResult) => {
            newCache.set(result.chatSessionId, result);
            validResults.push(result);
          });
          
          setCachedResults(newCache);
          
          // Mostrar resultados inmediatamente si no hay otros resultados
          if (results.length === 0) {
            setResults(validResults);
            
            // Actualizar estadísticas
            const newStats = {
              totalChats: validResults.length,
              classifiedChats: validResults.length,
              hotLeads: validResults.filter(r => r.classification === 'HOT').length,
              warmLeads: validResults.filter(r => r.classification === 'WARM').length,
              coldLeads: validResults.filter(r => r.classification === 'COLD').length,
            };
            setStatistics(newStats);
            
            // No mostrar mensaje de carga desde cache
            // setFeedback(`Cargados ${validResults.length} resultados desde cache - ¡Súper rápido! 🚀`);
            // setTimeout(() => setFeedback(''), 3000);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando cache:', error);
    } finally {
      setIsLoadingCachedResults(false);
    }
  };

  // Guardar resultados en cache
  const saveCachedResults = (resultsToCache: ClassificationResult[]) => {
    if (!session?.user?.workspaceId || resultsToCache.length === 0) return;
    
    try {
      const cacheKey = `classification-cache-${session.user.workspaceId}`;
      const cacheData = {
        results: resultsToCache,
        timestamp: Date.now(),
        workspaceId: session.user.workspaceId
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`[CACHE] Guardados ${resultsToCache.length} resultados en cache`);
    } catch (error) {
      console.error('Error guardando cache:', error);
    }
  };

  const handleClassifyAllChats = async () => {
    if (!session?.user?.workspaceId) return;

    setIsClassifying(true);
    setIsLoadingChats(true);
    setFeedback(t('leadClassification.feedback.classificationStarted'));

    try {
      // Obtener todos los chats
      const chatsResponse = await fetch(`/api/workspaces/${session.user.workspaceId}/chat-sessions?unclassified=true`);
      
      if (!chatsResponse.ok) {
        throw new Error('Error obteniendo chats');
      }

      const chatsData = await chatsResponse.json();
      const unclassifiedChats = chatsData.chats || [];
      
      setIsLoadingChats(false);

      const newResults: ClassificationResult[] = [];
      const newCache = new Map(cachedResults);

      // Mostrar progreso
      let processedCount = 0;
      const totalChats = unclassifiedChats.length;
      const startTime = Date.now();

      // No mostrar mensaje inicial
      // setFeedback(`🚀 Iniciando clasificación de ${totalChats} chats...`);
      
      // Procesar cada chat (revisar cache primero)
      for (const chat of unclassifiedChats) {
        try {
          let result = null;

          // 1. Revisar cache primero
          if (newCache.has(chat.id)) {
            result = newCache.get(chat.id);
            console.log(`[CACHE HIT] Chat ${chat.id} ya clasificado`);
          } else {
            // 2. Clasificar si no está en cache
            const classifyResponse = await fetch(`/api/workspaces/${session.user.workspaceId}/classify-lead`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chatSessionId: chat.id
              })
            });

            if (classifyResponse.ok) {
              const classifyData = await classifyResponse.json();
              if (classifyData.success && classifyData.result) {
                console.log('Classification result:', classifyData.result);
                result = {
                  chatSessionId: chat.id,
                  score: classifyData.result.score,
                  classification: classifyData.result.classification,
                  reasoning: classifyData.result.reasoning?.replace(/\\/g, '') || '',
                  createdAt: chat.ended_at || chat.created_at || new Date().toISOString(),
                  messageCount: classifyData.result.analysisDetails?.messageCount || 0
                };

                // Guardar en cache
                newCache.set(chat.id, result);
              }
            }
          }

          if (result) {
            newResults.push(result);
          }

          processedCount++;
          
          // Actualizar progreso cada 2 chats o al final para mayor fluidez
          if (processedCount % 2 === 0 || processedCount === totalChats) {
            const percentage = Math.round((processedCount / totalChats) * 100);
            setFeedback(`⚡ Procesando: ${processedCount}/${totalChats} chats (${percentage}%)`);
            
            // Mostrar resultados parciales para que se vea más rápido
            setResults([...newResults]);
            
            // Actualizar estadísticas parciales también
            const partialStats = {
              totalChats: chatsData.total || 0,
              classifiedChats: newResults.length,
              hotLeads: newResults.filter(r => r.classification === 'HOT').length,
              warmLeads: newResults.filter(r => r.classification === 'WARM').length,
              coldLeads: newResults.filter(r => r.classification === 'COLD').length,
            };
            setStatistics(partialStats);
          }

        } catch (chatError) {
          console.error(`Error clasificando chat ${chat.id}:`, chatError);
          processedCount++;
        }
      }

      // Actualizar cache global
      setCachedResults(newCache);
      
      // Resultados finales
      setResults(newResults);
      
      const newStats = {
        totalChats: chatsData.total || 0,
        classifiedChats: newResults.length,
        hotLeads: newResults.filter(r => r.classification === 'HOT').length,
        warmLeads: newResults.filter(r => r.classification === 'WARM').length,
        coldLeads: newResults.filter(r => r.classification === 'COLD').length,
      };
      setStatistics(newStats);

      // Guardar en cache para próximas cargas
      saveCachedResults(newResults);
      
      setFeedback(t('leadClassification.feedback.classificationComplete', { count: processedCount }));

    } catch (error) {
      console.error('Error en clasificación:', error);
      setFeedback(t('leadClassification.feedback.classificationError'));
      setIsLoadingChats(false);
    } finally {
      setIsClassifying(false);
    }
  };

  const addKeyword = async (type: 'hot' | 'warm' | 'cold', keyword: string) => {
    if (!keyword.trim()) {
      setFeedback(safeTranslate('leadClassification.feedback.keywordEmpty', 'Please enter a keyword'));
      setTimeout(() => setFeedback(''), 3000);
      return;
    }
    
    const normalizedKeyword = keyword.trim().toLowerCase();
    
    // Verificar si ya existe localmente
    const currentKeywords = type === 'hot' ? hotKeywords : type === 'warm' ? warmKeywords : coldKeywords;
    if (currentKeywords.includes(normalizedKeyword)) {
      setFeedback(safeTranslate('leadClassification.feedback.keywordDuplicate', 'This keyword already exists'));
      setTimeout(() => setFeedback(''), 3000);
      return;
    }
    
    try {
      setFeedback(safeTranslate('leadClassification.feedback.savingKeywords', 'Saving keywords...'));
      
      const response = await fetch(`/api/workspaces/${session!.user.workspaceId}/lead-keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: normalizedKeyword,
          category: type,
          language: currentLang
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Actualizar estado local
        if (type === 'hot') {
          setHotKeywords([normalizedKeyword, ...hotKeywords]);
          setNewHotKeyword('');
        } else if (type === 'warm') {
          setWarmKeywords([normalizedKeyword, ...warmKeywords]);
          setNewWarmKeyword('');
        } else if (type === 'cold') {
          setColdKeywords([normalizedKeyword, ...coldKeywords]);
          setNewColdKeyword('');
        }
        
        showKeywordAddedMessage(normalizedKeyword);
      } else {
        setFeedback(data.error || t('leadClassification.feedback.keywordAddError'));
        setTimeout(() => setFeedback(''), 3000);
      }
    } catch (error) {
      console.error('Error agregando keyword:', error);
      setFeedback(t('leadClassification.feedback.keywordAddError'));
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const showKeywordAddedMessage = (keyword: string) => {
    setKeywordAddedMessage(t('leadClassification.feedback.keywordAdded', { keyword }));
    setTimeout(() => {
      setKeywordAddedMessage('');
    }, 3000); // Desaparece después de 3 segundos
  };

  const removeKeyword = async (type: 'hot' | 'warm' | 'cold', keyword: string) => {
    try {
      const response = await fetch(`/api/workspaces/${session!.user.workspaceId}/lead-keywords`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keyword,
          category: type
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Actualizar estado local
        if (type === 'hot') {
          setHotKeywords(hotKeywords.filter(k => k !== keyword));
        } else if (type === 'warm') {
          setWarmKeywords(warmKeywords.filter(k => k !== keyword));
        } else if (type === 'cold') {
          setColdKeywords(coldKeywords.filter(k => k !== keyword));
        }
      } else {
        setFeedback(data.error || t('leadClassification.feedback.keywordRemoveError'));
        setTimeout(() => setFeedback(''), 3000);
      }
    } catch (error) {
      console.error('Error eliminando keyword:', error);
      setFeedback(t('leadClassification.feedback.keywordRemoveError'));
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  // Keywords por defecto separadas por idioma - sin repetidas
  const defaultKeywords = {
    es: {
      hot: [
        // Cotización/Presupuesto específico
        "cotización", "cotizacion", "presupuesto", "quiero cotización", "necesito presupuesto",
        
        // Disponibilidad inmediata
        "disponibilidad inmediata", "disponible ahora", "ahora mismo", "de inmediato",
        
        // Urgencia específica
        "necesito para mañana", "es urgente", "urgente", "rápido", "rapido", "prisa", "ya", "hoy mismo", "esta semana",
        
        // Información de contacto voluntaria
        "mi teléfono", "mi telefono", "mi número", "mi numero", "mi email", "mi correo", "contactarme", "pueden llamarme",
        
        // Formas de pago/financiamiento
        "formas de pago", "como puedo pagar", "financiamiento", "crédito", "credito", "métodos de pago",
        
        // Intención clara de compra
        "quiero comprar", "cómo puedo adquirir", "como puedo adquirir", "necesito comprar", "voy a comprar"
      ],
      warm: [
        // Preguntas específicas sobre productos/servicios
        "características", "caracteristicas", "especificaciones", "detalles del producto",
        
        // Interés en beneficios
        "beneficios", "ventajas", "qué incluye", "que incluye",
        
        // Comparaciones
        "comparar", "diferencias", "mejor opción", "mejor opcion", "cuál es mejor", "cual es mejor",
        
        // Precios sin cotización formal
        "cuánto cuesta", "cuanto cuesta", "precio", "range de precios", "precio aproximado",
        
        // Solicitud de información adicional
        "más información", "mas informacion", "catálogo", "catalogo", "folleto",
        
        // Interés específico
        "me interesa", "explícame", "explicame", "cómo funciona", "como funciona"
      ],
      cold: [
        // Preguntas generales/informativas
        "qué es", "que es", "información general", "informacion general", "solo pregunto",
        
        // Exploración sin compromiso
        "solo navegando", "explorando opciones", "viendo qué hay", "viendo que hay",
        
        // Consultas de soporte
        "problema con", "no funciona", "soporte", "ayuda con",
        
        // Sin intención inmediata
        "tal vez", "en el futuro", "algún día", "algun dia", "quizá", "quiza",
        
        // Primera interacción básica
        "hola", "buenos días", "información básica", "informacion basica"
      ]
    },
    en: {
      hot: [
        // Cotización/Presupuesto específico
        "quote", "budget", "quotation", "estimate", "need a quote", "need budget",
        
        // Disponibilidad inmediata
        "available now", "immediate availability", "right now", "immediately",
        
        // Urgencia específica
        "need it tomorrow", "it's urgent", "urgent", "fast", "quick", "rush", "asap", "today", "this week",
        
        // Información de contacto voluntaria
        "my phone", "my number", "my email", "contact me", "you can call me",
        
        // Formas de pago/financiamiento
        "payment options", "how can I pay", "financing", "credit", "payment methods",
        
        // Intención clara de compra
        "want to buy", "how can I acquire", "how can I buy", "need to buy", "going to buy"
      ],
      warm: [
        // Preguntas específicas sobre productos/servicios
        "features", "specifications", "specs", "product details",
        
        // Interés en beneficios
        "benefits", "advantages", "what includes",
        
        // Comparaciones
        "compare", "differences", "vs", "best option", "which is better",
        
        // Precios sin cotización formal
        "how much does it cost", "price", "cost", "price range", "ballpark price",
        
        // Solicitud de información adicional
        "more information", "catalog", "brochure",
        
        // Interés específico
        "interested", "tell me more", "explain", "how does it work"
      ],
      cold: [
        // Preguntas generales/informativas
        "what is", "general info", "just asking",
        
        // Exploración sin compromiso
        "just browsing", "exploring options", "looking around",
        
        // Consultas de soporte
        "problem with", "not working", "support", "help with", "technical issue",
        
        // Sin intención inmediata
        "maybe", "in the future", "someday", "perhaps",
        
        // Primera interacción básica
        "hello", "good morning", "basic information"
      ]
    }
  };

  // Cargar keywords desde la base de datos filtradas por idioma
  const loadKeywordsFromDatabase = async () => {
    if (!session?.user?.workspaceId) return;
    
    setFeedback(t('leadClassification.feedback.loadingFromDatabase'));
    
    try {
      // Cargar keywords filtradas por idioma actual
      const response = await fetch(`/api/workspaces/${session.user.workspaceId}/lead-keywords?language=${currentLang}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const keywords = data.keywords;
          
          console.log(`[KEYWORDS] Loading for language: ${currentLang}`, keywords);
          
          // Si hay keywords en la base de datos para este idioma, usarlas
          if (keywords.hot.length > 0 || keywords.warm.length > 0 || keywords.cold.length > 0) {
            setHotKeywords(keywords.hot);
            setWarmKeywords(keywords.warm);
            setColdKeywords(keywords.cold);
            console.log(`[KEYWORDS] Loaded ${keywords.hot.length + keywords.warm.length + keywords.cold.length} keywords for language ${currentLang}`);
            setFeedback('');
          } else {
            // Si no hay keywords para este idioma, usar por defecto según idioma actual
            console.log(`[KEYWORDS] No keywords found for language ${currentLang}, using defaults`);
            const langKeywords = defaultKeywords[currentLang as 'es' | 'en'];
            setHotKeywords(langKeywords.hot);
            setWarmKeywords(langKeywords.warm);
            setColdKeywords(langKeywords.cold);
            setFeedback(safeTranslate('leadClassification.feedback.usingDefaultKeywords', 'Using default keywords'));
            setTimeout(() => setFeedback(''), 2000);
          }
        } else {
          throw new Error('Error en respuesta de API');
        }
      } else {
        throw new Error(`Error ${response.status}`);
      }
      
      setKeywordsLoaded(true);
      
    } catch (error) {
      console.error('Error cargando keywords desde BD:', error);
      
      // Fallback a valores por defecto según idioma actual
      const langKeywords = defaultKeywords[currentLang as 'es' | 'en'];
      setHotKeywords(langKeywords.hot);
      setWarmKeywords(langKeywords.warm);
      setColdKeywords(langKeywords.cold);
      setKeywordsLoaded(true);
      
      setFeedback(t('leadClassification.feedback.usingDefaultKeywords'));
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const resetToDefaults = async () => {
    try {
      setFeedback(t('leadClassification.feedback.savingKeywords'));
      
      // Primero, eliminar todas las keywords existentes y luego agregar las por defecto
      // Sería más eficiente con una API de reset, pero por simplicidad usamos las funciones existentes
      
      // Usar valores por defecto según idioma actual
      const langKeywords = defaultKeywords[currentLang as 'es' | 'en'];
      setHotKeywords(langKeywords.hot);
      setWarmKeywords(langKeywords.warm);
      setColdKeywords(langKeywords.cold);
      
      setFeedback(t('leadClassification.feedback.keywordsReset'));
      setTimeout(() => setFeedback(''), 3000);
    } catch (error) {
      console.error('Error reseteando keywords:', error);
      setFeedback(t('leadClassification.feedback.keywordsResetError'));
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  // Función simplificada ya que las keywords se guardan automáticamente en cada operación
  const saveKeywordsConfig = () => {
    setFeedback(t('leadClassification.feedback.keywordsConfigSaved'));
    setTimeout(() => setFeedback(''), 3000);
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'HOT':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'WARM':
        return <Minus className="h-4 w-4 text-yellow-600" />;
      case 'COLD':
        return <TrendingDown className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'HOT':
        return 'bg-red-100 text-red-800';
      case 'WARM':
        return 'bg-yellow-100 text-yellow-800';
      case 'COLD':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Target className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            {t('leadClassification.pageTitle')}
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          {t('leadClassification.pageSubtitle')}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">{t('leadClassification.totalChats')}</div>
          <div className="text-2xl font-bold text-gray-900">{statistics.totalChats}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">{t('leadClassification.classifiedChats')}</div>
          <div className="text-2xl font-bold text-indigo-600">{statistics.classifiedChats}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">{t('leadClassification.hotLeads')}</div>
          <div className="text-2xl font-bold text-red-600">{statistics.hotLeads}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">{t('leadClassification.warmLeads')}</div>
          <div className="text-2xl font-bold text-yellow-600">{statistics.warmLeads}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">{t('leadClassification.coldLeads')}</div>
          <div className="text-2xl font-bold text-blue-600">{statistics.coldLeads}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={handleClassifyAllChats}
          disabled={isClassifying || isLoadingCachedResults}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isClassifying || isLoadingCachedResults ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Target className="h-4 w-4" />
          )}
          {isLoadingCachedResults
            ? 'Cargando cache...'
            : isClassifying
            ? t('leadClassification.classifyingButton')
            : t('leadClassification.classifyButton')
          }
        </button>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700"
        >
          <Settings className="h-4 w-4" />
          {showSettings ? t('leadClassification.hideKeywords') : t('leadClassification.configureKeywords')}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            {(isClassifying || isLoadingCachedResults) && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            )}
            <p className="text-blue-800">{feedback}</p>
          </div>
        </div>
      )}

      {/* Keywords Configuration */}
      {showSettings && !keywordsLoaded && (
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-gray-600">{t('leadClassification.feedback.loadingKeywords')}</p>
        </div>
      )}
      
      {showSettings && keywordsLoaded && (
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('leadClassification.keywordsConfigTitle')}
            </h2>
          </div>

          {/* Keyword Added Message */}
          {keywordAddedMessage && (
            <div className="px-6 py-3 bg-green-50 border-b border-green-200">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <p className="text-green-800 text-sm font-medium transition-opacity duration-300">
                  {keywordAddedMessage}
                </p>
              </div>
            </div>
          )}
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* HOT Keywords */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-600" />
                  <h3 className="font-medium text-gray-900">
                    {translations.hotTitle[currentLang as 'es' | 'en']} ({hotKeywords.length})
                  </h3>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHotKeyword}
                    onChange={(e) => setNewHotKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword('hot', newHotKeyword)}
                    placeholder={t('leadClassification.newHotKeyword')}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <button
                    onClick={() => addKeyword('hot', newHotKeyword)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {hotKeywords.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between bg-red-50 px-2 py-1 rounded text-sm">
                      <span className="text-red-800">{keyword}</span>
                      <button
                        onClick={() => removeKeyword('hot', keyword)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* WARM Keywords */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-yellow-600" />
                  <h3 className="font-medium text-gray-900">
                    {translations.warmTitle[currentLang as 'es' | 'en']} ({warmKeywords.length})
                  </h3>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newWarmKeyword}
                    onChange={(e) => setNewWarmKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword('warm', newWarmKeyword)}
                    placeholder={t('leadClassification.newWarmKeyword')}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  />
                  <button
                    onClick={() => addKeyword('warm', newWarmKeyword)}
                    className="px-2 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {warmKeywords.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between bg-yellow-50 px-2 py-1 rounded text-sm">
                      <span className="text-yellow-800">{keyword}</span>
                      <button
                        onClick={() => removeKeyword('warm', keyword)}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLD Keywords */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900">
                    {translations.coldTitle[currentLang as 'es' | 'en']} ({coldKeywords.length})
                  </h3>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newColdKeyword}
                    onChange={(e) => setNewColdKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword('cold', newColdKeyword)}
                    placeholder={t('leadClassification.newColdKeyword')}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => addKeyword('cold', newColdKeyword)}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {coldKeywords.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between bg-blue-50 px-2 py-1 rounded text-sm">
                      <span className="text-blue-800">{keyword}</span>
                      <button
                        onClick={() => removeKeyword('cold', keyword)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveKeywordsConfig}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Save className="h-4 w-4" />
                {t('leadClassification.saveConfiguration')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t('leadClassification.resultsTitle')}</h2>
            {results.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {/* Removido indicador de cache
                cachedResults.size > 0 && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    ⚡ {cachedResults.size} en cache
                  </span>
                )
                */}
                <span>{results.length} resultados</span>
              </div>
            )}
          </div>
        </div>

        {results.length === 0 ? (
          <div className="px-6 py-12 text-center">
            {isLoadingCachedResults ? (
              <div className="space-y-4">
                <Loader2 className="mx-auto h-12 w-12 text-indigo-600 animate-spin" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Cargando resultados desde cache...
                  </h3>
                  <p className="text-gray-500">
                    ⚡ Esto debería ser súper rápido
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Target className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {t('leadClassification.noResults')}
                </h3>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('leadClassification.tableHeaderChat')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('leadClassification.tableHeaderScore')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('leadClassification.tableHeaderClassification')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('leadClassification.tableHeaderReasoning')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('leadClassification.tableHeaderDate')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={result.chatSessionId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        {/* Removido indicador de cache
                        cachedResults.has(result.chatSessionId) && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" title="Resultado cacheado"></div>
                        )
                        */}
                        <span>{result.chatSessionId.slice(0, 8)}... ({result.messageCount} mensajes)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{result.score}/100</div>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${result.score}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getClassificationIcon(result.classification)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClassificationColor(result.classification)}`}>
                          {result.classification}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="break-words" title={result.reasoning}>
                        {result.reasoning}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(result.createdAt).toLocaleDateString()} {new Date(result.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}