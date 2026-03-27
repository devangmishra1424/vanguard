import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
  const csvPath = path.join(process.cwd(), 'dataset', 'Indian_Food_Nutrition_Processed.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  cachedRows = parseCSV(content);
  return cachedRows;
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
      folate: parseFloat(r['Folate (µg)'] || '0'),
      xp: computeXP(r),
      isJunk: isJunk(r['Dish Name']),
    }));

  return NextResponse.json(matches);
}
