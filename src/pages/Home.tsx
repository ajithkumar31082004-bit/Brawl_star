import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Trophy, Shield, Play, ArrowRight, Star, Users } from 'lucide-react';
import { HEROES } from '../data/heroes';
import { GAME_MODES } from '../data/events';
import { HeroCard } from '../components/hero/HeroCard';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const FEATURED_HEROES = HEROES.slice(0, 4);

const WHY_CARDS = [
  {
    icon: <Zap className="w-8 h-8" />,
    color: '#F59E0B',
    title: 'FAST-PACED BATTLES',
    desc: 'Real-time 3v3 competitive gameplay with instant matchmaking. Jump into action in seconds.',
  },
  {
    icon: <Star className="w-8 h-8" />,
    color: '#6C63FF',
    title: 'UNIQUE HEROES',
    desc: 'Build your roster with 8 original heroes — each with unique abilities and playstyles.',
  },
  {
    icon: <Trophy className="w-8 h-8" />,
    color: '#00D9FF',
    title: 'CLIMB THE RANKS',
    desc: 'Win matches, earn trophies, and rise through the global leaderboard to become a legend.',
  },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Cinematic BG */}
        <div className="absolute inset-0">
          <img
            src="/hero_banner.jpg"
            alt="BattleVerse Arena"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a]/60 via-[#0a0e1a]/20 to-[#0a0e1a]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e1a]/80 via-transparent to-[#0a0e1a]/80" />
        </div>

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              backgroundColor: i % 3 === 0 ? '#6C63FF' : i % 3 === 1 ? '#00D9FF' : '#F59E0B',
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.4, 1, 0.4],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}

        <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full mb-6 border border-purple-500/30"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-300">⚡ Season 7 Now Live</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-black text-white mb-4 leading-none tracking-tight"
          >
            ENTER THE
            <br />
            <span className="bg-gradient-to-r from-[#6C63FF] via-[#00D9FF] to-[#F59E0B] bg-clip-text text-transparent">
              BATTLE
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg sm:text-xl md:text-2xl font-heading font-medium text-[#00D9FF] tracking-widest mb-4 uppercase"
          >
            Fast-Paced 3V3 Hero Arena
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-10"
          >
            Choose your hero, master your abilities, and dominate the arena with your team.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: '0 0 30px rgba(245,158,11,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(isAuthenticated ? '/play' : '/register')}
              className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl font-heading font-black text-xl text-black shadow-2xl shadow-amber-500/40 cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current" />
              PLAY NOW
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/heroes')}
              className="flex items-center gap-3 px-8 py-4 glass border border-purple-500/40 rounded-2xl font-heading font-bold text-lg text-white cursor-pointer hover:border-purple-400/60 transition-colors"
            >
              EXPLORE HEROES
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex items-center justify-center gap-8 mt-14 flex-wrap"
          >
            {[
              { label: 'Active Players', value: '2.4M+' },
              { label: 'Matches Today', value: '890K' },
              { label: 'Heroes', value: '8' },
              { label: 'Countries', value: '120+' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="font-heading font-black text-2xl text-white">{value}</div>
                <div className="text-slate-500 text-xs uppercase tracking-wider mt-0.5">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-500 text-xs tracking-widest"
        >
          <span>SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-slate-500 to-transparent" />
        </motion.div>
      </section>

      {/* ===== WHY BATTLEVERSE ===== */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="font-heading font-black text-4xl sm:text-5xl text-white mb-4">
              WHY <span className="text-[#00D9FF]">BATTLEVERSE?</span>
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Everything you need for the ultimate competitive gaming experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHY_CARDS.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ y: -8 }}
                className="glass rounded-2xl p-8 border border-white/8 group hover:border-white/20 transition-all duration-300"
                style={{ '--tw-shadow-color': card.color } as React.CSSProperties}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${card.color}20`, color: card.color }}
                >
                  {card.icon}
                </div>
                <h3 className="font-heading font-bold text-xl text-white mb-3 tracking-wide">{card.title}</h3>
                <p className="text-slate-400 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED HEROES ===== */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <h2 className="font-heading font-black text-4xl sm:text-5xl text-white">
                FEATURED <span className="text-[#F59E0B]">HEROES</span>
              </h2>
              <p className="text-slate-400 mt-2">Master these champions to dominate the arena</p>
            </div>
            <Link
              to="/heroes"
              className="hidden sm:flex items-center gap-2 text-[#00D9FF] hover:text-cyan-300 font-heading font-semibold text-sm tracking-wider transition-colors"
            >
              VIEW ALL <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURED_HEROES.map((hero, i) => (
              <HeroCard key={hero.id} hero={hero} index={i} />
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link to="/heroes">
              <Button variant="secondary" size="md">VIEW ALL HEROES</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== GAME MODES ===== */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-heading font-black text-4xl sm:text-5xl text-white mb-4">
              GAME <span className="text-[#6C63FF]">MODES</span>
            </h2>
            <p className="text-slate-400 max-w-md mx-auto">Three unique ways to prove your worth on the battlefield</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GAME_MODES.slice(0, 3).map((mode, i) => (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -6 }}
                className="relative rounded-2xl overflow-hidden group cursor-pointer border border-white/10 hover:border-white/20 transition-all"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-15 group-hover:opacity-25 transition-opacity`} />
                <div className="absolute inset-0 bg-[#111827]" style={{ zIndex: -1 }} />
                <div className="relative p-6">
                  <div className="text-5xl mb-4">{mode.emoji}</div>
                  <div className="inline-flex items-center gap-2 glass px-3 py-1 rounded-full text-xs font-heading font-bold text-slate-300 mb-4">
                    <Users className="w-3 h-3" /> {mode.players}
                  </div>
                  <h3 className="font-heading font-black text-2xl text-white mb-2">{mode.name}</h3>
                  <p className="text-slate-400 text-sm mb-4 leading-relaxed">{mode.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Difficulty: <span className="text-white">{mode.difficulty}</span></span>
                    <Link
                      to="/modes"
                      className="flex items-center gap-1.5 text-xs font-heading font-bold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      PLAY <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative glass rounded-3xl p-12 border border-purple-500/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-cyan-900/20" />
            <div className="relative">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="font-heading font-black text-4xl sm:text-5xl text-white mb-4">
                READY TO BATTLE?
              </h2>
              <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">
                Join millions of players worldwide. Create your account and start climbing the ranks today!
              </p>
              <motion.button
                whileHover={{ scale: 1.06, boxShadow: '0 0 40px rgba(245,158,11,0.6)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(isAuthenticated ? '/play' : '/register')}
                className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl font-heading font-black text-2xl text-black shadow-2xl shadow-amber-500/40 cursor-pointer"
              >
                <Play className="w-7 h-7 fill-current" />
                PLAY BATTLEVERSE
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
