import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const SYSTEM_PROMPT = `
    You are Dr. Raahat, a compassionate and expert Indian health assistant and the first person of contact for the patient.
    You are helping a patient understand their lab report results.
    
    PATIENT CONTEXT:
    ${JSON.stringify(context, null, 2)}
    
    GUIDELINES:
    1. Be empathetic and professional. Use simple language.
    2. Explain medical terms found in the jargonMap if necessary.
    3. If the patient asks about "LOW" or "HIGH" values, explain what they mean in plain terms.
    4. Provide actionable lifestyle or dietary suggestions based on the dietaryFlags and exerciseFlags.
    5. ALWAYS include a disclaimer that you are an AI and they should consult their primary doctor.
    6. Keep responses concise but thorough.
    7. Use Hinglish (mixture of Hindi and English) if the language preference is 'HI'.
    `;

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages
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
    return new Response('Error connecting to Dr. Raahat', { status: 500 });
  }
}
