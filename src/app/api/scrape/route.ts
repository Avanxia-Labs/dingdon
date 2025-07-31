// Ruta completa del archivo: src/app/api/scrape/route.ts

import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
// ¡Importante! Importamos la biblioteca de Google
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Inicializamos el cliente de Google, leyendo la nueva clave de entorno.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { url, question } = await req.json();

    if (!url || !question) {
      return NextResponse.json({ error: 'La URL y la pregunta son obligatorias' }, { status: 400 });
    }

    // El proceso de scraping es EXACTAMENTE el mismo
    const response = await fetch(url);
    if (!response.ok) {
        return NextResponse.json({ error: `No se pudo acceder a la URL. Estado: ${response.status}` }, { status: 500 });
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const pageContent = $('body').text().replace(/\s\s+/g, ' ').trim();
    const truncatedContent = pageContent.substring(0, 15000);

    // 2. Construimos el prompt (es el mismo concepto)
    const prompt = `
      Analiza el siguiente texto extraído de una página web y responde a la pregunta del usuario.
      Tu respuesta debe ser exclusivamente un objeto JSON.

      TEXTO DE LA PÁGINA:
      """
      ${truncatedContent}
      """

      PREGUNTA DEL USUARIO: "${question}"

      Basado en la pregunta, extrae la información relevante del texto y devuélvela como un objeto JSON.
    `;

    // 3. ¡Aquí está el cambio! Usamos el modelo y la configuración de Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // Un modelo rápido y eficiente de Gemini
      generationConfig: {
        responseMimeType: "application/json", // ¡La función mágica para forzar JSON en Gemini!
      },
    });

    const result = await model.generateContent(prompt);
    const aiResponse = result.response;
    const extractedData = aiResponse.text();

    // 4. Devolver la respuesta JSON parseada al cliente.
    return NextResponse.json(JSON.parse(extractedData || '{}'));

  } catch (error) {
    console.error('Error en el endpoint de scrape con Gemini:', error);
    return NextResponse.json({ error: 'Ocurrió un error en el servidor al procesar la solicitud.' }, { status: 500 });
  }
}