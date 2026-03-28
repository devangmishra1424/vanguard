import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { executeFullPipeline } from '@/lib/ragEngine';

// Set function timeout for Vercel
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return new Response('Error: GROQ_API_KEY is missing or invalid in .env.local', { status: 500 });
  }

  try {
    const { messages, context, reportContext } = await req.json();

    const SYSTEM_PROMPT = `
You are Dr. Raahat, a medical AI assistant helping patients understand lab results.

RESPONSE STYLE: Concise, Pointwise, Well-Documented
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Use numbered lists or bullets (not paragraphs)
✓ One sentence per point (max 2 lines)
✓ No fluff, jargon, or lengthy explanations
✓ Include section headers in BOLD
✓ Translation MUST be dual (EN: / HI:)
✓ Pure English in EN section, Pure Hindi (Devanagari) in HI section

STRUCTURE YOUR ANSWERS AS:

EN:
**Section Header**
1. Point one — concise explanation
2. Point two — actionable advice
3. When to see doctor — clear red flags

HI:
**खंड शीर्षक**
1. पहला बिंदु — संक्षिप्त व्याख्या
2. दूसरा बिंदु — कार्यान्वयन योग्य सलाह
3. डॉक्टर से कब मिलें — स्पष्ट संकेत

CONTENT REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• **What It Means** (1-2 lines defining the lab value)
• **Why It Matters** (1-2 lines impact on health)
• **What To Do** (2-3 numbered actions only)
• **Red Flags** (when to see doctor immediately)
• **Disclaimer** (you are AI, consult your doctor)

TONE: Professional, empathetic, never alarmist
LANGUAGE: Simple, avoid medical jargon unless explaining it

${reportContext ? `\nPATIENT CONTEXT: ${reportContext}` : ''}
`;


    // Get the last user message for query
    const lastUserMessage = [...messages]
      .reverse()
      .find((m: any) => m.role === 'user');
    const query = lastUserMessage?.content || '';

    // Execute three-stage pipeline for chat context
    const pipelineResult = await executeFullPipeline(query, SYSTEM_PROMPT, 'chat');

    const groq = new Groq({ apiKey });
    const augmentedMessages = [
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    // Insert pipeline context into user query if available
    if (pipelineResult.ragContext) {
      const lastIdx = augmentedMessages.length - 1;
      if (augmentedMessages[lastIdx]?.role === 'user') {
        augmentedMessages[lastIdx].content += `\n\n[MEDICAL KNOWLEDGE CONTEXT]\n${pipelineResult.ragContext}`;
      }
    }

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...augmentedMessages,
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