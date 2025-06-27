// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { chatbotServiceBackend } from '@/services/server/chatbotServiceBackend';
import { notificationService } from '@/lib/server/notificationService';
import { Message } from '@/types/chatbot';

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
    const { message, sessionId, history } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required and must be a non-empty string.' }, { status: 400 });
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
    }
    
    
    const aiResponse = await chatbotServiceBackend.generateChatbotResponse(message, sessionId);

    // Call the backend service to get the AI-generated response
    if (typeof aiResponse === 'object' && aiResponse.handoff) {
      // The backend service detected a handoff request.
      console.log(`[API Route] Handoff initiated for session ${sessionId}.`);

      // We get the initial message to provide context to the agent.
      const firstUserMessage = history.find(
        (msg: Message) => msg.role === 'user'
      )

      // We call the service to send the notification to the agent dashboard.
      if (firstUserMessage) {
        notificationService.notifyNewHandoffRequest(sessionId, firstUserMessage)
      }

      return NextResponse.json({
        reply: "Understood. I'm finding an agent to help you. Please wait."
      });
    } else if (typeof aiResponse === 'string') {
      // This is a standard AI-generated response.
      return NextResponse.json({ reply: aiResponse })
    }

    // Fallback for an unexpected response type from the service.
    console.error(`[API Route] Invalid response type from backend service for session: ${sessionId}`);
    return NextResponse.json({ error: 'Invalid response type from backend service.' }, { status: 500 });

  } catch (error) {
    // This catches potential JSON parsing errors or other unexpected issues.
    console.error('[CHAT_API_ROUTE_ERROR]', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}