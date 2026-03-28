'use client';
import { createPortal } from 'react-dom';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import {
  getFoodRecommendations,
  getJunkWarning,
  isJunkFood,
  computeNutrientRadar,
  computeIntakeRadar,
  getDailyTargets,
  type FoodItem,
} from '@/lib/nutritionEngine';
import type { FoodSearchResult } from '@/app/api/food-search/route';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Apple,
  Leaf,
  Zap,
  Search,
  Star,
  AlertTriangle,
  X,
  TrendingUp,
  CheckCircle2,
  Flame,
  Loader2,
  ChefHat,
  Ban,
  Check,
  MessageSquareQuote,
  Sparkles,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getDietPlan } from '@/lib/dietEngine';

function fmt(n: number, d = 1) {
  return Number(n.toFixed(d));
}

// ---------- Junk Alert Modal ----------
function JunkModal({
  food,
  warning,
  onClose,
}: {
  food: string;
  warning: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative bg-[#1e1b2e] border border-orange-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-orange-500/20"
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 40 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-500/20 rounded-full">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-wider">
            Cheat Meal Alert 🍟
          </h3>
        </div>
        <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
          {warning}
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold uppercase tracking-widest text-sm hover:opacity-90 transition"
        >
          Got It — Back on Track! 💪
        </button>
      </motion.div>
    </motion.div>
  );
}

// ---------- Food Search Autocomplete (portal-based to escape overflow:hidden) ----------
function FoodSearch({
  dietaryFlags,
  onSelect,
}: {
  dietaryFlags: string[];
  onSelect: (food: FoodSearchResult) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const updatePos = useCallback(() => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    // position:fixed uses viewport coords — store them directly
    setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(q)}`);
      const data: FoodSearchResult[] = await res.json();
      setResults(data);
      if (data.length > 0) {
        updatePos();
        setOpen(true);
      } else {
        setOpen(false);
      }
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, [updatePos]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(val), 300);
  };

  const handleSelect = (food: FoodSearchResult) => {
    onSelect(food);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dropdown = open && results.length > 0 && mounted
    ? createPortal(
          <div
            ref={dropRef}
            style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-[340px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {results.map((food) => (
              <button
                key={food.name}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(food); }}
                className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-800 transition border-b border-slate-800/60 last:border-0"
              >
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${food.isJunk ? 'text-orange-400' : 'text-slate-200'}`}>
                    {food.isJunk ? '🍟 ' : '✅ '}{food.name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {food.calories} kcal · Protein {fmt(food.protein)}g · Iron {fmt(food.iron)}mg · Ca {fmt(food.calcium, 0)}mg
                  </p>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  food.isJunk
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20'
                }`}>
                  {food.isJunk ? '+2 XP' : `+${food.xp} XP`}
                </span>
              </button>
            ))}
          </div>,
        document.body
      )
    : null;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
        <input
          ref={inputRef}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/60 transition"
          placeholder="Search any Indian food (e.g. paneer, poha, rajmah…)"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0) { updatePos(); setOpen(true); } }}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />
        )}
      </div>
      <p className="text-[11px] text-slate-600 mt-1.5">
        ⚡ Junk foods trigger a health alert · Healthy foods earn XP based on their nutrition
      </p>
      {dropdown}
    </div>
  );
}


// ---------- Main Page ----------
export default function NutritionPage() {
  const {
    labValues,
    dietaryFlags,
    loggedFoods,
    xpHistory,
    logFood,
    addNutritionXP,
    resetDailyProgress,
    addXP,
    reportText
  } = useStore();

  const [junkFood, setJunkFood] = useState<string | null>(null);
  const [junkWarning, setJunkWarning] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [coachingLanguage, setCoachingLanguage] = useState<'EN' | 'HI'>('EN');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const recommendations = getFoodRecommendations(dietaryFlags);
  const targets = getDailyTargets(dietaryFlags);
  const radarData = computeNutrientRadar(labValues);

  // Daily log totals
  const totals = loggedFoods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      iron: acc.iron + f.iron,
      calcium: acc.calcium + f.calcium,
      vitaminC: acc.vitaminC + f.vitaminC,
      vitaminD: acc.vitaminD + (f.vitaminD || 0),
      vitaminB12: acc.vitaminB12 + (f.vitaminB12 || 0),
      folate: acc.folate + (f.folate || 0),
    }),
    { calories: 0, protein: 0, iron: 0, calcium: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0, folate: 0 }
  );

  const intakeRadarData = computeIntakeRadar(totals, targets);

  const today = new Date().toISOString().slice(0, 10);

  // XP chart — last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const label =
      key === today ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' });
    const hist = xpHistory.find((h) => h.date === key);
    return { day: label, xp: hist?.nutritionXP ?? 0 };
  });

  const xpToday = xpHistory.find((h) => h.date === today)?.nutritionXP ?? 0;
  const xpGoal = 100;
  const xpPct = Math.min(100, Math.round((xpToday / xpGoal) * 100));

  const condition = (dietaryFlags.includes('IRON_RICH') || dietaryFlags.includes('ANEMIA_DIET'))
    ? 'Iron Deficiency / Anemia'
    : (dietaryFlags.includes('LOW_FAT') || dietaryFlags.includes('LIVER_DETOX_DIET'))
    ? 'Liver Condition'
    : (dietaryFlags.includes('LOW_GLYCEMIC_DIET') || dietaryFlags.includes('LOW_SUGAR'))
    ? 'Diabetes / Glucose Balance'
    : dietaryFlags.includes('HEART_HEALTHY_DIET')
    ? 'Heart & Lipid Care'
    : dietaryFlags.includes('KIDNEY_FRIENDLY_DIET')
    ? 'Kidney Condition'
    : dietaryFlags.includes('VITAMIN_D_RICH')
    ? 'Vitamin D Deficiency'
    : dietaryFlags.includes('CALCIUM_RICH')
    ? 'Bone Health'
    : 'General Wellness';

  // Called when user picks a food from search OR clicks recommended card
  const handleLogFood = (food: FoodSearchResult | FoodItem) => {
    const junk = food.isJunk || isJunkFood(food.name);
    if (junk) {
      setJunkFood(food.name);
      setJunkWarning(getJunkWarning(food.name, dietaryFlags));
    }
    const xpEarned = junk ? 2 : (food as FoodSearchResult).xp ?? (food as FoodItem).xp;
    logFood({
      id: Math.random().toString(36).slice(2),
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      iron: food.iron,
      calcium: food.calcium,
      vitaminC: food.vitaminC,
      vitaminD: food.vitaminD,
      vitaminB12: food.vitaminB12,
      folate: food.folate,
      xpEarned,
      isJunk: junk,
      timestamp: Date.now(),
    });
    addNutritionXP(xpEarned);
    confetti({
      particleCount: junk ? 20 : 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: junk ? ['#ef4444', '#f97316'] : ['#f59e0b', '#fbbf24', '#ffffff'],
    });
  };

  const progressBar = (val: number, max: number, color: string) => {
    const pct = Math.min(100, Math.round((val / max) * 100));
    return (
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    );
  };

  const dietPlan = getDietPlan(dietaryFlags);
  const [aiInsight, setAiInsight] = useState('');
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  const fetchAiInsight = async () => {
    if (!labValues.length) return;
    setIsInsightLoading(true);
    setAiInsight('');
    const { language } = useStore.getState();
    try {
      const res = await fetch('/api/diet-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labValues,
          dietaryFlags,
          dietPlan,
          language
        })
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        setAiInsight(prev => prev + decoder.decode(value));
      }
    } catch (err) {
      console.error(err);
      setAiInsight('Error generating insight.');
    } finally {
      setIsInsightLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted && labValues.length > 0 && !aiInsight) {
      fetchAiInsight();
    }
  }, [isMounted, labValues]);

  return (
    <main className="min-h-screen bg-[#0F172A] p-4 md:p-8">

      <AnimatePresence>
        {junkFood && (
          <JunkModal
            food={junkFood}
            warning={junkWarning}
            onClose={() => setJunkFood(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
              Nutrition <span className="text-[#f59e0b]">Lab</span>
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">
              Personalised for · {condition}
            </p>
          </div>
          {/* XP Bar */}
          <Card className="bg-slate-900 border-slate-800 px-5 py-3 min-w-[220px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#f59e0b]" /> Daily Nutrition XP
              </span>
              <span className="text-[#f59e0b] font-bold text-sm">
                {xpToday}/{xpGoal}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </Card>
        </div>

        {/* Row 1: Radar + Search + Targets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Radar */}
          <Card className="bg-slate-900/50 border-slate-800 p-6 flex flex-col">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#f59e0b]" /> Your Nutrient Status
            </h3>
            {isMounted && (
              <div className="w-full h-[320px] relative overflow-visible">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={intakeRadarData} cx="50%" cy="50%" outerRadius="80%">
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                      dataKey="nutrient"
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name="Intake %"
                      dataKey="value"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.5}
                      animationBegin={0}
                      animationDuration={1000}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2 text-center">
              Based on your latest lab report values
            </p>
          </Card>

          {/* Search + Daily Targets */}
          <div className="flex flex-col gap-4 overflow-visible">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 overflow-visible relative">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-orange-400" /> Log a Food
              </h3>
              <FoodSearch dietaryFlags={dietaryFlags} onSelect={handleLogFood} />
            </div>

            <Card className="bg-slate-900 border-slate-800 p-4 flex-1">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-orange-500" /> Daily Targets
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Calories', val: fmt(totals.calories, 0), max: targets.calories, unit: 'kcal', color: '#f59e0b' },
                  { label: 'Protein', val: fmt(totals.protein), max: targets.protein, unit: 'g', color: '#22c55e' },
                  { label: 'Iron', val: fmt(totals.iron), max: targets.iron, unit: 'mg', color: '#ef4444' },
                  { label: 'Calcium', val: fmt(totals.calcium, 0), max: targets.calcium, unit: 'mg', color: '#3b82f6' },
                  { label: 'Vitamin C', val: fmt(totals.vitaminC), max: targets.vitaminC, unit: 'mg', color: '#a855f7' },
                  { label: 'Vitamin D', val: fmt(totals.vitaminD), max: targets.vitaminD, unit: 'mcg', color: '#facc15' },
                  { label: 'Vitamin B12', val: fmt(totals.vitaminB12), max: targets.vitaminB12, unit: 'mcg', color: '#ec4899' },
                ].map(({ label, val, max, unit, color }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</span>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {val}/{max} {unit}
                      </span>
                    </div>
                    {progressBar(Number(val), max, color)}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Row 1.5: Personalized Diet Plan (The AI + Rule Hybrid) */}
        <AnimatePresence>
          {isMounted && labValues.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* AI Coaching Box */}
              <Card className="lg:col-span-1 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-indigo-500/20 p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
                  <Sparkles className="w-12 h-12 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquareQuote className="w-4 h-4" /> AI Coaching Insight
                    </h3>
                    <div className="flex bg-slate-800/50 p-1 rounded-lg border border-indigo-500/20">
                      <button 
                        onClick={() => setCoachingLanguage('EN')}
                        className={`px-2 py-1 text-[9px] font-bold rounded transition-all ${coachingLanguage === 'EN' ? 'bg-[#f59e0b] text-white' : 'text-slate-500'}`}
                      >EN</button>
                      <button 
                        onClick={() => setCoachingLanguage('HI')}
                        className={`px-2 py-1 text-[9px] font-bold rounded transition-all ${coachingLanguage === 'HI' ? 'bg-[#f59e0b] text-white' : 'text-slate-500'}`}
                      >HI</button>
                    </div>
                  </div>
                  <div className="relative">
                    {isInsightLoading && !aiInsight ? (
                      <div className="flex items-center gap-3 py-4">
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                        <span className="text-xs text-indigo-400/70 font-mono tracking-tighter">Analyzing your report context...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(() => {
                          const parts = aiInsight.split('HI:');
                          const en = parts[0].replace('EN:', '').trim();
                          const hi = parts[1]?.trim() || '';
                          const content = coachingLanguage === 'EN' ? en : hi;
                          
                          if (!content) return <p className="text-[13px] leading-relaxed text-slate-300 italic">"{aiInsight || 'Loading your personalized advice...'}"</p>;

                          return content.split('\n').map((line, idx) => {
                            const cleanLine = line.replace(/^- /, '').trim();
                            if (!cleanLine) return null;
                            return (
                              <div key={idx} className="flex gap-2 items-start">
                                <span className="text-indigo-400 mt-1">✦</span>
                                <p className="text-[13px] leading-relaxed text-slate-200">{cleanLine}</p>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-indigo-500/10 flex justify-between items-center text-[10px] text-indigo-400/60 uppercase font-black">
                  <span>Dr. Raahat AI v2.0</span>
                  <button onClick={fetchAiInsight} className="hover:text-indigo-300 transition-colors flex items-center gap-1 group">
                    Regenerate <Zap className="w-2.5 h-2.5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </Card>

              {/* Rule-Based Consume/Avoid Table */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Consume List */}
                <Card className="bg-slate-900 border-green-500/20 p-5 border-l-4 border-l-green-500 shadow-xl">
                  <h4 className="text-[11px] font-black text-green-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Check className="w-4 h-4" /> Focus on These
                  </h4>
                  <div className="space-y-4">
                    {dietPlan.consume.map((item) => (
                      <div key={item.name} className="flex gap-3 items-start">
                        <span className="text-xl flex-shrink-0">{item.emoji}</span>
                        <div>
                          <p className="text-sm font-bold text-slate-100">{item.name}</p>
                          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Avoid List */}
                <Card className="bg-slate-900 border-red-500/20 p-5 border-l-4 border-l-red-500 shadow-xl">
                  <h4 className="text-[11px] font-black text-red-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Ban className="w-4 h-4" /> Strictly Avoid
                  </h4>
                  <div className="space-y-4">
                    {dietPlan.avoid.map((item) => (
                      <div key={item.name} className="flex gap-3 items-start grayscale opacity-60">
                        <span className="text-xl flex-shrink-0">{item.emoji}</span>
                        <div>
                          <p className="text-sm font-bold text-slate-200">{item.name}</p>
                          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Chef Tip Full Width */}
                <Card className="md:col-span-2 bg-[#f59e0b]/5 border-[#f59e0b]/20 p-4 flex items-center gap-4 hover:bg-[#f59e0b]/10 transition-colors">
                  <div className="p-2.5 bg-[#f59e0b]/20 rounded-xl">
                    <ChefHat className="w-5 h-5 text-[#f59e0b]" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#f59e0b]">
                      {coachingLanguage === 'EN' ? 'Raahat Chef Tips' : 'राहहत शेफ टिप्स'}
                    </span>
                    <div className="mt-2 space-y-2">
                      {(coachingLanguage === 'EN' ? dietPlan.chefTips : dietPlan.chefTipsHi).map((tip, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="text-[#f59e0b] mt-0.5">✦</span>
                          <p className="text-xs text-[#f59e0b]/80 font-medium leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Healing Clock (Nutrition Timing) */}
                <div className="md:col-span-2 mt-4">
                  <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> The Healing Clock (Optimum Timing)
                  </h4>
                  <div className="relative border-l-2 border-slate-800 ml-3 space-y-8 pb-4">
                    {dietPlan.schedule.map((slot, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative pl-8"
                      >
                        {/* Dot */}
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-amber-500" />
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter w-16">
                            {slot.time}
                          </span>
                          <div className="flex-1 bg-slate-800/30 rounded-xl p-3 border border-slate-800/50 hover:border-amber-500/30 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-200">
                                {coachingLanguage === 'EN' ? slot.activity : slot.activityHi}
                              </span>
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold uppercase tracking-widest">
                                {coachingLanguage === 'EN' ? 'Optimum' : 'सबसे सही समय'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">
                              <span className="text-amber-500/80">✦ </span>
                              {coachingLanguage === 'EN' ? slot.foods : slot.foodsHi}
                            </p>
                            <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-start gap-2">
                              <Sparkles className="w-2.5 h-2.5 text-indigo-400 mt-0.5" />
                              <p className="text-[10px] text-slate-500 italic">
                                {coachingLanguage === 'EN' ? slot.tip : slot.tipHi}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Row 2: Recommended Foods */}
        <div>
          <h3 className="text-lg font-black text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Apple className="w-5 h-5 text-orange-500" /> Healing Foods For You
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recommendations.map((food, i) => (
              <motion.div
                key={food.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="bg-slate-900 border-slate-800 p-4 hover:border-orange-500/50 transition-all group flex flex-col h-full">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                    {food.emoji}
                  </div>
                  <h4 className="font-bold text-slate-200 text-sm leading-tight">
                    {food.name}
                  </h4>
                  <div className="mt-1 text-[11px] text-slate-500 space-y-0.5">
                    <div>{food.calories} kcal · {food.protein}g protein</div>
                    <div>Iron {food.iron}mg · Vit C {food.vitaminC}mg</div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {food.tags.map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto pt-3">
                    <button
                      onClick={() => handleLogFood(food)}
                      className="w-full py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold hover:bg-orange-500/20 transition flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ate This! +{food.xp} XP
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Row 3: XP Chart + Food Log */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-[#f59e0b]" /> 7-Day Nutrition XP
            </h3>
            {isMounted && (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="nutGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }}
                      labelStyle={{ color: '#94a3b8' }}
                      itemStyle={{ color: '#f59e0b' }}
                    />
                    <Area type="monotone" dataKey="xp" stroke="#f59e0b" fill="url(#nutGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Leaf className="w-4 h-4 text-green-500" /> Today's Food Log
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {loggedFoods.length === 0 ? (
                <p className="text-slate-600 text-sm text-center py-8">
                  No foods logged yet today. Start eating healthy! 🌿
                </p>
              ) : (
                [...loggedFoods].reverse().map((f) => (
                  <div
                    key={f.id}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                      f.isJunk
                        ? 'bg-red-500/10 border border-red-500/20'
                        : 'bg-slate-800/50 border border-slate-700/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex-shrink-0">{f.isJunk ? '🍟' : '✅'}</span>
                      <div className="min-w-0">
                        <p className="text-slate-200 text-xs font-semibold truncate">{f.name}</p>
                        <p className="text-slate-500 text-[10px]">{f.calories} kcal</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 ${f.isJunk ? 'text-red-400' : 'text-[#f59e0b]'}`}>
                      +{f.xpEarned} XP
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Pro Tip */}
        <Card className="bg-orange-500/10 border-orange-500/20 p-5">
          <div className="flex gap-4 items-start">
            <Leaf className="w-8 h-8 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-200">Absorption Pro-Tip</h4>
              <p className="text-sm text-slate-400 mt-1">
                {dietaryFlags.includes('IRON_RICH') || dietaryFlags.includes('VITAMIN_C')
                  ? '🍋 Pair iron-rich foods (spinach, rajmah, bajra) with Vitamin C (amla, lemon, capsicum) to triple your iron absorption. Avoid tea/coffee for 1 hour after iron-rich meals.'
                  : dietaryFlags.includes('LOW_FAT')
                  ? '🥬 Eat small meals every 3–4 hours. Turmeric, amla, and green veggies actively support liver regeneration. Avoid fried foods, processed sugar, and red meat.'
                  : dietaryFlags.includes('VITAMIN_D_RICH')
                  ? '☀️ Get 15–20 minutes of morning sunlight (before 10 AM) daily — this is the only natural source of Vitamin D. Pair with calcium-rich foods like paneer and ragi.'
                  : '🌿 Eat a rainbow of Indian vegetables daily. Seasonal local produce is highest in nutrients. Small consistent habits beat occasional perfect days.'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
