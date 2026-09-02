import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Check, Lock, Star } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSound } from '../hooks/useSound';
import { CrateOpeningModal } from '../components/gacha/CrateOpeningModal';

interface Milestone {
  trophies: number;
  type: 'hero' | 'mode' | 'crate' | 'coins' | 'gems';
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  claimed: boolean;
}

export const TrophyRoad: React.FC = () => {
  const { user, addCoins, addGems } = useAuthStore();
  const { playSound } = useSound();
  const [openCrate, setOpenCrate] = useState(false);

  const playerTrophies = user?.trophies || 12540;

  const [milestones, setMilestones] = useState<Milestone[]>([
    { trophies: 50, type: 'coins', title: '150 Coins', subtitle: 'Starter Bonus', icon: '🪙', color: '#F59E0B', claimed: true },
    { trophies: 100, type: 'hero', title: 'BUSTER', subtitle: 'New Rare Hero', icon: '👊', color: '#F59E0B', claimed: true },
    { trophies: 250, type: 'mode', title: 'SURVIVAL MODE', subtitle: 'Solo / Duo Showdown', icon: '💀', color: '#EF4444', claimed: true },
    { trophies: 500, type: 'crate', title: 'MEGA CRATE', subtitle: 'Guaranteed 5 Items', icon: '🎁', color: '#8B5CF6', claimed: true },
    { trophies: 1000, type: 'hero', title: 'FROST', subtitle: 'Super Rare Controller', icon: '❄️', color: '#06B6D4', claimed: true },
    { trophies: 1500, type: 'coins', title: '500 Coins', subtitle: 'Currency Drop', icon: '🪙', color: '#F59E0B', claimed: true },
    { trophies: 2000, type: 'hero', title: 'TITAN', subtitle: 'Epic Armored Tank', icon: '🛡️', color: '#10B981', claimed: true },
    { trophies: 3000, type: 'hero', title: 'ROCKET', subtitle: 'Super Rare Artillery', icon: '🚀', color: '#F97316', claimed: true },
    { trophies: 5000, type: 'crate', title: 'OMEGA CRATE', subtitle: 'Rare Hero Chance', icon: '🌟', color: '#EC4899', claimed: true },
    { trophies: 7500, type: 'gems', title: '50 Gems', subtitle: 'Premium Currency', icon: '💎', color: '#00D9FF', claimed: true },
    { trophies: 10000, type: 'hero', title: 'VOLT', subtitle: 'Epic Assassin', icon: '⚡', color: '#3B82F6', claimed: true },
    { trophies: 12500, type: 'crate', title: 'STAR MEGA CRATE', subtitle: 'Legendary Drops', icon: '🎁', color: '#F59E0B', claimed: false },
    { trophies: 15000, type: 'hero', title: 'BLAZE', subtitle: 'Legendary Champion', icon: '🔥', color: '#EF4444', claimed: false },
    { trophies: 20000, type: 'gems', title: '150 Gems', subtitle: 'Master Tier Reward', icon: '💎', color: '#00D9FF', claimed: false },
  ]);

  const handleClaim = (index: number) => {
    const m = milestones[index];
    if (m.claimed || playerTrophies < m.trophies) return;

    playSound('victory');
    setMilestones(prev => {
      const updated = [...prev];
      updated[index].claimed = true;
      return updated;
    });

    if (m.type === 'crate') {
      setOpenCrate(true);
    } else if (m.type === 'coins') {
      addCoins(500);
    } else if (m.type === 'gems') {
      addGems(50);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <CrateOpeningModal isOpen={openCrate} onClose={() => setOpenCrate(false)} />

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-xs font-heading font-black text-amber-400 border border-amber-500/30 mb-3 shadow-lg">
          <Trophy className="w-4 h-4" /> TROPHY MILESTONES
        </div>
        <h1 className="font-heading font-black text-3xl sm:text-5xl text-white text-glow-gold tracking-tight mb-2">
          TROPHY <span className="text-[#F59E0B]">ROAD</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Gain trophies in competitive matches to unlock heroes, game modes, and mega crates!
        </p>

        {/* Current Trophy Card */}
        <div className="inline-flex items-center gap-4 glass px-6 py-3 rounded-2xl border border-amber-500/40 bg-[#111827] mt-6 shadow-2xl">
          <span className="text-3xl">🏆</span>
          <div className="text-left">
            <div className="font-heading font-black text-2xl text-amber-400">
              {playerTrophies.toLocaleString()}
            </div>
            <div className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest">
              CURRENT TROPHIES
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Milestone Pathway */}
      <div className="relative flex flex-col items-center py-6">
        {/* Center Progress Line */}
        <div className="absolute top-0 bottom-0 w-2 bg-white/10 rounded-full" />
        <div
          className="absolute top-0 w-2 bg-gradient-to-b from-amber-400 via-orange-500 to-purple-600 rounded-full shadow-lg shadow-amber-500/50 transition-all duration-1000"
          style={{ height: '80%' }}
        />

        {/* Milestone Nodes */}
        <div className="relative z-10 w-full space-y-8">
          {milestones.map((m, idx) => {
            const isReached = playerTrophies >= m.trophies;
            const isLeft = idx % 2 === 0;

            return (
              <div
                key={m.trophies}
                className={`flex items-center justify-between w-full ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
              >
                {/* Reward Card */}
                <div className={`w-5/12 ${isLeft ? 'text-right pr-4' : 'text-left pl-4'}`}>
                  <motion.div
                    whileHover={isReached && !m.claimed ? { scale: 1.04 } : {}}
                    className={`glass rounded-3xl p-5 border transition-all inline-block w-full max-w-xs ${
                      m.claimed
                        ? 'bg-white/5 border-white/5 opacity-70'
                        : isReached
                        ? 'bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-amber-500/60 shadow-2xl shadow-amber-500/20'
                        : 'bg-[#111827]/80 border-white/5 opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0"
                        style={{ backgroundColor: `${m.color}20`, border: `1px solid ${m.color}40` }}
                      >
                        {m.icon}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="font-heading font-black text-sm sm:text-base text-white truncate">
                          {m.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{m.subtitle}</div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-heading font-bold text-slate-500">
                        {m.trophies.toLocaleString()} 🏆
                      </span>

                      {m.claimed ? (
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-green-400" /> Claimed
                        </span>
                      ) : isReached ? (
                        <button
                          onClick={() => handleClaim(idx)}
                          className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-heading font-black text-[11px] rounded-xl shadow-lg cursor-pointer hover:brightness-110 animate-pulse"
                        >
                          CLAIM
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Center Trophy Pin Node */}
                <div className="w-12 h-12 rounded-full glass border-2 border-amber-400 flex items-center justify-center font-heading font-black text-xs text-amber-300 shadow-xl bg-[#0a0e1a] z-20">
                  {m.trophies >= 1000 ? `${m.trophies / 1000}K` : m.trophies}
                </div>

                {/* Empty Spacer */}
                <div className="w-5/12" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
