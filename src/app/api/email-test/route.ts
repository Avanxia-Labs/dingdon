import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email/server';

// GET /api/email-test
// Envía un correo de prueba usando el servicio configurado (Resend + remitente fijo).
export async function GET() {
  try {
    await emailService.sendNewLeadNotification('test', {
      name: 'Prueba Resend',
      email: 'test@avanxia.com',
      phone: '555-555-5555',
    });

    return NextResponse.json({ ok: true, message: 'Email de prueba enviado' });
  } catch (error) {
    console.error('Error en /api/email-test:', error);
    return NextResponse.json({ ok: false, error: 'Fallo enviando email de prueba' }, { status: 500 });
  }
}