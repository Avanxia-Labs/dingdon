/**
 * @file Defines the core types for the chatbot application.
 * @description These types are used across the frontend and backend to ensure consistency.
 */

type Roles = 
  'user'      | // The user who interacts with the chatbot
  'assistant' | // The chatbot itself, providing responses
  'system'    | // System messages, typically for internal use
  'agent'       // An agent who can take over the conversation

/**
 * Represents a single message in the chat conversation.
 */
export interface Message {
  id: string;
  content: string;
  role: Roles 
  timestamp: Date;
  agentName?: string; // Optional, used for agent messages
}

/**
 * Defines the structure for the chatbot's knowledge base.
 * This configures the bot's identity, services, and predefined answers.
 */
export interface ChatbotConfig {
  companyName: string;
  services: string[];
  commonQuestions: { question: string; answer: string }[];
}

/**
 * The expected structure of the response from our own chat API endpoint from Gemini (/api/chat).
 */
export interface ChatApiResponse {
  reply: string;
}

/**
 * Represents a chat session, which includes the messages exchanged and the session status.
 */
export type ChatSessionStatus = 
  'bot'             // The bot is handling the session 
| 'pending_agent'   // The session is waiting for an agent to take over
| 'in_progress'     // The session is currently being handled by an agent
| 'closed';         // The session has been closed

export interface ChatSession {
  id: string;
  messages: Message[];
  status: ChatSessionStatus;
  assignedAgentId?: string;
}

