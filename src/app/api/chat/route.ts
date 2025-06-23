// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { chatbotServiceBackend } from '@/services/server/chatbotServiceBackend';

/**
 * @file API route for handling chat messages.
 * @description This route acts as a secure bridge between the client and the
 * server-side chatbot logic. It receives a user's message, passes it to the
 * `chatbotServiceBackend` for processing with Gemini, and returns the AI's response.
 */

/**
 * Handles POST requests to the /api/chat endpoint.
 * @param {NextRequest} req - The incoming request object from the client.
 * @returns {Promise<NextResponse>} A JSON response containing the AI's reply or an error message.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required and must be a non-empty string.' }, { status: 400 });
    }

    // Call the backend service to get the AI-generated response
    const aiResponse = await chatbotServiceBackend.generateChatbotResponse(message);

    // Send the response back to the client
    return NextResponse.json({ reply: aiResponse });

  } catch (error) {
    // This catches potential JSON parsing errors or other unexpected issues.
    console.error('[CHAT_API_ROUTE_ERROR]', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}