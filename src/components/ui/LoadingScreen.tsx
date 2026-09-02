import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  text?: string;
  tip?: string;
}

const TIPS = [
  'Energy Crystals spawn at the center every few seconds!',
  'Coordinate with your team to protect the crystal carrier!',
  'Charging your Super ability can turn the tide of battle!',
  'Use bushes and cover to ambush your opponents!',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  text = 'ENTERING THE ARENA...',
  tip,
}) => {
  const displayTip = tip || TIPS[Math.floor(Math.random() * TIPS.length)];

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0e1a] flex flex-col items-center justify-center p-6 select-none">
      {/* Background glow */}
      <div className="absolute w-96 h-96 rounded-full bg-purple-600/15 blur-3xl animate-pulse pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
        {/* Logo */}
        <div className="font-heading font-black text-3xl sm:text-4xl text-white text-glow-cyan mb-8">
          BATTLE<span className="text-[#00D9FF]">VERSE</span>
        </div>

        {/* Animated spinner ring */}
        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="w-full h-full rounded-full border-4 border-cyan-500/20 border-t-cyan-400 border-r-purple-500"
          />
          <span className="absolute text-2xl animate-bounce">⚡</span>
        </div>

        {/* Text */}
        <h3 className="font-heading font-black text-lg text-white tracking-widest uppercase mb-2">
          {text}
        </h3>

        {/* Tip */}
        <p className="text-slate-400 text-xs mt-4 glass p-3 rounded-xl border border-white/10">
          💡 <span className="text-slate-300 font-medium">{displayTip}</span>
        </p>
      </div>
    </div>
  );
};
