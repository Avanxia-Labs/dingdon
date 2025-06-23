/**
 * @file Defines the core types for the chatbot application.
 * @description These types are used across the frontend and backend to ensure consistency.
 */

/**
 * Represents a single message in the chat conversation.
 */
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system'; // 'system' can be used for error messages
  timestamp: Date;
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