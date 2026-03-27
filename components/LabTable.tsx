'use client';

import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Loader2 } from 'lucide-react';

export const LabTable = () => {
  const { labValues, language, t, setReportData } = useStore();
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // For each lab value, if layman explanation is missing for current language, fetch it
    const fetchExplanations = async () => {
      const updatedValues = [...labValues];
      let changed = false;

      for (let i = 0; i < updatedValues.length; i++) {
        const v = updatedValues[i];
        const key = language === 'EN' ? 'layman_en' : 'layman_hi';
        
        if (!v[key as keyof typeof v]) {
          setLoadingMap(prev => ({ ...prev, [v.name]: true }));
          try {
            const res = await fetch('/api/layman', {
              method: 'POST',
              body: JSON.stringify({ test: v.name, value: v.value, status: v.status, lang: language })
            });
            const data = await res.json();
            if (data.explanation) {
              (updatedValues[i] as any)[key] = data.explanation;
              changed = true;
            }
          } catch (e) {
            console.error(e);
          }
          setLoadingMap(prev => ({ ...prev, [v.name]: false }));
        }
      }

      if (changed) {
        setReportData({ labValues: updatedValues });
      }
    };

    if (labValues.length > 0) {
      fetchExplanations();
    }
  }, [labValues, language, setReportData]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-800/50">
          <TableRow>
            <TableHead className="text-slate-300 font-bold">{language === 'EN' ? 'Test' : 'जांच'}</TableHead>
            <TableHead className="text-slate-300 font-bold text-center">{language === 'EN' ? 'Result' : 'परिणाम'}</TableHead>
            <TableHead className="text-slate-300 font-bold">{language === 'EN' ? 'Status' : 'स्थिति'}</TableHead>
            <TableHead className="text-slate-300 font-bold">{language === 'EN' ? 'Simplified Finding' : 'सरल व्याख्या'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {labValues.map((row, i) => (
            <TableRow key={i} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
              <TableCell className="font-medium text-slate-200">{row.name}</TableCell>
              <TableCell className="text-center text-slate-300">
                <span className="font-mono">{row.value}</span> <span className="text-[10px] text-slate-500">{row.unit}</span>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={`
                    ${row.status === 'NORMAL' ? 'border-green-500/50 text-green-400 bg-green-500/5' : ''}
                    ${row.status === 'HIGH' ? 'border-red-500/50 text-red-400 bg-red-500/5' : ''}
                    ${row.status === 'LOW' ? 'border-orange-500/50 text-orange-400 bg-orange-500/5' : ''}
                  `}
                >
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs transition-all">
                <div className="flex items-start gap-2">
                  <Info className="w-3 h-3 text-[#f59e0b] mt-1 shrink-0" />
                  <div className="text-xs text-slate-400 leading-relaxed italic">
                    {loadingMap[row.name] ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Generating...</span>
                      </div>
                    ) : (
                      language === 'EN' ? row.layman_en : row.layman_hi
                    ) || 'Processing...'}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
