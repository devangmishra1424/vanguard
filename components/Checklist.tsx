'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export const Checklist = () => {
  const { checklist, toggleChecklistItem, addXP } = useStore();

  const handleToggle = (id: string, completed: boolean) => {
    toggleChecklistItem(id);
    if (!completed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#ffffff']
      });
      addXP(10);
    }
  };

  return (
    <div className="space-y-4">
      {checklist.map((item) => (
        <motion.div 
          key={item.id}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors group"
        >
          <Checkbox 
            id={item.id} 
            checked={item.completed} 
            onCheckedChange={() => handleToggle(item.id, item.completed)}
            className="mt-1 border-slate-700 data-[state=checked]:bg-[#f59e0b] data-[state=checked]:border-[#f59e0b]"
          />
          <label 
            htmlFor={item.id}
            className={`text-sm leading-relaxed transition-all cursor-pointer ${item.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}
          >
            {item.task}
          </label>
        </motion.div>
      ))}
      {checklist.length === 0 && (
        <div className="text-center py-10">
          <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">No tasks generated yet</p>
        </div>
      )}
    </div>
  );
};
