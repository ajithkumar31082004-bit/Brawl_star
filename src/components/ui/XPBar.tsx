import React from 'react';
import { motion } from 'framer-motion';

interface XPBarProps {
  current: number;
  max: number;
  level?: number;
  showLevel?: boolean;
  className?: string;
}

export const XPBar: React.FC<XPBarProps> = ({
  current,
  max,
  level,
  showLevel = false,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between text-xs font-semibold mb-1">
        {showLevel && level !== undefined ? (
          <span className="text-purple-300 font-heading font-bold">LEVEL {level}</span>
        ) : (
          <span className="text-slate-400 font-heading font-medium">PROGRESS</span>
        )}
        <span className="text-slate-400 font-mono">
          <strong className="text-white">{current.toLocaleString()}</strong> / {max.toLocaleString()} XP
        </span>
      </div>
      <div className="h-3 bg-[#0f1629] rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 shadow-md shadow-cyan-500/40"
        />
      </div>
    </div>
  );
};
