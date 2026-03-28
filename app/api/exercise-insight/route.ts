import { NextRequest, NextResponse } from 'next/server';
import { executeFullPipeline } from '@/lib/ragEngine';

// Set function timeout for Vercel
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { labValues, exerciseFlags, exercisePlan, age, language } = await req.json();

    const abnormalTests = labValues
      .filter((v: any) => v.status !== 'NORMAL')
      .map((v: any) => `${v.name}: ${v.value} ${v.unit}`)
      .join('; ');
    const flagsSummary = exerciseFlags.join(', ');
    const ageBracket = age ? (age >= 60 ? 'Senior (60+)' : age >= 40 ? 'Middle-aged (40-60)' : 'Young Adult') : 'Age unknown';

    const systemPrompt = `
You are a certified exercise coach providing personalized movement guidance.

PATIENT: ${ageBracket} with ${flagsSummary}
FINDINGS: ${abnormalTests || 'No critical abnormalities'}

RULES:
1. Specific activities tied to their condition
2. 1 activity to AVOID and why
3. For seniors/anemia/liver: ZERO-IMPACT only (walking, yoga, stretching)
4. Weekly progression (Week 1: 3x → Week 2: 4x)
5. English and Hindi sections (pure, no Hinglish mixing)
6. Maximum 300 words
7. No internal prompts or markdown headers showing
    `.trim();

    const query = `Exercise plan for: ${flagsSummary}. Age: ${age || 'unknown'} years. Critical labs: ${abnormalTests}`;

    // Helper: Generate fallback exercise insight
    const getFallbackExerciseInsight = (flags: string): string => {
      const patterns: Record<string, string> = {
        'ANEMIA': 'For anemia, perform low-intensity activities: Daily 20-30 minute walks, gentle yoga (3x/week), swimming (2x/week). AVOID: Running, high-intensity workouts. Take breaks when tired. Stay well-hydrated.\n\nएनीमिया के लिए: रोज 20-30 मिनट की सैर, कोमल योग (3x हफ्ता में), तैराकी (2x हफ्ता में)। बचें: दौड़ना, तीव्र व्यायाम। थकान होने पर आराम करें। पानी खूब पिएं।',
        'DIABETES': 'For diabetes: 30-minute walks after meals (especially dinner), resistance training 2x/week, yoga 3x/week. This helps control blood sugar naturally. Check glucose before/after exercise. Stay hydrated and have a snack ready.\n\nडाइबिटीज़ के लिए: खाने के बाद 30 मिनट की सैर (खासकर रात को), सप्ताह में 2 बार शक्ति प्रशिक्षण, योग 3x। यह रक्त शर्करा को नियंत्रित करने में मदद करता है।',
        'LIVER': 'For liver health: Gentle 20-minute walks daily, stretching 5x/week, restorative yoga 2x/week. AVOID: Intense cardio, heavy weights. Listen to your body. Rest when fatigued.\n\nलीवर स्वास्थ्य के लिए: रोज कोमल 20 मिनट की सैर, खिंचाव 5x हफ्ता, बहाली योग 2x। बचें: तीव्र कार्डियो, भारी वजन।',
        'KIDNEY': 'For kidney support: Moderate walking 30-40 minutes, 4-5 days/week, light yoga, swimming. Monitor fluid intake per doctor. Avoid strenuous exercise.\n\nगुर्दे के लिए: मध्यम सैर 30-40 मिनट, 4-5 दिन/हफ्ता, हल्का योग, तैराकी। डॉक्टर की सलाह के अनुसार तरल सेवन करें।',
        'HEART': 'For heart health: Consult your cardiologist first. Usually 20-30 minute moderate walks, 5x/week, light stretching. Avoid sudden intense activity.\n\nहृदय स्वास्थ्य के लिए: पहले हृदय रोग विशेषज्ञ से मिलें। आमतौर पर 20-30 मिनट की मध्यम सैर, 5x/हफ्ता।',
      };
      
      for (const [keyword, advice] of Object.entries(patterns)) {
        if (flags.toUpperCase().includes(keyword)) {
          return advice;
        }
      }
      
      return 'Start with 20-30 minute daily walks. Add yoga or stretching 2-3x/week. Gradually increase activity. Consult your doctor before major changes.\n\nरोज 20-30 मिनट की सैर से शुरुआत करें। सप्ताह में 2-3 बार योग जोड़ें। धीरे-धीरे गतिविधि बढ़ाएं। बड़े बदलावों से पहले डॉक्टर से परामर्श लें।';
    };

    // Call executeFullPipeline to get exercise insight
    const pipelineResult = await executeFullPipeline(query, systemPrompt, 'exercise');

    let insight = pipelineResult.generated || '';

    // FIXED: Validate response before returning (check for corrupted output)
    // Detect corrupted output: too short, has prompt markers, or shows leaked internal text
    const isSuspicious =
      !insight ||
      insight.length < 50 ||
      insight.includes('**') ||
      insight.includes('✦') ||
      insight.includes('System prompt') ||
      insight.includes('PATIENT:') ||
      insight.includes('RULES:') ||
      /\*\*[^\*]*EN:/i.test(insight) ||  // Markdown header pattern
      /mixed|fragment|repeat/i.test(insight);  // Common corruption indicators

    if (isSuspicious) {
      console.warn('⚠️  Exercise insight response validation failed, using fallback');
      insight = getFallbackExerciseInsight(flagsSummary);
    }

    return NextResponse.json({ insight });
  } catch (error) {
    console.error('❌ Exercise insight generation failed:', error);
    const fallback = 'Maintain a regular exercise routine: 30-minute walks daily, gentle yoga 2-3x/week, stretching 5x/week. Consult your healthcare provider for a personalized plan.\n\nनियमित व्यायाम दिनचर्या: रोज 30 मिनट की सैर, सप्ताह में 2-3 बार योग, खिंचाव 5x हफ्ता में। व्यक्तिगत योजना के लिए डॉक्टर से परामर्श लें।';
    return NextResponse.json({ insight: fallback }, { status: 500 });
  }
}
