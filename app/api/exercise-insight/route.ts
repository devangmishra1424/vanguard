import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      return new Response('Note: Configure GROQ_API_KEY for AI exercise coaching.', { status: 200 });
    }
    const groq = new Groq({ apiKey: key });
    const { labValues, exerciseFlags, exercisePlan, age, language } = await req.json();

    const SYSTEM_PROMPT = `
    You are Dr. Raahat's specialized MoveSmart Exercise Coach. 
    Your goal is to provide a BRIEF, professional, and age-aware summary of the suggested exercise plan.

    CONTEXT:
    - Current Language Preference: ${language}
    - Patient Age: ${age || 'Not Extracted'}
    - Exercise Flags: ${JSON.stringify(exerciseFlags)}
    - Lab Findings: ${JSON.stringify(labValues)}
    - Pre-defined Plan: ${JSON.stringify(exercisePlan)}

    GUIDELINES:
    1. EXTREMELY IMPORTANT: Provide the response in BOTH English and Hindi.
    2. Format exactly as:
       EN:
       - Point 1
       - Point 2
       HI:
       - बिंदु 1
       - बिंदु 2
    3. Be extremely strict about safety. If the patient is a Senior (60+) or has severe findings (like anemia/liver stress), emphasize Low-Impact movement.
    4. Explain *why* certain "Healing" movements (like specific Yoga or Breathing) are suggested for their condition.
    5. Highlight 1 key activity to AVOID based on their risk flags.
    6. Keep it short (max 2-3 points per language).
    7. Use simple, supportive language.
    `;

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "Can you give me a personalized coaching summary for my exercise plan?" }
      ],
      stream: true,
      temperature: 0.4,
      max_tokens: 400,
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
    console.error('Exercise Insight API Error:', error);
    return new Response('Unable to generate movement insight.', { status: 500 });
  }
}
