'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { calculateVitalityScore, getBiomarkerTrend, getAvailableBiomarkers, getVitalityTrend } from '@/lib/vitalsEngine';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceArea
} from 'recharts';
import { 
  TrendingUp, 
  History, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  Database,
  Search,
  ChevronRight,
  ShieldAlert,
  Plus,
  Activity,
  Calendar,
  Settings2,
  X,
  Zap,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { getVitalReferenceRange } from '@/lib/vitalsEngine';

export default function VitalsVault() {
  const { reportHistory, dailyVitals, logDailyVital, setReportData, t } = useStore();
  const [selectedBiomarker, setSelectedBiomarker] = useState<string>('');
  const [showLogModal, setShowLogModal] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<'BIOMARKER' | 'VITALITY'>('VITALITY');

  // Form State
  const [vitalType, setVitalType] = useState<'BP_SYS' | 'BP_DIA' | 'HR' | 'WEIGHT'>('BP_SYS');
  const [vitalValue, setVitalValue] = useState<string>('');

  const history = useMemo(() => reportHistory || [], [reportHistory]);
  const vitals = useMemo(() => dailyVitals || [], [dailyVitals]);
  
  const availableBiomarkers = useMemo(() => 
    getAvailableBiomarkers(history, vitals), 
    [history, vitals]
  );

  // Set default biomarker if none selected
  useMemo(() => {
    if (!selectedBiomarker && availableBiomarkers.length > 0) {
      const priority = availableBiomarkers.find(b => 
        b.toLowerCase().includes('hemoglobin') || b.toLowerCase().includes('systolic')
      );
      setSelectedBiomarker(priority || availableBiomarkers[0]);
    }
  }, [availableBiomarkers, selectedBiomarker]);

  const trendData = useMemo(() => 
    selectedBiomarker ? getBiomarkerTrend(history, vitals, selectedBiomarker) : [], 
    [history, vitals, selectedBiomarker]
  );

  const overallTrend = useMemo(() => 
    getVitalityTrend(history),
    [history]
  );

  const activeTrendData = chartMode === 'VITALITY' ? overallTrend : trendData;

  const momentum = useMemo(() => {
    if (activeTrendData.length < 2) return 0;
    const last = activeTrendData[activeTrendData.length - 1].value || 0;
    const prev = activeTrendData[activeTrendData.length - 2].value || 0;
    return last - prev;
  }, [activeTrendData]);

  const referenceRange = useMemo(() => 
    getVitalReferenceRange(selectedBiomarker), 
    [selectedBiomarker]
  );

  const latestReport = history[0];
  const vitalityScore = useMemo(() => 
    latestReport ? calculateVitalityScore(latestReport.labValues) : 0, 
    [latestReport]
  );

  const previousReport = history[1];
  const previousScore = useMemo(() => 
    previousReport ? calculateVitalityScore(previousReport.labValues) : 0, 
    [previousReport]
  );

  const handleLogVital = () => {
    if (!vitalValue) return;
    const units: Record<string, string> = { 'BP_SYS': 'mmHg', 'BP_DIA': 'mmHg', 'HR': 'bpm', 'WEIGHT': 'kg' };
    logDailyVital({
      id: Math.random().toString(36).substring(7),
      date: new Date().toISOString(),
      type: vitalType,
      value: parseFloat(vitalValue),
      unit: units[vitalType]
    });
    setVitalValue('');
    setShowLogModal(false);
  };

  const handleRestore = (report: any) => {
    setReportData({
      reportText: report.reportText,
      labValues: report.labValues,
      summary: report.summary
    });
    alert('Historical context restored to Dashboard.');
  };

  const scoreDelta = vitalityScore - previousScore;

  if (history.length === 0) {
    return (
      <main className="min-h-screen bg-[#0f111a] text-slate-100 p-6 pb-32 flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md space-y-6"
        >
          <div className="w-24 h-24 bg-slate-900 rounded-3xl border border-slate-800 flex items-center justify-center mx-auto shadow-2xl">
            <Database className="w-10 h-10 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Vitals Vault is Empty</h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Upload your first medical report to begin building your historical health journey.
          </p>
          <a href="/" className="inline-block mt-4 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-sm">
            Upload Now
          </a>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f111a] text-slate-100 p-6 pb-32">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter flex items-center gap-3">
              <Database className="w-8 h-8 text-indigo-500" /> Vitals Vault
            </h1>
            <p className="text-slate-500 font-bold mt-1 text-sm uppercase tracking-[0.2em]">
              Your Historical Health Archive
            </p>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setShowLogModal(true)}
               className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 group"
             >
               <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Log Vital
             </button>
             <div className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-2 hidden md:flex">
                <History className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-black text-slate-300 uppercase">{history.length + vitals.length} Logs</span>
             </div>
          </div>
        </header>

        {/* Log Modal */}
        <AnimatePresence>
          {showLogModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowLogModal(false)}
                  className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <Activity className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Manual Log</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Metric Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'BP_SYS', label: 'Systolic' },
                        { id: 'BP_DIA', label: 'Diastolic' },
                        { id: 'HR', label: 'Heart Rate' },
                        { id: 'WEIGHT', label: 'Weight' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setVitalType(t.id as any)}
                          className={`px-3 py-2 text-[10px] font-black rounded-lg border transition-all ${vitalType === t.id ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Value</label>
                    <input 
                      type="number" 
                      value={vitalValue}
                      onChange={(e) => setVitalValue(e.target.value)}
                      placeholder="Enter numeric value..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-black placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <button 
                    onClick={handleLogVital}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    Save Log <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Vitality Index Card */}
          <Card className="bg-slate-900 border-slate-800 p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-24 h-24 text-indigo-500" />
            </div>
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6">Current Vitality Index</h3>
            <div className="flex items-end gap-3">
              <span className="text-6xl font-black text-white">{vitalityScore}</span>
              <div className="pb-2">
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${scoreDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {scoreDelta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(scoreDelta)} Points
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">vs last report</div>
              </div>
            </div>
            <div className="mt-6 h-2 bg-slate-800 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${vitalityScore}%` }}
                 className="h-full bg-gradient-to-r from-indigo-600 to-purple-500"
               />
            </div>
          </Card>

          {/* Biomarker Trend Card */}
          <Card className="md:col-span-2 bg-[#171923] border-slate-800 p-6 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                     <TrendingUp className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                     <h3 className="text-sm font-black text-white uppercase tracking-tight">
                       {chartMode === 'VITALITY' ? 'Overall Vitality Journey' : 'Biomarker Detail'}
                     </h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                       {chartMode === 'VITALITY' ? 'Tracking: Health Score' : `Tracking: ${selectedBiomarker}`}
                     </p>
                  </div>
               </div>
               
               <div className="flex items-center gap-3">
                 <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg mr-2">
                    <button 
                      onClick={() => setChartMode('VITALITY')}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-md transition-all ${chartMode === 'VITALITY' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Vitality
                    </button>
                    <button 
                      onClick={() => setChartMode('BIOMARKER')}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-md transition-all ${chartMode === 'BIOMARKER' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Detail
                    </button>
                 </div>

                 <AnimatePresence>
                   {chartMode === 'BIOMARKER' && (
                     <motion.select 
                       initial={{ opacity: 0, x: 10 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: 10 }}
                       value={selectedBiomarker}
                       onChange={(e) => setSelectedBiomarker(e.target.value)}
                       className="bg-slate-900 border border-slate-800 text-[10px] font-black uppercase text-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer pr-10 bg-no-repeat bg-[right_0.75rem_center]"
                       style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 5 3 3 3-3'/%3E%3C/svg%3E")` }}
                     >
                       {availableBiomarkers.map(b => (
                         <option key={b} value={b}>{b}</option>
                       ))}
                     </motion.select>
                   )}
                 </AnimatePresence>
               </div>
            </div>

            <div className="h-[200px] w-full relative">
              {momentum !== 0 && (
                <div className={`absolute top-0 right-0 px-3 py-1 rounded-full border text-[10px] font-black uppercase flex items-center gap-1 z-10 ${momentum > 0 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {momentum > 0 ? <Zap className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                  {momentum > 0 ? 'Improving' : 'Attention Needed'}
                </div>
              )}
              
              {activeTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeTrendData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartMode === 'VITALITY' ? '#6366f1' : '#f59e0b'} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={chartMode === 'VITALITY' ? '#6366f1' : '#f59e0b'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="displayDate" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <YAxis 
                      hide
                      domain={chartMode === 'VITALITY' ? [0, 100] : ['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}
                      cursor={{ stroke: '#6366f133', strokeWidth: 2 }}
                    />
                    {chartMode === 'BIOMARKER' && referenceRange && (
                       <ReferenceArea 
                         y1={referenceRange.min} 
                         y2={referenceRange.max} 
                         fill="#10b981" 
                         fillOpacity={0.05} 
                         strokeDasharray="3 3"
                       />
                    )}
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={chartMode === 'VITALITY' ? '#6366f1' : '#f59e0b'} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                   <ShieldAlert className="w-6 h-6 text-slate-600 mb-2" />
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest max-w-[200px]">
                     {chartMode === 'VITALITY' 
                       ? 'Upload your first reports to see your vitality journey.' 
                       : `Log more data for "${selectedBiomarker}" to unlock trend mapping.`}
                   </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Timeline */}
        <section className="space-y-6">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <History className="w-4 h-4" /> Historical Timeline
          </h3>
          
          <div className="space-y-4">
            {history.map((report, idx) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="space-y-4">
                  <Card 
                    onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
                    className={`bg-slate-900/40 border-slate-800 hover:border-indigo-500/30 p-5 transition-all group cursor-pointer relative ${expandedReportId === report.id ? 'border-indigo-500/40 ring-1 ring-indigo-500/20 shadow-2xl' : ''}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-center leading-none">
                              <span className="text-[10px] font-black text-slate-500 uppercase">{new Date(report.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                              <span className="text-lg font-black text-slate-200">{new Date(report.date).getDate()}</span>
                          </div>
                          <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase">Archive #{history.length - idx}</span>
                                <span className="text-[10px] font-bold text-slate-500">{new Date(report.date).toLocaleDateString('en-US', { year: 'numeric' })}</span>
                              </div>
                              <h4 className="text-sm font-bold text-white leading-tight line-clamp-1">{report.summary.slice(0, 80)}...</h4>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden md:block">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vitals Tracked</p>
                              <p className="text-xs font-bold text-slate-300">{report.labValues.length} Biomarkers</p>
                          </div>
                          <div className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 transition-all ${expandedReportId === report.id ? 'rotate-90 bg-indigo-600' : ''}`}>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                          </div>
                        </div>
                    </div>
                  </Card>

                  <AnimatePresence>
                    {expandedReportId === report.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <Card className="bg-slate-900/60 border-slate-800 ml-6 md:ml-16 p-6 space-y-6 relative">
                          <div className="absolute top-4 right-4 flex gap-2">
                             <button 
                               onClick={() => handleRestore(report)}
                               className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all flex items-center gap-2 text-[9px] font-black uppercase"
                               title="Restore Context"
                             >
                               <RotateCcw className="w-3.5 h-3.5" /> Restore
                             </button>
                             <a 
                               href="/"
                               className="p-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-lg transition-all flex items-center gap-2 text-[9px] font-black uppercase"
                             >
                               Full Analysis <ArrowUpRight className="w-3.5 h-3.5" />
                             </a>
                          </div>

                          <div>
                            <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Detailed Lab Values</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {report.labValues.map((v, i) => (
                                <div key={i} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 flex justify-between items-center group/item hover:border-slate-700 transition-all">
                                  <div>
                                    <p className="text-[11px] font-black text-slate-200 uppercase">{v.name}</p>
                                    <p className="text-[9px] text-slate-500 font-bold">{v.referenceRange}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-black text-white">{v.value} <span className="text-[9px] text-slate-500">{v.unit}</span></p>
                                    <span className={`text-[8px] font-black uppercase ${v.status === 'NORMAL' ? 'text-green-500' : 'text-amber-500'}`}>{v.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
