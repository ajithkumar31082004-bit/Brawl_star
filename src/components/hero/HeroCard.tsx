import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import type { Hero } from '../../data/heroes';
import { RARITY_COLORS, CLASS_COLORS } from '../../data/heroes';
import { Badge } from '../ui/Card';

interface HeroCardProps {
  hero: Hero;
  index?: number;
  compact?: boolean;
}

const HERO_VISUALS: Record<string, { icon: string; bg: string }> = {
  blaze:  { icon: '🔥', bg: 'radial-gradient(circle at 60% 30%, rgba(239,68,68,0.25) 0%, transparent 70%)' },
  volt:   { icon: '⚡', bg: 'radial-gradient(circle at 60% 30%, rgba(59,130,246,0.25) 0%, transparent 70%)' },
  titan:  { icon: '🛡️', bg: 'radial-gradient(circle at 60% 30%, rgba(16,185,129,0.25) 0%, transparent 70%)' },
  frost:  { icon: '❄️', bg: 'radial-gradient(circle at 60% 30%, rgba(6,182,212,0.25) 0%, transparent 70%)' },
  rocket: { icon: '🚀', bg: 'radial-gradient(circle at 60% 30%, rgba(249,115,22,0.25) 0%, transparent 70%)' },
  luna:   { icon: '🌙', bg: 'radial-gradient(circle at 60% 30%, rgba(168,85,247,0.25) 0%, transparent 70%)' },
  buster: { icon: '👊', bg: 'radial-gradient(circle at 60% 30%, rgba(245,158,11,0.25) 0%, transparent 70%)' },
  pico:   { icon: '🤖', bg: 'radial-gradient(circle at 60% 30%, rgba(20,184,166,0.25) 0%, transparent 70%)' },
};

const STAT_BAR_MAX: Record<string, number> = {
  health: 10000, attack: 1500, speed: 100, range: 100,
};

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 text-[10px] w-8 uppercase tracking-wider font-semibold">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-bold w-9 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

export const HeroCard: React.FC<HeroCardProps> = ({ hero, index = 0, compact = false }) => {
  const visual = HERO_VISUALS[hero.id] || { icon: '⚔️', bg: '' };
  const rarityColor = RARITY_COLORS[hero.rarity] || '#6C63FF';
  const classColor = CLASS_COLORS[hero.class] || '#6C63FF';

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer flex flex-col bg-[#111827] border border-white/10 hover:border-white/30 transition-all duration-300 shadow-xl"
    >
      <Link to={`/heroes/${hero.id}`} className="flex flex-col h-full p-4">
        {/* Background gradient */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: visual.bg }} />
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 50%, ${rarityColor}20 0%, transparent 75%)` }}
        />

        {/* Top ribbon - rarity line */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, transparent, ${rarityColor}, transparent)` }}
        />

        {/* Header badges */}
        <div className="flex items-center justify-between mb-2 relative z-10">
          <Badge color={rarityColor}>{hero.rarity}</Badge>
          <Badge color={classColor}>{hero.class}</Badge>
        </div>

        {/* Hero icon / avatar */}
        <div className="flex items-center justify-center py-3 relative z-10">
          <motion.div
            whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.3 }}
            className="text-6xl filter drop-shadow-xl select-none"
          >
            {visual.icon}
          </motion.div>
        </div>

        {/* Hero name & ability */}
        <div className="text-center relative z-10 mb-3">
          <h3 className="font-heading font-black text-lg sm:text-xl text-white tracking-wider">
            {hero.name}
          </h3>
          <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
            {hero.emoji} {hero.superAbility}
          </p>
        </div>

        {!compact && (
          <div className="mt-auto space-y-1.5 pt-2 border-t border-white/5 relative z-10">
            <StatBar label="HP" value={hero.health} max={STAT_BAR_MAX.health} color="#10B981" />
            <StatBar label="ATK" value={hero.attack} max={STAT_BAR_MAX.attack} color="#EF4444" />
            <StatBar label="SPD" value={hero.speed} max={STAT_BAR_MAX.speed} color="#F59E0B" />
            <StatBar label="RNG" value={hero.range} max={STAT_BAR_MAX.range} color={rarityColor} />

            {/* View Hero Button */}
            <div className="pt-2">
              <div
                className="w-full py-1.5 rounded-xl font-heading font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all group-hover:shadow-lg"
                style={{
                  backgroundColor: `${rarityColor}20`,
                  color: rarityColor,
                  border: `1px solid ${rarityColor}40`,
                }}
              >
                <Eye className="w-3.5 h-3.5" />
                VIEW HERO
              </div>
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
};
