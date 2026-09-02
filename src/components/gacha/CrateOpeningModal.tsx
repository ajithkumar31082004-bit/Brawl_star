import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../../hooks/useSound';
import { useAuthStore } from '../../store/authStore';

export interface CrateReward {
  type: 'coins' | 'gems' | 'powerpoints' | 'hero';
  title: string;
  amount?: number;
  heroName?: string;
  heroEmoji?: string;
  heroClass?: string;
  heroRarity?: string;
  icon: string;
  color: string;
}

interface CrateOpeningModalProps {
  crateName?: string;
  crateType?: 'brawl_box' | 'big_box' | 'mega_box';
  isOpen: boolean;
  onClose: () => void;
}

export const CrateOpeningModal: React.FC<CrateOpeningModalProps> = ({
  crateName = 'STAR MEGA CRATE',
  crateType = 'mega_box',
  isOpen,
  onClose,
}) => {
  const { playSound } = useSound();
  const { user, addCoins, addGems } = useAuthStore();

  const [step, setStep] = useState<'closed' | 'opening' | 'revealing' | 'done'>('closed');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rewards list
  const [rewards] = useState<CrateReward[]>([
    { type: 'coins', title: 'Coins', amount: 240, icon: '🪙', color: '#F59E0B' },
    { type: 'powerpoints', title: 'Power Points (VOLT)', amount: 65, icon: '⚡', color: '#3B82F6' },
    { type: 'powerpoints', title: 'Power Points (TITAN)', amount: 45, icon: '🛡️', color: '#10B981' },
    { type: 'gems', title: 'Gems', amount: 15, icon: '💎', color: '#00D9FF' },
    { type: 'hero', title: 'NEW HERO!', heroName: 'FROST', heroEmoji: '❄️', heroClass: 'Controller', heroRarity: 'Super Rare', icon: '❄️', color: '#06B6D4' },
  ]);

  if (!isOpen) return null;

  const handleBoxClick = () => {
    playSound('click');
    setStep('revealing');
    setCurrentIndex(0);
    playSound('crystal');
  };

  const handleNextCard = () => {
    if (currentIndex < rewards.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextReward = rewards[nextIdx];

      if (nextReward.type === 'hero') {
        playSound('victory');
      } else {
        playSound('crystal');
      }
    } else {
      // Award to player
      addCoins(240);
      addGems(15);
      setStep('done');
      playSound('select');
    }
  };

  const currentReward = rewards[currentIndex];
  const itemsRemaining = rewards.length - currentIndex;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl select-none">
      {/* Background glow effects */}
      <div className="absolute w-96 h-96 rounded-full bg-purple-600/20 blur-3xl animate-pulse pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center max-w-lg w-full text-center">
        {step === 'closed' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="font-heading font-black text-2xl sm:text-3xl text-white text-glow-gold mb-2">
              {crateName}
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mb-8">Tap the box to open and reveal your rewards!</p>

            {/* Shaking 3D Crate Box */}
            <motion.div
              animate={{
                rotate: [-3, 3, -3],
                scale: [1, 1.06, 1],
                y: [-8, 0, -8],
              }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
              onClick={handleBoxClick}
              className="w-44 h-44 sm:w-52 sm:h-52 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-purple-800 p-1 flex items-center justify-center cursor-pointer shadow-2xl shadow-amber-500/50 border-4 border-yellow-300"
            >
              <div className="w-full h-full rounded-2xl bg-[#0f1629] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="text-6xl sm:text-7xl filter drop-shadow-2xl mb-1 animate-bounce">
                  🎁
                </div>
                <span className="font-heading font-black text-xs text-amber-400 tracking-wider">
                  TAP TO OPEN!
                </span>
                <div className="absolute bottom-2 right-2 glass px-2 py-0.5 rounded-full text-[10px] font-bold text-cyan-300">
                  5 ITEMS
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {step === 'revealing' && currentReward && (
          <motion.div
            key={currentIndex}
            initial={{ scale: 0.4, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 200 }}
            onClick={handleNextCard}
            className="flex flex-col items-center cursor-pointer w-full"
          >
            {/* Items Left Counter */}
            <div className="glass px-4 py-1.5 rounded-full text-xs font-heading font-black text-amber-400 border border-amber-500/30 mb-6 animate-pulse">
              {itemsRemaining} {itemsRemaining === 1 ? 'ITEM LEFT' : 'ITEMS REMAINING'}
            </div>

            {/* Reward Card */}
            {currentReward.type === 'hero' ? (
              // EPIC NEW HERO UNLOCKED
              <div className="relative w-72 sm:w-80 rounded-3xl p-6 bg-gradient-to-b from-amber-500/30 via-[#111827] to-[#0a0e1a] border-2 border-yellow-400 shadow-2xl shadow-amber-500/50 flex flex-col items-center">
                <div className="absolute -top-3 px-4 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-heading font-black text-xs rounded-full shadow-lg">
                  ★ NEW HERO UNLOCKED! ★
                </div>
                <div className="text-8xl my-4 filter drop-shadow-2xl animate-bounce">
                  {currentReward.heroEmoji}
                </div>
                <h3 className="font-heading font-black text-3xl text-white mb-1 tracking-wider text-glow-gold">
                  {currentReward.heroName}
                </h3>
                <div className="flex gap-2 text-xs font-bold font-heading mb-4">
                  <span className="text-cyan-400">{currentReward.heroClass}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-blue-400">{currentReward.heroRarity}</span>
                </div>
                <div className="text-[11px] text-slate-400 text-center mb-2">
                  Added to your hero collection!
                </div>
              </div>
            ) : (
              // Standard Resource Card
              <div
                className="w-64 sm:w-72 rounded-3xl p-6 bg-[#111827] border-2 shadow-2xl flex flex-col items-center"
                style={{ borderColor: currentReward.color }}
              >
                <div className="text-7xl my-3 filter drop-shadow-lg">
                  {currentReward.icon}
                </div>
                <div
                  className="font-heading font-black text-4xl mb-1"
                  style={{ color: currentReward.color }}
                >
                  +{currentReward.amount}
                </div>
                <h4 className="font-heading font-bold text-sm text-slate-300">
                  {currentReward.title}
                </h4>
              </div>
            )}

            <p className="text-slate-500 text-xs font-heading tracking-widest mt-8 animate-pulse">
              TAP ANYWHERE TO CONTINUE ►
            </p>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="text-6xl mb-3">🎉</div>
            <h3 className="font-heading font-black text-3xl text-white mb-2 text-glow-cyan">
              CRATE COMPLETED!
            </h3>
            <p className="text-slate-400 text-sm mb-6">All rewards have been added to your account.</p>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 w-full">
              <div className="glass p-3 rounded-2xl border border-amber-500/20 text-center">
                <span className="text-xl">🪙</span>
                <div className="font-heading font-black text-amber-400 text-sm mt-0.5">+240</div>
                <div className="text-[10px] text-slate-500">Coins</div>
              </div>
              <div className="glass p-3 rounded-2xl border border-blue-500/20 text-center">
                <span className="text-xl">⚡</span>
                <div className="font-heading font-black text-blue-400 text-sm mt-0.5">+65</div>
                <div className="text-[10px] text-slate-500">Volt PP</div>
              </div>
              <div className="glass p-3 rounded-2xl border border-cyan-500/20 text-center">
                <span className="text-xl">💎</span>
                <div className="font-heading font-black text-cyan-400 text-sm mt-0.5">+15</div>
                <div className="text-[10px] text-slate-500">Gems</div>
              </div>
              <div className="glass p-3 rounded-2xl border border-purple-500/20 text-center">
                <span className="text-xl">❄️</span>
                <div className="font-heading font-black text-cyan-400 text-sm mt-0.5">FROST</div>
                <div className="text-[10px] text-slate-500">New Hero</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-10 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-heading font-black text-base rounded-2xl shadow-xl cursor-pointer hover:brightness-110"
            >
              COLLECT & RETURN
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
