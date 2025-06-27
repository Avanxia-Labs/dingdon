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
  const { companyName, services, commonQuestions } = MOCK_CHATBOT_CONFIG;

  const formattedQA = commonQuestions.map(qa =>
    `Q: ${qa.question}\nA: ${qa.answer}`
  ).join('\n\n')

  return `
  You are a professional and knowledgeable virtual assistant for ${companyName}.
  Your goal is to provide expert guidance on payment processing solutions, answer technical questions, and identify potential business opportunities.

  About the company:
  - Company Name: ${companyName}
  - We are a comprehensive payment processing and financial services provider
  - We specialize in secure, scalable payment solutions for businesses across multiple industries
  - We offer both payment processing technology and additional business services

  Our Core Services:
  ${services.map(service => `- ${service}`).join('\n')}

  KNOWLEDGE BASE - Use this information to answer user questions accurately:
  ${formattedQA}

  Your Instructions:
  1. FIRST, check if the user's question relates to any topic in the KNOWLEDGE BASE above. Use those answers as your primary reference.
  2. For payment processing questions (credit cards, ACH, pricing models), use the relevant knowledge base information.
  3. For industry-specific questions (legal, healthcare, retail, jewelry), reference our specialized industry solutions.
  4. For fraud protection, chargeback, or security questions, highlight our advanced protection features.
  5. For POS or hardware questions, mention our Clover solutions and payment hardware options.
  6. For business services beyond payments (accounting, payroll, registration), reference our additional services.
  7. Always be professional, knowledgeable, and solution-oriented.
  8. If you need more specific technical details not in the knowledge base, offer to connect them with a payment specialist.
  9. Your primary goal is to demonstrate our expertise and encourage next steps like consultations, demos, or quotes.
  10. When discussing pricing, emphasize our transparent interchange plus pricing model and offer personalized consultations.
  11. Keep responses informative but concise, matching the professional tone of the financial services industry.
  12. Always prioritize security, compliance, and reliability in your responses.
  `;
}

/**
 * Generates a response to the user's prompt.
 * It first checks for a local answer and falls back to the Gemini API if none is found.
 * @param {string} userPrompt - The message sent by the user.
 * @param {string} sessionId - The unique ID of the chat session.
 * @returns {Promise<string>} The generated or retrieved response.
 */
async function generateChatbotResponse(userPrompt: string, sessionId: string): Promise<string | { handoff: true }> {

  console.log(`[Backend] Generating response for session: ${sessionId}`);

  // Validate the user prompt
  const normalizedQuery = userPrompt.toLowerCase();
  const handOffKeywords = ['agent', 'human', 'speak to', 'talk to', 'representative', 'customer service', 'support'];

  // Check if the user is explicitly asking to speak to a human agent
  if (handOffKeywords.some(keyword => normalizedQuery.includes(keyword))) {
    console.log(`[Handoff] User requested human assistance in session: ${sessionId}`);
    return { handoff: true }; // Indicate that the user wants to speak to a human agent
  }

  // 1. (Retrieval) Attempt to find a direct answer from our knowledge base first.
  const localAnswer = findLocalAnswer(userPrompt);
  if (localAnswer) {
    console.log("Returning local answer");
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
        generationConfig: {
          temperature: 0.7, // The lower the temp, the more consistent response
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
    );

    const textResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textResponse) {
      console.log("Returning AI response");
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