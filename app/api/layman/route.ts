import { NextRequest, NextResponse } from 'next/server';
import { pipeline } from '@xenova/transformers';

// Singleton for model loading to avoid repeated initialization
let laymanPipeline: any = null;

const getPipeline = async () => {
    if (!laymanPipeline) {
        laymanPipeline = await pipeline('text2text-generation', 'Xenova/flan-t5-small');
    }
    return laymanPipeline;
};

const CLINICAL_DICT: Record<string, string> = {
  'Hemoglobin': 'Hemoglobin is the protein in your red blood cells that carries oxygen.',
  'Bilirubin (Total)': 'Total Bilirubin measures the yellowish pigment made during the breakdown of red blood cells.',
  'Bilirubin (Direct)': 'Direct Bilirubin is the form of bilirubin that has been processed by the liver.',
  'SGPT (ALT)': 'ALT is an enzyme found mostly in the liver; high levels suggest liver stress.',
  'SGOT (AST)': 'AST is an enzyme found in the liver and heart; elevated levels can indicate cell damage.',
  'Albumin': 'Albumin is a protein made by the liver that keeps fluid from leaking out of blood vessels.',
  'Glucose': 'Glucose is the main sugar found in your blood and is your body\'s primary source of energy.',
  'Creatinine': 'Creatinine is a waste product from muscle breakdown, filtered by the kidneys.',
  'Urea': 'Urea is a waste product formed in the liver and excreted by the kidneys.',
  'TSH': 'TSH levels indicate how well your thyroid gland is functioning.',
  'T3': 'T3 is a thyroid hormone that plays a vital role in metabolism.',
  'T4': 'T4 is the primary hormone secreted by the thyroid gland.',
  'HbA1c': 'HbA1c measures your average blood sugar levels over the past 3 months.',
  'Uric Acid': 'High uric acid levels can lead to gout or kidney stones.',
  'Cholesterol': 'Total cholesterol is a measure of the total amount of fat in your blood.',
  'Triglycerides': 'Triglycerides are a type of fat (lipid) found in your blood.',
  'HDL': 'HDL is the "good" cholesterol that helps remove other forms of cholesterol from your bloodstream.',
  'LDL': 'LDL is the "bad" cholesterol that can build up in the walls of your arteries.'
};

export async function POST(req: NextRequest) {
    try {
        const { test, value, status, lang } = await req.json();

        // Dictionary Fallback (High-Confidence First)
        if (lang === 'EN' && CLINICAL_DICT[test]) {
            return NextResponse.json({ explanation: CLINICAL_DICT[test] });
        }

        const generator = await getPipeline();

        // EkaCare Standardized Prompting (Fine-tuned on reportraahat-simplifier)
        const prompt = `simplify medical finding: ${test} ${value} ${status}`;
        
        const out = await generator(prompt, { 
            max_new_tokens: 60,
            temperature: 0.3,
            repetition_penalty: 1.2
        });
        const explanation = out[0].generated_text.trim();
        return NextResponse.json({ explanation });

    } catch (error) {
        console.error('FLAN-T5 Inference Error:', error);
        return NextResponse.json({ error: 'Inference failed' }, { status: 500 });
    }
}
