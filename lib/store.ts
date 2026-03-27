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
  
  // Actions
  setReportData: (data: Partial<GUCState>) => void;
  toggleLanguage: () => void;
  toggleChecklistItem: (id: string) => void;
  addXP: (amount: number) => void;
  t: (key: string) => string;
  reset: () => void;
};

const initialState: Omit<GUCState, 'setReportData' | 'toggleLanguage' | 'toggleChecklistItem' | 'addXP' | 't' | 'reset'> = {
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
};

export const useStore = create<GUCState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setReportData: (data) => set((state) => ({ ...state, ...data })),
      toggleLanguage: () => set((state) => ({ language: state.language === 'EN' ? 'HI' : 'EN' })),
      toggleChecklistItem: (id) => set((state) => {
        const newChecklist = state.checklist.map(item => 
          item.id === id ? { ...item, completed: !item.completed } : item
        );
        return { checklist: newChecklist };
      }),
      addXP: (amount) => set((state) => {
        const newXP = state.xp + amount;
        const newLevel = Math.floor(newXP / 100) + 1;
        return { xp: newXP, level: newLevel };
      }),
      t: (key) => {
        const lang = get().language;
        return translations[key]?.[lang] || key;
      },
      reset: () => set(initialState),
    }),
    {
      name: 'reportraahat-guc',
    }
  )
);
