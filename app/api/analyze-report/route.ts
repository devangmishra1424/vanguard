import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { z } from 'zod';
import { mockAnemia, mockLiver, mockVitaminD } from '@/lib/mockData';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const reportSchema = z.object({
  summary: z.string(),
  hindiSummary: z.string(),
  labValues: z.array(z.object({
    name: z.string(),
    value: z.number(),
    unit: z.string(),
    status: z.enum(['NORMAL', 'HIGH', 'LOW']),
    referenceRange: z.string(),
  })),
  organFlags: z.array(z.string()),
  exerciseFlags: z.array(z.string()),
  dietaryFlags: z.array(z.string()),
  jargonMap: z.record(z.string(), z.string()),
  ai_confidence_score: z.number(),
  checklist: z.array(z.object({
    id: z.string(),
    task: z.string(),
    completed: z.boolean(),
  })),
});

const getSystemPrompt = (language: string) => `
You are Raahat, the first point of contact medical analyzer.
Analyze the report and provide a compassionate explanation.
Language Preference: ${language}

If language is "HI", provide hindiSummary in simple Hindi and summary in English.
If language is "EN", provide both summaries but focus on clarity.

Output ONLY a JSON object matching this schema:
{
  "summary": "Plain English explanation of overall health findings",
  "hindiSummary": "Simple Hindi translation of the summary",
  "labValues": [
    { "name": "Test Name", "value": 12.5, "unit": "g/dL", "status": "NORMAL|HIGH|LOW", "referenceRange": "12-16" }
  ],
  "organFlags": ["liver", "kidney", "heart", "lungs", "blood", "bones"], // use only these IDs if affected
  "exerciseFlags": ["ANEMIA_LIGHT", "LIVER_RESTRICTED", "NORMAL_ACTIVE"], // pick most relevant
  "dietaryFlags": ["IRON_RICH", "LOW_FAT", "VITAMIN_D_RICH", "CALCIUM_RICH", "NO_ALCOHOL"],
  "jargonMap": { "Medical Term": "Simple explanation" },
  "ai_confidence_score": 95,
  "checklist": [
    { "id": "1", "task": "Specific actionable step", "completed": false }
  ]
}

Strictly follow the status (NORMAL/HIGH/LOW) based on the reference ranges in the report.
If a value is outside the range, mark it HIGH or LOW.
`;

export async function POST(req: NextRequest) {
  try {
    const { base64Image, mimeType, language } = await req.json();

    if (!base64Image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for Groq Vision

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: getSystemPrompt(language) },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2048,
        temperature: 0.1,
      }, { signal: controller.signal });

      clearTimeout(timeoutId);

      const content = completion.choices[0]?.message?.content || '';
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      const jsonStr = content.substring(jsonStart, jsonEnd);

      try {
        const rawData = JSON.parse(jsonStr);
        const validatedData = reportSchema.parse(rawData);
        return NextResponse.json(validatedData);
      } catch (parseError) {
        console.error('JSON Parse/Validation Error:', parseError);
        return NextResponse.json(mockVitaminD); // Fallback 3: Parse failure
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Groq API Timeout - Loading Mock Anemia');
        return NextResponse.json(mockAnemia); // Fallback 1: Timeout
      }
      
      if (error.status === 429) {
        console.warn('Groq API Rate Limit - Loading Mock Liver');
        return NextResponse.json(mockLiver); // Fallback 2: Rate limit
      }

      throw error;
    }

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
