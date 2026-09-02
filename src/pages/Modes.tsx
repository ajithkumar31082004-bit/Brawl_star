import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Trophy, Star, Play, Lock } from 'lucide-react';
import { GAME_MODES } from '../data/events';
import { useAuthStore } from '../store/authStore';

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#10B981',
  Medium: '#F59E0B',
  Hard: '#EF4444',
  Extreme: '#A855F7',
};

export const Modes: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full mb-4 border border-purple-500/30">
            <span className="text-sm font-medium text-slate-300">🎮 {GAME_MODES.length} Game Modes</span>
          </div>
          <h1 className="font-heading font-black text-5xl sm:text-6xl text-white mb-4">
            GAME <span className="text-[#6C63FF]">MODES</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto">
            Choose your battlefield. Each mode offers a unique way to prove your skills.
          </p>
        </motion.div>

        {/* Mode cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {GAME_MODES.map((mode, i) => {
            const diffColor = DIFFICULTY_COLORS[mode.difficulty];
            const isHovered = hoveredMode === mode.id;

            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                onHoverStart={() => setHoveredMode(mode.id)}
                onHoverEnd={() => setHoveredMode(null)}
                className="relative rounded-3xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(isAuthenticated ? '/play' : '/login')}
              >
                {/* Background */}
                <div className="absolute inset-0 bg-[#0f1629]" />
                <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />

                {/* Top accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mode.gradient}`} />

                <div className="relative p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="text-6xl mb-3">{mode.emoji}</div>
                      <h2 className="font-heading font-black text-3xl text-white mb-1 tracking-wide">{mode.name}</h2>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1.5 glass px-3 py-1 rounded-full text-xs font-heading font-bold text-slate-300">
                          <Users className="w-3 h-3" /> {mode.players}
                        </span>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-heading font-bold"
                          style={{ backgroundColor: `${diffColor}20`, color: diffColor, border: `1px solid ${diffColor}40` }}
                        >
                          {mode.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Play button */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-black cursor-pointer shadow-lg bg-gradient-to-br ${mode.gradient}`}
                    >
                      {mode.id === 'custom' && !isAuthenticated ? (
                        <Lock className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 fill-current" />
                      )}
                    </motion.div>
                  </div>

                  <p className="text-slate-400 leading-relaxed mb-6">{mode.description}</p>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {mode.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>

                  {/* Rewards */}
                  <div className="glass rounded-xl p-3 border border-white/8">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-400 font-heading font-bold text-sm">{mode.rewards}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Rotating Events Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6 border border-amber-500/20 bg-gradient-to-r from-amber-900/10 to-orange-900/10"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">🎯</div>
              <div>
                <div className="font-heading font-black text-amber-400 text-lg">FEATURED EVENT: DOUBLE TROPHIES</div>
                <div className="text-slate-400 text-sm">All 3v3 matches give 2X trophies this weekend!</div>
              </div>
            </div>
            <button
              onClick={() => navigate('/events')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-heading font-bold text-sm rounded-xl transition-colors cursor-pointer"
            >
              VIEW EVENTS
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
