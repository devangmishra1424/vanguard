import { NextRequest, NextResponse } from 'next/server';
import { mockAnemia, mockVitaminD } from '@/lib/mockData';
import { searchRAG, searchTestKnowledge, searchDietRecommendations, searchExerciseRecommendations, formatRAGContext, initializeRAG, executeFullPipeline } from '@/lib/ragEngine';
// Force Vercel's Node File Trace (NFT) to include the worker in the deployment package
// @ts-ignore
import 'pdfjs-dist/legacy/build/pdf.worker.mjs';

// pdfjs is dynamically imported in the POST handler to avoid Vercel build issues

// Set function timeout for Vercel
export const maxDuration = 60;

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
    aliases: ['hemoglobin', 'haemoglobin', 'hb', 'hgb'],
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
    aliases: ['hba1c', 'glycated haemoglobin', 'glycated hemoglobin', 'hb a1c', 'a1c', 'glycosylated hemoglobin'],
    min: 0,
    max: 5.6,
    invert: false,
    explanation: 'HbA1c shows your average blood sugar over the last 3 months.'
  },
  'Fasting Blood Glucose': {
    aliases: ['fasting blood glucose', 'fbg', 'fasting glucose', 'blood glucose fasting', 'glucose fasting', 'fbs', 'fasting blood sugar', 'blood sugar fasting'],
    max: 99,
    explanation: 'Fasting blood glucose measures glucose after not eating for 8 hours. High levels suggest prediabetes or diabetes.'
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
    aliases: ['alkaline phosphatase', 'alp', 'alk phos', 'alk. phosphatase', 'alk phosphatase', 'alkaline phos'],
    min: 44, max: 147,
    explanation: 'ALP is a liver and bone enzyme. High levels suggest liver disease, bile duct blockage, or bone disorders.'
  },
  'ACR': {
    aliases: ['albumin-creatinine ratio', 'acr', 'urine acr', 'urine albumin creatinine', 'microalbumin creatinine ratio'],
    max: 30,
    invert: false,
    explanation: 'ACR measures protein leaking into urine — high levels indicate kidney damage.'
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
    min: 0.5, max: 1.2,
    explanation: 'Creatinine is a waste product filtered by the kidneys. High levels indicate kidney disease.'
  },
  'Urea': {
    aliases: ['urea', 'blood urea', 'blood urea nitrogen', 'bun'],
    min: 7, max: 20,
    explanation: 'Blood urea is a waste product from protein breakdown, filtered by the kidneys.'
  },
  'Uric Acid': {
    aliases: ['uric acid', 'serum uric acid', 'urate'],
    min: 2.4,
    max: 7.0,
    invert: false,
    explanation: 'High uric acid causes gout and can affect kidneys.'
  },
  'Total Cholesterol': {
    aliases: ['total cholesterol', 'cholesterol total', 'cholesterol'],
    max: 200,
    explanation: 'Total cholesterol measures all fats in your blood. High levels increase heart disease risk.'
  },
  'Triglycerides': {
    aliases: ['triglycerides', 'tg', 'serum triglycerides', 'triglyceride'],
    min: 0,
    max: 150,
    invert: false,
    explanation: 'Triglycerides are blood fats linked to heart disease risk.'
  },
  'HDL Cholesterol': {
    aliases: ['hdl cholesterol', 'hdl', 'high density lipoprotein', 'hdl-c', 'hdl chol'],
    min: 40,
    invert: true,
    explanation: 'HDL is "good cholesterol" that removes bad cholesterol from your arteries. Higher is better.'
  },
  'LDL Cholesterol': {
    aliases: ['ldl cholesterol', 'ldl', 'low density lipoprotein'],
    min: 0,
    max: 100,
    invert: false,
    explanation: 'LDL is "bad cholesterol" that clogs arteries. Optimal <100 mg/dL — 128 IS high, flag it.'
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
    aliases: ['potassium', 'serum potassium', 'k+', 'serum k'],
    min: 3.5,
    max: 5.0,
    invert: false,
    explanation: 'Potassium controls heart rhythm and muscle function.'
  },
  'GGT': {
    aliases: ['ggt', 'gamma-glutamyl transferase', 'gamma glutamyl transferase', 'gamma gt', 'gamma-gt', 'ggt (gamma glutamyl transferase)'],
    min: 0,
    max: 36,
    invert: false,
    explanation: 'GGT is a liver enzyme elevated by alcohol use and liver disease.'
  },
  'eGFR': {
    aliases: ['egfr', 'estimated gfr', 'estimated glomerular filtration rate', 'gfr', 'ckd-epi'],
    min: 60,
    invert: true,
    explanation: 'eGFR measures how well your kidneys are filtering waste from blood. Below 60 indicates kidney disease.'
  },
  'INR': {
    aliases: ['inr', 'international normalised ratio', 'international normalized ratio', 'pt/inr'],
    min: 0.8,
    max: 1.2,
    invert: false,
    explanation: 'INR measures how long blood takes to clot — high means bleeding risk.'
  },
  'Prothrombin Time': {
    aliases: ['pt', 'prothrombin time', 'prothrombin', 'pt (prothrombin time)', 'prothrombin (pt)'],
    min: 11.0,
    max: 13.5,
    invert: false,
    explanation: 'PT measures how long your blood takes to clot. High means bleeding risk.'
  },
  'Free T3': {
    aliases: ['free t3', 'ft3', 'free triiodothyronine', 'f-t3', 't3 free'],
    min: 2.0,
    max: 4.4,
    invert: false,
    explanation: 'Free T3 is the active thyroid hormone that controls metabolism.'
  },
  'Free T4': {
    aliases: ['free t4', 'ft4', 'free thyroxine', 'f-t4', 't4 free', 'fT4'],
    min: 0.93,
    max: 1.70,
    invert: false,
    explanation: 'Free T4 is released by the thyroid and converts to active T3.'
  },
  'Blood Urea Nitrogen': {
    aliases: ['blood urea nitrogen', 'bun', 'urea nitrogen', 'serum bun'],
    min: 7,
    max: 20,
    invert: false,
    explanation: 'BUN measures waste product from protein breakdown filtered by kidneys.'
  },
  'Vitamin D': {
    aliases: ['vitamin d', '25-hydroxy vitamin d', '25(oh)d', '25 hydroxy vitamin d', 'vitamin d3', 'calciferol', '25-oh vitamin d', 'cholecalciferol', '25-hydroxyvitamin d', 'vit d', 'vitamin d total'],
    min: 30,
    invert: true,
    explanation: 'Vitamin D is essential for bones, immunity, and energy levels.'
  },
  'Calcium': {
    aliases: ['calcium', 'serum calcium', 'calcium total', 'total calcium', 'ca', 'ca2+'],
    min: 8.5, max: 10.5,
    invert: false,
    explanation: 'Calcium is essential for bones, muscles, and nerve signals. Low levels weaken bones and affect muscle function.'
  },
  'Magnesium': {
    aliases: ['magnesium', 'serum magnesium', 'mg', 'magnesium serum', 'mg2+'],
    min: 1.8, max: 2.4,
    invert: false,
    explanation: 'Magnesium supports muscle, nerve, and bone function. Low levels cause muscle cramps and weakness.'
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
      // Vercel serverless environment polyfills for pdfjs-dist
      if (typeof globalThis.DOMMatrix === 'undefined') {
        globalThis.DOMMatrix = class DOMMatrix {} as any;
      }
      if (typeof globalThis.Path2D === 'undefined') {
        (globalThis as any).Path2D = class Path2D {} as any;
      }
      
      // Keep using mjs since v5 drops CommonJS. next.config.ts serverExternalPackages will handle the Vercel chunking error.
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const buffer = Buffer.from(base64Image, 'base64');
      
      // We DO NOT override workerSrc. Because 'pdfjs-dist' is in serverExternalPackages in next.config.ts,
      // it stays perfectly intact in node_modules on Vercel. Thus, pdf.mjs's native default behavior
      // of resolving 'pdf.worker.mjs' via import.meta.url as a file:// URI will work flawlessly!
      
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
      // For images/text, use base64 content directly (skip Tesseract to avoid module issues)
      try {
        // If it's base64 text, decode it
        extractedText = Buffer.from(base64Image, 'base64').toString('utf-8');
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

    let patientAge: number | null = null;
    const allText = sortedRows.map(r => r.map(c => c.text).join(' ')).join('\n');
    
    // FIXED: Anchor to age field, reject false positives like "ISO 15189:2022" or "Level 4"
    let ageMatch = allText.match(/age\s*(?:[\/|]|and)\s*(?:gender)?[^\d]*(\d{2,3})/i);
    if (!ageMatch) {
      ageMatch = allText.match(/(\d{2,3})\s*(?:years?|yrs?)\s*(?:[\/|])\s*(?:male|female|m|f)/i);
    }
    if (!ageMatch) {
      ageMatch = allText.match(/age[:\s]+(\d{2,3})/i);
    }
    
    if (ageMatch && ageMatch[1]) {
      const parsedAge = parseInt(ageMatch[1], 10);
      // Validate age: reject impossible values (reject "3" from "ISO 15189:2022", "Level 4", etc.)
      if (parsedAge >= 5 && parsedAge <= 110) {
        patientAge = parsedAge;
      }
      console.log('Extracted Patient Age:', patientAge);
    }

    for (const row of sortedRows) {
      const rowStr = row.map(c => c.text).join(' ').toLowerCase().trim();
      if (!rowStr) continue;

      // Try to match a known lab marker in this row's text
      for (const [canonicalName, config] of Object.entries(CLINICAL_DB)) {
        if (seenTests.has(canonicalName)) continue;

        // Find which alias matched and get its position
        let matchedAlias = '';
        for (const alias of config.aliases) {
          if (rowStr.includes(alias.toLowerCase())) {
            matchedAlias = alias.toLowerCase();
            break;
          }
        }
        if (!matchedAlias) continue;

        // Find the cell containing the matched alias
        const aliasCell = row.find(c => c.text.toLowerCase().includes(matchedAlias));
        const aliasCellX = aliasCell?.x ?? -Infinity;

        // FIXED: Find numeric cells to the RIGHT of the alias
        // Take the LEFTMOST numeric cell, sort by X position
        const numericCells = row.filter(c => {
          const cleaned = c.text.trim().replace(/,/g, '');
          // Check if it's a standalone number (not part of a range)
          return /^\d+(\.\d+)?$/.test(cleaned) && c.x > aliasCellX;
        }).sort((a, b) => a.x - b.x);  // Sort left-to-right to get first one
        
        if (numericCells.length === 0) continue;

        // The LEFTMOST numeric cell to the right of the alias is the Result value
        let resultCell = numericCells[0];
        let value = parseFloat(resultCell.text.replace(/,/g, ''));
        if (isNaN(value)) continue;

        // PLAUSIBILITY CHECK: If value is implausibly large (>3x max range), try next numeric cell
        if (config.max && value > config.max * 3 && numericCells.length > 1) {
          const nextCell = numericCells[1];
          const nextValue = parseFloat(nextCell.text.replace(/,/g, ''));
          if (!isNaN(nextValue) && config.max && nextValue <= config.max * 1.5) {
            // Next value is more plausible, use it instead
            value = nextValue;
            resultCell = nextCell;
          }
        }

        // BUG 3 FIX: Deduplication by test name (checked earlier via seenTests)
        // NOT by value — different tests can have identical numeric values!
        // The seenTests check ensures we don't extract the same test twice

        // FIXED: Unit cell must match whitelist (avoid picking up "Issued:", metadata text, etc.)
        const VALID_UNITS = [
          'g/dl','mg/dl','ug/dl','ng/ml','pg/ml','iu/ml','u/l','meq/l','mmol/l','%','seconds','ratio',
          'mg/g','cells/ul','/ul','fl','pg','mm/hr','mg/l','uiu/ml','ng/dl','miu/ml','µg/dl','u/kg','g/kg'
        ];
        let unitCell = row.find(c => c.x > resultCell.x && !/^[\d.\s-]+$/.test(c.text) && c.text.length < 20);
        let unit = '';
        if (unitCell) {
          const candidateUnit = unitCell.text.trim().toLowerCase();
          unit = VALID_UNITS.find(u => candidateUnit.includes(u)) || '';
        }
        
        // Special unit handling for specific tests
        if (canonicalName === 'eGFR' && (!unit || unit === 'l')) {
          unit = 'mL/min/1.73m²';
        }

        // Status: look for HIGH/LOW/ABNORMAL/NORMAL in the row
        let status: 'NORMAL' | 'HIGH' | 'LOW' = 'NORMAL';
        const upperRow = rowStr.toUpperCase();

        // Step 1: explicit flags in report text — DO NOT invert, use as-is
        if (
          upperRow.includes('HIGH') ||
          upperRow.includes('ABNORMAL') ||
          upperRow.includes('H)') ||
          upperRow.includes('↑') ||
          upperRow.includes('CR')
        ) {
          status = 'HIGH';
        } else if (
          upperRow.includes('LOW') ||
          upperRow.includes('L)') ||
          upperRow.includes('↓')
        ) {
          status = 'LOW';
        } else {
          // Step 2: numeric comparison against reference range
          if (config.invert) {
            // For invert:true tests (eGFR, Vitamin D) — LOW value is BAD
            // HIGH value is GOOD
            if (config.min !== undefined && value < config.min) status = 'LOW';
            else if (config.max !== undefined && value > config.max) status = 'HIGH';
          } else {
            // Normal tests — HIGH value is BAD, LOW value is BAD
            if (config.min !== undefined && value < config.min) status = 'LOW';
            if (config.max !== undefined && value > config.max) status = 'HIGH';
          }
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
    let finalFindings: any[] = extractedFindings;
    
    // DEBUG: If no findings but we extracted text, return the raw text as a finding
    if (finalFindings.length === 0) {
       finalFindings = [
         {
           name: 'DEBUG_TEXT',
           value: 0,
           unit: '',
           status: 'HIGH',
           layman_en: `No markers extracted. Raw text starts with: ${extractedText.substring(0, 300)}`
         }
       ];
    }

    const ORGAN_MAP: Record<string, string[]> = {
      'blood':     ['hemoglobin', 'rbc', 'wbc', 'platelet', 'hematocrit', 'mcv', 'mch'],
      'liver':     ['alt', 'sgpt', 'ast', 'sgot', 'bilirubin', 'ggt', 'alp', 'albumin', 'inr', 'pt'],
      'kidney':    ['creatinine', 'urea', 'bun', 'egfr', 'uric acid', 'potassium', 'sodium', 'acr'],
      'thyroid':   ['tsh', 'free t3', 'free t4', 'ft3', 'ft4', 'anti-tpo'],
      'heart':     ['cholesterol', 'ldl', 'hdl', 'triglycerides', 'vldl'],
      'diabetes':  ['glucose', 'hba1c', 'insulin'],
      'bone':      ['vitamin d', 'calcium', 'phosphorus'],
    };

    // Collect ALL affected organs (only from abnormal findings)
    const detectedOrgans = new Set<string>();
    for (const finding of finalFindings) {
      // Only map organs for abnormal findings, skip NORMAL results
      if (finding.status === 'NORMAL') continue;
      
      const testName = finding.name.toLowerCase();
      for (const [organ, keywords] of Object.entries(ORGAN_MAP)) {
        if (keywords.some((k: string) => testName.includes(k))) {
          detectedOrgans.add(organ);
        }
      }
    }
    const organFlags = Array.from(detectedOrgans);

    // ── RAG ENHANCEMENT: Query knowledge base for all findings ────────────────
    try {
      await initializeRAG();
      
      // Enhance each finding with RAG-retrieved explanations
      for (const finding of finalFindings) {
        try {
          const ragResults = await searchTestKnowledge(finding.name);
          if (ragResults.length > 0) {
            // Enhance explanation with RAG knowledge
            finding.layman_en = ragResults[0].content || finding.layman_en;
            finding.rag_source = ragResults[0].metadata?.source || 'knowledge-base';
          }
        } catch (err) {
          console.warn(`RAG enhancement failed for ${finding.name}:`, err);
          // Fall back to default explanation
        }
      }

      // Query RAG for organ-specific guidance
      const organGuidance: Record<string, string> = {};
      for (const organ of organFlags) {
        try {
          const ragResults = await searchRAG(`diagnosis and management of ${organ} conditions`, 3, 0.5);
          if (ragResults.documents.length > 0) {
            organGuidance[organ] = formatRAGContext(ragResults);
          }
        } catch (err) {
          console.warn(`Could not fetch RAG guidance for ${organ}:`, err);
        }
      }

      // Generate comprehensive diagnosis summary using three-stage RAG pipeline
      let diagnosisSummary = '';
      const abnormalFindings = finalFindings.filter(f => f.status !== 'NORMAL');
      if (abnormalFindings.length > 0) {
        const conditionQuery = abnormalFindings.map(f => `${f.name} (${f.status})`).join(', ');
        try {
          // Use three-stage pipeline (HF flan-t5 → FAISS → Groq) for enhanced diagnosis
          const diagnosisPrompt = `Provide a brief clinical summary of these findings: ${conditionQuery}. Include: 1) What these results mean together, 2) Which organs are affected, 3) Next steps.`;
          const pipelineResult = await executeFullPipeline(
            diagnosisPrompt,
            'You are a medical knowledge synthesizer. Generate concise clinical summaries.',
            'report'
          );
          
          if (pipelineResult.ragContext) {
            diagnosisSummary = `[FAISS KNOWLEDGE: ${pipelineResult.ragContext.substring(0, 200)}...] ${pipelineResult.processed}`;
          } else {
            // Fallback to simple searchRAG if pipeline fails
            const diagnosisRag = await searchRAG(`diagnosis summary for ${conditionQuery}`, 5, 0.4);
            if (diagnosisRag.documents.length > 0) {
              diagnosisSummary = diagnosisRag.documents.map(doc => doc.content).join(' ');
            }
          }
        } catch (err) {
          console.warn('Three-stage pipeline diagnosis query failed, using fallback:', err);
          // Additional fallback: just use searchRAG
          try {
            const diagnosisRag = await searchRAG(`diagnosis summary for ${conditionQuery}`, 5, 0.4);
            if (diagnosisRag.documents.length > 0) {
              diagnosisSummary = diagnosisRag.documents.map(doc => doc.content).join(' ');
            }
          } catch (fallbackErr) {
            console.warn('RAG diagnosis query failed:', fallbackErr);
          }
        }
      }
    } catch (err) {
      console.warn('RAG initialization failed, continuing with static knowledge:', err);
    }

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

    const exerciseFlags: string[] = [];
    const dietaryFlags: string[] = [];
    let dietaryContext = '';
    let exerciseContext = '';

    const lowerHighs = highs.map((h: string) => h.toLowerCase());
    const lowerLows = lows.map((l: string) => l.toLowerCase());

    // Anemia detection
    if (lowerLows.includes('hemoglobin') || lowerLows.includes('serum iron') || lowerLows.includes('vitamin b12')) {
      exerciseFlags.push('ANEMIA_LIGHT');
      dietaryFlags.push('ANEMIA_DIET');
      
      // Query RAG for anemia-specific guidance
      try {
        const anemiaRag = await searchDietRecommendations('anemia iron deficiency');
        if (anemiaRag.length > 0) dietaryContext += `\n[Anemia Diet]: ${anemiaRag[0].content}`;
      } catch (err) {
        console.warn('RAG anemia diet query failed:', err);
      }
    }

    // Liver detection
    if (lowerHighs.includes('sgpt (alt)') || lowerHighs.includes('sgot (ast)') || lowerHighs.includes('bilirubin (total)')) {
      exerciseFlags.push('LIVER_RESTRICTED');
      dietaryFlags.push('LIVER_DETOX_DIET');
      
      // Query RAG for liver-specific guidance
      try {
        const liverRag = await searchDietRecommendations('liver detoxification liver disease');
        if (liverRag.length > 0) dietaryContext += `\n[Liver Diet]: ${liverRag[0].content}`;
      } catch (err) {
        console.warn('RAG liver diet query failed:', err);
      }
    }

    // Diabetes detection
    if (lowerHighs.includes('hba1c') || lowerHighs.includes('glucose (fasting)')) {
      exerciseFlags.push('DIABETES');
      dietaryFlags.push('LOW_GLYCEMIC_DIET');
      
      // Query RAG for diabetes exercise/diet
      try {
        const diabetesExerciseRag = await searchExerciseRecommendations('diabetes glucose control safety');
        if (diabetesExerciseRag.length > 0) exerciseContext += `\n[Diabetes Exercise]: ${diabetesExerciseRag[0].content}`;
      } catch (err) {
        console.warn('RAG diabetes exercise query failed:', err);
      }
    }

    // Heart detection
    if (lowerHighs.includes('total cholesterol') || lowerHighs.includes('ldl cholesterol') || lowerHighs.includes('triglycerides')) {
      dietaryFlags.push('HEART_HEALTHY_DIET');
      
      // Query RAG for heart-healthy diet
      try {
        const heartRag = await searchDietRecommendations('heart disease cholesterol management cardiovascular');
        if (heartRag.length > 0) dietaryContext += `\n[Heart-Healthy Diet]: ${heartRag[0].content}`;
      } catch (err) {
        console.warn('RAG heart diet query failed:', err);
      }
    }

    // Kidney detection
    if (lowerHighs.includes('creatinine') || lowerHighs.includes('urea')) {
      dietaryFlags.push('KIDNEY_FRIENDLY_DIET');
      
      // Query RAG for kidney-friendly guidance
      try {
        const kidneyRag = await searchDietRecommendations('kidney disease renal function nephropathy');
        if (kidneyRag.length > 0) dietaryContext += `\n[Kidney-Friendly Diet]: ${kidneyRag[0].content}`;
      } catch (err) {
        console.warn('RAG kidney diet query failed:', err);
      }
    }

    // Thyroid detection
    if (lowerHighs.includes('tsh') || lowerLows.includes('tsh') || lowerHighs.includes('t3') || lowerLows.includes('t3') || lowerHighs.includes('t4') || lowerLows.includes('t4')) {
      exerciseFlags.push('THYROID_RECOVERY');
      dietaryFlags.push('THYROID_DIET');
      
      // Query RAG for thyroid-specific guidance
      try {
        const thyroidRag = await searchDietRecommendations('thyroid hypothyroidism hyperthyroidism iodine');
        if (thyroidRag.length > 0) dietaryContext += `\n[Thyroid Diet]: ${thyroidRag[0].content}`;
      } catch (err) {
        console.warn('RAG thyroid diet query failed:', err);
      }
    }

    // Fallbacks
    if (exerciseFlags.length === 0) exerciseFlags.push('NORMAL_ACTIVE');
    if (dietaryFlags.length === 0) dietaryFlags.push('NORMAL_HEALTHY');

    // ── 8. SEVERITY WEIGHTING & VITALITY SCORE ──────────────────────────────────
    // Critical markers that indicate serious health issues and drop vitality significantly
    const criticalMarkers = [
      'hemoglobin', 'haemoglobin', 'hb', // anemia is critical
      'vitamin b12', 'b12', // B12 deficiency causes permanent nerve damage
      'vitamin d', '25-hydroxy', // severe vitamin D affects bones and immunity
      'creatinine', // kidney function
      'bilirubin', // liver function — multiple types
      'glucose', 'fasting blood glucose', 'fbg', 'hba1c', // diabetes severity
      'potassium', // cardiac risk
      'inr', 'prothrombin', 'pt', // bleeding risk
      'egfr', // kidney disease
      'tsh', // thyroid control
      'alt', 'sgpt', 'ast', 'sgot', 'ggt', 'gamma-glutamyl', 'alp', 'alkaline', // liver enzymes — all of them
      'ldl', 'total cholesterol', // cardiovascular risk
      'urea', 'bun', // kidney damage
    ];

    const allFindings = finalFindings;
    const scoreArray = allFindings.map(finding => {
      if (finding.status === 'NORMAL') return 100;
      const name = finding.name.toLowerCase();
      const isCritical = criticalMarkers.some(m => name.includes(m));
      return isCritical ? 15 : 45;
    });
    const vitalityScore = scoreArray.length > 0
      ? Math.max(Math.min(Math.round(scoreArray.reduce((a, b) => a + b, 0) / scoreArray.length), 100), 0)
      : 100;
    console.log(`✅ Vitality: ${vitalityScore}% from ${scoreArray.length} findings`);

    // BUG 1 FIX: Vitality now uses averaging instead of cumulative subtraction
    // (All scores properly clamped 0-100)

    return NextResponse.json({
      summary,
      age: patientAge,
      vitality_score: vitalityScore, // ← NEW: Add vitality score to response
      hindiSummary: 'रिपोर्ट का विश्लेषण पूर्ण हुआ। कृपया अपने डॉक्टर से सलाह लें।',
      labValues: finalFindings,
      organFlags,
      exerciseFlags,
      dietaryFlags,
      dietaryContext,
      exerciseContext,
      jargonMap: {},
      ai_confidence_score: confidenceScore,
      checklist,
      reportText: extractedText.substring(0, 1500),
    });

  } catch (error) {
    console.error('Analysis Pipeline Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Analysis failed: ${errorMessage}. Returning debug finding.`);
    
    // Return a visible error as a lab finding so the user can see it on the frontend
    return NextResponse.json({
      summary: "CRITICAL PIPELINE ERROR",
      age: 0,
      vitality_score: 0,
      hindiSummary: 'त्रुटि (Error)',
      labValues: [{
        name: 'PIPELINE_ERROR',
        value: 0,
        unit: 'error',
        status: 'HIGH',
        layman_en: `Vercel threw an error: ${errorMessage}. Check Vercel logs for full stack trace.`,
      }],
      organFlags: [],
      exerciseFlags: [],
      dietaryFlags: [],
      dietaryContext: '',
      exerciseContext: '',
      jargonMap: {},
      ai_confidence_score: 0,
      checklist: [],
      reportText: errorMessage,
    });
  }
}

