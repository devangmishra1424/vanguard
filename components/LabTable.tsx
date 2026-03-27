'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

export const LabTable = () => {
  const { labValues, language } = useStore();

  // Explanations are now pre-populated in CLINICAL_DB within analyze-report/route.ts
  // No extra fetch needed – layman_en is baked into the labValues array

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
                    {(language === 'EN' ? (row as any).layman_en : (row as any).layman_hi) || '–'}
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
