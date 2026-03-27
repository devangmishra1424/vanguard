'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dumbbell, 
  AlertCircle, 
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ExercisePage() {
  const { exerciseFlags } = useStore();

  const tier = exerciseFlags.includes('ANEMIA_LIGHT') ? 'Light' : 
               exerciseFlags.includes('LIVER_RESTRICTED') ? 'Moderate' : 'Active';

  const plan = [
    { day: 'Day 1', activity: 'Leisurely Walking', duration: '20 min', intensity: 'Low' },
    { day: 'Day 2', activity: 'Soft Stretching', duration: '15 min', intensity: 'Very Low' },
    { day: 'Day 3', activity: 'Gentle Yoga', duration: '30 min', intensity: 'Low' },
    { day: 'Day 4', activity: 'Rest / Light Walk', duration: '15 min', intensity: 'Low' },
    { day: 'Day 5', activity: 'Deep Breathing', duration: '20 min', intensity: 'Very Low' },
  ];

  // Assuming 'routine' object is available for 'routine.timing'
  // For this edit, I'll define a placeholder for 'routine'
  const routine = { timing: 'Morning/Evening' };

  return (
    <main className="min-h-screen bg-[#0F172A] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div className="mb-10">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{t('safety_first')}</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Safety-Tiered Recovery</p>
        </div>
          <Card className="bg-slate-900 border-slate-800 p-4 border-l-4 border-l-[#f59e0b]">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Recommended Tier</span>
            <p className="text-2xl font-bold text-white">{tier}</p>
          </Card>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Warning/Guideline */}
          <div className="md:col-span-1 space-y-6">
            <Card className="bg-red-500/10 border-red-500/20 p-6">
              <div className="flex gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-200">Safety First</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Your current ferritin/hemoglobin levels suggest low oxygen persistence. Avoid high-intensity cardio or heavy weightlifting until follow-up.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-900 border-slate-800 p-6">
              <h4 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#f59e0b]" /> {t('best_timing')}: {routine.timing}
              </h4>
              <p className="text-sm text-slate-400">
                Early morning or late evening is best to avoid heat exhaustion. Stop immediately if you feel dizzy.
              </p>
            </Card>
          </div>

          {/* Weekly Plan */}
          <div className="md:col-span-2">
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-slate-200 uppercase tracking-widest text-sm">5-Day Recovery Routine</h3>
              </div>
              <div className="divide-y divide-slate-800">
                {plan.map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 flex items-center justify-between hover:bg-slate-800/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full border border-slate-700 flex items-center justify-center text-xs font-bold text-[#f59e0b]">
                        {item.day}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{item.activity}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          {item.intensity} Intensity
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
                      <Clock className="w-4 h-4" />
                      {item.duration}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="p-6 bg-slate-800/30 flex justify-center">
                <Button variant="ghost" className="text-sm text-slate-500 hover:text-white uppercase tracking-widest font-bold">
                  View Full 4-Week Plan
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
