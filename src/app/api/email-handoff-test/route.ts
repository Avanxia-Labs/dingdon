import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email/server';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const via = url.searchParams.get('via');
  const workspaceId = process.env.TEST_WORKSPACE_ID || 'test-workspace';
  const sessionId = `test-${Date.now()}`;
  const initialMessage = { id: 'user-1', role: 'user', content: 'Quiero hablar con un agente', timestamp: new Date() };

  // Modo por defecto: envío directo de email (evita ECONNREFUSED si el servidor interno no está disponible)
  if (via !== 'internal') {
    try {
      await emailService.sendHandoffNotification(workspaceId, sessionId, initialMessage.content);
      return NextResponse.json({ ok: true, message: 'Handoff de prueba enviado', via: 'direct-email' });
    } catch (err) {
      console.error('Error en envío directo:', err);
      return NextResponse.json({ ok: false, error: 'Fallo en envío directo' }, { status: 500 });
    }
  }

  // Modo interno explícito: intenta notificador interno
  try {
    const isDev = process.env.NODE_ENV !== 'production';
    const internalApiUrl = isDev
      ? 'http://localhost:3001/api/internal/notify-handoff'
      : `http://localhost:${process.env.PORT || 3001}/api/internal/notify-handoff`;

    const resp = await fetch(internalApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || ''
      },
      body: JSON.stringify({ workspaceId, sessionId, initialMessage })
    });
    const text = await resp.text();
    return NextResponse.json({ ok: resp.ok, status: resp.status, body: text, via: 'internal-notifier' });
  } catch (error) {
    console.error('Error en notificador interno:', error);
    return NextResponse.json({ ok: false, error: 'ECONNREFUSED notificador interno' }, { status: 502 });
  }
}