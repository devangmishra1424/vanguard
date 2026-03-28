import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return new Response('Error: GROQ_API_KEY is missing or invalid in .env.local', { status: 500 });
  }

  const groq = new Groq({ apiKey });

  try {
    const { messages, context } = await req.json();

    const SYSTEM_PROMPT = `
    You are Dr. Raahat, a compassionate and expert Indian health assistant and the first person of contact for the patient.
    You are helping a patient understand their lab report results.
    
    GUIDELINES:
    1. Be empathetic and professional. Use simple language.
    2. Explain medical terms found in the jargonMap if necessary.
    3. If the patient asks about "LOW" or "HIGH" values, explain what they mean in plain terms.
    4. Provide actionable lifestyle or dietary suggestions based on the dietaryFlags and exerciseFlags.
    5. ALWAYS include a disclaimer that you are an AI and they should consult their primary doctor.
    6. Keep responses concise but thorough.
    7. DUAL GENERATION: You MUST provide your response in BOTH English and Hindi.
    8. FORMAT: Start your English section with 'EN:' and your Hindi section with 'HI:'.
    9. NO HINGLISH: The Hindi section must be in pure Hindi (Devanagari script), and the English section must be in pure English. Never mix them.
    `;

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m: any) => ({ role: m.role, content: m.content }))
      ],
      stream: true,
      temperature: 0.5,
      max_tokens: 1024,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          controller.enqueue(encoder.encode(content));
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error connecting to Dr. Raahat: ${errorMessage}`, { status: 500 });
  }
}