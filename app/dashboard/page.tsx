'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Download, 
  FileText, 
  Globe, 
  MessageSquare, 
  ShieldCheck, 
  Stethoscope, 
  Target,
  TrendingUp,
  Clock,
  Waves
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LabTable } from '@/components/LabTable';
import { BodyMap } from '@/components/BodyMap';
import { Checklist } from '@/components/Checklist';
import { DoctorChat } from '@/components/DoctorChat';
import { 
  RadialBarChart, 
  RadialBar, 
  ResponsiveContainer, 
  PolarAngleAxis 
} from 'recharts';
import TypewriterText from '@/components/TypewriterText';

export default function Dashboard() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { 
    reportText, 
    language, 
    summary, 
    hindiSummary, 
    jargonMap, 
    ai_confidence_score,
    toggleLanguage,
    xp,
    level,
    t
  } = useStore();

  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] pb-32 pt-10 px-6 font-sans">
      <DoctorChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      {/* Header Info */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tight">{t('health')} <span className="text-[#f59e0b]">RAAHAT</span></h2>
          <p className="text-slate-400 font-medium">{t('dashboard_subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setIsChatOpen(true)}
            className="bg-[#f59e0b] hover:bg-orange-600 text-white gap-2 shadow-lg shadow-orange-500/20 font-bold px-6 py-6 rounded-2xl transition-all hover:scale-105 active:scale-95"
          >
            <MessageSquare className="w-5 h-5" />
            {t('talk_to_doctor')}
          </Button>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black leading-none mb-1">{t('patient_level')} {level}</span>
            <div className="w-32 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${xp % 100}%` }}
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              />
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        {/* Card A: Report Source */}
        <motion.div variants={item} className="md:col-span-4 h-full">
          <Card className="h-full bg-slate-900/50 border-slate-800 p-6 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-2 mb-4 text-slate-400">
              <FileText className="w-4 h-4" />
              <h3 className="font-bold text-xs uppercase tracking-widest">{t('report_source')}</h3>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono relative z-10">
                {reportText ? reportText.substring(0, 500) + '...' : 'No report data loaded.'}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Card B: AI Doctor Explanation */}
        <motion.div variants={item} className="md:col-span-5 h-full">
          <Card className="h-full bg-slate-900 border-slate-800 p-8 shadow-xl shadow-black/50 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#f59e0b] to-transparent opacity-50" />
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3 text-[#f59e0b]">
                <ShieldCheck className="w-6 h-6" />
                <h3 className="font-black text-sm uppercase tracking-[0.2em]">{t('doctor_explanation')}</h3>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleLanguage}
                className="border-slate-800 hover:bg-slate-800 text-[#f59e0b] h-9 gap-2 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all active:scale-95"
              >
                <Globe className="w-3.5 h-3.5" />
                {language === 'EN' ? t('translate_to_hindi') : t('switch_to_english')}
              </Button>
            </div>
            <div className="min-h-[140px] text-slate-200 text-lg font-medium leading-loose">
              <TypewriterText text={language === 'EN' ? summary : hindiSummary} speed={15} />
            </div>
          </Card>
        </motion.div>

        {/* Card C: Body Map */}
        <motion.div variants={item} className="md:col-span-3 h-full">
          <Card className="bg-slate-900/50 border-slate-800 p-6 h-full flex flex-col items-center hover:border-slate-700 transition-colors cursor-default shadow-lg">
            <div className="flex self-start items-center gap-2 mb-6 text-slate-400">
              <Activity className="w-4 h-4 text-rose-500" />
              <h3 className="font-bold text-xs uppercase tracking-widest">{t('affected_areas')}</h3>
            </div>
            <div className="flex-1 w-full flex items-center justify-center py-4">
              <BodyMap />
            </div>
          </Card>
        </motion.div>

        {/* Card D: Lab Table (Full Width) */}
        <motion.div variants={item} className="md:col-span-9 h-full">
          <Card className="h-full bg-slate-950 border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/20">
              <div className="flex items-center gap-3 text-[#f59e0b]">
                <Target className="w-5 h-5" />
                <h3 className="font-black text-sm uppercase tracking-[0.2em]">{t('lab_parameters')}</h3>
              </div>
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-bold uppercase tracking-widest text-[9px] px-3 py-1">
                Clinical Sync Active
              </Badge>
            </div>
            <div className="p-6">
              <LabTable />
            </div>
          </Card>
        </motion.div>

        {/* Card E: AI Confidence & Action Plan Container */}
        <div className="md:col-span-3 grid grid-rows-2 gap-6 h-full">
          {/* AI Confidence */}
          <motion.div variants={item} className="h-full">
            <Card className="bg-slate-900 border-slate-800 p-6 flex flex-col items-center justify-center h-full relative group">
              <div className="absolute top-4 left-4">
                 <h3 className="font-bold text-[9px] uppercase tracking-[0.3em] text-slate-500">{t('ai_confidence')}</h3>
              </div>
              <div className="w-full h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    innerRadius="70%" 
                    outerRadius="100%" 
                    data={[{ name: 'Confidence', value: ai_confidence_score, fill: '#f59e0b' }]} 
                    startAngle={180} 
                    endAngle={-180}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={15} />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-3xl font-black">
                      {ai_confidence_score}%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Action Plan */}
          <motion.div variants={item} className="h-full">
            <Card className="h-full bg-slate-900 border-slate-800 p-6 shadow-inner">
              <div className="flex items-center gap-3 mb-6 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-black text-sm uppercase tracking-[0.2em]">{t('action_plan')}</h3>
              </div>
              <Checklist />
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="fixed bottom-10 right-10 flex flex-col items-end opacity-20 hover:opacity-100 transition-opacity cursor-default hidden xl:flex">
         <span className="text-[10px] font-black tracking-[0.5em] text-white">RAAHAT HEALTH CORE</span>
         <span className="text-[8px] text-slate-500">VERSION 2.1.0 • FLAN-T5 ENABLED</span>
      </div>
    </div>
  );
}
