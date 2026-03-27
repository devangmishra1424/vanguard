/**
 * exerciseEngine.ts
 * Maps exerciseFlags → condition-specific exercise plans with XP per activity.
 */

export type ExerciseItem = {
  id: string;
  day: string;
  activity: string;
  duration: string;
  intensity: 'Very Low' | 'Low' | 'Moderate' | 'High';
  xp: number;
  emoji: string;
  tip: string;
};

export type ExercisePlan = {
  tierLabel: string;
  tierColor: string;
  safetyWarning: string;
  bestTiming: string;
  items: ExerciseItem[];
};

const ANEMIA_PLAN: ExercisePlan = {
  tierLabel: 'Light Recovery',
  tierColor: '#f59e0b',
  safetyWarning:
    'Your hemoglobin/ferritin levels are low — avoid high-intensity cardio or heavy lifting. Low oxygen delivery can cause dizziness. Stop if you feel breathless.',
  bestTiming: 'Early morning (6–8 AM) or evening (5–7 PM). Avoid peak afternoon heat.',
  items: [
    { id: 'a1', day: 'Day 1', activity: 'Leisurely Walk', duration: '20 min', intensity: 'Low', xp: 15, emoji: '🚶', tip: 'Keep a comfortable pace, no rushing.' },
    { id: 'a2', day: 'Day 2', activity: 'Gentle Yoga (Pranayama + Stretches)', duration: '25 min', intensity: 'Very Low', xp: 18, emoji: '🧘', tip: 'Deep breathing improves oxygen utilization — great for anemia.' },
    { id: 'a3', day: 'Day 3', activity: 'Soft Stretching', duration: '15 min', intensity: 'Very Low', xp: 12, emoji: '🤸', tip: 'Focus on neck, shoulder, and back relaxation.' },
    { id: 'a4', day: 'Day 4', activity: 'Rest Day / Light Walk', duration: '10 min', intensity: 'Very Low', xp: 8, emoji: '🌳', tip: 'Rest is recovery. A short nature walk is perfect.' },
    { id: 'a5', day: 'Day 5', activity: 'Nadi Shodhana (Alternate Nostril Breathing)', duration: '20 min', intensity: 'Very Low', xp: 18, emoji: '💨', tip: 'This improves blood oxygen levels directly.' },
    { id: 'a6', day: 'Day 6', activity: 'Gentle Walk + Arm Swings', duration: '25 min', intensity: 'Low', xp: 15, emoji: '🚶', tip: 'Gradually increase distance as energy improves.' },
    { id: 'a7', day: 'Day 7', activity: 'Restorative Yoga / Savasana', duration: '30 min', intensity: 'Very Low', xp: 20, emoji: '🧘', tip: 'End the week with full body relaxation and meditation.' },
  ],
};

const LIVER_PLAN: ExercisePlan = {
  tierLabel: 'Moderate Recovery',
  tierColor: '#22c55e',
  safetyWarning:
    'Your liver enzymes (ALT/AST) are elevated. Avoid strenuous exercise that strains metabolism. Moderate exercise actually helps liver health, but keep intensity low-to-moderate.',
  bestTiming: 'Morning (7–9 AM). Avoid evening exercise close to meals.',
  items: [
    { id: 'l1', day: 'Day 1', activity: 'Brisk Walk', duration: '30 min', intensity: 'Moderate', xp: 20, emoji: '🚶', tip: 'Walking is one of the best exercises for liver health.' },
    { id: 'l2', day: 'Day 2', activity: 'Yoga (Twisting Poses)', duration: '30 min', intensity: 'Low', xp: 20, emoji: '🧘', tip: 'Twists massage digestive organs and support liver detox.' },
    { id: 'l3', day: 'Day 3', activity: 'Light Cycling or Stationary Bike', duration: '20 min', intensity: 'Moderate', xp: 18, emoji: '🚴', tip: 'Low-impact cardio burns fat, reducing liver load.' },
    { id: 'l4', day: 'Day 4', activity: 'Rest / Meditation', duration: '20 min', intensity: 'Very Low', xp: 10, emoji: '🧠', tip: 'Stress raises cortisol which worsens liver inflammation.' },
    { id: 'l5', day: 'Day 5', activity: 'Swimming (slow laps)', duration: '20 min', intensity: 'Moderate', xp: 22, emoji: '🏊', tip: 'Full-body exercise with zero joint stress.' },
    { id: 'l6', day: 'Day 6', activity: 'Strength Training (light bands)', duration: '25 min', intensity: 'Moderate', xp: 20, emoji: '💪', tip: 'Muscle burns fat even at rest — helps NAFLD.' },
    { id: 'l7', day: 'Day 7', activity: 'Nature Walk + Deep Breathing', duration: '30 min', intensity: 'Low', xp: 18, emoji: '🌿', tip: 'Fresh air and mindfulness complete the week well.' },
  ],
};

const NORMAL_PLAN: ExercisePlan = {
  tierLabel: 'Active Wellness',
  tierColor: '#3b82f6',
  safetyWarning:
    'Your vitals are within manageable range. Maintain consistent exercise for strong prevention. Avoid sudden extreme intensity jumps.',
  bestTiming: 'Any time that suits your schedule. Morning consistency builds the best habits.',
  items: [
    { id: 'n1', day: 'Day 1', activity: 'Jogging / Running', duration: '30 min', intensity: 'Moderate', xp: 25, emoji: '🏃', tip: 'Cardiovascular health reduces all chronic disease risk.' },
    { id: 'n2', day: 'Day 2', activity: 'Strength Training (bodyweight)', duration: '30 min', intensity: 'Moderate', xp: 25, emoji: '💪', tip: 'Muscle mass improves metabolism and bone density.' },
    { id: 'n3', day: 'Day 3', activity: 'Yoga / Flexibility', duration: '30 min', intensity: 'Low', xp: 20, emoji: '🧘', tip: 'Flexibility reduces injury risk and improves posture.' },
    { id: 'n4', day: 'Day 4', activity: 'HIIT (20 min)', duration: '20 min', intensity: 'High', xp: 30, emoji: '🔥', tip: 'High intensity intervals boost metabolism for hours after.' },
    { id: 'n5', day: 'Day 5', activity: 'Cycling or Swimming', duration: '30 min', intensity: 'Moderate', xp: 25, emoji: '🚴', tip: 'Low-impact cardio for joint-friendly endurance.' },
    { id: 'n6', day: 'Day 6', activity: 'Active Recovery Walk', duration: '30 min', intensity: 'Low', xp: 15, emoji: '🚶', tip: 'Keep moving on rest days — active recovery > complete rest.' },
    { id: 'n7', day: 'Day 7', activity: 'Sports / Play', duration: '45 min', intensity: 'Moderate', xp: 28, emoji: '⚽', tip: 'Fun exercise sustains long-term motivation.' },
  ],
};

const DIABETES_PLAN: ExercisePlan = {
  tierLabel: 'Glucose Balance',
  tierColor: '#a855f7',
  safetyWarning:
    'Exercise lowers blood glucose — always carry a small snack. Check glucose before and after workouts. Avoid exercising if glucose is below 100 mg/dL.',
  bestTiming: '1–2 hours after meals. Avoid fasted cardio if on insulin.',
  items: [
    { id: 'd1', day: 'Day 1', activity: 'Post-meal Walk', duration: '20 min', intensity: 'Low', xp: 20, emoji: '🚶', tip: '15-min walk after meals cuts glucose spike by up to 30%.' },
    { id: 'd2', day: 'Day 2', activity: 'Resistance Band Training', duration: '25 min', intensity: 'Moderate', xp: 22, emoji: '💪', tip: 'Muscle contraction moves glucose out of blood without insulin.' },
    { id: 'd3', day: 'Day 3', activity: 'Yoga (Diabetes Flow)', duration: '30 min', intensity: 'Low', xp: 20, emoji: '🧘', tip: 'Twists and forward folds stimulate pancreatic function.' },
    { id: 'd4', day: 'Day 4', activity: 'Swimming', duration: '25 min', intensity: 'Moderate', xp: 22, emoji: '🏊', tip: 'Great for weight management which is key for T2D.' },
    { id: 'd5', day: 'Day 5', activity: 'Post-dinner Walk + Stretching', duration: '20 min', intensity: 'Low', xp: 18, emoji: '🌙', tip: 'Evening walks reduce morning fasting glucose.' },
    { id: 'd6', day: 'Day 6', activity: 'Strength Circuit (light)', duration: '30 min', intensity: 'Moderate', xp: 22, emoji: '🏋️', tip: 'Building muscle = building your insulin sensitivity.' },
    { id: 'd7', day: 'Day 7', activity: 'Leisurely Stroll / Rest', duration: '20 min', intensity: 'Very Low', xp: 12, emoji: '🌳', tip: 'Consistency next week matters more than this one day.' },
  ],
};

// Dangerous exercises per condition
export const DANGER_EXERCISES: Record<string, string[]> = {
  ANEMIA_LIGHT: ['running', 'HIIT', 'sprinting', 'heavy lifting', 'cardio'],
  LIVER_RESTRICTED: ['heavy lifting', 'intense cardio', 'HIIT', 'marathons'],
  DIABETES: ['fasted cardio', 'skipping meals before workout'],
};

export function getDangerWarning(activity: string, exerciseFlags: string[]): string | null {
  for (const flag of exerciseFlags) {
    const dangers = DANGER_EXERCISES[flag] || [];
    const actLower = activity.toLowerCase();
    for (const d of dangers) {
      if (actLower.includes(d)) {
        if (flag === 'ANEMIA_LIGHT') {
          return `⚠️ "${activity}" is high-intensity and risky with low hemoglobin. Your muscles may not get enough oxygen, causing dizziness or fainting. Try a lighter activity today.`;
        }
        if (flag === 'LIVER_RESTRICTED') {
          return `⚠️ "${activity}" puts excessive metabolic strain on an inflamed liver. High-intensity exercise raises liver enzymes temporarily. Stick to moderate activity for now.`;
        }
        if (flag === 'DIABETES') {
          return `⚠️ Exercising fasted or skipping meals with diabetes can cause hypoglycemia. Always eat a small snack (banana/biscuit) 30 min before working out.`;
        }
      }
    }
  }
  return null;
}

export function getExercisePlan(exerciseFlags: string[]): ExercisePlan {
  if (exerciseFlags.includes('ANEMIA_LIGHT')) return ANEMIA_PLAN;
  if (exerciseFlags.includes('LIVER_RESTRICTED')) return LIVER_PLAN;
  if (exerciseFlags.includes('DIABETES') || exerciseFlags.includes('HIGH_SUGAR')) return DIABETES_PLAN;
  return NORMAL_PLAN;
}
