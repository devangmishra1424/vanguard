import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Set function timeout for Vercel
export const maxDuration = 30;

export type FoodSearchResult = {
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fats: number;
  fibre: number;
  iron: number;
  calcium: number;
  vitaminC: number;
  vitaminD: number;
  vitaminB12: number;
  folate: number;
  xp: number;
  isJunk: boolean;
};

// Simple CSV parser that handles quoted fields
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter(Boolean);
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (vals[i] || '').trim();
    });
    return row;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

const JUNK_KEYWORDS = [
  'samosa', 'pakora', 'pakoda', 'poori', 'puri', 'bhatura', 'bhature',
  'burger', 'pizza', 'mathri', 'kachori', 'bonda', 'cutlet', 'fried',
  'tali', 'chips', 'biscuit', 'cookie', 'cake', 'halwa', 'gulab jamun',
  'burfi', 'ladoo', 'jalebi', 'ice cream', 'chocolate', 'namak paras', 'chikki',
];

function isJunk(name: string): boolean {
  const lower = name.toLowerCase();
  return JUNK_KEYWORDS.some((k) => lower.includes(k));
}

// Estimated Vitamin D (mcg) and B12 (mcg) for common foods
// These are rough averages since the primary dataset lacks them
const VITAMIN_LOOKUP: Record<string, { d: number, b12: number }> = {
  'egg': { d: 2, b12: 0.6 },
  'boiled egg': { d: 2, b12: 0.6 },
  'omelette': { d: 2, b12: 0.6 },
  'milk': { d: 3, b12: 1.1 },
  'paneer': { d: 0.5, b12: 0.4 },
  'curd': { d: 0.2, b12: 0.3 },
  'yogurt': { d: 0.2, b12: 0.3 },
  'fish': { d: 10, b12: 3.0 },
  'salmon': { d: 15, b12: 4.8 },
  'chicken': { d: 0.1, b12: 0.3 },
  'mutton': { d: 0.1, b12: 2.5 },
  'liver': { d: 1.2, b12: 18.0 },
  'mushroom': { d: 2, b12: 0 },
  'soya': { d: 0, b12: 0 },
  'fortified milk': { d: 5, b12: 1.2 },
};

function getVitaminEstimate(name: string) {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(VITAMIN_LOOKUP)) {
    if (lower.includes(key)) return val;
  }
  return { d: 0, b12: 0 };
}

function computeXP(row: Record<string, string>): number {
  const protein = parseFloat(row['Protein (g)'] || '0');
  const iron = parseFloat(row['Iron (mg)'] || '0');
  const fibre = parseFloat(row['Fibre (g)'] || '0');
  const vitC = parseFloat(row['Vitamin C (mg)'] || '0');
  const fats = parseFloat(row['Fats (g)'] || '0');
  const calories = parseFloat(row['Calories (kcal)'] || '0');
  // XP formula: higher protein/iron/fibre/vitC = more XP, penalise extreme fat/calorie
  const score = protein * 2 + iron * 3 + fibre * 1.5 + vitC * 0.5 - (fats > 20 ? 5 : 0) - (calories > 600 ? 5 : 0);
  return Math.max(2, Math.min(30, Math.round(score)));
}

let cachedRows: Record<string, string>[] | null = null;

function getRows(): Record<string, string>[] {
  if (cachedRows) return cachedRows;
  try {
    const csvPath = path.join(process.cwd(), 'dataset', 'Indian_Food_Nutrition_Processed.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    cachedRows = parseCSV(content);
    return cachedRows;
  } catch (error) {
    console.error('Failed to load CSV:', error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const rows = getRows();
  const lower = q.toLowerCase();

  const matches = rows
    .filter((r) => r['Dish Name']?.toLowerCase().includes(lower))
    .slice(0, 12)
    .map((r): FoodSearchResult => ({
      name: r['Dish Name'],
      calories: Math.round(parseFloat(r['Calories (kcal)'] || '0')),
      carbs: parseFloat(r['Carbohydrates (g)'] || '0'),
      protein: parseFloat(r['Protein (g)'] || '0'),
      fats: parseFloat(r['Fats (g)'] || '0'),
      fibre: parseFloat(r['Fibre (g)'] || '0'),
      iron: parseFloat(r['Iron (mg)'] || '0'),
      calcium: parseFloat(r['Calcium (mg)'] || '0'),
      vitaminC: parseFloat(r['Vitamin C (mg)'] || '0'),
      vitaminD: getVitaminEstimate(r['Dish Name']).d,
      vitaminB12: getVitaminEstimate(r['Dish Name']).b12,
      folate: parseFloat(r['Folate (µg)'] || r['Folate (µ?g)'] || '0'),
      xp: computeXP(r),
      isJunk: isJunk(r['Dish Name']),
    }));

  return NextResponse.json(matches);
}
