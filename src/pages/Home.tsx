import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Trophy, Play, ArrowRight, Star, Users } from 'lucide-react';
import { HEROES } from '../data/heroes';
import { GAME_MODES } from '../data/events';
import { HeroCard } from '../components/hero/HeroCard';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';

const FEATURED_HEROES = HEROES.slice(0, 4);

const WHY_CARDS = [
  {
    icon: <Zap className="w-7 h-7" />,
    color: '#F59E0B',
    title: 'FAST-PACED BATTLES',
    desc: 'Real-time 3v3 competitive gameplay with instant matchmaking. Jump into action in seconds.',
  },
  {
    icon: <Star className="w-7 h-7" />,
    color: '#6C63FF',
    title: 'UNIQUE HEROES',
    desc: 'Build your roster with 8 original heroes — each with unique abilities and playstyles.',
  },
  {
    icon: <Trophy className="w-7 h-7" />,
    color: '#00D9FF',
    title: 'CLIMB THE RANKS',
    desc: 'Win matches, earn trophies, and rise through the global leaderboard to become a legend.',
  },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col gap-12 sm:gap-20 pb-20">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-12 sm:py-20">
        {/* Cinematic BG */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/hero_banner.jpg"
            alt="BattleVerse Arena"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a]/90 via-[#0a0e1a]/40 to-[#0a0e1a]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e1a]/90 via-transparent to-[#0a0e1a]/90" />
        </div>

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${15 + Math.random() * 70}%`,
              backgroundColor: i % 3 === 0 ? '#6C63FF' : i % 3 === 1 ? '#00D9FF' : '#F59E0B',
            }}
            animate={{
              y: [-8, 8, -8],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full mb-6 border border-purple-500/30 shadow-lg shadow-purple-500/10"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-slate-300">⚡ Season 7 Now Live</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-black text-white mb-3 tracking-tight leading-none"
          >
            ENTER THE <br />
            <span className="bg-gradient-to-r from-[#6C63FF] via-[#00D9FF] to-[#F59E0B] bg-clip-text text-transparent">
              BATTLE
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl font-heading font-bold text-[#00D9FF] tracking-widest mb-4 uppercase"
          >
            Fast-Paced 3V3 Hero Arena
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed"
          >
            Choose your hero, master your abilities, and dominate the arena with your team.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 35px rgba(245,158,11,0.5)' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(isAuthenticated ? '/play' : '/register')}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl font-heading font-black text-lg sm:text-xl text-black shadow-2xl shadow-amber-500/40 cursor-pointer transition-all"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              PLAY NOW
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/heroes')}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 glass border border-purple-500/40 hover:border-purple-400 rounded-2xl font-heading font-bold text-sm sm:text-base text-white cursor-pointer transition-colors"
            >
              EXPLORE HEROES
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-12 pt-8 border-t border-white/10"
          >
            {[
              { label: 'Active Players', value: '2.4M+' },
              { label: 'Matches Today', value: '890K' },
              { label: 'Heroes', value: '8' },
              { label: 'Countries', value: '120+' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-3 rounded-2xl glass border border-white/5">
                <div className="font-heading font-black text-xl sm:text-2xl text-white">{value}</div>
                <div className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-wider font-semibold mt-0.5">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== WHY BATTLEVERSE ===== */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-white mb-2 tracking-wide">
            WHY <span className="text-[#00D9FF]">BATTLEVERSE?</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Everything you need for the ultimate competitive gaming experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {WHY_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="glass rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all duration-300 bg-[#111827]/80 shadow-xl"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                style={{ backgroundColor: `${card.color}20`, color: card.color, border: `1px solid ${card.color}40` }}
              >
                {card.icon}
              </div>
              <h3 className="font-heading font-bold text-lg sm:text-xl text-white mb-2 tracking-wide">{card.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== FEATURED HEROES ===== */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <div>
            <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-white tracking-wide">
              FEATURED <span className="text-[#F59E0B]">HEROES</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-1">Master these champions to dominate the arena</p>
          </div>
          <Link
            to="/heroes"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-heading font-bold text-[#00D9FF] hover:text-cyan-300 tracking-wider transition-colors"
          >
            VIEW ALL <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {FEATURED_HEROES.map((hero, i) => (
            <HeroCard key={hero.id} hero={hero} index={i} />
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Link to="/heroes">
            <Button variant="secondary" size="md">VIEW ALL HEROES</Button>
          </Link>
        </div>
      </section>

      {/* ===== GAME MODES ===== */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-white mb-2 tracking-wide">
            GAME <span className="text-[#6C63FF]">MODES</span>
          </h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm sm:text-base">
            Three unique ways to prove your worth on the battlefield
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {GAME_MODES.slice(0, 3).map((mode, i) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="relative rounded-3xl overflow-hidden group cursor-pointer border border-white/10 hover:border-white/20 transition-all bg-[#111827] shadow-xl"
              onClick={() => navigate('/modes')}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className="relative p-6 sm:p-8 flex flex-col h-full">
                <div className="text-5xl mb-4">{mode.emoji}</div>
                <div className="inline-flex items-center gap-1.5 glass px-3 py-1 rounded-full text-xs font-heading font-bold text-slate-300 mb-3 w-fit border border-white/10">
                  <Users className="w-3 h-3" /> {mode.players}
                </div>
                <h3 className="font-heading font-black text-2xl text-white mb-2">{mode.name}</h3>
                <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed flex-1">{mode.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs font-medium text-slate-500">
                    Difficulty: <span className="text-white font-bold">{mode.difficulty}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-heading font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                    PLAY <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative glass rounded-3xl p-8 sm:p-12 border border-purple-500/30 overflow-hidden shadow-2xl bg-gradient-to-br from-[#0f1629] to-[#111827]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20 pointer-events-none" />
          <div className="relative z-10">
            <div className="text-5xl sm:text-6xl mb-4">🏆</div>
            <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-white mb-3">
              READY TO BATTLE?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mb-8 max-w-lg mx-auto">
              Join millions of players worldwide. Create your account and start climbing the ranks today!
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 35px rgba(245,158,11,0.5)' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(isAuthenticated ? '/play' : '/register')}
              className="inline-flex items-center gap-3 px-8 sm:px-12 py-4 sm:py-4.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl font-heading font-black text-lg sm:text-xl text-black shadow-2xl shadow-amber-500/40 cursor-pointer transition-all"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              PLAY BATTLEVERSE
            </motion.button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
