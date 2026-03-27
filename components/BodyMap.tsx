'use client';

import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';

export const BodyMap = () => {
  const { organFlags } = useStore();

  const organs = [
    { id: 'brain', path: 'M12,2C7.58,2,4,5.58,4,10c0,3.31,2.02,6.15,4.9,7.4C8.6,18.5,9,19.5,9,20c0,1.1,0.9,2,2,2s2-0.9,2-2c0-0.5,0.4-1.5,0.1-2.6 c2.88-1.25,4.9-4.09,4.9-7.4C18,5.58,14.42,2,12,2z', label: 'Brain' },
    { id: 'heart', path: 'M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z', label: 'Heart' },
    { id: 'liver', path: 'M21,11c0-1.66-1.34-3-3-3s-3,1.34-3,3s1.34,3,3,3S21,12.66,21,11z M4,11c0,1.66,1.34,3,3,3s3-1.34,3-3s-1.34-3-3-3 S4,9.34,4,11z M12,15c-1.66,0-3,1.34-3,3s1.34,3,3,3s3-1.34,3-3S13.66,15,12,15z', label: 'Liver' },
    { id: 'blood', path: 'M12,2c-5.33,4.55-8,8.48-8,11.8c0,4.98,3.8,8.2,8,8.2s8-3.22,8-8.2C20,10.48,17.33,5.55,12,2z', label: 'Blood' },
    { id: 'bones', path: 'M17,10c0-2.76-2.24-5-5-5s-5,2.24-5,5s2.24,5,5,5S17,12.76,17,10z M12,17c-3.31,0-6,2.69-6,6h12C18,19.69,15.31,17,12,17z', label: 'Bones' },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 24 24" className="w-full h-full fill-slate-800 stroke-slate-700 stroke-1">
          {organs.map((organ) => {
            const isActive = organFlags.some(f => f.toLowerCase().includes(organ.id));
            return (
              <motion.path
                key={organ.id}
                d={organ.path}
                initial={{ fill: '#1e293b' }}
                animate={{ 
                  fill: isActive ? '#f59e0b' : '#1e293b',
                  scale: isActive ? 1.1 : 1,
                  opacity: isActive ? 1 : 0.5
                }}
                className={isActive ? 'organ-pulse' : ''}
                transition={{ duration: 0.5 }}
              />
            );
          })}
        </svg>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {organFlags.map(flag => (
          <span key={flag} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase font-bold tracking-widest">
            {flag}
          </span >
        ))}
        {organFlags.length === 0 && <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">All Clear</span>}
      </div>
    </div>
  );
};
