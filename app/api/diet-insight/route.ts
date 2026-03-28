import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { executeFullPipeline } from '@/lib/ragEngine';

// Set function timeout for Vercel
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      return new Response('Note: To enable personalized AI coaching insights, please configure your GROQ_API_KEY in the environment settings.', { status: 200 });
    }
    const { labValues, dietaryFlags, dietPlan, language } = await req.json();

    // Build narrative context instead of raw JSON
    const abnormalTests = labValues
      .filter((v: { status: string }) => v.status !== 'NORMAL')
      .map((v: { name: string; value: number; unit: string; status: string }) => `${v.name} (${v.value} ${v.unit} - ${v.status})`)
      .join(', ');
    const flagsSummary = dietaryFlags.join(', ');

    const SYSTEM_PROMPT = `
    You are Dr. Raahat's specialized Dietary AI Coach with 20+ years of clinical nutrition expertise.
    Your role is to provide PERSONALIZED, evidence-based dietary guidance tailored to THIS patient's specific lab findings.

    PATIENT CONTEXT:
    - Abnormal Lab Findings: ${abnormalTests || 'All within normal limits'}
    - Dietary Condition Flags: ${flagsSummary}
    - Recommended Diet Plan: ${dietPlan.name}

    CRITICAL GUIDELINES:
    1. Output BOTH English and Hindi (Hinglish acceptable for Hindi)
    2. Format:
       EN:
       - Why THIS food helps THIS patient's specific condition (reference the actual lab finding)
       - One actionable dietary change starting THIS WEEK
       HI:
       - [Same in Hindi/Hinglish]
       - [Same in Hindi/Hinglish]
    3. Be SPECIFIC, not generic: Don't say "Iron is important". Say "Your hemoglobin is low (${
      labValues.find((v: { name: string }) => v.name.includes('Hemoglobin'))?.value || 'N/A'
    } g/dL), so eat palak with lemon TODAY to absorb iron."
    4. Acknowledge emotional impact: "I know this diagnosis feels overwhelming, but small diet changes work quickly."
    5. Each point should be 1-2 sentences, practical, and culturally relevant (Indian context).
    6. End with hope: "You're taking the right step by managing this through diet."
    `;

    // Execute three-stage pipeline with 'diet' context
    const queryText = `Dietary recommendations for conditions: ${flagsSummary}. Patient lab findings: ${abnormalTests}`;
    const pipelineResult = await executeFullPipeline(queryText, SYSTEM_PROMPT, 'diet');

    // Stream the generated response
    const groq = new Groq({ apiKey: key });
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Using this context, provide personalized dietary guidance:\n${pipelineResult.ragContext}\n\nQuery: ${pipelineResult.processed}`,
        },
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
