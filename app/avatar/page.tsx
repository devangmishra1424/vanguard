'use client';

import React, { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Trophy, Heart, Shield, Flame, Brain, Leaf, TrendingUp } from 'lucide-react';

export default function AvatarPage() {
  const { xp, level } = useStore();

  // Level progression: Every 100 XP = 1 level
  const currentLevel = Math.floor(xp / 100) + 1;
  const xpForCurrentLevel = (currentLevel - 1) * 100;
  const xpForNextLevel = currentLevel * 100;
  const xpProgress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  // Character stats scaling with level
  const stats = useMemo(() => ({
    health: Math.min(100, 80 + currentLevel * 2),
    vitality: Math.min(100, 70 + currentLevel * 3),
    resilience: Math.min(100, 60 + currentLevel * 2.5),
    wellness: Math.min(100, 75 + currentLevel * 1.5),
  }), [currentLevel]);

  // Achievements/Milestones
  const achievements = [
    { title: '🏥 Lab Analyst', description: 'Upload first report', xpRequired: 0, icon: '📋' },
    { title: '💪 Health Tracker', description: 'Complete 5 checklists', xpRequired: 100, icon: '✅' },
    { title: '🧠 Diet Master', description: 'Follow diet plan 10 days', xpRequired: 200, icon: '🥗' },
    { title: '⚡ Wellness Warrior', description: 'Reach Level 5', xpRequired: 400, icon: '🏆' },
    { title: '🎯 Perfect Score', description: 'All vitals normal', xpRequired: 600, icon: '⭐' },
  ];

  const unlockedAchievements = achievements.filter(a => xp >= a.xpRequired);

  const roles = [
    { name: 'Health Guardian', level: 1, description: 'Your wellness protector' },
    { name: 'Medical Analyst', level: 2, description: 'Lab report expert' },
    { name: 'Wellness Champion', level: 4, description: 'Multi-system optimizer' },
    { name: 'Health Legend', level: 6, description: 'Master of vitality' },
  ];

  const currentRole = roles.find(r => r.level <= currentLevel) || roles[0];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            Character Profile
          </h1>
          <p className="text-slate-400 text-lg">Your health journey as an RPG adventure</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Main Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar Display */}
            <Card className="bg-gradient-to-b from-slate-800 to-slate-900 border-orange-500/30 overflow-hidden relative">
              <div className="relative aspect-square flex items-center justify-center bg-gradient-to-br from-orange-900/20 via-slate-900 to-slate-950 overflow-hidden">
                {/* Animated background glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent" />
                
                {/* Avatar */}
                <div className="relative z-10 text-9xl drop-shadow-2xl">
                  👨‍⚕️
                </div>

                {/* Level Badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg px-4 py-2 shadow-lg">
                  <span className="text-white font-black text-2xl">Lv. {currentLevel}</span>
                </div>

                {/* Role / Class */}
                <div className="absolute bottom-0 left-0 right-0 pt-8 pb-6 px-4 bg-gradient-to-t from-slate-950 to-transparent">
                  <div className="text-center">
                    <h2 className="text-2xl font-black text-orange-400 mb-1">{currentRole.name}</h2>
                    <p className="text-sm text-slate-400">{currentRole.description}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* XP Progress Bar */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-300">EXPERIENCE</span>
                  <span className="text-sm font-mono text-orange-400">{xp} / {xpForNextLevel} XP</span>
                </div>
                <div className="relative h-6 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    style={{ width: `${xpProgress}%` }}
                    className="h-full bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 rounded-full shadow-lg transition-all duration-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white drop-shadow-lg">{Math.floor(xpProgress)}%</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  {xpForNextLevel - xp} XP until Level {currentLevel + 1}
                </p>
              </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gradient-to-br from-red-900/20 to-red-900/5 border-red-500/30 p-4 text-center">
                <Heart className="w-5 h-5 text-red-500 mx-auto mb-2" />
                <div className="text-xl font-black text-red-400">{Math.round(stats.health)}%</div>
                <div className="text-xs text-slate-400 font-bold uppercase">Health</div>
              </Card>
              <Card className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border-blue-500/30 p-4 text-center">
                <Shield className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                <div className="text-xl font-black text-blue-400">{Math.round(stats.resilience)}%</div>
                <div className="text-xs text-slate-400 font-bold uppercase">Resilience</div>
              </Card>
            </div>
          </div>

          {/* Middle Column: Stats & Attributes */}
          <div className="lg:col-span-1 space-y-6">
            {/* Main Stats */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                ATTRIBUTES
              </h3>
              <div className="space-y-5">
                {/* Health */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-slate-300">Health</span>
                    <span className="text-sm font-mono text-orange-400">{Math.round(stats.health)}</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${stats.health}%` }}
                      className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Vitality */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-slate-300">Vitality</span>
                    <span className="text-sm font-mono text-orange-400">{Math.round(stats.vitality)}</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${stats.vitality}%` }}
                      className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Resilience */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-slate-300">Resilience</span>
                    <span className="text-sm font-mono text-orange-400">{Math.round(stats.resilience)}</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${stats.resilience}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Wellness */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-slate-300">Wellness</span>
                    <span className="text-sm font-mono text-orange-400">{Math.round(stats.wellness)}</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${stats.wellness}%` }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Level Milestones */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                LEVEL RANKS
              </h3>
              <div className="space-y-3">
                {roles.map((role, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-lg border transition-all ${currentLevel >= role.level ? 'bg-orange-500/10 border-orange-500/50' : 'bg-slate-900/30 border-slate-700 opacity-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-200">{role.name}</span>
                      <span className={`text-xs font-mono font-bold ${currentLevel >= role.level ? 'text-orange-400' : 'text-slate-600'}`}>
                        Lv. {role.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{role.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Achievements */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                ACHIEVEMENTS
              </h3>
              <div className="space-y-3">
                {achievements.map((ach, i) => {
                  const unlocked = xp >= ach.xpRequired;
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-lg border transition-all ${unlocked ? 'bg-yellow-500/10 border-yellow-500/50 cursor-pointer hover:bg-yellow-500/15' : 'bg-slate-900/30 border-slate-700 opacity-60'}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{ach.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-200">{ach.title}</div>
                          <p className="text-xs text-slate-500 mt-1">{ach.description}</p>
                          <div className="text-xs text-slate-600 mt-2 font-mono">
                            Req: {ach.xpRequired} XP {unlocked && '✓'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400 text-center">
                  <span className="font-bold text-orange-400">{unlockedAchievements.length}</span> of {achievements.length} achievements unlocked
                </p>
              </div>
            </Card>

            {/* Call to Action */}
            <Button className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg shadow-lg gap-2">
              <Flame className="w-5 h-5" />
              Continue Your Journey
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
