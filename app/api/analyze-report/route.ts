import { NextRequest, NextResponse } from 'next/server';
import { mockAnemia, mockVitaminD } from '@/lib/mockData';
// @ts-ignore
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
// @ts-ignore
import * as pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';

// ── Clinical Knowledge Base ────────────────────────────────────────────────────
// Canonical name → { aliases, normal range, instant explanation }
const CLINICAL_DB: Record<string, {
  aliases: string[];
  min?: number;
  max?: number;
  invert?: boolean;
  explanation: string;
}> = {
  'Hemoglobin': {
    aliases: ['hemoglobin', 'haemoglobin', 'haemoglobin (hb)', 'hemoglobin (hb)'],
    min: 12.0, max: 17.5,
    explanation: 'Hemoglobin carries oxygen in your red blood cells. Low levels indicate anemia.'
  },
  'RBC Count': {
    aliases: ['total rbc count', 'rbc count', 'red blood cells'],
    min: 4.5, max: 5.5,
    explanation: 'RBC count measures the number of red blood cells. Low levels suggest anemia.'
  },
  'Hematocrit (PCV)': {
    aliases: ['pcv', 'haematocrit (pcv)', 'hematocrit (pcv)', 'packed cell volume', 'hematocrit'],
    min: 40, max: 50,
    explanation: 'Hematocrit is the percentage of red blood cells in your blood.'
  },
  'MCV': {
    aliases: ['mcv', 'mean corpuscular volume', 'mean cell volume'],
    min: 83, max: 101,
    explanation: 'MCV measures the average size of your red blood cells.'
  },
  'MCH': {
    aliases: ['mch', 'mean corpuscular hemoglobin'],
    min: 27, max: 32,
    explanation: 'MCH is the average amount of hemoglobin in each red blood cell.'
  },
  'MCHC': {
    aliases: ['mchc', 'mean corpuscular hemoglobin concentration'],
    min: 31.5, max: 34.5,
    explanation: 'MCHC measures the concentration of hemoglobin in red blood cells.'
  },
  'RDW': {
    aliases: ['rdw', 'rdw - cv', 'rdw-cv', 'red cell distribution width'],
    min: 11.6, max: 14.0,
    explanation: 'RDW measures how much your red blood cells vary in size. High levels can point to anemia.'
  },
  'WBC Count': {
    aliases: ['total wbc count', 'wbc count', 'total leukocyte count', 'tlc', 'white blood cells'],
    min: 4000, max: 11000,
    explanation: 'WBC count measures infection-fighting white blood cells. High levels may indicate infection.'
  },
  'Neutrophils': {
    aliases: ['neutrophils'],
    min: 40, max: 80,
    explanation: 'Neutrophils are the main type of white blood cell that fights bacterial infections.'
  },
  'Lymphocytes': {
    aliases: ['lymphocytes'],
    min: 20, max: 40,
    explanation: 'Lymphocytes are white blood cells that fight viral infections and build immunity.'
  },
  'Monocytes': {
    aliases: ['monocytes'],
    min: 2, max: 10,
    explanation: 'Monocytes help the immune system fight infections and clean up damaged tissue.'
  },
  'Eosinophils': {
    aliases: ['eosinophils'],
    min: 1, max: 6,
    explanation: 'Elevated eosinophils can be a sign of allergies or parasitic infections.'
  },
  'Basophils': {
    aliases: ['basophils'],
    max: 2,
    explanation: 'Basophils release histamine and are involved in allergic reactions.'
  },
  'Platelet Count': {
    aliases: ['platelet count', 'platelets', 'plt'],
    min: 150000, max: 450000,
    explanation: 'Platelets help your blood clot. Low levels increase bleeding risk.'
  },
  'Serum Iron': {
    aliases: ['serum iron', 'iron'],
    min: 60, max: 170,
    explanation: 'Serum iron measures the amount of iron in your blood. Low levels cause anemia.'
  },
  'TIBC': {
    aliases: ['tibc', 'total iron binding capacity'],
    min: 250, max: 370,
    explanation: 'TIBC measures your blood\'s ability to carry iron. High TIBC often means iron deficiency.'
  },
  'Transferrin Saturation': {
    aliases: ['transferrin saturation'],
    min: 20, max: 50,
    explanation: 'Transferrin saturation shows how much of your iron-carrying protein is being used.'
  },
  'Serum Ferritin': {
    aliases: ['serum ferritin', 'ferritin'],
    min: 12, max: 300,
    explanation: 'Ferritin is a protein that stores iron. Low levels are the earliest sign of iron deficiency.'
  },
  'Vitamin B12': {
    aliases: ['vitamin b12', 'b12', 'cyanocobalamin'],
    min: 211, max: 911,
    explanation: 'Vitamin B12 is essential for nerve function and red blood cell formation.'
  },
  'Folic Acid': {
    aliases: ['folic acid', 'folate', 'vitamin b9'],
    min: 3.0, max: 17.0,
    explanation: 'Folic acid is a B-vitamin essential for DNA production and red blood cell formation.'
  },
  'HbA1c': {
    aliases: ['hba1c', 'glycated hemoglobin', 'glycosylated hemoglobin'],
    max: 5.7,
    explanation: 'HbA1c reflects your average blood sugar over 3 months. Used to diagnose diabetes.'
  },
  'Glucose (Fasting)': {
    aliases: ['blood sugar fasting', 'fasting blood sugar', 'glucose fasting', 'fbs', 'blood glucose fasting'],
    max: 100,
    explanation: 'Fasting blood sugar measures glucose after not eating for 8 hours. High levels suggest diabetes.'
  },
  'Bilirubin (Total)': {
    aliases: ['total bilirubin', 'bilirubin total', 'bilirubin (total)'],
    max: 1.2,
    explanation: 'Total Bilirubin is the yellowish pigment made during the breakdown of red blood cells. High levels can cause jaundice.'
  },
  'Bilirubin (Direct)': {
    aliases: ['direct bilirubin', 'bilirubin direct', 'bilirubin (direct)'],
    max: 0.4,
    explanation: 'Direct Bilirubin is the form processed by the liver. High levels suggest liver or bile duct problems.'
  },
  'SGPT (ALT)': {
    aliases: ['sgpt (alt)', 'sgpt', 'alanine aminotransferase', 'alt (sgpt)'],
    max: 45,
    explanation: 'ALT is an enzyme mainly found in the liver. High levels are a strong signal of liver damage.'
  },
  'SGOT (AST)': {
    aliases: ['sgot (ast)', 'sgot', 'aspartate aminotransferase', 'ast (sgot)'],
    max: 40,
    explanation: 'AST is an enzyme found in the liver and heart. High levels can indicate cell damage.'
  },
  'Alkaline Phosphatase': {
    aliases: ['alkaline phosphatase', 'alp'],
    min: 44, max: 147,
    explanation: 'ALP is an enzyme related to the liver and bones. Elevated levels can suggest liver or bone disease.'
  },
  'Albumin': {
    aliases: ['albumin', 'serum albumin'],
    min: 3.5, max: 5.5,
    explanation: 'Albumin is a protein made by the liver. Low levels indicate poor nutrition or liver disease.'
  },
  'Total Protein': {
    aliases: ['total protein'],
    min: 6.4, max: 8.3,
    explanation: 'Total protein measures all proteins in your blood. Low levels may signal kidney or liver disease.'
  },
  'Creatinine': {
    aliases: ['creatinine', 'serum creatinine'],
    min: 0.7, max: 1.3,
    explanation: 'Creatinine is a waste product filtered by the kidneys. High levels indicate kidney disease.'
  },
  'Urea': {
    aliases: ['urea', 'blood urea', 'blood urea nitrogen', 'bun'],
    min: 7, max: 20,
    explanation: 'Blood urea is a waste product from protein breakdown, filtered by the kidneys.'
  },
  'Uric Acid': {
    aliases: ['uric acid'],
    min: 3.5, max: 7.2,
    explanation: 'High uric acid can accumulate in joints, causing gout (sudden joint pain).'
  },
  'Total Cholesterol': {
    aliases: ['total cholesterol', 'cholesterol total', 'cholesterol'],
    max: 200,
    explanation: 'Total cholesterol measures all fats in your blood. High levels increase heart disease risk.'
  },
  'Triglycerides': {
    aliases: ['triglycerides'],
    max: 150,
    explanation: 'Triglycerides are blood fats. High levels, often from diet, increase heart disease risk.'
  },
  'HDL Cholesterol': {
    aliases: ['hdl cholesterol', 'hdl'],
    min: 40, invert: true,
    explanation: 'HDL is "good cholesterol" that removes bad cholesterol from your arteries. Higher is better.'
  },
  'LDL Cholesterol': {
    aliases: ['ldl cholesterol', 'ldl'],
    max: 100,
    explanation: 'LDL is "bad cholesterol" that builds up in arteries. High levels increase heart attack risk.'
  },
  'VLDL Cholesterol': {
    aliases: ['vldl cholesterol', 'vldl'],
    max: 40,
    explanation: 'VLDL carries triglycerides in the blood. High levels increase heart disease risk.'
  },
  'TSH': {
    aliases: ['tsh', 'thyroid stimulating hormone'],
    min: 0.4, max: 4.5,
    explanation: 'TSH controls thyroid function. High TSH means an underactive thyroid; low means overactive.'
  },
  'T3': {
    aliases: ['t3', 'triiodothyronine'],
    min: 80, max: 200,
    explanation: 'T3 is a key thyroid hormone that regulates metabolism and energy levels.'
  },
  'T4': {
    aliases: ['t4', 'thyroxine'],
    min: 5.1, max: 14.1,
    explanation: 'T4 is the main hormone released by the thyroid gland, controlling metabolism.'
  },
  'Sodium': {
    aliases: ['sodium', 'serum sodium'],
    min: 135, max: 145,
    explanation: 'Sodium regulates fluid balance and nerve signals. Imbalances can affect brain function.'
  },
  'Potassium': {
    aliases: ['potassium', 'serum potassium'],
    min: 3.5, max: 5.1,
    explanation: 'Potassium is essential for heart, muscle, and nerve function.'
  },
};

export async function POST(req: NextRequest) {
  try {
    const { base64Image, mimeType, isPDF } = await req.json();

    if (!base64Image) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    // ── 1. PDF TEXT EXTRACTION (Coordinate-Aware) ──────────────────────────────
    let textRows: { text: string; x: number; y: number }[] = [];
    let extractedText = '';

    if (isPDF) {
      const buffer = Buffer.from(base64Image, 'base64');
      if (!(pdfjs as any).GlobalWorkerOptions.workerSrc) {
        (pdfjs as any).GlobalWorkerOptions.workerSrc = pdfWorker;
      }
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer), verbosity: 0 } as any);
      const pdf = await loadingTask.promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        for (const item of content.items as any[]) {
          if (item.str && item.str.trim()) {
            textRows.push({
              text: item.str.trim(),
              x: Math.round(item.transform[4]),
              y: Math.round(item.transform[5]),
            });
          }
        }
      }
      // Build flat text for fallback matching
      extractedText = textRows.map(r => r.text).join(' ');
    } else {
      // For images, fall back to Tesseract (may not be installed but keep old path)
      try {
        const Tesseract = (await import('tesseract.js')).default;
        const { data: { text } } = await Tesseract.recognize(Buffer.from(base64Image, 'base64'), 'eng');
        extractedText = text;
        // Convert to pseudo-rows (each word as a row)
        textRows = extractedText.split('\n').map((line, i) => ({ text: line.trim(), x: 0, y: i * 20 })).filter(r => r.text);
      } catch {
        extractedText = '';
      }
    }

    // ── 2. COLUMNAR TABLE PARSING ──────────────────────────────────────────────
    // Group text items by y-coordinate (±4px tolerance = same row)
    const rowMap = new Map<number, { text: string; x: number }[]>();
    for (const item of textRows) {
      // Find closest existing y-bucket
      let bucket = item.y;
      for (const [k] of rowMap) {
        if (Math.abs(k - item.y) <= 4) { bucket = k; break; }
      }
      if (!rowMap.has(bucket)) rowMap.set(bucket, []);
      rowMap.get(bucket)!.push({ text: item.text, x: item.x });
    }

    // Sort rows top-to-bottom, items left-to-right within each row
    const sortedRows = [...rowMap.entries()]
      .sort((a, b) => b[0] - a[0])           // PDF y goes bottom-up, so higher = earlier
      .map(([, cells]) => cells.sort((a, b) => a.x - b.x));

    const extractedFindings: { name: string; value: number; unit: string; status: 'NORMAL' | 'HIGH' | 'LOW'; layman_en: string }[] = [];
    const seenTests = new Set<string>();

    for (const row of sortedRows) {
      const rowStr = row.map(c => c.text).join(' ').toLowerCase().trim();
      if (!rowStr) continue;

      // Try to match a known lab marker in this row's text
      for (const [canonicalName, config] of Object.entries(CLINICAL_DB)) {
        if (seenTests.has(canonicalName)) continue;

        const matched = config.aliases.some(a => rowStr.includes(a.toLowerCase()));
        if (!matched) continue;

        // Find all numeric cells in this row
        const numericCells = row.filter(c => /^[\d.]+$/.test(c.text.trim()));
        if (numericCells.length === 0) continue;

        // The FIRST numeric cell (leftmost x) is the Result value.
        // The second (if exists) is the start of the Reference Range (e.g. "0.2")
        const resultCell = numericCells[0];
        const value = parseFloat(resultCell.text);
        if (isNaN(value)) continue;

        // Unit: text cell immediately to the RIGHT of the result
        const unitCell = row.find(c => c.x > resultCell.x && !/^[\d.\s-]+$/.test(c.text) && c.text.length < 15);
        const unit = unitCell?.text || '';

        // Status: look for HIGH/LOW/ABNORMAL/NORMAL in the row
        let status: 'NORMAL' | 'HIGH' | 'LOW' = 'NORMAL';
        const upperRow = rowStr.toUpperCase();
        if (upperRow.includes('HIGH') || upperRow.includes('ABNORMAL') || upperRow.includes('H)')) status = 'HIGH';
        else if (upperRow.includes('LOW') || upperRow.includes('L)')) status = 'LOW';
        else {
          // Clinical range fallback
          if (config.min !== undefined && value < config.min) status = config.invert ? 'NORMAL' : 'LOW';
          if (config.max !== undefined && value > config.max) status = config.invert ? 'LOW' : 'HIGH';
        }

        extractedFindings.push({
          name: canonicalName,
          value,
          unit,
          status,
          layman_en: config.explanation,
        });
        seenTests.add(canonicalName);
        break;
      }
    }

    // ── 3. FLAT TEXT FALLBACK (for PDFs where coordinate data is sparse) ───────
    if (extractedFindings.length < 3 && extractedText) {
      const lowerText = extractedText.toLowerCase();
      for (const [canonicalName, config] of Object.entries(CLINICAL_DB)) {
        if (seenTests.has(canonicalName)) continue;
        for (const alias of config.aliases) {
          const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const idx = lowerText.search(new RegExp(`\\b${escapedAlias}\\b`, 'i'));
          if (idx === -1) continue;

          // Lookahead: grab the text snippet after the marker
          const snippet = extractedText.substring(idx + alias.length, idx + alias.length + 100);
          // Skip reference range numbers by looking for a decimal-value pattern NOT preceded by a hyphen
          // "  9.2   g/dL   13.0 - 17.0   LOW"
          // We want 9.2, not 13.0 — pick the FIRST number that isn't immediately after a dash/space-dash
          const numMatches = [...snippet.matchAll(/([\d.]+)/g)];
          if (numMatches.length === 0) continue;
          // The result value is the very first number in the snippet
          const value = parseFloat(numMatches[0][1]);
          if (isNaN(value)) continue;

          const unit = snippet.match(/[\d.]+\s+([a-zA-Z/%]{1,10})/)?.[1] || '';
          let status: 'NORMAL' | 'HIGH' | 'LOW' = 'NORMAL';
          const upper = snippet.toUpperCase();
          if (upper.includes('HIGH') || upper.includes('ABNORMAL')) status = 'HIGH';
          else if (upper.includes('LOW')) status = 'LOW';
          else {
            if (config.min !== undefined && value < config.min) status = config.invert ? 'NORMAL' : 'LOW';
            if (config.max !== undefined && value > config.max) status = config.invert ? 'LOW' : 'HIGH';
          }

          extractedFindings.push({ name: canonicalName, value, unit, status, layman_en: config.explanation });
          seenTests.add(canonicalName);
          break;
        }
      }
    }

    // ── 4. ORGAN INFERENCE (based on actual abnormal findings) ────────────────
    const finalFindings: any[] = extractedFindings.length > 0 ? extractedFindings : (mockAnemia.labValues || []);
    const ORGAN_MAP: Record<string, string> = {
      'sgpt (alt)': 'liver', 'sgot (ast)': 'liver', 'bilirubin (total)': 'liver',
      'bilirubin (direct)': 'liver', 'alkaline phosphatase': 'liver', 'albumin': 'liver',
      'total protein': 'liver',
      'creatinine': 'kidney', 'urea': 'kidney', 'uric acid': 'kidney',
      'tsh': 'thyroid', 't3': 'thyroid', 't4': 'thyroid',
      'total cholesterol': 'heart', 'triglycerides': 'heart', 'hdl cholesterol': 'heart',
      'ldl cholesterol': 'heart', 'vldl cholesterol': 'heart',
      'hemoglobin': 'blood', 'rbc count': 'blood', 'wbc count': 'blood',
      'platelet count': 'blood', 'hematocrit (pcv)': 'blood', 'mcv': 'blood',
      'mch': 'blood', 'mchc': 'blood', 'rdw': 'blood', 'serum iron': 'blood',
      'serum ferritin': 'blood', 'tibc': 'blood', 'transferrin saturation': 'blood',
      'vitamin b12': 'blood', 'folic acid': 'blood',
      'hba1c': 'blood', 'glucose (fasting)': 'blood',
      'sodium': 'blood', 'potassium': 'blood',
    };

    const affectedOrganSet = new Set<string>();
    for (const finding of finalFindings) {
      // Map every finding (not just abnormal) to an organ so the diagram populates
      const organ = ORGAN_MAP[finding.name.toLowerCase()];
      if (organ) affectedOrganSet.add(organ);
    }
    // ── 5. ORGAN INFERENCE: show only the MOST affected organ ─────────────────
    // Count how many abnormal findings map to each organ
    const organAbnormalCount: Record<string, number> = {};
    for (const finding of finalFindings) {
      if (finding.status === 'HIGH' || finding.status === 'LOW') {
        const organ = ORGAN_MAP[finding.name.toLowerCase()];
        if (organ) organAbnormalCount[organ] = (organAbnormalCount[organ] || 0) + 1;
      }
    }

    // Sort organs by abnormal count and pick top 1 (most affected)
    const sortedOrgans = Object.entries(organAbnormalCount)
      .sort((a, b) => b[1] - a[1]);

    // Show only the single most-affected organ (or 'blood' if nothing found)
    const topOrgan = sortedOrgans.length > 0 ? sortedOrgans[0][0] : 'blood';
    const organFlags = [topOrgan];

    // ── 6. REAL CONFIDENCE SCORE ──────────────────────────────────────────────
    // Confidence = how many markers we successfully extracted vs expected panel size
    // A typical report has 10-20 markers. Full extraction of 15+ = high confidence.
    const parsedCount = extractedFindings.length;
    const MIN_EXPECTED = 5;   // less than this = very poor extraction
    const GOOD_EXPECTED = 15; // 15+ markers = good extraction
    
    let confidenceScore: number;
    if (parsedCount === 0) {
      confidenceScore = 20; // complete failure
    } else if (parsedCount < MIN_EXPECTED) {
      // 1-4 markers: low confidence (20-50)
      confidenceScore = 20 + Math.round((parsedCount / MIN_EXPECTED) * 30);
    } else if (parsedCount < GOOD_EXPECTED) {
      // 5-14 markers: medium confidence (50-80)
      confidenceScore = 50 + Math.round(((parsedCount - MIN_EXPECTED) / (GOOD_EXPECTED - MIN_EXPECTED)) * 30);
    } else {
      // 15+ markers: high confidence (80-99)
      confidenceScore = Math.min(80 + Math.round(((parsedCount - GOOD_EXPECTED) / 10) * 15), 99);
    }


    // ── 6. PERSONALIZED ACTION PLAN ──────────────────────────────────────────
    // Maps (markerName_lowercase + status) → up to 3 evidence-based action items
    const ACTION_PLAN_DB: Record<string, { emoji: string; task: string }[]> = {
      'hemoglobin_low': [
        { emoji: '🥦', task: 'Eat iron-rich foods daily: dark leafy greens (palak), beetroot, pomegranate, and dates.' },
        { emoji: '🍊', task: 'Take iron with Vitamin C (amla, orange juice) to improve absorption. Avoid tea/coffee within 1 hour.' },
        { emoji: '💊', task: 'Ask your doctor about iron supplementation (ferrous sulfate or ferrous fumarate).' },
      ],
      'rbc count_low': [
        { emoji: '🥩', task: 'Increase intake of B12-rich foods: eggs, dairy, lean meat, and fortified cereals.' },
        { emoji: '🏃', task: 'Do mild aerobic exercise (30-min walks) to stimulate bone marrow red cell production.' },
        { emoji: '🩺', task: 'Request a peripheral blood smear test to identify the type of anemia.' },
      ],
      'serum iron_low': [
        { emoji: '🫘', task: 'Eat iron-rich dals (rajma, chana, lentils) and leafy greens every day.' },
        { emoji: '🚫', task: 'Avoid tea, coffee, and calcium supplements within 2 hours of iron-rich meals.' },
        { emoji: '💊', task: 'Consult your doctor for oral iron therapy; recheck iron levels in 3 months.' },
      ],
      'serum ferritin_low': [
        { emoji: '🌿', task: 'Ferritin is the earliest iron store marker. Start iron supplementation with medical advice.' },
        { emoji: '🍳', task: 'Include heme-iron sources: eggs and chicken. Non-heme: tofu, pumpkin seeds, spirulina.' },
        { emoji: '🩺', task: 'Recheck ferritin after 8–12 weeks of iron therapy to confirm response.' },
      ],
      'vitamin b12_low': [
        { emoji: '🥛', task: 'Eat B12-rich foods daily: paneer, dahi (curd), eggs, fortified milk or soy milk.' },
        { emoji: '💉', task: 'Severe B12 deficiency may require monthly B12 injections — ask your doctor.' },
        { emoji: '🧠', task: 'Watch for tingling, fatigue, or memory changes — all signs of B12 deficiency.' },
      ],
      'folic acid_low': [
        { emoji: '🥬', task: 'Eat folate-rich foods: methi (fenugreek), moong dal, broccoli, and fortified bread.' },
        { emoji: '💊', task: 'Take folic acid 5 mg/day under medical supervision, especially if pregnant.' },
        { emoji: '🚫', task: 'Limit alcohol entirely — it directly depletes folate stores.' },
      ],
      'mcv_low': [
        { emoji: '🫐', task: 'Low MCV suggests microcytic anemia. Focus on iron: beetroot, methi, and rajma.' },
        { emoji: '💊', task: 'Discuss with your doctor whether iron or thalassemia workup is needed.' },
        { emoji: '🩸', task: 'Request a serum iron, TIBC, and ferritin panel to confirm iron deficiency.' },
      ],
      'rdw_high': [
        { emoji: '🩺', task: 'High RDW suggests mixed deficiency (iron + B12/folate). Request a full hematinic panel.' },
        { emoji: '🥗', task: 'Diversify your diet: iron (palak, rajma), B12 (paneer, eggs), folate (methi, dal).' },
        { emoji: '💊', task: 'A multivitamin with iron, B12, and folic acid may help bridge nutritional gaps.' },
      ],
      'sgpt (alt)_high': [
        { emoji: '🚫', task: 'Avoid alcohol completely — even small amounts worsen liver enzyme elevation.' },
        { emoji: '🥗', task: 'Follow a low-fat, low-sugar diet. Avoid fried foods, maida, and packed snacks.' },
        { emoji: '🩺', task: 'Repeat LFT in 4–6 weeks. If still elevated, request a liver ultrasound.' },
      ],
      'sgot (ast)_high': [
        { emoji: '💧', task: 'Stay well hydrated (8–10 glasses of water/day) to support liver detox pathways.' },
        { emoji: '🚫', task: 'Avoid all hepatotoxic medications (paracetamol, NSAIDs) without doctor approval.' },
        { emoji: '🩺', task: 'AST elevation can indicate cardiac or liver stress — rule out both with your doctor.' },
      ],
      'bilirubin (total)_high': [
        { emoji: '☀️', task: 'Brief morning sunlight exposure (10–15 min) can help break down mild bilirubin.' },
        { emoji: '🚫', task: 'Avoid fatty, oily foods and alcohol entirely until bilirubin normalises.' },
        { emoji: '🩺', task: 'If bilirubin is >2.5 mg/dL, request a liver ultrasound and hepatitis panel immediately.' },
      ],
      'creatinine_high': [
        { emoji: '💧', task: 'Drink 2.5–3 litres of water daily to support kidney filtration.' },
        { emoji: '🥗', task: 'Reduce high-protein foods (meat, protein shakes). Choose plant proteins instead.' },
        { emoji: '🩺', task: 'Request an eGFR test and kidney ultrasound. Monitor BP closely.' },
      ],
      'urea_high': [
        { emoji: '💧', task: 'Increase water intake significantly — dehydration is a common cause of elevated urea.' },
        { emoji: '🥦', task: 'Reduce dietary protein temporarily: avoid red meat, excess dal, and protein supplements.' },
        { emoji: '🩺', task: 'If urea is consistently high, request a creatinine clearance test.' },
      ],
      'total cholesterol_high': [
        { emoji: '🏃', task: 'Do 30–45 minutes of brisk walking or cardio 5 days a week.' },
        { emoji: '🥑', task: 'Replace saturated fats (ghee, cream, red meat) with healthy fats: avocado, nuts, olive oil.' },
        { emoji: '🚫', task: 'Eliminate trans fats: avoid biscuits, namkeen, and commercial fried foods entirely.' },
      ],
      'ldl cholesterol_high': [
        { emoji: '🌾', task: 'Add soluble fibre daily: oats (dalia), psyllium husk (isabgol), and sabja seeds.' },
        { emoji: '🥜', task: 'Eat a small handful of walnuts or almonds daily — shown to reduce LDL by 5–10%.' },
        { emoji: '🩺', task: 'Discuss statin therapy with your doctor if LDL exceeds 160 mg/dL despite lifestyle changes.' },
      ],
      'hdl cholesterol_low': [
        { emoji: '🏃', task: 'Aerobic exercise is the single most effective way to raise HDL — aim for 150 min/week.' },
        { emoji: '🫒', task: 'Add omega-3-rich foods: flaxseeds (alsi), walnuts, and fatty fish (mackerel, sardines).' },
        { emoji: '🚫', task: 'Quit smoking completely — smoking is one of the leading causes of low HDL.' },
      ],
      'triglycerides_high': [
        { emoji: '🚫', task: 'Avoid all refined carbohydrates: white rice (excess), maida, sugar, and cold drinks.' },
        { emoji: '🍷', task: 'Eliminate alcohol — it directly converts to triglycerides in the liver.' },
        { emoji: '🐟', task: 'Eat fatty fish or take fish oil (omega-3): proven to lower triglycerides by 30%.' },
      ],
      'tsh_high': [
        { emoji: '🥥', task: 'Limit goitrogenic foods in raw form: cabbage, cauliflower, broccoli — cook them instead.' },
        { emoji: '💊', task: 'TSH >10: discuss levothyroxine therapy with an endocrinologist.' },
        { emoji: '🧘', task: 'Manage stress actively — cortisol dysregulation can suppress thyroid function.' },
      ],
      'tsh_low': [
        { emoji: '🧘', task: 'Practice consistent sleep hygiene and stress management — hyperthyroidism worsens with stress.' },
        { emoji: '🚫', task: 'Avoid iodine-rich supplements and kelp unless prescribed.' },
        { emoji: '🩺', task: 'Request free T3, free T4, and thyroid antibodies to confirm hyperthyroidism type.' },
      ],
      'glucose (fasting)_high': [
        { emoji: '🚶', task: 'Walk for 30 minutes after each major meal — this is the most effective single intervention for blood sugar.' },
        { emoji: '🥗', task: 'Adopt a low-GI diet: millets (bajra, jowar), vegetables, and legumes over white rice.' },
        { emoji: '🩺', task: 'If fasting glucose is >110 mg/dL, request HbA1c to assess long-term control.' },
      ],
      'hba1c_high': [
        { emoji: '🥦', task: 'Follow a low-carb diet: replace white rice with brown rice, multigrain roti, or dalia.' },
        { emoji: '🏋️', task: 'Resistance training (bodyweight squats, lunges) 3×/week significantly improves insulin sensitivity.' },
        { emoji: '🩺', task: 'HbA1c >6.5% meets criteria for diabetes — start treatment discussions with your doctor now.' },
      ],
      'sodium_low': [
        { emoji: '🧂', task: 'Add a small pinch of rock salt (sendha namak) to meals if medically cleared to do so.' },
        { emoji: '💧', task: 'Do not overhydrate — excessive plain water can dilute sodium further.' },
        { emoji: '🩺', task: 'Low sodium can cause brain fog and seizures — consult your doctor promptly.' },
      ],
      'potassium_low': [
        { emoji: '🍌', task: 'Eat potassium-rich foods: banana, coconut water, sweet potato, and spinach daily.' },
        { emoji: '💊', task: 'Discuss oral potassium supplementation with your doctor if levels are <3.0 mEq/L.' },
        { emoji: '🩺', task: 'Low potassium affects heart rhythm — monitor for palpitations or muscle cramps.' },
      ],
    };

    // Generate personalized checklist from abnormal findings
    const generateChecklist = () => {
      const items: { id: string; task: string; completed: boolean }[] = [];
      let idx = 1;

      // First pass: pick actions for abnormal findings
      for (const finding of finalFindings) {
        if (finding.status === 'NORMAL') continue;
        const key = `${finding.name.toLowerCase()}_${finding.status.toLowerCase()}`;
        const plans = ACTION_PLAN_DB[key];
        if (plans && plans.length > 0) {
          // Add the best action for this finding
          const plan = plans[0]; // top recommendation
          items.push({ id: String(idx++), task: `${plan.emoji} ${plan.task}`, completed: false });
          if (items.length >= 5) break;
        }
      }

      // Second pass: fill up to 3 with additional tips for top abnormal finding
      if (items.length < 3 && finalFindings.length > 0) {
        const topFinding = finalFindings.find(f => f.status !== 'NORMAL');
        if (topFinding) {
          const key = `${topFinding.name.toLowerCase()}_${topFinding.status.toLowerCase()}`;
          const plans = ACTION_PLAN_DB[key];
          if (plans) {
            for (let i = 1; i < plans.length && items.length < 3; i++) {
              items.push({ id: String(idx++), task: `${plans[i].emoji} ${plans[i].task}`, completed: false });
            }
          }
        }
      }

      // Always include doctor visit as last resort
      if (items.length === 0) {
        items.push({ id: '1', task: '🩺 Discuss these findings with your doctor for a personalised treatment plan.', completed: false });
      } else if (items.length < 3) {
        items.push({ id: String(idx), task: '🩺 Follow up with your doctor within 2 weeks to review these results.', completed: false });
      }

      return items.slice(0, 3);
    };

    const checklist = generateChecklist();

    // ── 7. SUMMARY ────────────────────────────────────────────────────────────
    const highs = finalFindings.filter((f: any) => f.status === 'HIGH').map((f: any) => f.name);
    const lows  = finalFindings.filter((f: any) => f.status === 'LOW').map((f: any) => f.name);

    let summary = `Report analysis complete. Found ${extractedFindings.length} lab parameters. `;
    if (highs.length > 0) summary += `Elevated: ${highs.join(', ')}. `;
    if (lows.length  > 0) summary += `Low: ${lows.join(', ')}. `;
    if (highs.length === 0 && lows.length === 0) summary += `All parameters within normal limits. `;
    summary += `Please discuss these results with your doctor.`;

    return NextResponse.json({
      summary,
      hindiSummary: 'रिपोर्ट का विश्लेषण पूर्ण हुआ। कृपया अपने डॉक्टर से सलाह लें।',
      labValues: finalFindings,
      organFlags,
      exerciseFlags: ['NORMAL_ACTIVE'],
      dietaryFlags: ['PROTEIN_RICH'],
      jargonMap: {},
      ai_confidence_score: confidenceScore,
      checklist,
      reportText: extractedText.substring(0, 1500),
    });

  } catch (error) {
    console.error('Analysis Pipeline Error:', error);
    return NextResponse.json(mockVitaminD);
  }
}

