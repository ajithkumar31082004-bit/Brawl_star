import React from 'react';
import { motion } from 'framer-motion';
import { useSound } from '../../hooks/useSound';

interface GameButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'gold' | 'cyan' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const variants: Record<string, string> = {
  primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/30 border border-purple-400/30',
  secondary: 'bg-white/10 hover:bg-white/15 text-white border border-white/20 shadow-md',
  gold: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-500/40 border border-yellow-300/50',
  cyan: 'bg-gradient-to-r from-cyan-400 to-teal-500 hover:from-cyan-300 hover:to-teal-400 text-black shadow-lg shadow-cyan-500/40 border border-cyan-300/50',
  danger: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/30 border border-red-400/30',
  ghost: 'bg-transparent hover:bg-white/10 text-slate-300 hover:text-white border border-white/10',
};

const sizes: Record<string, string> = {
  sm: 'px-3.5 py-1.5 text-xs rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-8 py-3.5 text-base rounded-2xl',
  xl: 'px-10 py-4.5 text-lg sm:text-xl rounded-2xl',
};

export const GameButton: React.FC<GameButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = false,
  icon,
}) => {
  const { playSound } = useSound();

  const handleClick = () => {
    if (disabled) return;
    playSound('click');
    onClick?.();
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      whileHover={disabled ? {} : { scale: 1.04, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.96, y: 1 }}
      className={`
        font-heading font-black tracking-wider uppercase
        flex items-center justify-center gap-2 select-none
        transition-all duration-150 cursor-pointer
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed filter grayscale' : ''}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
};
