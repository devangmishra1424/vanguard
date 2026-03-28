/**
 * exerciseEngine.ts
 * Maps exerciseFlags + Age → multi-activity condition-specific exercise plans.
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
  sessionType: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  suitability: string;
};

export type HealItem = {
  name: string;
  benefit: string;
  emoji: string;
};

export type AvoidItem = {
  name: string;
  risk: string;
  emoji: string;
};

export type ExercisePlan = {
  tierLabel: string;
  tierColor: string;
  safetyWarning: string;
  bestTiming: string;
  dailyExercises: Record<string, ExerciseItem[]>; // Key: "Day 1", "Day 2", etc.
  healers: HealItem[];
  avoid: AvoidItem[];
};

const ANEMIA_PLAN_BASE = {
  tierLabel: 'Light Recovery',
  tierColor: '#f59e0b',
  safetyWarning: 'Hemoglobin levels are low. Avoid heavy lifting. Focus on oxygen-efficient movements.',
  bestTiming: 'Early morning or evening.',
  healers: [
    { name: 'Pranayama', benefit: 'Improves oxygen blood levels.', emoji: '💨' },
    { name: 'Slow Walking', benefit: 'Increases circulation safely.', emoji: '🚶' },
    { name: 'Stretch', benefit: 'Relieves fatigue.', emoji: '🤸' },
  ],
  avoid: [
    { name: 'HIIT', risk: 'Causes rapid heart rate; oxygen supply fails.', emoji: '🏃' },
    { name: 'Heavy Weights', risk: 'Risk of fainting.', emoji: '🏋️' },
  ],
};

const NORMAL_PLAN_BASE = {
  tierLabel: 'Active Longevity',
  tierColor: '#3b82f6',
  safetyWarning: 'Maintain consistency for long-term health.',
  bestTiming: 'Anytime.',
  healers: [
    { name: 'Jogging', benefit: 'Heart health & mental clarity.', emoji: '🏃' },
    { name: 'Strength', benefit: 'Maintains bone density.', emoji: '💪' },
  ],
  avoid: [
    { name: 'Sedentary', risk: 'Sitting for >2 hours is high risk.', emoji: '🛋️' },
  ],
};

const LIVER_PLAN_BASE = {
  tierLabel: 'Metabolic Support',
  tierColor: '#22c55e',
  safetyWarning: 'Elevated enzymes indicate stress. Avoid extreme metabolic heat.',
  bestTiming: 'Morning (7-9 AM).',
  healers: [
    { name: 'Yoga Twists', benefit: 'Improves liver blood flow.', emoji: '🧘' },
    { name: 'Slow Swim', benefit: 'Zero inflammation stress.', emoji: '🏊' },
  ],
  avoid: [
    { name: 'Marathons', risk: 'Extreme muscle breakdown strains liver.', emoji: '🏁' },
  ],
};

const DIABETES_PLAN_BASE = {
  tierLabel: 'Glucose Balance',
  tierColor: '#a855f7',
  safetyWarning: 'Monitor glucose. Carry a snack.',
  bestTiming: '1-2 hours after meals.',
  healers: [
    { name: 'Post-Meal Walk', benefit: 'Uses blood glucose immediately.', emoji: '🚶' },
    { name: 'Resistance', benefit: 'Builds insulin sensitivity.', emoji: '💪' },
  ],
  avoid: [
    { name: 'Fasted HIIT', risk: 'Triggers glucose spikes.', emoji: '🏃' },
  ],
};

const THYROID_PLAN_BASE = {
  tierLabel: 'Metabolic Recovery',
  tierColor: '#0ea5e9',
  safetyWarning: 'Thyroid imbalances affect heart rate and temperature. Avoid over-exhaustion.',
  bestTiming: 'Late morning or early afternoon.',
  healers: [
    { name: 'Power Yoga', benefit: 'Stimulates endocrine system.', emoji: '🧘' },
    { name: 'Swimming', benefit: 'Maintains cool body temperature.', emoji: '🏊' },
    { name: 'Bodyweight Squats', benefit: 'Preserves muscle mass.', emoji: '💪' },
  ],
  avoid: [
    { name: 'Extreme Heat Yoga', risk: 'Risk of temperature dysregulation.', emoji: '🔥' },
    { name: 'Burst Sprints', risk: 'Unpredictable heart rate response.', emoji: '🏃' },
  ],
};

// Internal helper for multi-session generation
function generateDailySessions(
  day: string,
  baseActivity: Partial<ExerciseItem>,
  loadScore: number,
  condition: string
): ExerciseItem[] {
  const getSuitability = (act: string, cond: string): string => {
    const activity = act.toLowerCase();
    if (cond === 'THYROID') {
      if (activity.includes('yoga')) return 'Stimulates the endocrine system and improves metabolic balance without over-exhaustion.';
      if (activity.includes('walk')) return 'Low-impact movement that helps maintain metabolic rate while respecting heart rate variability.';
      if (activity.includes('swim')) return 'Zero-impact and cooling, prevents metabolic overheating common in thyroid dysfunction.';
      if (activity.includes('bodyweight') || activity.includes('core')) return 'Preserves muscle mass which is vital for maintaining metabolic health in thyroid support.';
      if (activity.includes('rest')) return 'Essential for thyroid recovery to prevent adrenal fatigue and metabolic burnout.';
      return 'Tailored movement to support thyroid hormonal balance and energy conservation.';
    }
    if (cond === 'ANEMIA') {
      if (activity.includes('yoga') || activity.includes('breath')) return 'Focuses on deep oxygenation and low heart-rate movement, crucial when hemoglobin is low.';
      if (activity.includes('walk')) return 'Gentle circulation boost that ensures oxygen reaches tissues without causing fainting or fatigue.';
      if (activity.includes('stretch')) return 'Relieves muscle stiffness and fatigue common in anemic profiles without oxygen debt.';
      if (activity.includes('rest')) return 'Critical recovery to prevent over-exertion and lightheadedness.';
      return 'Gentle activity designed to improve circulation while respecting oxygen transport limits.';
    }
    if (cond === 'DIABETES') {
      if (activity.includes('walk')) return 'Directly consumes blood glucose to lower post-meal spikes and improve insulin sensitivity.';
      if (activity.includes('resistance') || activity.includes('core') || activity.includes('bodyweight')) return 'Builds lean muscle mass, which acts as a major glucose sink for the body.';
      if (activity.includes('yoga')) return 'Improves circulation and reduces stress, which helps stabilize cortisol and blood sugar levels.';
      return 'Metabolic conditioning focused on glucose management and insulin efficiency.';
    }
    if (cond === 'LIVER') {
      if (activity.includes('yoga') || activity.includes('twist')) return 'Encourages blood flow to abdominal organs and aids in detoxification and enzyme balance.';
      if (activity.includes('swim') || activity.includes('walk')) return 'Non-inflammatory low-impact movement that avoids metabolic heat stress on the liver.';
      return 'Safe movement focused on reducing systemic inflammation and supporting liver health.';
    }
    return 'General health maintenance to improve longevity and movement efficiency.';
  };

  const getScientificTip = (act: string, cond: string): string => {
    const activity = act.toLowerCase();
    if (cond === 'THYROID') {
      if (activity.includes('swim')) return 'Swimming at 26-28°C is clinically optimal to prevent the T3/T4 conversion stress caused by body temperature fluctuations.';
      if (activity.includes('yoga')) return 'Controlled inversions in Power Yoga help stimulate blood flow to the thyroid gland, aiding endocrine signaling.';
      if (activity.includes('walk')) return 'Walking at 45-55% VO2 max prevents the cortisol spikes that interfere with thyroid Hormone (TSH) regulation.';
      if (activity.includes('rest')) return 'Adrenal rest periods of 24h are essential to avoid the "hypothyroid crash" associated with over-training.';
      return 'Maintain a stable core temperature to optimize metabolic thyroid response.';
    }
    if (cond === 'ANEMIA') {
      if (activity.includes('yoga') || activity.includes('breath')) return 'Diaphragmatic breathing increases alveolar ventilation, maximizing oxygen saturation when hemoglobin availability is low.';
      if (activity.includes('walk')) return 'Short, frequent walks (15m) prevent the lactic acid buildup that occur faster in iron-deficient muscles.';
      if (activity.includes('rest')) return 'Iron-deficient profiles require 30% more rest time for ATP regeneration between low-impact sessions.';
      return 'Focus on rhythmic, low-demand movements to avoid oxygen debt.';
    }
    if (cond === 'DIABETES') {
      if (activity.includes('walk')) return 'Post-prandial walking triggers GLUT4 translocation, allowing muscle cells to absorb glucose without requiring as much insulin.';
      if (activity.includes('resistance') || activity.includes('core')) return 'Hypertrophy-focused movement increases the total volumetric "glucose sink," improving long-term HbA1c.';
      return 'Timing movement 90 minutes after meals is the glycemic "sweet spot" for glucose clearance.';
    }
    if (cond === 'LIVER') {
      if (activity.includes('yoga') || activity.includes('twist')) return 'Compression of the hepatic region followed by release stimulates the "squeeze-and-soak" blood flow mechanism to the liver.';
      if (activity.includes('swim') || activity.includes('walk')) return 'Non-impact aerobic activity at "Zone 2" intensity helps reduce intra-hepatic fat without creating oxidative stress.';
      return 'Low-intensity recovery activities minimize metabolic heat, which is vital for enzyme stability.';
    }
    return 'Consistent movement triggers autophagy and cellular repair mechanisms for healthy aging.';
  };

  const sessions: ExerciseItem[] = [];
  
  // 1. Always add the Base session
  sessions.push({
    id: `${day}_base`,
    day,
    activity: baseActivity.activity || 'Generic movement',
    duration: baseActivity.duration || '20 min',
    intensity: baseActivity.intensity || 'Low',
    xp: baseActivity.xp || 15,
    emoji: baseActivity.emoji || '🚶',
    tip: getScientificTip(baseActivity.activity || 'Generic movement', condition),
    sessionType: 'Morning',
    suitability: getSuitability(baseActivity.activity || 'Generic movement', condition),
  });

  // 2. High Load Additions (Youth or Healthy Adult)
  if (loadScore >= 1.5) {
    const activity = 'Mobility & Stretching';
    sessions.push({
      id: `${day}_secondary`,
      day,
      activity,
      duration: '15 min',
      intensity: 'Very Low',
      xp: 12,
      emoji: '🤸',
      tip: getScientificTip(activity, condition),
      sessionType: 'Afternoon',
      suitability: getSuitability(activity, condition),
    });
  }

  if (loadScore >= 2.0) {
    const activity = condition === 'DIABETES' ? 'Resistance Bands' : 'Light Core Work';
    sessions.push({
      id: `${day}_tertiary`,
      day,
      activity,
      duration: '20 min',
      intensity: 'Moderate',
      xp: 20,
      emoji: '💪',
      tip: getScientificTip(activity, condition),
      sessionType: 'Evening',
      suitability: getSuitability(activity, condition),
    });
  }

  // 3. Low Load (Senior or Recovery)
  if (loadScore < 1.0 && loadScore >= 0.7) {
    const activity = 'Deep Breathing / Pranayama';
    sessions.push({
        id: `${day}_safety`,
        day,
        activity,
        duration: '10 min',
        intensity: 'Very Low',
        xp: 10,
        emoji: '🧘',
        tip: getScientificTip(activity, condition),
        sessionType: 'Evening',
        suitability: getSuitability(activity, condition),
      });
  }

  return sessions;
}

export function getExercisePlan(exerciseFlags: string[], age: number | null): ExercisePlan {
  // 1. Calculate Load Factor
  let ageFactor = 1.0;
  if (age && age < 18) ageFactor = 1.5;
  if (age && age >= 60) ageFactor = 0.7;

  let conditionFactor = 1.0;
  if (exerciseFlags.includes('ANEMIA_LIGHT')) conditionFactor = 0.6;
  if (exerciseFlags.includes('LIVER_RESTRICTED')) conditionFactor = 0.8;
  if (exerciseFlags.includes('NORMAL_ACTIVE')) conditionFactor = 1.4;

  const loadScore = ageFactor * conditionFactor;
  if (exerciseFlags.includes('THYROID_RECOVERY')) conditionFactor = 0.9;

  // 2. Select Base Plan
  let basePlan: any = NORMAL_PLAN_BASE;
  let condition = 'NORMAL';
  if (exerciseFlags.includes('ANEMIA_LIGHT')) { basePlan = ANEMIA_PLAN_BASE; condition = 'ANEMIA'; }
  else if (exerciseFlags.includes('LIVER_RESTRICTED')) { basePlan = LIVER_PLAN_BASE; condition = 'LIVER'; }
  else if (exerciseFlags.includes('DIABETES') || exerciseFlags.includes('HIGH_SUGAR')) { basePlan = DIABETES_PLAN_BASE; condition = 'DIABETES'; }
  else if (exerciseFlags.includes('THYROID_RECOVERY')) { basePlan = THYROID_PLAN_BASE; condition = 'THYROID'; }

  // 3. Generate Weekly multi-sessions
  const dailyExercises: Record<string, ExerciseItem[]> = {};
  const dayBases: Record<string, Partial<ExerciseItem>> = {
    'Day 1': { activity: 'Brisk Walk', duration: '30 min', intensity: 'Moderate', xp: 20, emoji: '🚶' },
    'Day 2': { activity: 'Bodyweight Basics', duration: '25 min', intensity: 'Moderate', xp: 25, emoji: '💪' },
    'Day 3': { activity: 'Yoga Flow', duration: '40 min', intensity: 'Low', xp: 22, emoji: '🧘' },
    'Day 4': { activity: 'Leisurely Walk', duration: '20 min', intensity: 'Low', xp: 15, emoji: '🚶' },
    'Day 5': { activity: 'Cycle / Swim', duration: '30 min', intensity: 'Moderate', xp: 25, emoji: '🚴' },
    'Day 6': { activity: 'Active Recovery', duration: '45 min', intensity: 'Very Low', xp: 15, emoji: '🌳' },
    'Day 7': { activity: 'Full Rest & Breath', duration: '15 min', intensity: 'Very Low', xp: 10, emoji: '🧘' },
  };

  // Adjust dayBases for Anemia (Lower intensity)
  if (condition === 'ANEMIA') {
    Object.keys(dayBases).forEach(d => {
        dayBases[d].intensity = 'Low';
        dayBases[d].duration = '15-20 min';
        dayBases[d].activity = dayBases[d].activity?.replace('Brisk', 'Gentle').replace('Cycle', 'Slow Cycle');
    });
  }

  for (let i = 1; i <= 7; i++) {
    const dayName = `Day ${i}`;
    dailyExercises[dayName] = generateDailySessions(dayName, dayBases[dayName], loadScore, condition);
  }

  return {
    ...basePlan,
    tierLabel: ageFactor > 1.2 ? `Youth ${basePlan.tierLabel}` : ageFactor < 0.8 ? `Senior ${basePlan.tierLabel}` : basePlan.tierLabel,
    dailyExercises,
  };
}

export const DANGER_EXERCISES: Record<string, string[]> = {
  ANEMIA_LIGHT: ['running', 'hiit', 'sprinting', 'heavy lifting'],
  LIVER_RESTRICTED: ['heavy lifting', 'intense cardio'],
};

export function getDangerWarning(activity: string, exerciseFlags: string[]): string | null {
  for (const flag of exerciseFlags) {
    const dangers = DANGER_EXERCISES[flag] || [];
    const actLower = activity.toLowerCase();
    for (const d of dangers) {
      if (actLower.includes(d)) return `High-intensity activity like "${activity}" is risky for your current findings.`;
    }
  }
  return null;
}
