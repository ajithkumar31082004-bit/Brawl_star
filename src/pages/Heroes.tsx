import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { HEROES } from '../data/heroes';
import type { Hero } from '../data/heroes';
import { HeroCard } from '../components/hero/HeroCard';

const CLASSES = ['ALL', 'DAMAGE', 'ASSASSIN', 'TANK', 'SUPPORT', 'CONTROLLER'];
const RARITIES = ['All', 'Legendary', 'Epic', 'Super Rare', 'Rare'];

const CLASS_COLORS: Record<string, string> = {
  ALL: '#6C63FF',
  DAMAGE: '#EF4444',
  ASSASSIN: '#3B82F6',
  TANK: '#10B981',
  SUPPORT: '#A855F7',
  CONTROLLER: '#06B6D4',
};

export const Heroes: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedRarity, setSelectedRarity] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'attack' | 'health'>('name');

  const filtered = HEROES.filter((h) => {
    const matchClass = selectedClass === 'ALL' || h.class.toUpperCase() === selectedClass;
    const matchRarity = selectedRarity === 'All' || h.rarity === selectedRarity;
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchRarity && matchSearch;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'attack') return b.attack - a.attack;
    if (sortBy === 'health') return b.health - a.health;
    return 0;
  });

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full mb-4 border border-purple-500/30">
            <span className="text-sm font-medium text-slate-300">⚔️ {HEROES.length} Original Heroes</span>
          </div>
          <h1 className="font-heading font-black text-5xl sm:text-6xl text-white mb-4">
            CHOOSE YOUR <span className="text-[#00D9FF]">HERO</span>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto text-lg">
            Each hero has unique abilities, playstyles, and stats. Find the perfect champion for your team.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <motion.aside
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:w-56 flex-shrink-0"
          >
            <div className="glass rounded-2xl p-5 border border-white/8 sticky top-24">
              <h3 className="font-heading font-bold text-sm text-slate-300 tracking-widest uppercase mb-4">Class</h3>
              <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
                {CLASSES.map((cls) => {
                  const color = CLASS_COLORS[cls];
                  const active = selectedClass === cls;
                  return (
                    <motion.button
                      key={cls}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedClass(cls)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-heading font-semibold tracking-wider whitespace-nowrap transition-all ${
                        active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                      style={active ? { backgroundColor: `${color}20`, color, border: `1px solid ${color}40` } : {}}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: active ? color : '#475569' }} />
                      {cls}
                      {active && (
                        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${color}30` }}>
                          {cls === 'ALL' ? HEROES.length : HEROES.filter(h => h.class.toUpperCase() === cls).length}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="border-t border-white/8 my-4" />

              <h3 className="font-heading font-bold text-sm text-slate-300 tracking-widest uppercase mb-4">Rarity</h3>
              <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
                {RARITIES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRarity(r)}
                    className={`px-3 py-2 rounded-xl text-sm font-heading font-semibold transition-all whitespace-nowrap ${
                      selectedRarity === r
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>

          {/* Main content */}
          <div className="flex-1">
            {/* Search + Sort bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col sm:flex-row gap-3 mb-6"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search heroes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 text-sm"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-purple-500/60 cursor-pointer"
              >
                <option value="name">Sort: Name</option>
                <option value="attack">Sort: Attack</option>
                <option value="health">Sort: Health</option>
              </select>
            </motion.div>

            {/* Hero count */}
            <p className="text-slate-500 text-sm mb-4 font-medium">{filtered.length} hero{filtered.length !== 1 ? 'es' : ''} found</p>

            {/* Hero grid */}
            <AnimatePresence mode="wait">
              {filtered.length > 0 ? (
                <motion.div
                  key={`${selectedClass}-${selectedRarity}-${search}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                  {filtered.map((hero, i) => (
                    <HeroCard key={hero.id} hero={hero} index={i} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass rounded-2xl p-16 text-center border border-white/8"
                >
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="font-heading font-bold text-xl text-white mb-2">No Heroes Found</h3>
                  <p className="text-slate-400">Try adjusting your filters or search term.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
