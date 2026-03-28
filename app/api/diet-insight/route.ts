import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      return new Response('Note: To enable personalized AI coaching insights, please configure your GROQ_API_KEY in the environment settings.', { status: 200 });
    }
    const groq = new Groq({ apiKey: key });
    const { labValues, dietaryFlags, dietPlan, language } = await req.json();

    const SYSTEM_PROMPT = `
    You are Dr. Raahat's specialized Dietary AI Coach. 
    Your goal is to provide a BRIEF, compassionate, and personalized summary of the suggested diet plan based on the patient's lab results.

    CONTEXT:
    - Current Language Preference: ${language}
    - Dietary Flags: ${JSON.stringify(dietaryFlags)}
    - Lab Findings: ${JSON.stringify(labValues)}
    - Pre-defined Diet Rules: ${JSON.stringify(dietPlan)}

    GUIDELINES:
    1. EXTREMELY IMPORTANT: Provide the response in BOTH English and Hindi.
    2. Format exactly as:
       EN:
       - Point 1
       - Point 2
       HI:
       - बिंदु 1
       - बिंदु 2
    3. Use very simple, layman terms.
    4. Be empathetic. Acknowledge findings.
    5. Explain *why* the suggested "Consume" foods are important.
    6. Keep it short (max 2 points per language).
    7. Use Hinglish for the Hindi part if appropriate.
    8. End with a supportive closing in both languages.
    `;

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "Can you give me a quick personalized summary of my diet plan?" }
      ],
      stream: true,
      temperature: 0.5,
      max_tokens: 300,
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
    console.error('Diet Insight API Error:', error);
    return new Response('Unable to generate personalized insight at this moment.', { status: 500 });
  }
}
