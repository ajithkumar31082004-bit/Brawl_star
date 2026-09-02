import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Zap, Wind, Eye } from 'lucide-react';
import type { Hero } from '../../data/heroes';
import { RARITY_COLORS, CLASS_COLORS } from '../../data/heroes';
import { Badge } from '../ui/Card';

interface HeroCardProps {
  hero: Hero;
  index?: number;
  compact?: boolean;
}

const HERO_VISUALS: Record<string, { icon: string; bg: string }> = {
  blaze:  { icon: '🔥', bg: 'radial-gradient(circle at 60% 30%, rgba(239,68,68,0.3) 0%, transparent 70%)' },
  volt:   { icon: '⚡', bg: 'radial-gradient(circle at 60% 30%, rgba(59,130,246,0.3) 0%, transparent 70%)' },
  titan:  { icon: '🛡️', bg: 'radial-gradient(circle at 60% 30%, rgba(16,185,129,0.3) 0%, transparent 70%)' },
  frost:  { icon: '❄️', bg: 'radial-gradient(circle at 60% 30%, rgba(6,182,212,0.3) 0%, transparent 70%)' },
  rocket: { icon: '🚀', bg: 'radial-gradient(circle at 60% 30%, rgba(249,115,22,0.3) 0%, transparent 70%)' },
  luna:   { icon: '🌙', bg: 'radial-gradient(circle at 60% 30%, rgba(168,85,247,0.3) 0%, transparent 70%)' },
  buster: { icon: '👊', bg: 'radial-gradient(circle at 60% 30%, rgba(245,158,11,0.3) 0%, transparent 70%)' },
  pico:   { icon: '🤖', bg: 'radial-gradient(circle at 60% 30%, rgba(20,184,166,0.3) 0%, transparent 70%)' },
};

const STAT_BAR_MAX: Record<string, number> = {
  health: 10000, attack: 1500, speed: 100, range: 100,
};

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 text-[10px] w-12 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-bold w-8 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

export const HeroCard: React.FC<HeroCardProps> = ({ hero, index = 0, compact = false }) => {
  const visual = HERO_VISUALS[hero.id] || { icon: '⚔️', bg: '' };
  const rarityColor = RARITY_COLORS[hero.rarity] || '#6C63FF';
  const classColor = CLASS_COLORS[hero.class] || '#6C63FF';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      whileHover={{ y: -8, scale: 1.03 }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
      style={{ border: `1px solid ${rarityColor}30` }}
    >
      <Link to={`/heroes/${hero.id}`} className="block">
        {/* Card background */}
        <div className="absolute inset-0 bg-[#111827]" />
        <div className="absolute inset-0" style={{ background: visual.bg }} />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `radial-gradient(circle at 50% 50%, ${rarityColor}15 0%, transparent 70%)` }}
        />

        {/* Top ribbon - rarity */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, transparent, ${rarityColor}, transparent)` }}
        />

        <div className="relative p-4">
          {/* Badges */}
          <div className="flex items-center justify-between mb-3">
            <Badge color={rarityColor}>{hero.rarity}</Badge>
            <Badge color={classColor}>{hero.class}</Badge>
          </div>

          {/* Hero icon / avatar */}
          <div className="flex items-center justify-center py-4">
            <motion.div
              whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
              className="text-7xl filter drop-shadow-lg select-none"
            >
              {visual.icon}
            </motion.div>
          </div>

          {/* Hero name */}
          <h3 className="font-heading font-black text-center text-xl text-white mb-1 tracking-wider">
            {hero.name}
          </h3>
          <p className="text-center text-xs text-slate-400 mb-3 font-medium">{hero.emoji} {hero.superAbility}</p>

          {!compact && (
            <>
              {/* Stats */}
              <div className="space-y-1.5 mb-4">
                <StatBar label="HP" value={hero.health} max={STAT_BAR_MAX.health} color="#10B981" />
                <StatBar label="ATK" value={hero.attack} max={STAT_BAR_MAX.attack} color="#EF4444" />
                <StatBar label="SPD" value={hero.speed} max={STAT_BAR_MAX.speed} color="#F59E0B" />
                <StatBar label="RNG" value={hero.range} max={STAT_BAR_MAX.range} color={rarityColor} />
              </div>

              {/* View button */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-heading font-bold text-sm"
                  style={{ backgroundColor: rarityColor, color: '#0a0e1a' }}
                >
                  <Eye className="w-3.5 h-3.5" />
                  VIEW HERO
                </div>
              </motion.div>
            </>
          )}
        </div>
      </Link>
    </motion.div>
  );
};
