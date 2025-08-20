import { Message } from '@/types/chatbot';

export interface BotCommandResult {
  type: 'system_message' | 'bot_action' | 'error';
  message?: string;
  action?: string;
  data?: any;
}

export interface ChatSessionInfo {
  sessionId: string;
  messages: Message[];
  status: string;
  customerInfo?: any;
  tags?: string[];
  botPaused?: boolean;
}

export const parseBotCommand = (input: string): { command: string; args: string[] } | null => {
  const trimmed = input.trim().toLowerCase();
  
  // Check if it's a bot command
  if (!trimmed.startsWith('/bot ')) {
    return null;
  }
  
  const parts = trimmed.slice(5).split(' '); // Remove '/bot ' prefix
  const command = parts[0];
  const args = parts.slice(1);
  
  return { command, args };
};

export const executeBotCommand = (
  command: string,
  args: string[],
  sessionInfo: ChatSessionInfo
): BotCommandResult => {
  switch (command) {
    case 'resume':
    case 'activar':
      return {
        type: 'bot_action',
        action: 'resume_bot',
        message: '✅ Bot reactivado. La IA ahora responderá automáticamente a los mensajes del cliente.'
      };
      
    case 'pause':
    case 'pausar':
      return {
        type: 'bot_action',
        action: 'pause_bot',
        message: '⏸️ Bot pausado. La IA no responderá hasta que se reactive.'
      };
      
    case 'status':
      return generateStatusMessage(sessionInfo);
      
    case 'transfer':
      if (args.length === 0) {
        return {
          type: 'error',
          message: '❌ Por favor especifica el email del agente: /bot transfer email@empresa.com'
        };
      }
      return {
        type: 'bot_action',
        action: 'transfer_chat',
        data: { targetAgent: args[0] },
        message: `📤 Transfiriendo conversación a ${args[0]}...`
      };
      
    case 'summarize':
    case 'resumen':
      return generateSummary(sessionInfo);
      
    case 'tag':
      if (args.length === 0) {
        return {
          type: 'error',
          message: '❌ Por favor especifica una etiqueta: /bot tag venta'
        };
      }
      return {
        type: 'bot_action',
        action: 'add_tag',
        data: { tag: args.join(' ') },
        message: `🏷️ Etiqueta "${args.join(' ')}" añadida a la conversación.`
      };
      
    default:
      return {
        type: 'error',
        message: `❌ Comando no reconocido: ${command}\n\nComandos disponibles:\n• /bot resume o /bot activar\n• /bot pause o /bot pausar\n• /bot status\n• /bot transfer [email]\n• /bot summarize o /bot resumen\n• /bot tag [etiqueta]`
      };
  }
};

const generateStatusMessage = (sessionInfo: ChatSessionInfo): BotCommandResult => {
  const messageCount = sessionInfo.messages.length;
  const customerMessages = sessionInfo.messages.filter(m => m.role === 'user').length;
  const agentMessages = sessionInfo.messages.filter(m => m.role === 'agent').length;
  const botMessages = sessionInfo.messages.filter(m => m.role === 'assistant').length;
  
  const status = `📊 **ESTADO DE LA CONVERSACIÓN**
━━━━━━━━━━━━━━━━━━━━━━━━
🆔 ID Sesión: ${sessionInfo.sessionId.slice(-8)}
🤖 Estado del Bot: ${sessionInfo.botPaused ? '⏸️ Pausado' : '✅ Activo'}
💬 Total de mensajes: ${messageCount}
  • Cliente: ${customerMessages}
  • Agente: ${agentMessages}
  • Bot: ${botMessages}
🏷️ Etiquetas: ${sessionInfo.tags?.join(', ') || 'Sin etiquetas'}
📅 Estado: ${sessionInfo.status}`;

  return {
    type: 'system_message',
    message: status
  };
};

const generateSummary = (sessionInfo: ChatSessionInfo): BotCommandResult => {
  const messages = sessionInfo.messages;
  
  if (messages.length === 0) {
    return {
      type: 'system_message',
      message: '📝 No hay mensajes para resumir.'
    };
  }
  
  // Get key points from conversation
  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];
  const customerMessages = messages.filter(m => m.role === 'user');
  
  // Extract potential topics (simple keyword extraction)
  const topics = extractTopics(customerMessages);
  
  const summary = `📝 **RESUMEN DE LA CONVERSACIÓN**
━━━━━━━━━━━━━━━━━━━━━━━━
🔹 **Inicio:** ${firstMessage.content.substring(0, 100)}${firstMessage.content.length > 100 ? '...' : ''}

🔹 **Temas principales:** ${topics.join(', ') || 'Consulta general'}

🔹 **Último mensaje:** ${lastMessage.content.substring(0, 100)}${lastMessage.content.length > 100 ? '...' : ''}

🔹 **Interacciones:** ${messages.length} mensajes totales
🔹 **Duración:** ${calculateDuration(messages)}`;

  return {
    type: 'system_message',
    message: summary
  };
};

const extractTopics = (messages: Message[]): string[] => {
  const keywords = ['precio', 'comprar', 'información', 'problema', 'ayuda', 'servicio', 'producto', 'pago', 'envío', 'soporte'];
  const topics = new Set<string>();
  
  messages.forEach(msg => {
    const content = msg.content.toLowerCase();
    keywords.forEach(keyword => {
      if (content.includes(keyword)) {
        topics.add(keyword);
      }
    });
  });
  
  return Array.from(topics);
};

const calculateDuration = (messages: Message[]): string => {
  if (messages.length < 2) return 'N/A';
  
  const first = new Date(messages[0].timestamp);
  const last = new Date(messages[messages.length - 1].timestamp);
  const diffMs = last.getTime() - first.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Menos de 1 minuto';
  if (diffMins === 1) return '1 minuto';
  if (diffMins < 60) return `${diffMins} minutos`;
  
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (hours === 1) return mins > 0 ? `1 hora y ${mins} minutos` : '1 hora';
  return mins > 0 ? `${hours} horas y ${mins} minutos` : `${hours} horas`;
};