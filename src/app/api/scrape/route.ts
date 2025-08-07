// Ruta completa del archivo: src/app/api/scrape/route.ts

import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import puppeteer from 'puppeteer';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// --- ¡NUEVA CONFIGURACIÓN! ---
// Una User-Agent de un navegador real para no parecer un bot
const FAKE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36';

export async function POST(req: NextRequest) {
  let browser = null; // Definimos el navegador aquí para poder cerrarlo en el bloque finally

  try {
    const { url, question } = await req.json();

    if (!url || !question) {
      return NextResponse.json({ error: 'La URL y la pregunta son obligatorias' }, { status: 400 });
    }

    // Lanzamos el navegador en modo "headless" (sin interfaz gráfica)
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // --- MEJORAS DE HUMANIZACIÓN ---
    await page.setUserAgent(FAKE_USER_AGENT); // 1. Nos disfrazamos de Chrome
    await page.setViewport({ width: 1280, height: 800 }); // 2. Simulamos una pantalla de tamaño normal

    // Navegamos a la URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }); // Aumentamos el tiempo de espera

    // --- PAUSA ESTRATÉGICA ---
    // 3. Esperamos un par de segundos extra. Esto es CLAVE para que los pop-ups o scripts de carga tardía terminen.
    await new Promise(r => setTimeout(r, 2000));

    // --- CÓDIGO OPCIONAL PARA HACER CLIC EN EL BANNER DE COOKIES (SI ES NECESARIO) ---
    // Si después de probar, sigue sin funcionar, el siguiente paso es identificar el botón
    // de "Aceptar cookies" y hacer clic en él. Tendrías que encontrar su "selector".
    // Ejemplo:
    // try {
    //   await page.click('#id-del-boton-de-aceptar-cookies');
    //   await new Promise(r => setTimeout(r, 1000)); // Esperar un poco después del clic
    // } catch (e) {
    //   console.log('No se encontró el banner de cookies, o no se pudo hacer clic. Continuando...');
    // }
    
    // Obtenemos el contenido HTML final
    const html = await page.content();

    const $ = cheerio.load(html);
    const pageContent = $('body').text().replace(/\s\s+/g, ' ').trim();

    if (!pageContent) {
      return NextResponse.json({ 
        error: "Se accedió a la página, pero el contenido de texto estaba vacío, probablemente debido a protecciones anti-scraping o a un banner de cookies."
      });
    }

    // ... (El resto del código para llamar a Gemini es el mismo)
    const truncatedContent = pageContent.substring(0, 15000);
    const prompt = `
      Analiza el siguiente texto extraído de una página web y responde a la pregunta del usuario.
      Tu respuesta debe ser exclusivamente un objeto JSON.

      TEXTO DE LA PÁGINA:
      """
      ${truncatedContent}
      """

      PREGUNTA DEL USUARIO: "${question}"

      Basado en la pregunta, extrae la información relevante del texto y devuélvela como un objeto JSON.`;
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(prompt);
    const aiResponse = result.response;
    const extractedData = aiResponse.text();

    return NextResponse.json(JSON.parse(extractedData || '{}'));

  } catch (error) {
    console.error('Error en el endpoint de scrape con Puppeteer:', error);
    return NextResponse.json({ error: 'Ocurrió un error en el servidor al procesar la solicitud.' }, { status: 500 });
  
  } finally {
    // Asegurarnos de que el navegador SIEMPRE se cierre, incluso si hay un error
    if (browser) {
      await browser.close();
    }
  }
}