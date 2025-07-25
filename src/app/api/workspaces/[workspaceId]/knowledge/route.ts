// app/api/workspaces/[workspaceId]/knowledge/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// Inicializar el cliente de Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(
    request: Request,
    { params }: { params: { workspaceId: string } }
) {
    const session = await getServerSession(authOptions);
    const { workspaceId } = params;

    if (session?.user?.workspaceId !== workspaceId || session.user.workspaceRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 1. Extraer el texto del PDF usando PDFLoader de LangChain
        const loader = new PDFLoader(file, { splitPages: false });
        const docs = await loader.load();
        const documentText = docs.map(doc => doc.pageContent).join('\n\n');

        if (!documentText) {
            throw new Error("Could not extract text from the provided PDF.");
        }

        // 2. Crear el "Meta-Prompt" para la IA
        const metaPrompt = `
            Analyze the following document text and generate a JSON object that strictly follows the ChatbotConfig interface.
            The object must have three properties: 'companyName' (string), 'services' (an array of strings), and 'commonQuestions' (an array of objects, each with a 'question' and 'answer' property).
            Your entire response MUST be ONLY the raw JSON object.

            Document Text:
            ---
            ${documentText.substring(0, 25000)}
            ---

            Keep in mind that maybe the companyName is in the title of the pdf. AND IT IS MANDATORIAL THAT YOU SET AT LEAST 10 COMMON QUESTIONS AND ANSWERS BASED ON THE FILE PROVIDED

            An example answer would be:

            {
  
                "companyName": "GYB Connect",
  
                "services": [
                    "Payment Processing Solutions",
                    "Interchange Plus Pricing Models"
                ],
  
                "commonQuestions": [
                    {
                    "question": "What payment methods do you support?",
                    "answer": "We support all major payment methods including debit & credit cards, ACH payments, and cash management solutions. Our systems are designed to handle diverse payment needs for businesses of all sizes."
                    }
                ]

            }
        `;

        // 3. Llamar a la IA
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            generationConfig: { responseMimeType: "application/json" }
        });
        const result = await model.generateContent(metaPrompt);
        const responseText = result.response.text();

        // 4. Parsear la respuesta
        const generatedConfig = JSON.parse(responseText);

        // 5. Guardar en Supabase
        const { error: updateError } = await supabaseAdmin
            .from('workspaces')
            .update({ knowledge_base: generatedConfig })
            .eq('id', workspaceId);

        if (updateError) {
            throw new Error(`Failed to save knowledge base: ${updateError.message}`);
        }

        return NextResponse.json({ success: true, message: 'Knowledge base updated successfully.' });

    } catch (error: any) {
        console.error("Knowledge upload process failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}