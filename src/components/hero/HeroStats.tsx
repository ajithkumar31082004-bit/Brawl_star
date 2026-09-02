import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Zap, Wind, Target, Shield } from 'lucide-react';
import type { Hero } from '../../data/heroes';

interface HeroStatsProps {
  hero: Hero;
  color?: string;
  className?: string;
}

const STAT_CONFIG = [
  { key: 'health', label: 'HEALTH', max: 10000, color: '#10B981', icon: <Heart className="w-4 h-4" /> },
  { key: 'attack', label: 'ATTACK', max: 1500, color: '#EF4444', icon: <Zap className="w-4 h-4" /> },
  { key: 'speed', label: 'SPEED', max: 100, color: '#F59E0B', icon: <Wind className="w-4 h-4" /> },
  { key: 'range', label: 'RANGE', max: 100, color: '#00D9FF', icon: <Target className="w-4 h-4" /> },
  { key: 'superCharge', label: 'SUPER CHARGE', max: 100, color: '#A855F7', icon: <Shield className="w-4 h-4" /> },
];

export const HeroStats: React.FC<HeroStatsProps> = ({ hero, className = '' }) => {
  return (
    <div className={`space-y-3.5 ${className}`}>
      {STAT_CONFIG.map((stat) => {
        const val = (hero as unknown as Record<string, number>)[stat.key] || 0;
        const pct = Math.min(100, (val / stat.max) * 100);

        return (
          <div key={stat.key} className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-32 flex-shrink-0">
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <span className="text-slate-300 text-xs font-heading font-bold tracking-wider">
                {stat.label}
              </span>
            </div>

            <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${stat.color}88, ${stat.color})`,
                  boxShadow: `0 0 10px ${stat.color}60`,
                }}
              />
            </div>

            <span
              className="font-heading font-bold text-xs sm:text-sm w-16 text-right"
              style={{ color: stat.color }}
            >
              {val.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
};
