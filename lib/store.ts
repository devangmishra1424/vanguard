import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, Language } from './translations';

export type LabValue = {
  name: string;
  value: number;
  unit: string;
  status: 'NORMAL' | 'HIGH' | 'LOW';
  referenceRange: string;
  layman_en?: string;
  layman_hi?: string;
};

export type ChecklistItem = {
  id: string;
  task: string;
  completed: boolean;
};

export type LoggedFood = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  iron: number;
  calcium: number;
  vitaminC: number;
  xpEarned: number;
  isJunk: boolean;
  timestamp: number;
};

export type LoggedExercise = {
  id: string;
  activity: string;
  duration: string;
  xpEarned: number;
  timestamp: number;
};

export type XPHistory = {
  date: string; // YYYY-MM-DD
  nutritionXP: number;
  exerciseXP: number;
};

export type GUCState = {
  reportText: string;
  language: Language;
  summary: string;
  hindiSummary: string;
  labValues: LabValue[];
  organFlags: string[];
  exerciseFlags: string[];
  dietaryFlags: string[];
  jargonMap: Record<string, string>;
  ai_confidence_score: number;
  checklist: ChecklistItem[];
  xp: number;
  level: number;
  avatarState: 'IDLE' | 'ANALYZING' | 'HAPPY';

  // Daily gamification (session-only, NOT persisted)
  nutritionXP: number;
  exerciseXP: number;
  loggedFoods: LoggedFood[];
  loggedExercises: LoggedExercise[];

  // Persisted across reloads
  xpHistory: XPHistory[];

  // Actions
  setReportData: (data: Partial<GUCState>) => void;
  toggleLanguage: () => void;
  toggleChecklistItem: (id: string) => void;
  addXP: (amount: number) => void;
  addNutritionXP: (amount: number) => void;
  addExerciseXP: (amount: number) => void;
  logFood: (food: LoggedFood) => void;
  logExercise: (exercise: LoggedExercise) => void;
  resetDailyProgress: () => void;
  t: (key: string) => string;
  reset: () => void;
};

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Ensure today's entry always exists in history
function ensureTodayEntry(history: XPHistory[]): XPHistory[] {
  const today = getTodayStr();
  const copy = [...history];
  if (!copy.find((h) => h.date === today)) {
    copy.push({ date: today, nutritionXP: 0, exerciseXP: 0 });
  }
  // Keep last 7 days sorted
  return copy.sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
}

const initialState: Omit<
  GUCState,
  | 'setReportData'
  | 'toggleLanguage'
  | 'toggleChecklistItem'
  | 'addXP'
  | 'addNutritionXP'
  | 'addExerciseXP'
  | 'logFood'
  | 'logExercise'
  | 'resetDailyProgress'
  | 't'
  | 'reset'
> = {
  reportText: '',
  language: 'EN',
  summary: '',
  hindiSummary: '',
  labValues: [],
  organFlags: [],
  exerciseFlags: [],
  dietaryFlags: [],
  jargonMap: {},
  ai_confidence_score: 0,
  checklist: [],
  xp: 0,
  level: 1,
  avatarState: 'IDLE',
  // Daily state — starts fresh every session
  nutritionXP: 0,
  exerciseXP: 0,
  loggedFoods: [],
  loggedExercises: [],
  xpHistory: [],
};

export const useStore = create<GUCState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setReportData: (data) =>
        set((state) => ({
          ...state,
          // Explicitly clear old report data so it doesn't leak into new report if data omits it
          summary: '',
          hindiSummary: '',
          labValues: [],
          organFlags: [],
          exerciseFlags: [],
          dietaryFlags: [],
          jargonMap: {},
          checklist: [],
          // Apply new data
          ...data,
          // Clear daily progress whenever a new report is loaded
          nutritionXP: 0,
          exerciseXP: 0,
          loggedFoods: [],
          loggedExercises: [],
          // Ensure today is in history with zero totals if not already there
          xpHistory: ensureTodayEntry(state.xpHistory),
        })),

      toggleLanguage: () =>
        set((state) => ({ language: state.language === 'EN' ? 'HI' : 'EN' })),

      toggleChecklistItem: (id) =>
        set((state) => {
          const newChecklist = state.checklist.map((item) =>
            item.id === id ? { ...item, completed: !item.completed } : item
          );
          return { checklist: newChecklist };
        }),

      addXP: (amount) =>
        set((state) => {
          const newXP = state.xp + amount;
          const newLevel = Math.floor(newXP / 100) + 1;
          return { xp: newXP, level: newLevel };
        }),

      addNutritionXP: (amount) =>
        set((state) => {
          const today = getTodayStr();
          const history = ensureTodayEntry(state.xpHistory);
          const idx = history.findIndex((h) => h.date === today);
          history[idx] = {
            ...history[idx],
            nutritionXP: history[idx].nutritionXP + amount,
          };
          const newXP = state.xp + amount;
          return {
            nutritionXP: state.nutritionXP + amount,
            xp: newXP,
            level: Math.floor(newXP / 100) + 1,
            xpHistory: history,
          };
        }),

      addExerciseXP: (amount) =>
        set((state) => {
          const today = getTodayStr();
          const history = ensureTodayEntry(state.xpHistory);
          const idx = history.findIndex((h) => h.date === today);
          history[idx] = {
            ...history[idx],
            exerciseXP: history[idx].exerciseXP + amount,
          };
          const newXP = state.xp + amount;
          return {
            exerciseXP: state.exerciseXP + amount,
            xp: newXP,
            level: Math.floor(newXP / 100) + 1,
            xpHistory: history,
          };
        }),

      logFood: (food) =>
        set((state) => ({ loggedFoods: [...state.loggedFoods, food] })),

      logExercise: (exercise) =>
        set((state) => ({
          loggedExercises: [...state.loggedExercises, exercise],
        })),

      resetDailyProgress: () =>
        set({
          nutritionXP: 0,
          exerciseXP: 0,
          loggedFoods: [],
          loggedExercises: [],
        }),

      t: (key) => {
        const lang = get().language;
        return translations[key]?.[lang] || key;
      },

      reset: () => set(initialState),
    }),
    {
      name: 'reportraahat-v2', // Bumped version to wipe old broken localStorage state
      // Only persist XP totals and 7-day history
      // Daily food/exercise logs are session-only (cleared on reload/new report)
      partialize: (state) => ({
        language: state.language,
        xp: state.xp,
        level: state.level,
        xpHistory: state.xpHistory,
      }),
    }
  )
);
