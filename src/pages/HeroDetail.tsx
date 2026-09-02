import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Zap, Wind, Target, ChevronRight, Sparkles, Shield, Play } from 'lucide-react';
import { HEROES, RARITY_COLORS, CLASS_COLORS, POWER_LEVEL_COSTS } from '../data/heroes';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';
import { useSound } from '../hooks/useSound';

const HERO_VISUALS: Record<string, string> = {
  blaze: '🔥', volt: '⚡', titan: '🛡️', frost: '❄️',
  rocket: '🚀', luna: '🌙', buster: '👊', pico: '🤖',
};

function StatBar({ label, value, max, color, icon }: { label: string; value: number; max: number; color: string; icon: React.ReactNode }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 w-28 flex-shrink-0">
        <span style={{ color }}>{icon}</span>
        <span className="text-slate-300 text-xs sm:text-sm font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
      <span className="font-heading font-bold text-sm sm:text-base w-16 text-right" style={{ color }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export const HeroDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, addCoins } = useAuthStore();
  const { playSound } = useSound();

  const [activeTab, setActiveTab] = useState<'stats' | 'abilities' | 'gadgets'>('stats');
  const [powerLevel, setPowerLevel] = useState(7);
  const [selectedGadget, setSelectedGadget] = useState(0);
  const [selectedStarPower, setSelectedStarPower] = useState(0);

  const hero = HEROES.find((h) => h.id === id);

  if (!hero) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">Hero Not Found</h2>
          <Link to="/heroes"><Button variant="primary">Back to Heroes</Button></Link>
        </div>
      </div>
    );
  }

  const rarityColor = RARITY_COLORS[hero.rarity];
  const classColor = CLASS_COLORS[hero.class];
  const icon = HERO_VISUALS[hero.id] || '⚔️';
  const otherHeroes = HEROES.filter(h => h.id !== hero.id).slice(0, 4);

  // Stat scaling based on power level (5% per level above 1)
  const statMultiplier = 1 + (powerLevel - 1) * 0.05;
  const scaledHealth = Math.round(hero.health * statMultiplier);
  const scaledAttack = Math.round(hero.attack * statMultiplier);

  const nextUpgradeCost = POWER_LEVEL_COSTS[powerLevel + 1] || null;

  const handleUpgrade = () => {
    if (powerLevel >= 11) return;
    playSound('victory');
    setPowerLevel(prev => prev + 1);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate('/heroes')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group cursor-pointer">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          HEROES
        </button>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="text-white font-semibold text-sm">{hero.name}</span>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: Character Showcase & Power Level */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Hero Portrait Frame */}
          <div
            className="relative rounded-3xl overflow-hidden aspect-square flex flex-col items-center justify-center bg-[#111827] shadow-2xl p-6"
            style={{
              border: `2px solid ${rarityColor}50`,
              boxShadow: `0 0 60px ${rarityColor}20`,
            }}
          >
            {/* Top Ribbon */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ background: `linear-gradient(90deg, transparent, ${rarityColor}, transparent)` }}
            />

            {/* Power Level Badge */}
            <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-xs font-heading font-black text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-lg">
              <Zap className="w-3.5 h-3.5 fill-current" /> POWER {powerLevel}
            </div>

            {/* Hero Icon */}
            <motion.div
              animate={{ y: [-6, 6, -6], rotate: [-2, 2, -2] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-8xl sm:text-9xl filter drop-shadow-2xl select-none my-4"
            >
              {icon}
            </motion.div>

            <h2 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-wide text-glow-cyan">
              {hero.name}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge color={rarityColor}>{hero.rarity}</Badge>
              <Badge color={classColor}>{hero.class}</Badge>
            </div>
          </div>

          {/* Power Level Upgrade Widget */}
          <div className="glass rounded-3xl p-5 border border-white/10 bg-[#111827]/90 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="font-heading font-black text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> UPGRADE HERO
              </span>
              <span className="text-xs font-bold text-amber-400">
                {powerLevel < 11 ? `POWER ${powerLevel} → ${powerLevel + 1}` : '★ MAX POWER'}
              </span>
            </div>

            {/* Power Points Progress Bar */}
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Power Points</span>
                <span className="text-purple-300 font-bold">
                  {hero.powerPoints || 250} / {nextUpgradeCost ? nextUpgradeCost.powerPoints : 'MAX'}
                </span>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                  style={{ width: nextUpgradeCost ? `${Math.min(100, ((hero.powerPoints || 250) / nextUpgradeCost.powerPoints) * 100)}%` : '100%' }}
                />
              </div>
            </div>

            {powerLevel < 11 && nextUpgradeCost ? (
              <button
                onClick={handleUpgrade}
                className="w-full py-3 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black font-heading font-black text-sm rounded-xl shadow-lg cursor-pointer hover:brightness-110 flex items-center justify-center gap-2"
              >
                <span>UPGRADE TO POWER {powerLevel + 1}</span>
                <span className="glass px-2 py-0.5 rounded text-xs">🪙 {nextUpgradeCost.coins}</span>
              </button>
            ) : (
              <div className="text-center py-2 text-xs font-heading font-black text-amber-400 glass rounded-xl border border-amber-500/30">
                ★ MAXIMUM POWER REACHED
              </div>
            )}
          </div>
        </motion.div>

        {/* Right: Stats, Gadgets, Star Powers & Play CTA */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 glass p-1.5 rounded-2xl w-fit border border-white/10">
            {[
              { id: 'stats', label: 'STATS' },
              { id: 'gadgets', label: 'GADGETS & STAR POWERS' },
              { id: 'abilities', label: 'ABILITIES' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-5 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm tracking-wider transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: SCALED STATS */}
          {activeTab === 'stats' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="glass rounded-3xl p-6 border border-white/10 bg-[#111827]/80 shadow-xl space-y-4">
                <h3 className="font-heading font-bold text-lg text-white mb-2">Combat Attributes (Power {powerLevel})</h3>
                <StatBar label="Health" value={scaledHealth} max={12000} color="#10B981" icon={<Heart className="w-4 h-4" />} />
                <StatBar label="Attack" value={scaledAttack} max={2000} color="#EF4444" icon={<Zap className="w-4 h-4" />} />
                <StatBar label="Speed" value={hero.speed} max={100} color="#F59E0B" icon={<Wind className="w-4 h-4" />} />
                <StatBar label="Range" value={hero.range} max={100} color="#00D9FF" icon={<Target className="w-4 h-4" />} />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => navigate('/arena')}
                  className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-heading font-black text-base rounded-2xl shadow-xl cursor-pointer hover:brightness-110 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  PRACTICE IN ARENA
                </button>
                <button
                  onClick={() => navigate('/lobby')}
                  className="flex-1 py-4 glass border border-purple-500/40 text-white font-heading font-bold text-base rounded-2xl hover:bg-white/10 cursor-pointer flex items-center justify-center gap-2"
                >
                  SELECT & ENTER LOBBY
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 2: GADGETS & STAR POWERS */}
          {activeTab === 'gadgets' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Gadgets (Active) */}
              <div className="glass rounded-3xl p-6 border border-cyan-500/20 bg-[#111827]/80 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-base text-cyan-300 flex items-center gap-2">
                    <span>🪤</span> ACTIVE GADGETS (3 charges/match)
                  </h3>
                  <span className="text-xs text-slate-400">Unlocked at Power 7</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hero.gadgets.map((gadget, idx) => (
                    <div
                      key={gadget.id}
                      onClick={() => { setSelectedGadget(idx); playSound('select'); }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedGadget === idx
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/20'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{gadget.icon}</span>
                        <div>
                          <h4 className="font-heading font-bold text-sm text-white">{gadget.name}</h4>
                          <span className="text-[10px] text-cyan-400 font-bold">{gadget.charges} USES PER MATCH</span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">{gadget.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Star Powers (Passive) */}
              <div className="glass rounded-3xl p-6 border border-amber-500/20 bg-[#111827]/80 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-base text-amber-300 flex items-center gap-2">
                    <span>⭐</span> PASSIVE STAR POWERS
                  </h3>
                  <span className="text-xs text-slate-400">Unlocked at Power 9</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hero.starPowers.map((sp, idx) => (
                    <div
                      key={sp.id}
                      onClick={() => { setSelectedStarPower(idx); playSound('select'); }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedStarPower === idx
                          ? 'bg-amber-950/40 border-amber-400 shadow-lg shadow-amber-500/20'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{sp.icon}</span>
                        <div>
                          <h4 className="font-heading font-bold text-sm text-white">{sp.name}</h4>
                          <span className="text-[10px] text-amber-400 font-bold">PASSIVE ENHANCEMENT</span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">{sp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: ABILITIES */}
          {activeTab === 'abilities' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="glass rounded-2xl p-5 border border-white/10 bg-[#111827]/80">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center font-heading font-black text-sm">
                    ATK
                  </span>
                  <div>
                    <h4 className="font-heading font-bold text-white text-base">{hero.normalAttack}</h4>
                    <span className="text-slate-500 text-xs">Normal Attack</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm">{hero.normalAttackDesc}</p>
              </div>

              <div className="glass rounded-2xl p-5 border border-purple-500/30 bg-[#111827]/80">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center font-heading font-black text-sm">
                    ⚡
                  </span>
                  <div>
                    <h4 className="font-heading font-bold text-white text-base">{hero.superAbility}</h4>
                    <span className="text-purple-400 text-xs font-semibold">Super Ability</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm">{hero.superAbilityDesc}</p>
              </div>

              <div className="glass rounded-2xl p-5 border border-white/10 bg-[#111827]/80">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-heading font-black text-sm">
                    ★
                  </span>
                  <div>
                    <h4 className="font-heading font-bold text-white text-base">{hero.passive}</h4>
                    <span className="text-slate-500 text-xs">Passive Ability</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm">{hero.passiveDesc}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
