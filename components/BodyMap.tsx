'use client';

import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';

// Maps organ id → { label, color when active }
const ORGAN_COLORS: Record<string, string> = {
  blood: '#ef4444',    // red
  liver: '#f59e0b',    // amber
  kidney: '#8b5cf6',   // violet
  heart: '#ec4899',    // pink
  thyroid: '#06b6d4',  // cyan
  brain: '#10b981',    // emerald
  bones: '#64748b',    // slate
};

const ORGAN_LABELS: Record<string, string> = {
  blood: 'Blood / Anemia',
  liver: 'Liver',
  kidney: 'Kidney',
  heart: 'Heart / Lipids',
  thyroid: 'Thyroid',
  brain: 'Brain / Neuro',
  bones: 'Bones',
};

export const BodyMap = () => {
  const { organFlags } = useStore();

  const activeOrgans = organFlags.map(f => f.toLowerCase());

  const isActive = (id: string) => activeOrgans.some(f => f.includes(id));

  const organGlow = (id: string) => isActive(id) ? ORGAN_COLORS[id] || '#f59e0b' : '#1e293b';
  const organStroke = (id: string) => isActive(id) ? (ORGAN_COLORS[id] || '#f59e0b') : '#334155';

  return (
    <div className="w-full flex flex-col items-center justify-center p-4 gap-4">
      {/* Human Body SVG – 100x220 viewBox, anatomically positioned organs */}
      <div className="relative">
        <svg viewBox="0 0 100 220" className="w-32 h-72" xmlns="http://www.w3.org/2000/svg">
          {/* ── BODY SILHOUETTE ───────────────────────────────────── */}
          {/* Head */}
          <circle cx="50" cy="18" r="14" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
          {/* Neck */}
          <rect x="44" y="30" width="12" height="10" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
          {/* Torso */}
          <rect x="28" y="40" width="44" height="70" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
          {/* Left Arm */}
          <rect x="13" y="42" width="14" height="52" rx="7" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
          {/* Right Arm */}
          <rect x="73" y="42" width="14" height="52" rx="7" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
          {/* Pelvis */}
          <ellipse cx="50" cy="114" rx="22" ry="10" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
          {/* Left Leg */}
          <rect x="30" y="120" width="16" height="68" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
          {/* Right Leg */}
          <rect x="54" y="120" width="16" height="68" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />

          {/* ── ORGAN HOTSPOTS ──────────────────────────────────────── */}

          {/* BRAIN – top of head */}
          <motion.circle
            cx="50" cy="14" r="8"
            fill={organGlow('brain')} stroke={organStroke('brain')} strokeWidth="1"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: isActive('brain') ? [0.8, 1, 0.8] : 0.25, scale: isActive('brain') ? [1, 1.08, 1] : 1 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* THYROID – neck */}
          <motion.ellipse
            cx="50" cy="35" rx="5" ry="3"
            fill={organGlow('thyroid')} stroke={organStroke('thyroid')} strokeWidth="1"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: isActive('thyroid') ? [0.8, 1, 0.8] : 0.25, scale: isActive('thyroid') ? [1, 1.10, 1] : 1 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* HEART – left-centre of torso */}
          <motion.path
            d="M44,52 C44,49 47,47 50,50 C53,47 56,49 56,52 C56,57 50,62 50,62 C50,62 44,57 44,52 Z"
            fill={organGlow('heart')} stroke={organStroke('heart')} strokeWidth="1"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: isActive('heart') ? [0.8, 1, 0.8] : 0.25, scale: isActive('heart') ? [1, 1.12, 1] : 1 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* LIVER – right side of torso */}
          <motion.ellipse
            cx="58" cy="75" rx="10" ry="8"
            fill={organGlow('liver')} stroke={organStroke('liver')} strokeWidth="1"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: isActive('liver') ? [0.8, 1, 0.8] : 0.25, scale: isActive('liver') ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* KIDNEY – both sides, lower torso */}
          <motion.ellipse
            cx="40" cy="88" rx="6" ry="8"
            fill={organGlow('kidney')} stroke={organStroke('kidney')} strokeWidth="1"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: isActive('kidney') ? [0.8, 1, 0.8] : 0.25, scale: isActive('kidney') ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.ellipse
            cx="60" cy="88" rx="6" ry="8"
            fill={organGlow('kidney')} stroke={organStroke('kidney')} strokeWidth="1"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: isActive('kidney') ? [0.8, 1, 0.8] : 0.25, scale: isActive('kidney') ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* BLOOD – veins illustrated as pelvis + legs overlay */}
          <motion.ellipse
            cx="50" cy="113" rx="18" ry="7"
            fill={organGlow('blood')} stroke={organStroke('blood')} strokeWidth="1"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: isActive('blood') ? [0.5, 0.85, 0.5] : 0.15, scale: isActive('blood') ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* BONES – skeleton overlay on legs */}
          <motion.rect
            x="34" y="122" width="8" height="60" rx="4"
            fill={organGlow('bones')} stroke={organStroke('bones')} strokeWidth="1" opacity={0.5}
            initial={{ opacity: 0.15 }}
            animate={{ opacity: isActive('bones') ? [0.5, 0.8, 0.5] : 0.15 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.rect
            x="58" y="122" width="8" height="60" rx="4"
            fill={organGlow('bones')} stroke={organStroke('bones')} strokeWidth="1" opacity={0.5}
            initial={{ opacity: 0.15 }}
            animate={{ opacity: isActive('bones') ? [0.5, 0.8, 0.5] : 0.15 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>

        {/* Tooltip labels for active organs */}
        {activeOrgans.map((organ, i) => (
          <motion.div
            key={organ}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="absolute right-[-90px] text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
            style={{
              top: `${20 + i * 22}%`,
              backgroundColor: `${ORGAN_COLORS[organ] || '#f59e0b'}18`,
              borderColor: `${ORGAN_COLORS[organ] || '#f59e0b'}50`,
              color: ORGAN_COLORS[organ] || '#f59e0b',
            }}
          >
            {ORGAN_LABELS[organ] || organ}
          </motion.div>
        ))}
      </div>

      {/* Badges below */}
      <div className="flex flex-wrap gap-2 justify-center">
        {organFlags.length === 0 && (
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">All Clear</span>
        )}
        {organFlags.map(flag => (
          <span
            key={flag}
            className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-widest border"
            style={{
              backgroundColor: `${ORGAN_COLORS[flag.toLowerCase()] || '#f59e0b'}15`,
              borderColor: `${ORGAN_COLORS[flag.toLowerCase()] || '#f59e0b'}45`,
              color: ORGAN_COLORS[flag.toLowerCase()] || '#f59e0b',
            }}
          >
            {ORGAN_LABELS[flag.toLowerCase()] || flag}
          </span>
        ))}
      </div>
    </div>
  );
};
