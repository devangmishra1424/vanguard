'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Zap, Trophy, Heart, Shield } from 'lucide-react';



export default function AvatarPage() {
  const { xp, level } = useStore();

  const milestones = [
    { title: 'First Upload', completed: true, xp: 50 },
    { title: 'Checklist Champ', completed: xp > 100, xp: 20 },
    { title: 'Chat Master', completed: xp > 150, xp: 10 },
    { title: 'Wellness Warrior', completed: xp > 300, xp: 100 },
  ];

  return (
    <main className="min-h-screen bg-[#0F172A] p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Avatar Side */}
          <div className="flex flex-col items-center space-y-8">
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div className="w-64 h-64 rounded-full bg-orange-500/10 border-4 border-[#f59e0b] flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden relative">
                <span className="text-9xl grayscale-0">👨‍⚕️</span>
                {/* Health Bar Overlay */}
                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#0F172A] to-transparent">
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${xp % 100}%` }}
                      className="h-full bg-[#f59e0b]"
                    />
                  </div>
                </div>
              </div>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-4 -right-4 w-12 h-12 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center"
              >
                <Zap className="w-6 h-6 text-yellow-500" />
              </motion.div>
            </motion.div>

            <div className="text-center">
              <Badge variant="outline" className="text-[#f59e0b] border-[#f59e0b] mb-2 uppercase tracking-widest p-2">
                Level {level} Raahat Guardian
              </Badge>
              <h3 className="text-4xl font-bold text-white mb-2">{xp} <span className="text-slate-500 text-2xl font-normal">XP</span></h3>
              <p className="text-slate-400 text-sm">Earn more XP by following your checklist and diet!</p>
            </div>
          </div>

          {/* Stats Side */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-slate-900 border-slate-800 p-6 flex flex-col items-center">
                <Heart className="w-8 h-8 text-red-500 mb-2" />
                <span className="text-2xl font-bold text-white">82%</span>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Vitality</span>
              </Card>
              <Card className="bg-slate-900 border-slate-800 p-6 flex flex-col items-center">
                <Shield className="w-8 h-8 text-blue-500 mb-2" />
                <span className="text-2xl font-bold text-white">Lvl {level}</span>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Resilience</span>
              </Card>
            </div>

            <Card className="bg-slate-900 border-slate-800 p-6">
              <h4 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#f59e0b]" />
                Recent Milestones
              </h4>
              <div className="space-y-3">
                {milestones.map((m, i) => (
                  <div key={i} className={`p-4 rounded-xl border flex items-center justify-between ${m.completed ? 'bg-orange-500/5 border-orange-500/20' : 'bg-slate-800/20 border-slate-800 opacity-40'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${m.completed ? 'bg-[#f59e0b]' : 'bg-slate-700'}`} />
                      <span className={`text-sm font-medium ${m.completed ? 'text-slate-200' : 'text-slate-500'}`}>{m.title}</span>
                    </div>
                    <span className="text-xs font-mono text-[#f59e0b]">+{m.xp} XP</span>
                  </div>
                ))}
              </div>
            </Card>

            <Button className="w-full bg-[#f59e0b] hover:bg-orange-600 text-white h-14 text-lg gap-2">
              Sync to HealthConnect <Zap className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
