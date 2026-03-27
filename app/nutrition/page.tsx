'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import { Apple, Leaf, Zap, Info } from 'lucide-react';

export default function NutritionPage() {
  const { dietaryFlags, labValues } = useStore();

  const radarData = [
    { subject: 'Iron', A: 80, fullMark: 100 },
    { subject: 'Calcium', A: 65, fullMark: 100 },
    { subject: 'Vit D', A: 45, fullMark: 100 },
    { subject: 'Protein', A: 90, fullMark: 100 },
    { subject: 'B12', A: 70, fullMark: 100 },
    { subject: 'Folate', A: 85, fullMark: 100 },
  ];

  const foodCards = [
    { name: 'Spinach', icon: '🥬', benefit: 'High Iron', tags: ['Anemia', 'Veg'] },
    { name: 'Chana', icon: '🫘', benefit: 'Protein & Fiber', tags: ['Liver', 'Veg'] },
    { name: 'Bajra', icon: '🌾', benefit: 'Magnesium', tags: ['Heart', 'Veg'] },
    { name: 'Turmeric', icon: '🫚', benefit: 'Anti-inflammatory', tags: ['Liver', 'Healing'] },
    { name: 'Almonds', icon: '🫘', benefit: 'Vitamin E', tags: ['Skin', 'Brain'] },
    { name: 'Amla', icon: '🟢', benefit: 'Vitamin C', tags: ['Immunity', 'Absorption'] },
  ];

  return (
    <main className="min-h-screen bg-[#0F172A] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{t('nutrient_targets')}</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Daily Optimization</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Radar Chart */}
          <Card className="bg-slate-900/50 border-slate-800 p-8 flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-6 text-slate-200 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Nutrient Targets
            </h3>
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Level"
                    dataKey="A"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-slate-500 mt-4 text-center">
              Visualizing your micronutrient levels relative to optimal ranges.
            </p>
          </Card>

          {/* Food Recommendations */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
              <Apple className="w-5 h-5 text-orange-500" />
              Top Healing Foods
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {foodCards.map((food, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="bg-slate-900 border-slate-800 p-4 hover:border-orange-500/50 transition-all cursor-pointer group">
                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{food.icon}</div>
                    <h4 className="font-bold text-slate-200">{food.name}</h4>
                    <p className="text-xs text-[#f59e0b] mt-1">{food.benefit}</p>
                    <div className="flex gap-1 mt-3">
                      {food.tags.map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">{t}</span>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="bg-orange-500/10 border-orange-500/20 p-6">
              <div className="flex gap-4">
                <Leaf className="w-8 h-8 text-green-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-200">Pro-Tip for Absorption</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Combine Iron-rich foods (like Spinach) with Vitamin C (like Amla or Lemon) to maximize absorption. Avoid tea/coffee with meals.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
