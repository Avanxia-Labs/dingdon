// app/lib/chatbot/chatbotServiceBackend.ts

import axios from 'axios';
import { MOCK_CHATBOT_CONFIG } from '@/mocks/chatbotMock';

/**
 * @file Contains server-side logic for interacting with the Gemini API.
 * @description This service implements a simple Retrieval-Augmented Generation (RAG) pattern.
 * It first attempts to find a direct answer in its local knowledge base. If unsuccessful,
 * it then calls the external Gemini API for a generated response.
 */

// Retrieve the API key from environment variables. This code only runs on the server.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("CRITICAL: GEMINI_API_KEY is not defined. The chatbot will not be able to function.");
}

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;


/**
 * Searches the local knowledge base (MOCK_CHATBOT_CONFIG) for a predefined answer.
 * This is the "Retrieval" part of our RAG setup.
 * @param {string} userQuery - The user's incoming message.
 * @returns {string | null} The predefined answer if a match is found, otherwise null.
 */
function findLocalAnswer(userQuery: string): string | null {
  const normalizedQuery = userQuery.toLowerCase().trim();

  // A simple keyword-based search. For a real RAG system, this would be a vector search.
  for (const qa of MOCK_CHATBOT_CONFIG.commonQuestions) {
    // Check if the user's query is very similar to a predefined question.
    // This is a basic implementation. More advanced would be NLP similarity scores.
    if (normalizedQuery.includes(qa.question.toLowerCase().substring(0, 20))) { // Match first few words
      console.log(`[Local Answer] Found match for query: "${userQuery}"`);
      return qa.answer;
    }
  }

  return null; // No local answer found
}


/**
 * Generates a context string from the chatbot configuration to provide to the AI model.
 * This context is used when a local answer is not found and we need to call the AI.
 * @returns {string} The context prompt for the AI.
 */
function generateAIContext(): string {
  const { companyName, services } = MOCK_CHATBOT_CONFIG;
  return `
    You are a professional and friendly virtual assistant for ${companyName}.
    Your goal is to provide initial support, answer questions, and identify potential leads.

    About the company:
    - Company Name: ${companyName}
    - We specialize in AI and automation solutions for sales and support.

    Our Services:
    ${services.map(service => `- ${service}`).join('\n')}

    Your Instructions:
    1. Always be polite, professional, and helpful.
    2. Use the provided information to answer questions about our services.
    3. If you don't know an answer, politely state that you can connect the user with a human specialist.
    4. Your primary goal is to encourage the user to take the next step, such as scheduling a demo, talking to sales, or requesting a quote.
    5. When asked for pricing, explain that it's custom and offer to arrange a consultation for a personalized quote.
    6. Keep your answers concise and easy to understand.
  `;
}

/**
 * Generates a response to the user's prompt.
 * It first checks for a local answer and falls back to the Gemini API if none is found.
 * @param {string} userPrompt - The message sent by the user.
 * @returns {Promise<string>} The generated or retrieved response.
 */
async function generateChatbotResponse(userPrompt: string): Promise<string> {
  // 1. (Retrieval) Attempt to find a direct answer from our knowledge base first.
  const localAnswer = findLocalAnswer(userPrompt);
  if (localAnswer) {
    return localAnswer;
  }

  // 2. (Augmentation & Generation) If no local answer, proceed to call the AI.
  console.log(`[AI Fallback] No local answer for query: "${userPrompt}". Calling Gemini.`);

  if (!GEMINI_API_KEY) {
    console.error("Attempted to call Gemini without an API key.");
    return "I'm currently unable to connect to my core services due to a configuration issue. Our team has been notified.";
  }

  const context = generateAIContext();
  const fullPrompt = `${context}\n\nUser: ${userPrompt}\n\nAssistant:`;

  try {
    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024, },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
    );

    const textResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textResponse) {
      return textResponse.trim();
    }
    throw new Error('Invalid response structure from Gemini API');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error calling Gemini API:', error.response?.data || error.message);
    } else {
      console.error('Generic error calling Gemini API:', error);
    }
    return "I'm sorry, I seem to be having some technical difficulties at the moment. Please try again in a little while.";
  }
}

/**
 * The backend service object, exporting the functions to be used by API routes.
 */
export const chatbotServiceBackend = {
  generateChatbotResponse, // Renamed from getGeminiResponse
};