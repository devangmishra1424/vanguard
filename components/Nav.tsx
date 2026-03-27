'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  LayoutDashboard, 
  Apple, 
  Dumbbell, 
  User,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';

export const Nav = () => {
  const pathname = usePathname();
  const { t } = useStore();

  const links = [
    { href: '/', icon: Home, label: t('home') },
    { href: '/dashboard', icon: LayoutDashboard, label: t('health') },
    { href: '/nutrition', icon: Apple, label: t('diet') },
    { href: '/exercise', icon: Dumbbell, label: t('move') },
    { href: '/avatar', icon: User, label: t('me') },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-2 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex items-center gap-1">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link key={link.href} href={link.href}>
            <div className={`relative px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              <link.icon className="w-5 h-5" />
              {isActive && (
                <motion.span 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  className="text-xs font-bold uppercase tracking-widest whitespace-nowrap overflow-hidden"
                >
                  {link.label}
                </motion.span>
              )}
              {isActive && (
                <motion.div 
                  layoutId="active-nav"
                  className="absolute inset-0 bg-[#f59e0b]/20 border border-[#f59e0b]/30 rounded-xl z-[-1]"
                />
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
};
