'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { getExercisePlan, getDangerWarning, type ExerciseItem } from '@/lib/exerciseEngine';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  AlertCircle,
  Clock,
  CheckCircle2,
  Zap,
  Star,
  Shield,
  Flame,
  X,
  TrendingUp,
  Activity,
  ShieldAlert,
  Sparkles,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// ---------- Danger Warning Modal ----------
function DangerModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative bg-[#1e1b2e] border border-red-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-red-500/20"
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 40 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/20 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-wider">
            Safety Alert ⚠️
          </h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold uppercase tracking-widest text-sm hover:opacity-90 transition"
        >
          I Understood — Stay Safe
        </button>
      </motion.div>
    </motion.div>
  );
}

// ---------- XP Chips ----------
function XPChip({ xp }: { xp: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] text-[11px] font-bold">
      <Zap className="w-2.5 h-2.5" /> +{xp}
    </span>
  );
}

const intensityColors: Record<string, string> = {
  'Very Low': '#22c55e',
  'Low': '#3b82f6',
  'Moderate': '#f59e0b',
  'High': '#ef4444',
};

export default function ExercisePage() {
  const {
    exerciseFlags,
    xpHistory,
    addExerciseXP,
    logExercise,
    age,
    labValues,
  } = useStore();

  const [done, setDone] = useState<Set<string>>(new Set());
  const [dangerMsg, setDangerMsg] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [exerciseInsight, setExerciseInsight] = useState('');
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [coachingLanguage, setCoachingLanguage] = useState<'EN' | 'HI'>('EN');
  const [viewMode, setViewMode] = useState<'TODAY' | 'WEEKLY'>('TODAY');
  
  // Calculate current day (1-7) where Monday is 1
  const systemDay = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  const defaultDayIndex = systemDay === 0 ? 7 : systemDay;
  const [activeDay, setActiveDay] = useState(defaultDayIndex);

  const plan = getExercisePlan(exerciseFlags, age);
  
  const getWeekdayName = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayIndex = new Date().getDay();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (dayIndex - (todayIndex === 0 ? 7 : todayIndex)));
    return days[targetDate.getDay()];
  };

  const getDayPurpose = (dayIndex: number) => {
    const purposes: Record<number, string> = {
      1: 'Metabolic Priming',
      2: 'Strength Foundation',
      3: 'Endocrine Balance',
      4: 'Active Recovery',
      5: 'Cardio Endurance',
      6: 'Resilience Training',
      7: 'Systemic Rest',
    };
    return purposes[dayIndex] || 'General Wellness';
  };

  const currentDaySessions = plan.dailyExercises[`Day ${activeDay}`] || [];
  const isTodayUnfinished = activeDay === defaultDayIndex && currentDaySessions.some(s => !done.has(s.id));

  const fetchExerciseInsight = async () => {
    if (!exerciseFlags.length) return;
    setIsInsightLoading(true);
    setExerciseInsight('');
    try {
      const res = await fetch('/api/exercise-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labValues, exerciseFlags, exercisePlan: plan, age, language: coachingLanguage }),
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setExerciseInsight((prev) => prev + decoder.decode(value));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsInsightLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    if (exerciseFlags.length > 0) {
      fetchExerciseInsight();
    }
  }, [exerciseFlags]);

  // XP Chart — last 7 days
  const todayStr = new Date().toISOString().slice(0, 10);
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const label =
      key === todayStr
        ? 'Today'
        : d.toLocaleDateString('en-IN', { weekday: 'short' });
    const hist = xpHistory.find((h) => h.date === key);
    return { day: label, xp: hist?.exerciseXP ?? 0, isToday: key === todayStr };
  });

  const handleMarkDone = (item: ExerciseItem) => {
    const warn = getDangerWarning(item.activity, exerciseFlags);
    if (warn) {
      setDangerMsg(warn);
      return;
    }

    if (done.has(item.id)) return;

    setDone((prev) => new Set([...prev, item.id]));
    addExerciseXP(item.xp);
    logExercise({
      id: item.id,
      activity: item.activity,
      duration: item.duration,
      xpEarned: item.xp,
      timestamp: Date.now(),
    });
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#f59e0b', '#22c55e']
    });
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-[#0f111a] text-slate-200 pb-20 pt-28 px-4 md:px-8">
      <AnimatePresence>
        {dangerMsg && <DangerModal message={dangerMsg} onClose={() => setDangerMsg(null)} />}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <section className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
              <Dumbbell className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">
                Move<span className="text-indigo-500">Smart</span>
              </h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">
                Longevity & Movement Science
              </p>
            </div>
          </div>
        </section>

        {/* AI Insight & Healing Logic Sections */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Activity className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tight">
                  Personalized For: <span className="text-indigo-400">{plan.tierLabel}</span>
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  Extracted Profile: {age ? `${age} Years` : 'Unknown'} · {exerciseFlags[0]?.replace('_', ' ') || 'General'}
                </p>
              </div>
            </div>
            <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
              <button 
                onClick={() => { setCoachingLanguage('EN'); fetchExerciseInsight(); }}
                className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${coachingLanguage === 'EN' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                EN
              </button>
              <button 
                onClick={() => { setCoachingLanguage('HI'); fetchExerciseInsight(); }}
                className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${coachingLanguage === 'HI' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                HI
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Coaching Insight */}
            <Card className="lg:col-span-1 bg-gradient-to-br from-indigo-500/10 via-slate-900 to-slate-900 border-indigo-500/20 p-5 relative overflow-hidden flex flex-col min-h-[350px]">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Sparkles className="w-16 h-16 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> AI MoveSmart Insight
                </h4>
                <div className="space-y-4">
                  {isInsightLoading && !exerciseInsight ? (
                    <div className="flex items-center gap-3 py-4">
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                      <span className="text-xs text-indigo-400/70 font-mono tracking-tighter italic">Analyzing movement profile...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        const parts = exerciseInsight.split('HI:');
                        const en = parts[0].replace('EN:', '').trim();
                        const hi = parts[1]?.trim() || '';
                        const content = coachingLanguage === 'EN' ? en : hi;
                        if (!content) return <p className="text-[13px] leading-relaxed text-slate-400 italic">Reading your report context...</p>;
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
              <div className="mt-6 pt-4 border-t border-indigo-500/10 flex justify-between items-center text-[10px] text-indigo-400/60 font-black">
                <span>Raahat AI Movement v2.0</span>
                <button onClick={fetchExerciseInsight} className="hover:text-indigo-300 transition-colors flex items-center gap-1 group">
                  Regenerate <Zap className="w-2.5 h-2.5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </Card>

            {/* Healing vs Avoid Selections */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-900 border-green-500/20 p-5 border-l-4 border-l-green-500 shadow-xl">
                <h4 className="text-[11px] font-black text-green-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Healing Selections
                </h4>
                <div className="space-y-5">
                  {plan.healers.map((h, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <span className="text-xl flex-shrink-0">{h.emoji}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-100">{h.name}</p>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{h.benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-slate-900 border-red-500/20 p-5 border-l-4 border-l-red-500 shadow-xl">
                <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Strictly Avoid
                </h4>
                <div className="space-y-5">
                  {plan.avoid.map((a, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <span className="text-xl flex-shrink-0">{a.emoji}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-100">{a.name}</p>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{a.risk}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Tabs & Navigation */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex bg-[#1e293b]/50 p-1 rounded-xl border border-slate-800 w-fit backdrop-blur-md">
              <button 
                onClick={() => { setViewMode('TODAY'); setActiveDay(defaultDayIndex); }}
                className={`px-6 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-2 relative ${viewMode === 'TODAY' && activeDay === defaultDayIndex ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'text-slate-500 hover:text-slate-300'} ${viewMode === 'TODAY' && activeDay !== defaultDayIndex ? 'bg-slate-800 text-indigo-400' : ''}`}
              >
                <Clock className="w-3.5 h-3.5" /> 
                {viewMode === 'TODAY' && activeDay !== defaultDayIndex ? `Day ${activeDay} Preview` : "Today's Protocol"}
                {isTodayUnfinished && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                )}
              </button>
              <button 
                onClick={() => setViewMode('WEEKLY')}
                className={`px-6 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-2 ${viewMode === 'WEEKLY' ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Activity className="w-3.5 h-3.5" /> Weekly Masterplan
              </button>
            </div>

            {viewMode === 'TODAY' && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveDay(prev => Math.max(1, prev - 1))}
                  disabled={activeDay === 1}
                  className="p-2 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                >
                  <TrendingUp className="w-4 h-4 rotate-180" />
                </button>
                <div className="px-6 py-2 bg-indigo-500/10 backdrop-blur-md rounded-xl border border-indigo-500/20 min-w-[180px] text-center relative group">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] leading-none block mb-1">
                    {activeDay === defaultDayIndex ? 'Current Session' : 'Scheduled Preview'}
                  </span>
                  <span className="text-sm font-black text-white uppercase tracking-tight">
                    {getWeekdayName(activeDay)} <span className="text-indigo-500/60 mx-1">/</span> {getDayPurpose(activeDay)}
                  </span>
                  
                  {activeDay !== defaultDayIndex && (
                    <button 
                      onClick={() => setActiveDay(defaultDayIndex)}
                      className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-[9px] font-black rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap"
                    >
                      RESET TO TODAY
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setActiveDay(prev => Math.min(7, prev + 1))}
                  disabled={activeDay === 7}
                  className="p-2 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'TODAY' ? (
              <motion.div 
                key={`day-${activeDay}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="grid grid-cols-1 gap-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Today's Deep Dive */}
                  <div className="space-y-4">
                    {currentDaySessions.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card 
                          className={`relative p-8 bg-white/[0.03] backdrop-blur-xl border-slate-800/50 overflow-hidden group transition-all duration-700 ${done.has(item.id) ? 'opacity-40 grayscale-[0.8]' : 'hover:border-indigo-500/50 hover:bg-white/[0.06] shadow-[0_0_40px_rgba(0,0,0,0.3)]'}`}
                        >
                          {/* Animated Background Glow */}
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-10 transition duration-700 blur" />
                          
                          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
                            <Activity className="w-32 h-32 text-indigo-400" />
                          </div>
                          
                          <div className="relative z-10 flex flex-col md:flex-row gap-8">
                            <div className="flex-1 space-y-6">
                              <div className="flex items-center gap-4">
                                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                                  <span className="text-4xl block">{item.emoji}</span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{item.sessionType}</span>
                                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span 
                                      className="text-[9px] px-2 py-0.5 rounded-sm font-black uppercase tracking-widest bg-slate-800/50"
                                      style={{ color: intensityColors[item.intensity] }}
                                    >
                                      {item.intensity}
                                    </span>
                                  </div>
                                  <h4 className="text-2xl font-black text-white tracking-tight">{item.activity}</h4>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2 text-slate-400 bg-slate-800/30 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                    <span className="text-[11px] font-black uppercase tracking-wider">{item.duration}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-400 bg-slate-800/30 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-[11px] font-black uppercase tracking-wider">+{item.xp} XP</span>
                                  </div>
                                </div>
                                
                                <div className="p-5 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-2xl border border-indigo-500/10 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <Shield className="w-8 h-8 text-indigo-400" />
                                  </div>
                                  <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    Physiological Suitability
                                  </h5>
                                  <p className="text-[13px] text-slate-400 leading-relaxed italic font-medium">
                                    {item.suitability}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="md:w-56 flex flex-col justify-center items-center gap-4 md:border-l md:border-slate-800/50 md:pl-8">
                              {!done.has(item.id) ? (
                                <button
                                  onClick={() => handleMarkDone(item)}
                                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-black uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_30px_rgba(79,70,229,0.4)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 overflow-hidden relative group/btn"
                                >
                                  <span className="relative z-10 flex items-center justify-center gap-2">
                                    Log Session <CheckCircle2 className="w-4 h-4" />
                                  </span>
                                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                                </button>
                              ) : (
                                <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500">
                                  <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                                  </div>
                                  <span className="text-[10px] font-black text-green-400 uppercase tracking-[0.3em]">Completed</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Sidebar Tip & Safety */}
                  <div className="space-y-6">
                    <Card className="bg-slate-900/60 backdrop-blur-xl border-indigo-500/10 p-8 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/40" />
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Sparkles className="w-20 h-20 text-indigo-400" />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                            Source: Movement Science AI
                          </div>
                        </div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-amber-400" /> Research Note
                        </h4>
                        <div className="space-y-4">
                          {currentDaySessions.map((s, i) => (
                            <div key={i} className="flex gap-4 items-start group">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                              <p className="text-sm text-slate-300 leading-relaxed font-medium group-hover:text-white transition-colors">
                                {s.tip}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>

                    <Card className="bg-red-500/[0.03] backdrop-blur-sm border-red-500/20 p-8 border-l-4 border-l-red-500/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                          <ShieldAlert className="w-5 h-5 text-red-400" />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest italic">Safety Protocol</h4>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-[0.1em] font-bold opacity-80">
                        {plan.safetyWarning}
                      </p>
                    </Card>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative"
              >
                {/* Visual Connector Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500/20 via-indigo-500/50 to-indigo-500/20 hidden lg:block -translate-y-1/2 opacity-20" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 relative z-10">
                  {Object.entries(plan.dailyExercises).map(([day, sessions], dayIdx) => {
                    const dayNum = parseInt(day.split(' ')[1]);
                    const isToday = dayNum === defaultDayIndex;
                    const isDone = sessions.every(s => done.has(s.id));
                    const progress = (sessions.filter(s => done.has(s.id)).length / sessions.length) * 100;
                    const totalXP = sessions.reduce((acc, s) => acc + s.xp, 0);
                    const totalMin = sessions.reduce((acc, s) => acc + parseInt(s.duration), 0);
                    
                    return (
                      <Card 
                        key={day} 
                        onClick={() => { setActiveDay(dayNum); setViewMode('TODAY'); }}
                        className={`relative group cursor-pointer transition-all duration-500 border-slate-800 hover:border-indigo-500/50 overflow-hidden ${isToday ? 'bg-indigo-500/10 ring-1 ring-indigo-500/30' : 'bg-slate-900/40 hover:bg-slate-900/80'}`}
                      >
                        {/* Day Progress Bar at Top */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-green-500"
                          />
                        </div>

                        <div className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isToday ? 'text-indigo-400' : 'text-slate-500'}`}>
                                {isToday ? 'ACTIVE NOW' : `PHASE 0${dayNum}`}
                              </h4>
                              <p className="text-xs font-black text-white uppercase mt-1">
                                {getWeekdayName(dayNum).slice(0, 3)}
                              </p>
                            </div>
                            {isDone ? (
                              <div className="p-1 bg-green-500/10 rounded-full">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              </div>
                            ) : isToday ? (
                              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            {sessions.map(item => (
                              <div key={item.id} className="flex items-center gap-2 group/item">
                                <span className="text-sm grayscale group-hover/item:grayscale-0 transition-all">{item.emoji}</span>
                                <span className={`text-[10px] truncate flex-1 font-bold ${done.has(item.id) ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                                  {item.activity}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center text-[9px] font-black uppercase tracking-tighter">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-500" /> {totalXP} XP
                            </span>
                            <span className="text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-indigo-400" /> {totalMin}m
                            </span>
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* XP Chart */}
        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Performance Analytics
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e1b2e', border: '1px solid #6366f133', borderRadius: '12px' }}
                  itemStyle={{ fontSize: 11, fontWeight: 'bold' }}
                  labelStyle={{ display: 'none' }}
                />
                <Bar dataKey="xp" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isToday ? '#6366f1' : '#1e293b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </main>
  );
}
