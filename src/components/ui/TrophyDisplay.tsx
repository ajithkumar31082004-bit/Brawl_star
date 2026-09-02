import React from 'react';
import { motion } from 'framer-motion';

interface TrophyDisplayProps {
  trophies: number;
  highest?: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const TrophyDisplay: React.FC<TrophyDisplayProps> = ({
  trophies,
  highest,
  size = 'md',
  animated = true,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-base font-bold',
    md: 'text-2xl sm:text-3xl font-black',
    lg: 'text-3xl sm:text-5xl font-black',
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2">
        <motion.span
          animate={animated ? { rotate: [-4, 4, -4], scale: [1, 1.05, 1] } : undefined}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-amber-400 select-none"
        >
          🏆
        </motion.span>
        <span
          className={`font-heading text-amber-400 tracking-wide text-glow-gold ${sizeStyles[size]}`}
        >
          {trophies.toLocaleString()}
        </span>
      </div>
      {highest && (
        <span className="text-[11px] text-slate-500 font-medium mt-0.5">
          Highest: <strong className="text-slate-300">{highest.toLocaleString()}</strong>
        </span>
      )}
    </div>
  );
};
