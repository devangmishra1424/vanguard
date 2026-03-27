import { NextRequest, NextResponse } from 'next/server';
import { pipeline } from '@xenova/transformers';

// Singleton for model loading to avoid repeated initialization
let laymanPipeline: any = null;

const getPipeline = async () => {
    if (!laymanPipeline) {
        laymanPipeline = await pipeline('text-generation', 'Xenova/flan-t5-small');
    }
    return laymanPipeline;
};

export async function POST(req: NextRequest) {
    try {
        const { test, value, status, lang } = await req.json();

        const generator = await getPipeline();

        // Specific prompt engineered for medical layman explanation
        // Inspired by Indian clinical note style
        const prompt = lang === 'HI' 
            ? `Translate and explain medical term "${test}" with value "${value}" (${status}) for a patient in very simple Hindi. Explain what it means for their body.`
            : `Explain medical term "${test}" with value "${value}" (${status}) for a patient in very simple English. Avoid jargon.`;

        const out = await generator(prompt, {
            max_new_tokens: 50,
            temperature: 0.3,
            top_k: 5,
        });

        return NextResponse.json({ explanation: out[0].generated_text });

    } catch (error) {
        console.error('FLAN-T5 Inference Error:', error);
        return NextResponse.json({ error: 'Inference failed' }, { status: 500 });
    }
}
