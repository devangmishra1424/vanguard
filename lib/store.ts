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

export type ReportSnapshot = {
  id: string;
  date: string;
  labValues: LabValue[];
  summary: string;
  reportText: string;
};

export type DailyVital = {
  id: string;
  date: string;
  type: 'BP_SYS' | 'BP_DIA' | 'HR' | 'WEIGHT';
  value: number;
  unit: string;
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
  vitaminD: number;
  vitaminB12: number;
  folate: number;
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
  age: number | null;
  reportHistory: ReportSnapshot[];
  dailyVitals: DailyVital[];
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
  logDailyVital: (vital: DailyVital) => void;
  saveReportToHistory: () => void;
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
  | 'logDailyVital'
  | 'saveReportToHistory'
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
  age: null,
  reportHistory: [],
  dailyVitals: [],
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

      saveReportToHistory: () =>
        set((state) => {
          if (!state.reportText || state.labValues.length === 0) return state;
          
          // Prevent duplicate snapshots of the same report relative to its text content
          const isDuplicate = state.reportHistory.some(h => h.reportText === state.reportText);
          if (isDuplicate) return state;

          const newSnapshot: ReportSnapshot = {
            id: Math.random().toString(36).substring(7),
            date: getTodayStr(),
            labValues: state.labValues,
            summary: state.summary,
            reportText: state.reportText
          };

          // Limit to last 20 reports for storage efficiency
          const newHistory = [newSnapshot, ...state.reportHistory].slice(0, 20);
          return { reportHistory: newHistory };
        }),

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
      
      logDailyVital: (vital) =>
        set((state) => ({
          dailyVitals: [vital, ...state.dailyVitals].slice(0, 50) // Keep last 50 entries
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
      // Only persist essential report context and long-term history
      // Daily logs (foods/exercises) are session-only as intended.
      partialize: (state) => ({
        language: state.language,
        xp: state.xp,
        level: state.level,
        xpHistory: state.xpHistory,
        // Clinical Context (Persist report between reloads)
        reportText: state.reportText,
        summary: state.summary,
        hindiSummary: state.hindiSummary,
        labValues: state.labValues,
        organFlags: state.organFlags,
        exerciseFlags: state.exerciseFlags,
        dietaryFlags: state.dietaryFlags,
        jargonMap: state.jargonMap,
        age: state.age,
        reportHistory: state.reportHistory,
        dailyVitals: state.dailyVitals,
      }),
    }
  )
);
