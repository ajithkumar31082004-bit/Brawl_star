import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Zap, Wind, Target, ChevronRight } from 'lucide-react';
import { HEROES, RARITY_COLORS, CLASS_COLORS } from '../data/heroes';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';

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
        <span className="text-slate-300 text-sm font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
      <span className="font-heading font-bold text-base w-16 text-right" style={{ color }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export const HeroDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'stats' | 'abilities'>('stats');

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

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-8">
          <button onClick={() => navigate('/heroes')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            HEROES
          </button>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-white font-semibold text-sm">{hero.name}</span>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Character showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <div
              className="relative rounded-3xl overflow-hidden aspect-square flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 50% 40%, ${rarityColor}30 0%, ${hero.bgColor} 40%, #111827 80%)`,
                border: `1px solid ${rarityColor}40`,
                boxShadow: `0 0 60px ${rarityColor}20`,
              }}
            >
              {/* Rarity glow top */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: `linear-gradient(90deg, transparent, ${rarityColor}, transparent)` }}
              />

              {/* Hero icon */}
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="text-[160px] leading-none select-none filter drop-shadow-2xl"
              >
                {icon}
              </motion.div>

              {/* Rarity badge */}
              <div className="absolute top-4 left-4">
                <span
                  className="px-3 py-1.5 rounded-full text-xs font-heading font-black tracking-widest"
                  style={{ backgroundColor: `${rarityColor}20`, color: rarityColor, border: `1px solid ${rarityColor}50` }}
                >
                  ★ {hero.rarity.toUpperCase()}
                </span>
              </div>

              {/* Class badge */}
              <div className="absolute top-4 right-4">
                <span
                  className="px-3 py-1.5 rounded-full text-xs font-heading font-bold tracking-widest"
                  style={{ backgroundColor: `${classColor}20`, color: classColor, border: `1px solid ${classColor}50` }}
                >
                  {hero.class.toUpperCase()}
                </span>
              </div>

              {/* Particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: rarityColor,
                    left: `${15 + i * 14}%`,
                    top: `${20 + (i % 2 ? 20 : 0)}%`,
                  }}
                  animate={{
                    y: [-5, 5, -5],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 2 + i * 0.3,
                    repeat: Infinity,
                    delay: i * 0.4,
                  }}
                />
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(isAuthenticated ? '/play' : '/login')}
                className="flex-1 py-3.5 rounded-xl font-heading font-black text-sm tracking-wider text-black cursor-pointer shadow-lg"
                style={{ background: `linear-gradient(135deg, ${rarityColor}, ${rarityColor}bb)` }}
              >
                SELECT HERO
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/game')}
                className="flex-1 py-3.5 rounded-xl font-heading font-black text-sm tracking-wider text-white cursor-pointer glass border border-white/20"
              >
                TRY HERO
              </motion.button>
            </div>
          </motion.div>

          {/* Right: Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="mb-2">
              <h1 className="font-heading font-black text-5xl sm:text-6xl text-white tracking-wider mb-2">{hero.name}</h1>
              <p className="text-slate-400 text-lg mb-4 leading-relaxed">{hero.description}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge color={rarityColor}>{hero.rarity}</Badge>
                <Badge color={classColor}>{hero.class}</Badge>
                <Badge color="#F59E0B">⚡ {hero.superAbility}</Badge>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
              {['stats', 'abilities'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`px-6 py-2 rounded-lg font-heading font-bold text-sm tracking-wider transition-all cursor-pointer ${
                    activeTab === tab ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            {activeTab === 'stats' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <StatBar label="Health" value={hero.health} max={10000} color="#10B981" icon={<Heart className="w-4 h-4" />} />
                <StatBar label="Attack" value={hero.attack} max={1500} color="#EF4444" icon={<Zap className="w-4 h-4" />} />
                <StatBar label="Speed" value={hero.speed} max={100} color="#F59E0B" icon={<Wind className="w-4 h-4" />} />
                <StatBar label="Range" value={hero.range} max={100} color={rarityColor} icon={<Target className="w-4 h-4" />} />
                <StatBar label="Super" value={hero.superCharge} max={100} color="#A855F7" icon={<span>⚡</span>} />

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[
                    { label: 'HEALTH', value: hero.health.toLocaleString(), color: '#10B981' },
                    { label: 'ATTACK', value: hero.attack.toLocaleString(), color: '#EF4444' },
                    { label: 'SPEED', value: hero.speed > 80 ? 'Fast' : hero.speed > 60 ? 'Medium' : 'Slow', color: '#F59E0B' },
                  ].map((s) => (
                    <div key={s.label} className="glass rounded-xl p-4 text-center border border-white/8">
                      <div className="font-heading font-black text-2xl mb-1" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-slate-400 text-xs tracking-wider uppercase">{s.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'abilities' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {[
                  { label: 'NORMAL ATTACK', name: hero.normalAttack, desc: hero.normalAttackDesc, color: '#10B981', icon: '⚔️' },
                  { label: 'SUPER ABILITY', name: hero.superAbility, desc: hero.superAbilityDesc, color: rarityColor, icon: hero.emoji },
                  { label: 'PASSIVE', name: hero.passive, desc: hero.passiveDesc, color: '#6C63FF', icon: '✨' },
                ].map((ability) => (
                  <motion.div
                    key={ability.label}
                    whileHover={{ x: 4 }}
                    className="glass rounded-2xl p-5 border border-white/8 hover:border-white/15 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: `${ability.color}20`, border: `1px solid ${ability.color}40` }}
                      >
                        {ability.icon}
                      </div>
                      <div>
                        <div className="text-[10px] font-heading font-bold tracking-widest mb-0.5" style={{ color: ability.color }}>
                          {ability.label}
                        </div>
                        <h4 className="font-heading font-bold text-white text-lg mb-1">{ability.name}</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">{ability.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Other Heroes */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <h2 className="font-heading font-bold text-2xl text-white mb-6 tracking-wide">OTHER HEROES</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {otherHeroes.map((h, i) => (
              <motion.div key={h.id} whileHover={{ y: -4 }}>
                <Link
                  to={`/heroes/${h.id}`}
                  className="block glass rounded-2xl p-4 text-center border border-white/8 hover:border-white/20 transition-all"
                  style={{ '--hover-color': RARITY_COLORS[h.rarity] } as React.CSSProperties}
                >
                  <div className="text-4xl mb-2">{HERO_VISUALS[h.id] || '⚔️'}</div>
                  <div className="font-heading font-bold text-white text-sm">{h.name}</div>
                  <div className="text-slate-500 text-xs">{h.class}</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
