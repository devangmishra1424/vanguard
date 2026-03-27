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
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
  } = useStore();

  const [junkFood, setJunkFood] = useState<string | null>(null);
  const [junkWarning, setJunkWarning] = useState('');
  const [isMounted, setIsMounted] = useState(false);

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
    }),
    { calories: 0, protein: 0, iron: 0, calcium: 0, vitaminC: 0 }
  );

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

  const condition = dietaryFlags.includes('IRON_RICH')
    ? 'Iron Deficiency / Anemia'
    : dietaryFlags.includes('LOW_FAT')
    ? 'Liver Condition'
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
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name="Level"
                      dataKey="A"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.35}
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
                ].map(({ label, val, max, unit, color }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-semibold">{label}</span>
                      <span className="text-[11px] text-slate-500">
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
