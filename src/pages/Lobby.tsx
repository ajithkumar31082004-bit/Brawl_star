import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RefreshCw, Users, Swords, Trophy, ArrowLeft, Check } from 'lucide-react';
import { HEROES } from '../data/heroes';
import { useAuthStore } from '../store/authStore';

const RARITY_COLORS: Record<string, string> = {
  Legendary: '#F59E0B', Epic: '#A855F7', 'Super Rare': '#3B82F6', Rare: '#10B981',
};

const HERO_ICONS: Record<string, string> = {
  blaze: '🔥', volt: '⚡', titan: '🛡️', frost: '❄️', rocket: '🚀', luna: '🌙', buster: '👊', pico: '🤖',
};

const TEAM_BLUE = ['You', 'StarBlast', 'CosmicAce'];
const TEAM_RED = ['ShadowX', 'ProGamer', 'DarkKnight'];
const TEAM_HEROES = ['🔥', '🌙', '🛡️'];
const OPP_HEROES = ['⚡', '🚀', '❄️'];

type LobbyState = 'idle' | 'ready' | 'searching' | 'found';

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedHero, setSelectedHero] = useState(HEROES[0]);
  const [lobbyState, setLobbyState] = useState<LobbyState>('idle');
  const [searchTime, setSearchTime] = useState(0);
  const [showHeroSelect, setShowHeroSelect] = useState(false);
  const [selectedMode, setSelectedMode] = useState('Crystal Clash');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (lobbyState === 'searching') {
      interval = setInterval(() => {
        setSearchTime(t => {
          if (t >= 4) {
            setLobbyState('found');
            return 0;
          }
          return t + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lobbyState]);

  const handleReady = () => {
    if (lobbyState === 'idle') {
      setLobbyState('ready');
    } else if (lobbyState === 'ready') {
      setLobbyState('searching');
    }
  };

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/modes')} className="glass p-2 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading font-black text-3xl text-white">GAME LOBBY</h1>
              <p className="text-slate-400 text-sm">{selectedMode} • 3v3</p>
            </div>
          </div>

          {/* Mode selector */}
          <div className="flex gap-2">
            {['Crystal Clash', 'Ranked Arena', 'Showdown'].map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`px-4 py-2 rounded-xl font-heading font-bold text-xs tracking-wider cursor-pointer transition-all ${
                  selectedMode === mode
                    ? 'bg-purple-600 text-white'
                    : 'glass text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main lobby grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Blue Team */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <h3 className="font-heading font-bold text-blue-400 tracking-wider">BLUE TEAM</h3>
            </div>
            <div className="space-y-3">
              {TEAM_BLUE.map((name, i) => (
                <div key={name} className={`flex items-center gap-3 p-3 rounded-xl ${i === 0 ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-white/5'}`}>
                  <div className="text-2xl">{TEAM_HEROES[i]}</div>
                  <div className="flex-1">
                    <div className="font-heading font-bold text-white text-sm">{name}</div>
                    <div className="text-slate-500 text-xs">
                      {i === 0 ? (user?.username || 'Player') : `LV ${20 + i * 4}`}
                    </div>
                  </div>
                  {lobbyState !== 'idle' && (
                    <Check className="w-4 h-4 text-green-400" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Center — selected hero & controls */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            {/* Hero showcase */}
            <div
              className="glass rounded-2xl p-6 border flex-1 flex flex-col items-center text-center"
              style={{ borderColor: `${RARITY_COLORS[selectedHero.rarity]}40` }}
            >
              <div className="text-8xl mb-3 animate-float">{HERO_ICONS[selectedHero.id] || '⚔️'}</div>
              <h2 className="font-heading font-black text-2xl text-white mb-1">{selectedHero.name}</h2>
              <div className="flex gap-2 mb-4">
                <span className="text-xs glass px-2 py-0.5 rounded-full text-slate-300">{selectedHero.class}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: RARITY_COLORS[selectedHero.rarity], backgroundColor: `${RARITY_COLORS[selectedHero.rarity]}20` }}>
                  {selectedHero.rarity}
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <div className="text-green-400 font-bold">{selectedHero.health}</div>
                  <div className="text-slate-500 text-xs">HP</div>
                </div>
                <div className="text-center">
                  <div className="text-red-400 font-bold">{selectedHero.attack}</div>
                  <div className="text-slate-500 text-xs">ATK</div>
                </div>
                <div className="text-center">
                  <div className="text-amber-400 font-bold">{selectedHero.speed}</div>
                  <div className="text-slate-500 text-xs">SPD</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <button
              onClick={() => setShowHeroSelect(true)}
              className="glass py-3 rounded-xl font-heading font-bold text-sm text-slate-300 hover:text-white border border-white/10 hover:border-white/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              CHANGE HERO
            </button>

            <motion.button
              whileHover={{ scale: lobbyState === 'found' ? 1 : 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={lobbyState === 'found' ? () => navigate('/game') : handleReady}
              className={`py-4 rounded-xl font-heading font-black text-lg cursor-pointer transition-all shadow-lg flex items-center justify-center gap-3 ${
                lobbyState === 'found'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-green-500/40'
                  : lobbyState === 'searching'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white cursor-wait'
                  : lobbyState === 'ready'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-amber-500/40'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/40'
              }`}
            >
              {lobbyState === 'idle' && <><Check className="w-5 h-5" /> READY</>}
              {lobbyState === 'ready' && <><Swords className="w-5 h-5" /> FIND MATCH</>}
              {lobbyState === 'searching' && (
                <>
                  <RefreshCw className="w-5 h-5 matchmaking-spin" />
                  SEARCHING... {searchTime}s
                </>
              )}
              {lobbyState === 'found' && <><Play className="w-5 h-5 fill-current" /> START GAME!</>}
            </motion.button>

            {/* Searching animation */}
            <AnimatePresence>
              {lobbyState === 'searching' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-xl p-3 border border-purple-500/30 text-center"
                >
                  <div className="text-xs text-slate-400 font-medium">SEARCHING FOR PLAYERS...</div>
                  <div className="flex justify-center gap-1 mt-2">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-purple-400"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              {lobbyState === 'found' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-xl p-3 border border-green-500/30 text-center"
                >
                  <div className="text-sm text-green-400 font-heading font-black">⚡ OPPONENT FOUND!</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Red Team */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-5 border border-red-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <h3 className="font-heading font-bold text-red-400 tracking-wider">RED TEAM</h3>
            </div>
            <div className="space-y-3">
              {TEAM_RED.map((name, i) => (
                <div key={name} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="text-2xl">{OPP_HEROES[i]}</div>
                  <div className="flex-1">
                    <div className="font-heading font-bold text-white text-sm">{name}</div>
                    <div className="text-slate-500 text-xs">LV {24 + i * 3}</div>
                  </div>
                  {lobbyState === 'found' && <Check className="w-4 h-4 text-red-400" />}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Player stats bar */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-5 border border-white/8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-2xl">
                  {user.avatar}
                </div>
                <div>
                  <div className="font-heading font-black text-lg text-white">{user.username.toUpperCase()}</div>
                  <div className="text-slate-400 text-sm">Level {user.level} • {user.rank}</div>
                </div>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                {[
                  { label: 'TROPHIES', value: `🏆 ${user.trophies.toLocaleString()}`, color: '#F59E0B' },
                  { label: 'WIN RATE', value: `${((user.wins / user.matches) * 100).toFixed(1)}%`, color: '#10B981' },
                  { label: 'VICTORIES', value: user.wins.toString(), color: '#6C63FF' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="font-heading font-black text-xl" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-slate-500 text-xs tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Hero Select Modal */}
        <AnimatePresence>
          {showHeroSelect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowHeroSelect(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="glass-dark rounded-3xl p-6 max-w-2xl w-full border border-purple-500/30 max-h-[80vh] overflow-y-auto"
              >
                <h2 className="font-heading font-black text-2xl text-white mb-4">SELECT HERO</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {HEROES.map((hero) => (
                    <motion.button
                      key={hero.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setSelectedHero(hero); setShowHeroSelect(false); }}
                      className={`p-4 rounded-2xl text-center cursor-pointer transition-all border ${
                        selectedHero.id === hero.id
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/25'
                      }`}
                    >
                      <div className="text-4xl mb-2">{HERO_ICONS[hero.id]}</div>
                      <div className="font-heading font-bold text-white text-sm">{hero.name}</div>
                      <div className="text-slate-500 text-xs">{hero.class}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
