/**
 * nutritionEngine.ts
 * Maps dietaryFlags to Indian food recommendations, computes XP, detects junk food.
 */

export type FoodItem = {
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  fibre: number;
  iron: number;
  calcium: number;
  vitaminC: number;
  vitaminD: number;
  vitaminB12: number;
  folate: number;
  tags: string[];
  xp: number;
  isJunk: boolean;
};

// Junk food keywords (common cheat foods)
const JUNK_KEYWORDS = [
  'samosa', 'pakora', 'pakoda', 'poori', 'puri', 'bhatura', 'bhature',
  'burger', 'pizza', 'mathri', 'kachori', 'vada', 'bonda', 'cutlet',
  'fried', 'tali', 'chips', 'biscuit', 'cookie', 'cake', 'halwa',
  'gulab jamun', 'burfi', 'ladoo', 'jalebi', 'ice cream', 'chocolate',
  'namak paras', 'chикki', 'chikki', 'soda', 'cold drink',
];

export function isJunkFood(name: string): boolean {
  const lower = name.toLowerCase();
  return JUNK_KEYWORDS.some((k) => lower.includes(k));
}

// Condition-specific junk food warnings
export function getJunkWarning(foodName: string, dietaryFlags: string[]): string {
  const warnings: string[] = [];

  if (dietaryFlags.includes('IRON_RICH') || dietaryFlags.includes('VITAMIN_C')) {
    warnings.push('High fat in this food blocks iron absorption — the key nutrient your body needs right now.');
  }
  if (dietaryFlags.includes('LOW_FAT') || dietaryFlags.includes('NO_ALCOHOL')) {
    warnings.push('Your liver is under stress; fried and sugary foods raise liver enzyme levels further.');
  }
  if (dietaryFlags.includes('VITAMIN_D_RICH') || dietaryFlags.includes('CALCIUM_RICH')) {
    warnings.push('Excess sodium and fat in junk food leach calcium from bones — the opposite of what you need.');
  }
  if (dietaryFlags.includes('LOW_SUGAR')) {
    warnings.push('High refined sugar spikes blood glucose, worsening your current condition.');
  }
  if (dietaryFlags.includes('HIGH_PROTEIN')) {
    warnings.push('Empty calories displace the quality protein your muscles and recovery need today.');
  }

  const base = `⚠️ Cheat meal noted! ${foodName} is not ideal for your current health goals.`;
  const tip = '💚 Recovery tip: Drink a glass of warm water with lemon, eat a fruit or a handful of nuts, and get back on track with your next meal!';

  if (warnings.length > 0) {
    return `${base}\n\n${warnings[0]}\n\n${tip}`;
  }
  return `${base}\n\n${tip}`;
}

// Nutrient score → radar chart (0–100) from lab values
export function computeNutrientRadar(labValues: Array<{ name: string; value: number; referenceRange: string; status: string }>) {
  const result: Record<string, number> = {
    Iron: 50, Calcium: 50, 'Vit D': 50, Protein: 50, B12: 50, Folate: 50,
  };

  labValues.forEach((lv) => {
    if (!lv.referenceRange || typeof lv.referenceRange !== 'string') return;
    const n = lv.name.toLowerCase();
    const parts = lv.referenceRange.split('-');
    if (parts.length < 2) return;
    const [lo, hi] = parts.map(Number);
    if (!lo || !hi) return;
    const pct = Math.min(100, Math.max(0, Math.round(((lv.value - lo) / (hi - lo)) * 100)));

    if (n.includes('ferritin') || n.includes('hemoglobin') || n.includes('iron')) result['Iron'] = lv.status === 'NORMAL' ? pct : lv.status === 'LOW' ? 25 : 85;
    if (n.includes('calcium')) result['Calcium'] = lv.status === 'NORMAL' ? pct : lv.status === 'LOW' ? 25 : 85;
    if (n.includes('vitamin d') || n.includes('25-oh')) result['Vit D'] = lv.status === 'NORMAL' ? pct : lv.status === 'LOW' ? 20 : 90;
    if (n.includes('protein') || n.includes('albumin')) result['Protein'] = lv.status === 'NORMAL' ? pct : lv.status === 'LOW' ? 30 : 90;
    if (n.includes('b12') || n.includes('cobalamin')) result['B12'] = lv.status === 'NORMAL' ? pct : lv.status === 'LOW' ? 20 : 85;
    if (n.includes('folate') || n.includes('folic')) result['Folate'] = lv.status === 'NORMAL' ? pct : lv.status === 'LOW' ? 25 : 85;
  });

  return Object.entries(result).map(([nutrient, value]) => ({ nutrient, value, fullMark: 100 }));
}

/**
 * Computes Radar data based on daily intake vs targets.
 * Axis: Iron, Calcium, Vit D, Protein, B12, Folate
 */
export function computeIntakeRadar(
  totals: { iron: number; calcium: number; vitaminD: number; protein: number; vitaminB12: number; folate: number },
  targets: NutrientTarget & { folate?: number }
) {
  const radarTargets = {
    Iron: targets.iron || 18,
    Calcium: targets.calcium || 1000,
    'Vit D': targets.vitaminD || 20,
    Protein: targets.protein || 55,
    B12: targets.vitaminB12 || 2.4,
    Folate: targets.folate || 400
  };

  const data = [
    { nutrient: 'Iron', value: Math.min(100, Math.round((totals.iron / radarTargets.Iron) * 100)) },
    { nutrient: 'Calcium', value: Math.min(100, Math.round((totals.calcium / radarTargets.Calcium) * 100)) },
    { nutrient: 'Vit D', value: Math.min(100, Math.round((totals.vitaminD / radarTargets['Vit D']) * 100)) },
    { nutrient: 'Protein', value: Math.min(100, Math.round((totals.protein / radarTargets.Protein) * 100)) },
    { nutrient: 'B12', value: Math.min(100, Math.round((totals.vitaminB12 / radarTargets.B12) * 100)) },
    { nutrient: 'Folate', value: Math.min(100, Math.round((totals.folate / radarTargets.Folate) * 100)) },
  ];

  return data.map(item => ({ ...item, fullMark: 100 }));
}

// Recommended foods keyed by dietary flag
const FLAG_FOOD_MAP: Record<string, FoodItem[]> = {
  IRON_RICH: [
    { name: 'Sarson ka Saag', emoji: '🥬', calories: 88, protein: 3, fats: 6, carbs: 5, fibre: 3.7, iron: 2.43, calcium: 134, vitaminC: 60, vitaminD: 0, vitaminB12: 0, folate: 128, tags: ['Iron', 'Veg'], xp: 20, isJunk: false },
    { name: 'Spinach (Palak) Dal', emoji: '🍲', calories: 53, protein: 2, fats: 2.8, carbs: 4.8, fibre: 1.3, iron: 0.89, calcium: 21, vitaminC: 19, vitaminD: 0, vitaminB12: 0, folate: 106, tags: ['Iron', 'Protein'], xp: 18, isJunk: false },
    { name: 'Moong Dal', emoji: '🫘', calories: 50, protein: 2.7, fats: 1.7, carbs: 5.9, fibre: 1.2, iron: 0.64, calcium: 8, vitaminC: 0, vitaminD: 0, vitaminB12: 0, folate: 28, tags: ['Iron', 'Light'], xp: 15, isJunk: false },
    { name: 'Rajmah Curry', emoji: '🫛', calories: 144, protein: 5.95, fats: 5.8, carbs: 16.4, fibre: 5.8, iron: 2.27, calcium: 48, vitaminC: 16, vitaminD: 0, vitaminB12: 0, folate: 112, tags: ['Iron', 'Protein'], xp: 20, isJunk: false },
    { name: 'Poha', emoji: '🍚', calories: 295, protein: 6.1, fats: 14.1, carbs: 35, fibre: 3.7, iron: 3.01, calcium: 38, vitaminC: 6.6, vitaminD: 0, vitaminB12: 0, folate: 12, tags: ['Iron', 'Breakfast'], xp: 18, isJunk: false },
    { name: 'Sesame Chikki (Til)', emoji: '🍫', calories: 397, protein: 10.7, fats: 19.6, carbs: 43.5, fibre: 7.7, iron: 8.94, calcium: 632, vitaminC: 0, vitaminD: 0, vitaminB12: 0, folate: 18, tags: ['Iron', 'Calcium'], xp: 12, isJunk: false },
    { name: 'Bajra Ladoo', emoji: '🟤', calories: 320, protein: 9.6, fats: 8.1, carbs: 51, fibre: 6, iron: 4.72, calcium: 119, vitaminC: 0, vitaminD: 0, vitaminB12: 0, folate: 19, tags: ['Iron', 'Calcium'], xp: 15, isJunk: false },
    { name: 'Black Channa Curry', emoji: '⚫', calories: 141, protein: 5.7, fats: 6.6, carbs: 14.1, fibre: 8, iron: 2.43, calcium: 54, vitaminC: 15, vitaminD: 0, vitaminB12: 0, folate: 87, tags: ['Iron', 'Fibre'], xp: 20, isJunk: false },
  ],
  VITAMIN_C: [
    { name: 'Amla Chutney', emoji: '🟢', calories: 43, protein: 1.4, fats: 0.6, carbs: 8.8, fibre: 4.6, iron: 1.22, calcium: 46, vitaminC: 5, vitaminD: 0, vitaminB12: 0, folate: 2, tags: ['Vitamin C', 'Immunity'], xp: 15, isJunk: false },
    { name: 'Potato Capsicum Sabzi', emoji: '🫑', calories: 126, protein: 1.4, fats: 9.3, carbs: 8.7, fibre: 2, iron: 0.86, calcium: 16, vitaminC: 81, vitaminD: 0, vitaminB12: 0, folate: 40, tags: ['Vitamin C', 'Veg'], xp: 12, isJunk: false },
    { name: 'Summer Cooler Drink', emoji: '🥤', calories: 22, protein: 0.4, fats: 0, carbs: 5.4, fibre: 0.2, iron: 0.28, calcium: 8, vitaminC: 104, vitaminD: 0, vitaminB12: 0, folate: 64, tags: ['Vitamin C', 'Hydration'], xp: 10, isJunk: false },
    { name: 'Pea Potato Curry', emoji: '🥘', calories: 101, protein: 3.5, fats: 5.1, carbs: 9.7, fibre: 3.6, iron: 1.02, calcium: 21, vitaminC: 70, vitaminD: 0, vitaminB12: 0, folate: 88, tags: ['Vitamin C', 'Iron'], xp: 18, isJunk: false },
  ],
  LOW_FAT: [
    { name: 'Dal Soup (Arhar)', emoji: '🍵', calories: 31, protein: 9.7, fats: 11.7, carbs: 3.9, fibre: 2.6, iron: 2.26, calcium: 40, vitaminC: 18, vitaminD: 0, vitaminB12: 0, folate: 35, tags: ['Low Fat', 'Protein'], xp: 20, isJunk: false },
    { name: 'Mixed Vegetable Pulao', emoji: '🍛', calories: 113, protein: 2.7, fats: 3.3, carbs: 17.5, fibre: 2.7, iron: 0.6, calcium: 20, vitaminC: 26, vitaminD: 0, vitaminB12: 0, folate: 81, tags: ['Low Fat', 'Veg'], xp: 15, isJunk: false },
    { name: 'Dhokla', emoji: '🟡', calories: 216, protein: 13.5, fats: 5.3, carbs: 30.7, fibre: 5, iron: 1.39, calcium: 123, vitaminC: 0.7, vitaminD: 0, vitaminB12: 0, folate: 40, tags: ['Low Fat', 'Protein', 'Probiotic'], xp: 18, isJunk: false },
    { name: 'Curd Rice', emoji: '🍚', calories: 196, protein: 5.8, fats: 4.3, carbs: 32.9, fibre: 2.1, iron: 0.59, calcium: 102, vitaminC: 5, vitaminD: 0, vitaminB12: 0, folate: 28, tags: ['Low Fat', 'Probiotic'], xp: 15, isJunk: false },
    { name: 'Sprouted Moong Salad', emoji: '🥗', calories: 38, protein: 2.3, fats: 0.7, carbs: 5.5, fibre: 1, iron: 1.45, calcium: 55, vitaminC: 28, vitaminD: 0, vitaminB12: 0, folate: 50, tags: ['Low Fat', 'Iron'], xp: 18, isJunk: false },
  ],
  NO_ALCOHOL: [
    { name: 'Jal Jeera', emoji: '🥛', calories: 30, protein: 0.4, fats: 0.3, carbs: 6.7, fibre: 1, iron: 0.84, calcium: 25, vitaminC: 2, vitaminD: 0, vitaminB12: 0, folate: 4, tags: ['Liver', 'Hydration'], xp: 10, isJunk: false },
    { name: 'Aam Panna', emoji: '🥭', calories: 36, protein: 0.2, fats: 0, carbs: 9, fibre: 0.6, iron: 0.14, calcium: 7, vitaminC: 45, vitaminD: 0, vitaminB12: 0, folate: 14, tags: ['Liver', 'Vitamin C'], xp: 12, isJunk: false },
    { name: 'Vegetable Soup', emoji: '🍲', calories: 36, protein: 8.2, fats: 11.7, carbs: 3, fibre: 1.6, iron: 1.74, calcium: 51, vitaminC: 20, vitaminD: 0, vitaminB12: 0, folate: 32, tags: ['Liver', 'Low Fat'], xp: 15, isJunk: false },
  ],
  VITAMIN_D_RICH: [
    { name: 'Egg (Boiled)', emoji: '🥚', calories: 45, protein: 4.4, fats: 3, carbs: 0.1, fibre: 0.1, iron: 0.64, calcium: 18, vitaminC: 0, vitaminD: 2, vitaminB12: 0.6, folate: 25, tags: ['Vitamin D', 'Protein'], xp: 15, isJunk: false },
    { name: 'Mushroom Pulao', emoji: '🍄', calories: 124, protein: 2.5, fats: 4, carbs: 19, fibre: 1.9, iron: 0.39, calcium: 14, vitaminC: 3, vitaminD: 0, vitaminB12: 0, folate: 27, tags: ['Vitamin D', 'Veg'], xp: 15, isJunk: false },
    { name: 'Saffron Milk', emoji: '🥛', calories: 102, protein: 3.2, fats: 4.6, carbs: 12.6, fibre: 0.1, iron: 0.21, calcium: 111, vitaminC: 5, vitaminD: 0, vitaminB12: 0, folate: 18, tags: ['Vitamin D', 'Calcium'], xp: 12, isJunk: false },
    { name: 'Makhana Kheer', emoji: '🫙', calories: 108, protein: 3.3, fats: 5, carbs: 12.9, fibre: 0.1, iron: 0.28, calcium: 112, vitaminC: 5, vitaminD: 0, vitaminB12: 0, folate: 24, tags: ['Calcium', 'Veg'], xp: 12, isJunk: false },
  ],
  CALCIUM_RICH: [
    { name: 'Paneer Curry (Palak)', emoji: '🥗', calories: 78, protein: 4, fats: 4.8, carbs: 4.4, fibre: 1.9, iron: 1.85, calcium: 113, vitaminC: 60, vitaminD: 0.1, vitaminB12: 0.7, folate: 267, tags: ['Calcium', 'Iron'], xp: 20, isJunk: false },
    { name: 'Sesame Ladoo (Til)', emoji: '🟡', calories: 397, protein: 10.7, fats: 19.6, carbs: 43.5, fibre: 7.7, iron: 8.94, calcium: 632, vitaminC: 0, vitaminD: 0, vitaminB12: 0, folate: 18, tags: ['Calcium', 'Iron'], xp: 15, isJunk: false },
    { name: 'Carrot Raita', emoji: '🥕', calories: 65, protein: 4.1, fats: 2.2, carbs: 7.2, fibre: 1.7, iron: 0.55, calcium: 147, vitaminC: 8, vitaminD: 0, vitaminB12: 0.2, folate: 32, tags: ['Calcium', 'Probiotic'], xp: 12, isJunk: false },
    { name: 'Dhokla', emoji: '🟡', calories: 216, protein: 13.5, fats: 5.3, carbs: 30.7, fibre: 5, iron: 1.39, calcium: 123, vitaminC: 0.7, vitaminD: 0, vitaminB12: 0, folate: 40, tags: ['Calcium', 'Protein'], xp: 18, isJunk: false },
  ],
  HIGH_PROTEIN: [
    { name: 'Moong Dal Cheela', emoji: '🥞', calories: 155, protein: 7, fats: 5.1, carbs: 19.4, fibre: 4.3, iron: 2.22, calcium: 39, vitaminC: 35, vitaminD: 0, vitaminB12: 0, folate: 80, tags: ['Protein', 'Light'], xp: 18, isJunk: false },
    { name: 'Rajmah Curry', emoji: '🫛', calories: 144, protein: 5.95, fats: 5.8, carbs: 16.4, fibre: 5.8, iron: 2.27, calcium: 48, vitaminC: 16, vitaminD: 0, vitaminB12: 0, folate: 112, tags: ['Protein', 'Iron'], xp: 20, isJunk: false },
    { name: 'Soyabean Curry', emoji: '🌿', calories: 163, protein: 10.4, fats: 10.2, carbs: 6.8, fibre: 7.3, iron: 2.79, calcium: 65, vitaminC: 15, vitaminD: 0, vitaminB12: 0, folate: 104, tags: ['Protein', 'Iron'], xp: 20, isJunk: false },
    { name: 'Dhokla', emoji: '🟡', calories: 216, protein: 13.5, fats: 5.3, carbs: 30.7, fibre: 5, iron: 1.39, calcium: 123, vitaminC: 0.7, vitaminD: 0, vitaminB12: 0, folate: 40, tags: ['Protein', 'Probiotic'], xp: 18, isJunk: false },
    { name: 'Paneer Stuffed Cheela', emoji: '🫓', calories: 205, protein: 11.4, fats: 8.9, carbs: 19.2, fibre: 4, iron: 2.41, calcium: 151, vitaminC: 20, vitaminD: 0.1, vitaminB12: 0.7, folate: 117, tags: ['Protein', 'Calcium'], xp: 20, isJunk: false },
  ],
};

// Default recommendations when no specific flags
const DEFAULT_FOODS: FoodItem[] = [
  { name: 'Dal Khichdi', emoji: '🍲', calories: 57, protein: 1.7, fats: 1, carbs: 10, fibre: 0.85, iron: 0.31, calcium: 5, vitaminC: 0.8, vitaminD: 0, vitaminB12: 0, folate: 26, tags: ['Balanced', 'Easy'], xp: 15, isJunk: false },
  { name: 'Vegetable Upma', emoji: '🥣', calories: 146, protein: 4.7, fats: 6.6, carbs: 16.5, fibre: 4.2, iron: 1.35, calcium: 27, vitaminC: 14, vitaminD: 0, vitaminB12: 0, folate: 50, tags: ['Balanced', 'Breakfast'], xp: 15, isJunk: false },
  { name: 'Cucumber Raita', emoji: '🥒', calories: 59, protein: 4, fats: 2.1, carbs: 6.4, fibre: 0.9, iron: 0.29, calcium: 139, vitaminC: 6, vitaminD: 0, vitaminB12: 0.2, folate: 27, tags: ['Light', 'Probiotic'], xp: 10, isJunk: false },
  { name: 'Chapati', emoji: '🫓', calories: 202, protein: 5.9, fats: 3.6, carbs: 35.7, fibre: 6.3, iron: 2.28, calcium: 17, vitaminC: 0, vitaminD: 0, vitaminB12: 0, folate: 6, tags: ['Staple', 'Fibre'], xp: 12, isJunk: false },
];

export function getFoodRecommendations(dietaryFlags: string[]): FoodItem[] {
  if (!dietaryFlags || dietaryFlags.length === 0) return DEFAULT_FOODS;

  const seen = new Set<string>();
  const result: FoodItem[] = [];

  const allFlags = [...dietaryFlags];
  // Map new flags to existing recommendation keys
  if (dietaryFlags.includes('ANEMIA_DIET')) allFlags.push('IRON_RICH', 'VITAMIN_C');
  if (dietaryFlags.includes('LIVER_DETOX_DIET')) allFlags.push('LOW_FAT', 'NO_ALCOHOL');
  if (dietaryFlags.includes('LOW_GLYCEMIC_DIET')) allFlags.push('LOW_SUGAR');
  if (dietaryFlags.includes('HEART_HEALTHY_DIET')) allFlags.push('LOW_FAT');
  if (dietaryFlags.includes('KIDNEY_FRIENDLY_DIET')) allFlags.push('LOW_FAT');

  for (const flag of allFlags) {
    const foods = FLAG_FOOD_MAP[flag] || [];
    for (const f of foods) {
      if (!seen.has(f.name)) {
        seen.add(f.name);
        result.push(f);
      }
    }
  }

  return result.length > 0 ? result : DEFAULT_FOODS;
}

// Daily nutrient targets by condition
export type NutrientTarget = {
  calories: number;
  protein: number;
  iron: number;
  calcium: number;
  vitaminC: number;
  vitaminD: number;
  vitaminB12: number;
  folate: number;
};

export function getDailyTargets(dietaryFlags: string[]): NutrientTarget {
  if (dietaryFlags.includes('IRON_RICH') || dietaryFlags.includes('ANEMIA_DIET')) {
    return { calories: 1800, protein: 55, iron: 18, calcium: 1000, vitaminC: 65, vitaminD: 15, vitaminB12: 2.4, folate: 400 };
  }
  if (dietaryFlags.includes('LOW_FAT') || dietaryFlags.includes('LIVER_DETOX_DIET') || dietaryFlags.includes('HEART_HEALTHY_DIET')) {
    return { calories: 1600, protein: 50, iron: 15, calcium: 1200, vitaminC: 60, vitaminD: 15, vitaminB12: 2.4, folate: 400 };
  }
  if (dietaryFlags.includes('CALCIUM_RICH') || dietaryFlags.includes('VITAMIN_D_RICH')) {
    return { calories: 1800, protein: 60, iron: 15, calcium: 1200, vitaminC: 70, vitaminD: 20, vitaminB12: 2.4, folate: 400 };
  }
  if (dietaryFlags.includes('LOW_GLYCEMIC_DIET')) {
    return { calories: 1700, protein: 55, iron: 14, calcium: 1000, vitaminC: 60, vitaminD: 15, vitaminB12: 2.4, folate: 400 };
  }
  if (dietaryFlags.includes('KIDNEY_FRIENDLY_DIET')) {
    return { calories: 1800, protein: 45, iron: 14, calcium: 800, vitaminC: 60, vitaminD: 10, vitaminB12: 2.0, folate: 300 };
  }
  return { calories: 2000, protein: 50, iron: 14, calcium: 1000, vitaminC: 60, vitaminD: 15, vitaminB12: 2.4, folate: 400 };
}
