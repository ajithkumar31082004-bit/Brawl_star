import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Check, Lock, ChevronRight, Gift } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSound } from '../hooks/useSound';
import { CrateOpeningModal } from '../components/gacha/CrateOpeningModal';

interface PassTier {
  tier: number;
  tokensRequired: number;
  freeReward: { type: 'coins' | 'gems' | 'crate' | 'powerpoints'; label: string; icon: string; amount?: number };
  premiumReward: { type: 'coins' | 'gems' | 'crate' | 'skin' | 'pin' | 'powerpoints'; label: string; icon: string; amount?: number };
  claimedFree: boolean;
  claimedPremium: boolean;
}

interface Quest {
  id: string;
  title: string;
  hero?: string;
  mode?: string;
  progress: number;
  total: number;
  rewardTokens: number;
  completed: boolean;
  icon: string;
}

export const BrawlPass: React.FC = () => {
  const { user, addCoins, addGems } = useAuthStore();
  const { playSound } = useSound();

  const [activeTab, setActiveTab] = useState<'pass' | 'quests'>('pass');
  const [hasPremium, setHasPremium] = useState(false);
  const [currentTier] = useState(14);
  const [currentTokens, setCurrentTokens] = useState(380);
  const [tokensToNext] = useState(500);
  const [openCrateModal, setOpenCrateModal] = useState(false);

  // 15 Representative Tiers for demonstration
  const [tiers, setTiers] = useState<PassTier[]>([
    { tier: 1, tokensRequired: 100, freeReward: { type: 'coins', label: '100 Coins', icon: '🪙', amount: 100 }, premiumReward: { type: 'crate', label: 'Mega Crate', icon: '🎁' }, claimedFree: true, claimedPremium: false },
    { tier: 2, tokensRequired: 150, freeReward: { type: 'powerpoints', label: '50 Power Points', icon: '⚡', amount: 50 }, premiumReward: { type: 'gems', label: '20 Gems', icon: '💎', amount: 20 }, claimedFree: true, claimedPremium: false },
    { tier: 3, tokensRequired: 200, freeReward: { type: 'coins', label: '150 Coins', icon: '🪙', amount: 150 }, premiumReward: { type: 'coins', label: '300 Coins', icon: '🪙', amount: 300 }, claimedFree: true, claimedPremium: false },
    { tier: 4, tokensRequired: 250, freeReward: { type: 'crate', label: 'Big Crate', icon: '📦' }, premiumReward: { type: 'powerpoints', label: '100 Power Points', icon: '⚡', amount: 100 }, claimedFree: true, claimedPremium: false },
    { tier: 5, tokensRequired: 300, freeReward: { type: 'gems', label: '10 Gems', icon: '💎', amount: 10 }, premiumReward: { type: 'crate', label: 'Mega Crate', icon: '🎁' }, claimedFree: true, claimedPremium: false },
    { tier: 6, tokensRequired: 350, freeReward: { type: 'coins', label: '200 Coins', icon: '🪙', amount: 200 }, premiumReward: { type: 'coins', label: '500 Coins', icon: '🪙', amount: 500 }, claimedFree: true, claimedPremium: false },
    { tier: 7, tokensRequired: 400, freeReward: { type: 'powerpoints', label: '75 Power Points', icon: '⚡', amount: 75 }, premiumReward: { type: 'pin', label: 'Blaze Animated Pin', icon: '🔥' }, claimedFree: true, claimedPremium: false },
    { tier: 8, tokensRequired: 450, freeReward: { type: 'coins', label: '250 Coins', icon: '🪙', amount: 250 }, premiumReward: { type: 'gems', label: '30 Gems', icon: '💎', amount: 30 }, claimedFree: true, claimedPremium: false },
    { tier: 9, tokensRequired: 500, freeReward: { type: 'crate', label: 'Mega Crate', icon: '🎁' }, premiumReward: { type: 'crate', label: 'Mega Crate', icon: '🎁' }, claimedFree: true, claimedPremium: false },
    { tier: 10, tokensRequired: 550, freeReward: { type: 'gems', label: '20 Gems', icon: '💎', amount: 20 }, premiumReward: { type: 'coins', label: '1000 Coins', icon: '🪙', amount: 1000 }, claimedFree: true, claimedPremium: false },
    { tier: 11, tokensRequired: 600, freeReward: { type: 'coins', label: '300 Coins', icon: '🪙', amount: 300 }, premiumReward: { type: 'powerpoints', label: '200 Power Points', icon: '⚡', amount: 200 }, claimedFree: false, claimedPremium: false },
    { tier: 12, tokensRequired: 650, freeReward: { type: 'powerpoints', label: '100 Power Points', icon: '⚡', amount: 100 }, premiumReward: { type: 'crate', label: 'Mega Crate', icon: '🎁' }, claimedFree: false, claimedPremium: false },
    { tier: 13, tokensRequired: 700, freeReward: { type: 'coins', label: '400 Coins', icon: '🪙', amount: 400 }, premiumReward: { type: 'gems', label: '50 Gems', icon: '💎', amount: 50 }, claimedFree: false, claimedPremium: false },
    { tier: 14, tokensRequired: 750, freeReward: { type: 'crate', label: 'Mega Crate', icon: '🎁' }, premiumReward: { type: 'skin', label: 'CYBER BLAZE SKIN', icon: '🔥' }, claimedFree: false, claimedPremium: false },
    { tier: 15, tokensRequired: 800, freeReward: { type: 'gems', label: '50 Gems', icon: '💎', amount: 50 }, premiumReward: { type: 'crate', label: 'OMEGA CRATE', icon: '🌟' }, claimedFree: false, claimedPremium: false },
  ]);

  const [quests, setQuests] = useState<Quest[]>([
    { id: 'q1', title: 'Deal 20,000 damage with BLAZE', hero: 'BLAZE', progress: 16500, total: 20000, rewardTokens: 250, completed: false, icon: '🔥' },
    { id: 'q2', title: 'Win 3 matches in Crystal Clash', mode: 'Crystal Clash', progress: 3, total: 3, rewardTokens: 500, completed: true, icon: '💎' },
    { id: 'q3', title: 'Collect 25 Energy Crystals', mode: 'Crystal Clash', progress: 18, total: 25, rewardTokens: 250, completed: false, icon: '✨' },
    { id: 'q4', title: 'Defeat 10 enemies with VOLT', hero: 'VOLT', progress: 10, total: 10, rewardTokens: 500, completed: true, icon: '⚡' },
    { id: 'q5', title: 'Heal 15,000 HP with LUNA', hero: 'LUNA', progress: 7800, total: 15000, rewardTokens: 250, completed: false, icon: '🌙' },
  ]);

  const claimReward = (tierIdx: number, track: 'free' | 'premium') => {
    const tier = tiers[tierIdx];
    if (tier.tier > currentTier) return;
    if (track === 'premium' && !hasPremium) return;

    playSound('select');

    setTiers(prev => {
      const updated = [...prev];
      if (track === 'free') {
        updated[tierIdx].claimedFree = true;
        if (tier.freeReward.type === 'crate') setOpenCrateModal(true);
        if (tier.freeReward.amount && tier.freeReward.type === 'coins') addCoins(tier.freeReward.amount);
        if (tier.freeReward.amount && tier.freeReward.type === 'gems') addGems(tier.freeReward.amount);
      } else {
        updated[tierIdx].claimedPremium = true;
        if (tier.premiumReward.type === 'crate') setOpenCrateModal(true);
      }
      return updated;
    });
  };

  const claimQuest = (questId: string, tokens: number) => {
    playSound('crystal');
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, progress: q.total, completed: false, rewardTokens: 0 } : q));
    setCurrentTokens(prev => prev + tokens);
  };

  const unlockPremiumPass = () => {
    playSound('victory');
    setHasPremium(true);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Crate Opening Modal */}
      <CrateOpeningModal isOpen={openCrateModal} onClose={() => setOpenCrateModal(false)} />

      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden mb-8 border border-purple-500/30 bg-gradient-to-r from-purple-900/60 via-[#111827] to-amber-950/40 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="glass px-3 py-1 rounded-full text-xs font-heading font-black text-amber-400 border border-amber-500/30">
                SEASON 7 • CYBER ARENA
              </span>
              <span className="text-xs text-slate-400">Ends in 24d 12h</span>
            </div>
            <h1 className="font-heading font-black text-3xl sm:text-5xl text-white text-glow-gold tracking-tight">
              BATTLE <span className="text-[#00D9FF]">PASS</span>
            </h1>
          </div>

          {/* Tokens Progress Card */}
          <div className="flex items-center gap-4 glass p-4 rounded-2xl border border-white/10 w-full md:w-auto">
            <div className="text-3xl">🎫</div>
            <div className="flex-1 md:w-48">
              <div className="flex justify-between text-xs font-heading font-bold text-slate-300 mb-1">
                <span>TIER {currentTier} / 50</span>
                <span className="text-cyan-400">{currentTokens} / {tokensToNext}</span>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all"
                  style={{ width: `${(currentTokens / tokensToNext) * 100}%` }}
                />
              </div>
            </div>

            {!hasPremium ? (
              <button
                onClick={unlockPremiumPass}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-heading font-black text-xs rounded-xl shadow-lg cursor-pointer hover:brightness-110 flex-shrink-0"
              >
                UNLOCK PASS (169 💎)
              </button>
            ) : (
              <span className="glass px-3 py-2 rounded-xl text-xs font-heading font-bold text-green-400 border border-green-500/30">
                ✓ PASS ACTIVE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 glass p-1.5 rounded-2xl w-fit border border-white/10">
        <button
          onClick={() => setActiveTab('pass')}
          className={`px-6 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm tracking-wider cursor-pointer transition-all ${
            activeTab === 'pass'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          REWARD ROAD
        </button>
        <button
          onClick={() => setActiveTab('quests')}
          className={`px-6 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm tracking-wider cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'quests'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>QUESTS</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        </button>
      </div>

      {/* TAB 1: PASS ROAD */}
      {activeTab === 'pass' && (
        <div className="overflow-x-auto pb-6 scrollbar-thin">
          <div className="flex gap-4 min-w-max">
            {tiers.map((tier, idx) => {
              const isUnlocked = tier.tier <= currentTier;

              return (
                <div key={tier.tier} className="w-44 flex flex-col gap-3">
                  {/* Tier Number Badge */}
                  <div className="text-center font-heading font-black text-sm text-slate-300 glass py-1 rounded-xl border border-white/10">
                    TIER {tier.tier}
                  </div>

                  {/* Free Pass Track Card */}
                  <div
                    onClick={() => !tier.claimedFree && isUnlocked && claimReward(idx, 'free')}
                    className={`rounded-2xl p-4 border flex flex-col items-center justify-center text-center transition-all ${
                      tier.claimedFree
                        ? 'bg-white/5 border-white/5 opacity-60'
                        : isUnlocked
                        ? 'bg-gradient-to-b from-cyan-950/40 to-[#111827] border-cyan-500/50 cursor-pointer shadow-lg hover:scale-102'
                        : 'bg-[#111827] border-white/5 opacity-40'
                    }`}
                  >
                    <span className="text-[10px] font-heading font-bold text-cyan-400 uppercase mb-1">FREE</span>
                    <div className="text-4xl my-2">{tier.freeReward.icon}</div>
                    <span className="font-heading font-bold text-xs text-white truncate w-full">{tier.freeReward.label}</span>
                    {tier.claimedFree ? (
                      <span className="mt-2 text-[10px] font-bold text-slate-500">✓ CLAIMED</span>
                    ) : isUnlocked ? (
                      <span className="mt-2 px-3 py-1 rounded-full bg-cyan-500 text-black font-heading font-black text-[10px] animate-pulse">
                        CLAIM
                      </span>
                    ) : (
                      <span className="mt-2 text-[10px] font-bold text-slate-600 flex items-center gap-1"><Lock className="w-3 h-3" /> LOCKED</span>
                    )}
                  </div>

                  {/* Premium Pass Track Card */}
                  <div
                    onClick={() => !tier.claimedPremium && isUnlocked && hasPremium && claimReward(idx, 'premium')}
                    className={`rounded-2xl p-4 border flex flex-col items-center justify-center text-center transition-all relative ${
                      tier.claimedPremium
                        ? 'bg-white/5 border-white/5 opacity-60'
                        : isUnlocked && hasPremium
                        ? 'bg-gradient-to-b from-amber-950/40 to-[#111827] border-amber-500/50 cursor-pointer shadow-lg hover:scale-102'
                        : 'bg-gradient-to-b from-purple-950/30 to-[#0f1629] border-purple-500/20'
                    }`}
                  >
                    <span className="text-[10px] font-heading font-bold text-amber-400 uppercase mb-1">★ BATTLE PASS</span>
                    <div className="text-4xl my-2">{tier.premiumReward.icon}</div>
                    <span className="font-heading font-bold text-xs text-amber-300 truncate w-full">{tier.premiumReward.label}</span>
                    {tier.claimedPremium ? (
                      <span className="mt-2 text-[10px] font-bold text-slate-500">✓ CLAIMED</span>
                    ) : isUnlocked && hasPremium ? (
                      <span className="mt-2 px-3 py-1 rounded-full bg-amber-400 text-black font-heading font-black text-[10px] animate-pulse">
                        CLAIM
                      </span>
                    ) : (
                      <span className="mt-2 text-[10px] font-bold text-purple-400 flex items-center gap-1"><Lock className="w-3 h-3" /> PASS ONLY</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: QUESTS */}
      {activeTab === 'quests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quests.map(quest => {
            const isFinished = quest.progress >= quest.total;
            const pct = Math.min(100, (quest.progress / quest.total) * 100);

            return (
              <div
                key={quest.id}
                className="glass rounded-2xl p-5 border border-white/10 flex items-center justify-between gap-4 bg-[#111827]/80"
              >
                <div className="text-4xl p-2 rounded-2xl bg-white/5">{quest.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading font-bold text-sm text-white truncate mb-1">{quest.title}</h4>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>Progress: {quest.progress} / {quest.total}</span>
                    <span className="font-bold text-amber-400">+{quest.rewardTokens} 🎫</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isFinished ? 'bg-green-400' : 'bg-cyan-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {quest.completed && quest.rewardTokens > 0 ? (
                  <button
                    onClick={() => claimQuest(quest.id, quest.rewardTokens)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-heading font-black text-xs rounded-xl shadow-lg cursor-pointer hover:brightness-110 flex-shrink-0 animate-bounce"
                  >
                    CLAIM
                  </button>
                ) : isFinished ? (
                  <span className="text-xs font-bold text-green-400 flex-shrink-0">✓ DONE</span>
                ) : (
                  <span className="text-xs font-bold text-slate-500 flex-shrink-0">IN PROGRESS</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
