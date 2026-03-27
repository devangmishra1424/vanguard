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
    loggedExercises,
    exerciseXP,
    xpHistory,
    addExerciseXP,
    logExercise,
    resetDailyProgress,
    t,
  } = useStore();

  const [done, setDone] = useState<Set<string>>(new Set());
  const [dangerMsg, setDangerMsg] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const plan = getExercisePlan(exerciseFlags);

  // XP Chart — last 7 days
  const today = new Date().toISOString().slice(0, 10);
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const label =
      key === today
        ? 'Today'
        : d.toLocaleDateString('en-IN', { weekday: 'short' });
    const hist = xpHistory.find((h) => h.date === key);
    return { day: label, xp: hist?.exerciseXP ?? 0, isToday: key === today };
  });

  const exerciseXPToday = xpHistory.find((h) => h.date === today)?.exerciseXP ?? 0;
  const xpGoal = 100;
  const xpPct = Math.min(100, Math.round((exerciseXPToday / xpGoal) * 100));

  const totalXP = plan.items.reduce((s, i) => s + i.xp, 0);

  const handleMarkDone = (item: ExerciseItem) => {
    // Check for danger
    const warn = getDangerWarning(item.activity, exerciseFlags);
    if (warn) {
      setDangerMsg(warn);
    }

    if (done.has(item.id)) return; // idempotent

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
      colors: ['#f59e0b', '#fbbf24', '#ffffff'],
    });
  };

  const completedCount = done.size;
  const totalCount = plan.items.length;

  return (
    <main className="min-h-screen bg-[#0F172A] p-4 md:p-8">
      <AnimatePresence>
        {dangerMsg && (
          <DangerModal message={dangerMsg} onClose={() => setDangerMsg(null)} />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
              Move <span style={{ color: plan.tierColor }}>Smart</span>
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">
              {t('safety_first')} · Safety-Tiered Recovery
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Tier badge */}
            <Card className="bg-slate-900 border-slate-800 px-4 py-2 border-l-4" style={{ borderLeftColor: plan.tierColor }}>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Tier</span>
              <span className="text-lg font-black text-white">{plan.tierLabel}</span>
            </Card>
            {/* XP bar */}
            <Card className="bg-slate-900 border-slate-800 px-5 py-3 min-w-[200px]">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#f59e0b]" /> Daily Exercise XP
                </span>
                <span className="text-[#f59e0b] font-bold text-sm">{exerciseXPToday}/{xpGoal}</span>
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
        </div>

        {/* Progress summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Completed', value: `${completedCount}/${totalCount}`, icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, color: 'text-green-400' },
            { label: 'XP Earned Today', value: exerciseXPToday, icon: <Star className="w-5 h-5 text-[#f59e0b]" />, color: 'text-[#f59e0b]' },
            { label: 'Week Potential', value: `${totalXP} XP`, icon: <Flame className="w-5 h-5 text-orange-500" />, color: 'text-orange-500' },
          ].map(({ label, value, icon, color }) => (
            <Card key={label} className="bg-slate-900 border-slate-800 p-4 flex items-center gap-3">
              {icon}
              <div>
                <p className={`text-lg font-black ${color}`}>{value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar: Warning + Timing */}
          <div className="space-y-4">
            <Card className="bg-red-500/10 border-red-500/20 p-5">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">Safety First</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {plan.safetyWarning}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-900 border-slate-800 p-5">
              <h4 className="font-bold text-slate-300 text-sm flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#f59e0b]" /> Best Timing
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">{plan.bestTiming}</p>
            </Card>

            <Card className="bg-slate-900 border-slate-800 p-5">
              <h4 className="font-bold text-slate-300 text-sm flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-blue-400" /> Avoid These
              </h4>
              <div className="space-y-1.5">
                {exerciseFlags.includes('ANEMIA_LIGHT') && ['Heavy lifting', 'HIIT', 'Sprinting', 'High-intensity cardio'].map((e) => (
                  <div key={e} className="flex items-center gap-2 text-xs text-red-400">
                    <X className="w-3 h-3" /> {e}
                  </div>
                ))}
                {exerciseFlags.includes('LIVER_RESTRICTED') && ['Heavy lifting', 'Marathon runs', 'HIIT circuits', 'Fasted exercise'].map((e) => (
                  <div key={e} className="flex items-center gap-2 text-xs text-red-400">
                    <X className="w-3 h-3" /> {e}
                  </div>
                ))}
                {!exerciseFlags.includes('ANEMIA_LIGHT') && !exerciseFlags.includes('LIVER_RESTRICTED') && (
                  <p className="text-xs text-slate-500">Listen to your body. Stop if you feel pain.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Main: 7-Day Plan */}
          <div className="md:col-span-2">
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-[#f59e0b]" />
                  <h3 className="font-black text-slate-200 uppercase tracking-widest text-sm">
                    7-Day Recovery Plan
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {completedCount}/{totalCount} done
                </span>
              </div>

              <div className="divide-y divide-slate-800">
                {plan.items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className={`p-5 flex items-center justify-between gap-4 transition-colors ${
                      done.has(item.id)
                        ? 'bg-green-500/5 border-l-2 border-l-green-500'
                        : 'hover:bg-slate-800/20'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="text-2xl flex-shrink-0">{item.emoji}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-200 text-sm">{item.activity}</p>
                          <XPChip xp={item.xp} />
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> {item.duration}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${intensityColors[item.intensity]}20`, color: intensityColors[item.intensity] }}>
                            {item.intensity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug">{item.tip}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkDone(item)}
                      disabled={done.has(item.id)}
                      className={`flex-shrink-0 px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                        done.has(item.id)
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                          : 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/20'
                      }`}
                    >
                      {done.has(item.id) ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Done
                        </span>
                      ) : (
                        'Mark Done'
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* XP Progress Chart */}
        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#f59e0b]" /> 7-Day Exercise XP Progress
          </h3>
          {isMounted && (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }}
                    labelStyle={{ color: '#94a3b8' }}
                    itemStyle={{ color: '#f59e0b' }}
                  />
                  <Bar dataKey="xp" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isToday ? '#f59e0b' : '#334155'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Today's Exercise Log */}
        {loggedExercises.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-400" /> Today's Completed
            </h3>
            <div className="flex flex-wrap gap-2">
              {loggedExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs text-slate-200 font-semibold">{ex.activity}</span>
                  <span className="text-[10px] text-[#f59e0b] font-bold">+{ex.xpEarned} XP</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
