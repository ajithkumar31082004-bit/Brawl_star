import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, TrendingUp, Star } from 'lucide-react';
import { LEADERBOARD_DATA } from '../data/leaderboard';

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const RANK_TIER: Record<string, { label: string; color: string; emoji: string }> = {
  'Diamond I': { label: 'Diamond I', color: '#3B82F6', emoji: '💠' },
  'Master': { label: 'Master', color: '#A855F7', emoji: '👑' },
  'Legend': { label: 'Legend', color: '#F59E0B', emoji: '⭐' },
};

const TABS = ['GLOBAL', 'LOCAL', 'FRIENDS'];

const SEASON_REWARDS = [
  { tier: 'Bronze', emoji: '🥉', trophies: '0 - 5,000', reward: '500 Coins' },
  { tier: 'Silver', emoji: '🥈', trophies: '5,000 - 10,000', reward: '1,200 Coins' },
  { tier: 'Gold', emoji: '🥇', trophies: '10,000 - 15,000', reward: '2,500 Coins + Skin' },
  { tier: 'Diamond', emoji: '💠', trophies: '15,000+', reward: 'Exclusive Skin + Title' },
];

export const Ranking: React.FC = () => {
  const [activeTab, setActiveTab] = useState('GLOBAL');

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-heading font-black text-5xl sm:text-6xl text-white mb-4">
            GLOBAL <span className="text-[#F59E0B]">RANKING</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto">
            Only the strongest rise to the top. Where do you stand?
          </p>
        </motion.div>

        {/* Season banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-6 border border-blue-500/20 mb-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl">💠</div>
              <div>
                <div className="font-heading font-black text-2xl text-white">SEASON 7</div>
                <div className="text-slate-400 text-sm">Ends in: <span className="text-cyan-400 font-bold">14 days 20 hours</span></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-slate-400 text-xs">Your Rank</div>
                <div className="font-heading font-black text-2xl text-[#3B82F6]">💠 Diamond I</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-xs">Season Points</div>
                <div className="font-heading font-black text-2xl text-amber-400">6,300 / 7,000</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-1 glass rounded-xl p-1 mb-4 w-fit">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg font-heading font-bold text-sm tracking-wider transition-all cursor-pointer ${
                    activeTab === tab ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-slate-500 text-xs font-heading font-bold tracking-widest uppercase mb-2">
              <div className="col-span-1">#</div>
              <div className="col-span-5">PLAYER</div>
              <div className="col-span-2 text-right">TROPHIES</div>
              <div className="col-span-2 text-right hidden sm:block">WINS</div>
              <div className="col-span-2 text-right hidden sm:block">WIN RATE</div>
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {LEADERBOARD_DATA.map((entry, i) => (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`grid grid-cols-12 gap-2 items-center px-4 py-3.5 rounded-xl transition-all ${
                    entry.isCurrentUser
                      ? 'bg-purple-600/15 border border-purple-500/40'
                      : 'glass border border-white/5 hover:border-white/15'
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-1">
                    {RANK_MEDAL[entry.rank] ? (
                      <span className="text-xl">{RANK_MEDAL[entry.rank]}</span>
                    ) : (
                      <span className={`font-heading font-black text-sm ${entry.isCurrentUser ? 'text-purple-400' : 'text-slate-400'}`}>
                        #{entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Player */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                      ${entry.rank <= 3 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
                      {entry.username.charAt(0)}
                    </div>
                    <div>
                      <div className={`font-heading font-bold text-sm flex items-center gap-1.5 ${entry.isCurrentUser ? 'text-purple-300' : 'text-white'}`}>
                        {entry.username}
                        {entry.isCurrentUser && <span className="text-[10px] glass px-1.5 py-0.5 rounded text-purple-400">YOU</span>}
                      </div>
                      <div className="text-slate-500 text-xs">{entry.country}</div>
                    </div>
                  </div>

                  {/* Trophies */}
                  <div className="col-span-2 text-right">
                    <span className="font-heading font-black text-amber-400 text-sm">🏆 {entry.trophies.toLocaleString()}</span>
                  </div>

                  {/* Victories */}
                  <div className="col-span-2 text-right hidden sm:block">
                    <span className="font-heading font-bold text-green-400 text-sm">{entry.victories.toLocaleString()}</span>
                  </div>

                  {/* Win rate */}
                  <div className="col-span-2 text-right hidden sm:block">
                    <span className={`font-heading font-bold text-sm ${entry.winRate >= 70 ? 'text-green-400' : entry.winRate >= 55 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {entry.winRate}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Season Rewards */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-5 border border-white/8"
            >
              <h3 className="font-heading font-bold text-lg text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                SEASON REWARDS
              </h3>
              <div className="space-y-3">
                {SEASON_REWARDS.map((r, i) => (
                  <motion.div
                    key={r.tier}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-xl ${i === 2 ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-white/5'}`}
                  >
                    <span className="text-2xl">{r.emoji}</span>
                    <div className="flex-1">
                      <div className="font-heading font-bold text-sm text-white">{r.tier}</div>
                      <div className="text-slate-500 text-xs">{r.trophies}</div>
                    </div>
                    <div className="text-xs font-bold text-amber-400">{r.reward}</div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-white/8">
                <button className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-heading font-black text-sm text-black cursor-pointer hover:from-amber-400 hover:to-orange-400 transition-all">
                  LEADERBOARD REWARDS
                </button>
              </div>
            </motion.div>

            {/* Your rank card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-2xl p-5 border border-purple-500/20 mt-4"
            >
              <h3 className="font-heading font-bold text-sm text-slate-400 tracking-wider uppercase mb-3">YOUR STATS</h3>
              {[
                { label: 'Global Rank', value: '#3', color: '#A855F7' },
                { label: 'Trophies', value: '12,540', color: '#F59E0B' },
                { label: 'Win Rate', value: '58.8%', color: '#10B981' },
                { label: 'Best Rank', value: 'Diamond I', color: '#3B82F6' },
              ].map((s) => (
                <div key={s.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-slate-400 text-sm">{s.label}</span>
                  <span className="font-heading font-bold text-sm" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
