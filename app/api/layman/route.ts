import { NextRequest, NextResponse } from 'next/server';
import { searchTestKnowledge, generateRAGResponse } from '@/lib/ragEngine';

// Set function timeout for Vercel
export const maxDuration = 60;

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
        const { test, value, status, lang, unit = '' } = await req.json();

        // Dictionary Fallback for basic info
        if (lang === 'EN' && CLINICAL_DICT[test]) {
          let explanation = CLINICAL_DICT[test];
          
          // Add value-specific context
          if (status === 'HIGH') {
            explanation += ` In your case, it's elevated (${value} ${unit}), which means your body is producing or retaining too much of this marker.`;
          } else if (status === 'LOW') {
            explanation += ` In your case, it's low (${value} ${unit}), which means your body isn't producing or storing enough of this marker.`;
          }
          
          return NextResponse.json({ explanation });
        }

        // For RAG-enhanced explanations (Hindi or detailed English)
        const systemPrompt = `You are a medical assistant explaining lab test results in simple, patient-friendly language.
        
Test: ${test}
Value: ${value} ${unit}
Status: ${status}

Explain what this test measures, what the result means for the patient, and what they should do. Keep it simple and avoid medical jargon.`;

        const explanation = await generateRAGResponse(test, systemPrompt);
        return NextResponse.json({ explanation });

    } catch (error) {
        console.error('Layman Explanation Error:', error);
        return NextResponse.json({ error: 'Explanation generation failed' }, { status: 500 });
    }
}
