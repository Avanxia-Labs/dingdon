"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Tag, 
  ThermometerSun, 
  ThermometerSnowflake, 
  Thermometer,
  Clock,
  MessageSquare,
  FileText,
  Plus,
  X,
  AlertCircle,
  Loader
} from 'lucide-react';
import { Message } from '@/types/chatbot';
import { leadClassificationService } from '@/services/server/leadClassificationService';

interface LeadInfo {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  classification?: 'HOT' | 'WARM' | 'COLD';
  classificationScore?: number;
  lastInteraction?: string;
  totalInteractions?: number;
  tags?: string[];
  notes?: Array<{
    id: string;
    content: string;
    agentName: string;
    createdAt: string;
  }>;
}

interface LeadInfoPanelProps {
  sessionId: string;
  workspaceId: string;
  messages: Message[];
  isVisible: boolean;
  onClose?: () => void;
  existingTags?: string[];
  onAddTag?: (tag: string) => void;
}

export const LeadInfoPanel: React.FC<LeadInfoPanelProps> = ({
  sessionId,
  workspaceId,
  messages,
  isVisible,
  onClose,
  existingTags = [],
  onAddTag
}) => {
  const { t } = useTranslation();
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({});
  const [isLoading, setIsLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);
  const [classificationLoading, setClassificationLoading] = useState(false);

  // Cargar información del lead
  useEffect(() => {
    if (sessionId && workspaceId && isVisible) {
      loadLeadInfo();
    }
  }, [sessionId, workspaceId, isVisible]);

  // Reclasificar cuando cambien los mensajes
  useEffect(() => {
    if (sessionId && workspaceId && messages.length > 0) {
      classifyLead();
    }
  }, [messages.length]);

  const loadLeadInfo = async () => {
    setIsLoading(true);
    try {
      console.log(`[LeadInfoPanel] Loading lead info for session: ${sessionId} in workspace: ${workspaceId}`);
      
      // Primero intentar obtener datos del lead desde la sesión de chat
      const response = await fetch(`/api/workspaces/${workspaceId}/chat-sessions/${sessionId}/lead-info`);
      console.log(`[LeadInfoPanel] API response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[LeadInfoPanel] API response data:`, data);
        setLeadInfo(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.log(`[LeadInfoPanel] API error:`, errorData);
        // Si no existe, extraer información básica de los mensajes
        extractLeadInfoFromMessages();
      }
    } catch (error) {
      console.error('[LeadInfoPanel] Error loading lead info:', error);
      extractLeadInfoFromMessages();
    } finally {
      setIsLoading(false);
    }
  };

  const extractLeadInfoFromMessages = () => {
    const userMessages = messages.filter(m => m.role === 'user');
    const leadData: LeadInfo = {
      id: sessionId,
      totalInteractions: userMessages.length,
      lastInteraction: userMessages[userMessages.length - 1]?.timestamp ? 
        (userMessages[userMessages.length - 1].timestamp instanceof Date ? 
          userMessages[userMessages.length - 1].timestamp.toISOString() : 
          new Date(userMessages[userMessages.length - 1].timestamp).toISOString()) : 
        undefined,
      tags: [],
      notes: []
    };

    // Buscar nombre y email en los mensajes
    const allText = userMessages.map(m => m.content).join(' ');
    
    // Regex básico para email
    const emailMatch = allText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      leadData.email = emailMatch[0];
    }

    // Regex básico para teléfono
    const phoneMatch = allText.match(/(\+?[\d\s\-\(\)]{10,})/);
    if (phoneMatch) {
      leadData.phone = phoneMatch[0];
    }

    setLeadInfo(leadData);
  };

  const classifyLead = async () => {
    if (!workspaceId || !sessionId) return;
    
    setClassificationLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/classify-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatSessionId: sessionId })
      });

      if (response.ok) {
        const result = await response.json();
        setLeadInfo(prev => ({
          ...prev,
          classification: result.classification,
          classificationScore: result.score
        }));
      }
    } catch (error) {
      console.error('Error classifying lead:', error);
    } finally {
      setClassificationLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    setIsAddingNote(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/chat-sessions/${sessionId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote })
      });

      if (response.ok) {
        const note = await response.json();
        setLeadInfo(prev => ({
          ...prev,
          notes: [...(prev.notes || []), note]
        }));
        setNewNote('');
        setShowAddNote(false);
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsAddingNote(false);
    }
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    
    // Usar la función externa si está disponible (del ChatPanel)
    if (onAddTag) {
      onAddTag(newTag);
      setNewTag('');
      setShowAddTag(false);
    }
  };

  const getClassificationIcon = (classification?: string) => {
    switch (classification) {
      case 'HOT':
        return <ThermometerSun className="text-red-500" size={16} />;
      case 'WARM':
        return <Thermometer className="text-yellow-500" size={16} />;
      case 'COLD':
        return <ThermometerSnowflake className="text-blue-500" size={16} />;
      default:
        return <AlertCircle className="text-gray-400" size={16} />;
    }
  };

  const getClassificationColor = (classification?: string) => {
    switch (classification) {
      case 'HOT':
        return 'bg-red-100 text-red-800';
      case 'WARM':
        return 'bg-yellow-100 text-yellow-800';
      case 'COLD':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          {t('leadInfo.title', 'Información del Lead')}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="animate-spin" size={24} />
          </div>
        ) : (
          <>
            {/* Información de Contacto */}
            <section>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User size={16} />
                {t('leadInfo.contact', 'Datos de Contacto')}
              </h4>
              <div className="space-y-2">
                {leadInfo.name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-gray-400" />
                    <span>{leadInfo.name}</span>
                  </div>
                )}
                {leadInfo.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-gray-400" />
                    <span>{leadInfo.email}</span>
                  </div>
                )}
                {leadInfo.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-gray-400" />
                    <span>{leadInfo.phone}</span>
                  </div>
                )}
                {!leadInfo.name && !leadInfo.email && !leadInfo.phone && (
                  <p className="text-sm text-gray-500 italic">
                    {t('leadInfo.noContactInfo', 'Sin información de contacto disponible')}
                  </p>
                )}
              </div>
            </section>

            {/* Clasificación */}
            <section>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                {getClassificationIcon(leadInfo.classification)}
                {t('leadInfo.classification', 'Clasificación')}
                {classificationLoading && <Loader className="animate-spin" size={14} />}
              </h4>
              <div className="space-y-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getClassificationColor(leadInfo.classification)}`}>
                  {getClassificationIcon(leadInfo.classification)}
                  {leadInfo.classification || 'Sin clasificar'}
                  {leadInfo.classificationScore && (
                    <span className="text-xs">({leadInfo.classificationScore}/100)</span>
                  )}
                </div>
                <button
                  onClick={classifyLead}
                  disabled={classificationLoading}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {t('leadInfo.reclassify', 'Reclasificar')}
                </button>
              </div>
            </section>

            {/* Estadísticas */}
            <section>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MessageSquare size={16} />
                {t('leadInfo.stats', 'Estadísticas')}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {leadInfo.totalInteractions || 0}
                  </div>
                  <div className="text-xs text-gray-600">
                    {t('leadInfo.totalMessages', 'Mensajes')}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {leadInfo.lastInteraction ? '1' : '0'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {t('leadInfo.sessions', 'Sesiones')}
                  </div>
                </div>
              </div>
              {leadInfo.lastInteraction && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={14} />
                  <span>
                    {t('leadInfo.lastInteraction', 'Última interacción')}: {' '}
                    {new Date(leadInfo.lastInteraction).toLocaleDateString()}
                  </span>
                </div>
              )}
            </section>

            {/* Etiquetas */}
            <section>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Tag size={16} />
                {t('leadInfo.tags', 'Etiquetas')}
                <button
                  onClick={() => setShowAddTag(true)}
                  className="ml-auto p-1 hover:bg-gray-100 rounded-full"
                >
                  <Plus size={14} />
                </button>
              </h4>
              <div className="flex flex-wrap gap-1">
                {existingTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {existingTags.length === 0 && (
                  <p className="text-sm text-gray-500 italic">
                    {t('leadInfo.noTags', 'Sin etiquetas')}
                  </p>
                )}
              </div>
              {showAddTag && onAddTag && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder={t('leadInfo.addTagPlaceholder', 'Nueva etiqueta...')}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <button
                    onClick={addTag}
                    className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTag(false);
                      setNewTag('');
                    }}
                    className="px-2 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {!onAddTag && (
                <p className="text-xs text-gray-500 mt-1 italic">
                  Use el botón "Etiqueta" en la barra de acciones para añadir etiquetas
                </p>
              )}
            </section>

            {/* Notas Internas */}
            <section>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText size={16} />
                {t('leadInfo.notes', 'Notas Internas')}
                <button
                  onClick={() => setShowAddNote(true)}
                  className="ml-auto p-1 hover:bg-gray-100 rounded-full"
                >
                  <Plus size={14} />
                </button>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {leadInfo.notes?.map((note) => (
                  <div key={note.id} className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                    <p className="text-sm text-gray-800">{note.content}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      {note.agentName} • {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {(!leadInfo.notes || leadInfo.notes.length === 0) && (
                  <p className="text-sm text-gray-500 italic">
                    {t('leadInfo.noNotes', 'Sin notas internas')}
                  </p>
                )}
              </div>
              {showAddNote && (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={t('leadInfo.addNotePlaceholder', 'Añadir nota interna...')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setShowAddNote(false);
                        setNewNote('');
                      }}
                      className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                    >
                      {t('common.cancel', 'Cancelar')}
                    </button>
                    <button
                      onClick={addNote}
                      disabled={isAddingNote || !newNote.trim()}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isAddingNote ? <Loader className="animate-spin" size={14} /> : t('common.save', 'Guardar')}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Acciones Rápidas */}
            <section>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                {t('leadInfo.quickActions', 'Acciones Rápidas')}
              </h4>
              <div className="space-y-2">
                <button 
                  onClick={classifyLead}
                  className="w-full p-2 text-left text-sm bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                >
                  {t('leadInfo.reclassifyAction', 'Reclasificar Lead')}
                </button>
                <button className="w-full p-2 text-left text-sm bg-green-50 hover:bg-green-100 rounded border border-green-200">
                  {t('leadInfo.scheduleFollowup', 'Programar Seguimiento')}
                </button>
                <button className="w-full p-2 text-left text-sm bg-purple-50 hover:bg-purple-100 rounded border border-purple-200">
                  {t('leadInfo.exportConversation', 'Exportar Conversación')}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};