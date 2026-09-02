import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  glow?: boolean;
  glowColor?: 'purple' | 'cyan' | 'gold' | 'red' | 'green';
  hover?: boolean;
  onClick?: () => void;
}

const glowMap: Record<string, string> = {
  purple: 'hover:shadow-purple-500/30',
  cyan: 'hover:shadow-cyan-500/30',
  gold: 'hover:shadow-amber-500/30',
  red: 'hover:shadow-red-500/30',
  green: 'hover:shadow-green-500/30',
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glass = false,
  glow = false,
  glowColor = 'purple',
  hover = false,
  onClick,
}) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
      className={`
        rounded-2xl
        ${glass ? 'glass' : 'bg-[#111827] border border-white/8'}
        ${glow ? `shadow-xl ${glowMap[glowColor]}` : ''}
        ${hover ? 'cursor-pointer transition-all duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  suffix?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color = '#6C63FF', suffix }) => (
  <div className="glass rounded-xl p-4 flex flex-col gap-1">
    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
      {icon && <span>{icon}</span>}
      {label}
    </div>
    <div className="text-2xl font-heading font-bold" style={{ color }}>
      {value}{suffix && <span className="text-sm ml-1 text-slate-400">{suffix}</span>}
    </div>
  </div>
);

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, color = '#6C63FF', className = '' }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${className}`}
    style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
  >
    {children}
  </span>
);
