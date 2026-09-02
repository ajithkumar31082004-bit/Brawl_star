import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

const ACHIEVEMENTS = [
  { id: 1, name: 'Champion', desc: 'Win 100 matches', icon: '🏆', unlocked: true },
  { id: 2, name: 'Gem Collector', desc: 'Collect 50 crystals', icon: '💎', unlocked: true },
  { id: 3, name: '10 Win Streak', desc: 'Win 10 matches in a row', icon: '🔥', unlocked: true },
  { id: 4, name: 'Arena Master', desc: 'Play 500 matches', icon: '⚔️', unlocked: true },
  { id: 5, name: 'Diamond Rank', desc: 'Reach Diamond rank', icon: '💠', unlocked: true },
  { id: 6, name: 'Legend', desc: 'Reach Legend rank', icon: '⭐', unlocked: false },
  { id: 7, name: 'Perfect Game', desc: 'Win without taking damage', icon: '🛡️', unlocked: false },
  { id: 8, name: 'Unstoppable', desc: 'Win 50 ranked matches', icon: '💪', unlocked: false },
];

const HISTORY_DATA = [
  { name: 'Mon', wins: 6, losses: 3 },
  { name: 'Tue', wins: 8, losses: 2 },
  { name: 'Wed', wins: 4, losses: 5 },
  { name: 'Thu', wins: 10, losses: 1 },
  { name: 'Fri', wins: 7, losses: 3 },
  { name: 'Sat', wins: 9, losses: 2 },
  { name: 'Sun', wins: 5, losses: 4 },
];

const RADAR_DATA = [
  { subject: 'Damage', A: 85 },
  { subject: 'Survival', A: 72 },
  { subject: 'Support', A: 58 },
  { subject: 'Mobility', A: 78 },
  { subject: 'Crystal', A: 91 },
  { subject: 'Teamwork', A: 68 },
];

const FAVORITE_HEROES = [
  { name: 'BLAZE', icon: '🔥', winRate: 67, matches: 180 },
  { name: 'VOLT', icon: '⚡', winRate: 61, matches: 120 },
  { name: 'TITAN', icon: '🛡️', winRate: 52, matches: 90 },
];

const MATCH_HISTORY = [
  { mode: 'Crystal Clash', result: 'WIN', kills: 8, crystals: 5, trophies: '+25', time: '2 min ago' },
  { mode: 'Ranked Arena', result: 'WIN', kills: 6, crystals: 3, trophies: '+35', time: '15 min ago' },
  { mode: 'Showdown', result: 'LOSS', kills: 2, crystals: 0, trophies: '-5', time: '32 min ago' },
  { mode: 'Crystal Clash', result: 'WIN', kills: 10, crystals: 7, trophies: '+25', time: '1 hr ago' },
  { mode: 'Ranked Arena', result: 'LOSS', kills: 3, crystals: 1, trophies: '-15', time: '2 hr ago' },
];

function XPBar({ current, max }: { current: number; max: number }) {
  const pct = (current / max) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
        <span>XP: {current.toLocaleString()}</span>
        <span>{max.toLocaleString()} XP</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500"
        />
      </div>
    </div>
  );
}

export const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'achievements'>('stats');

  if (!user) return null;
  const winRate = ((user.wins / user.matches) * 100).toFixed(1);

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 sm:p-8 border border-white/8 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-5xl shadow-xl">
                {user.avatar}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-heading font-black text-xs text-black shadow-lg">
                {user.level}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start flex-wrap gap-3 mb-2">
                <h1 className="font-heading font-black text-3xl sm:text-4xl text-white">{user.username.toUpperCase()}</h1>
                <span className="glass px-3 py-1 rounded-full text-sm text-purple-400 font-medium border border-purple-500/30">
                  💠 {user.rank}
                </span>
              </div>
              <p className="text-slate-500 text-sm mb-4 font-mono">#BV8842</p>

              <div className="max-w-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-slate-400 text-sm">Level {user.level}</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-slate-400 text-sm">Level {user.level + 1}</span>
                </div>
                <XPBar current={user.xp} max={user.maxXp} />
              </div>
            </div>

            {/* Trophy count */}
            <div className="text-center sm:text-right">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="font-heading font-black text-4xl sm:text-5xl text-amber-400 flex items-center gap-2 justify-center sm:justify-end"
              >
                🏆 {user.trophies.toLocaleString()}
              </motion.div>
              <div className="text-slate-400 text-sm mt-1">TROPHIES</div>
              <div className="text-slate-500 text-xs mt-0.5">Highest: 12,800 🏆</div>
            </div>
          </div>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'MATCHES PLAYED', value: user.matches, icon: '🎮', color: '#6C63FF' },
            { label: 'VICTORIES', value: user.wins, icon: '🏆', color: '#F59E0B' },
            { label: 'WIN RATE', value: `${winRate}%`, icon: '📊', color: '#10B981' },
            { label: 'BEST STREAK', value: '10', icon: '🔥', color: '#EF4444' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              className="glass rounded-2xl p-5 border border-white/8 text-center"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="font-heading font-black text-2xl sm:text-3xl mb-1" style={{ color: stat.color }}>
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </div>
              <div className="text-slate-500 text-xs font-heading tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
          {['stats', 'history', 'achievements'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-5 py-2 rounded-lg font-heading font-bold text-sm tracking-wider transition-all cursor-pointer ${
                activeTab === tab ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Win/Loss chart */}
              <div className="glass rounded-2xl p-5 border border-white/8">
                <h3 className="font-heading font-bold text-white mb-4">This Week — Win/Loss</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={HISTORY_DATA}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9' }} />
                    <Bar dataKey="wins" fill="#6C63FF" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="losses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Radar chart */}
              <div className="glass rounded-2xl p-5 border border-white/8">
                <h3 className="font-heading font-bold text-white mb-4">Player Performance Profile</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={RADAR_DATA}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Radar name="Stats" dataKey="A" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Favorite Heroes + More stats */}
            <div className="space-y-6">
              <div className="glass rounded-2xl p-5 border border-white/8">
                <h3 className="font-heading font-bold text-white mb-4">Favorite Heroes</h3>
                <div className="space-y-3">
                  {FAVORITE_HEROES.map((h) => (
                    <div key={h.name} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <div className="text-3xl">{h.icon}</div>
                      <div className="flex-1">
                        <div className="font-heading font-bold text-white text-sm">{h.name}</div>
                        <div className="text-slate-500 text-xs">{h.matches} matches</div>
                      </div>
                      <div className="text-right">
                        <div className="font-heading font-bold text-green-400 text-sm">{h.winRate}%</div>
                        <div className="text-slate-600 text-xs">Win</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-5 border border-white/8">
                <h3 className="font-heading font-bold text-white mb-4">Career Stats</h3>
                {[
                  { label: 'Most Kills (Single Game)', value: '15', icon: '⚔️' },
                  { label: 'Longest Win Streak', value: '10', icon: '🔥' },
                  { label: 'Best Rank', value: 'Diamond I', icon: '💠' },
                  { label: 'Total Crystals', value: '8,240', icon: '💎' },
                  { label: 'Highest Trophies', value: '12,800', icon: '🏆' },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                    <span className="text-slate-400 text-sm flex items-center gap-2"><span>{s.icon}</span>{s.label}</span>
                    <span className="font-heading font-bold text-white text-sm">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="glass rounded-2xl border border-white/8 overflow-hidden">
            <div className="grid grid-cols-5 gap-2 px-6 py-3 border-b border-white/8 text-slate-500 text-xs font-heading font-bold tracking-widest">
              <div>MODE</div>
              <div>RESULT</div>
              <div className="text-center">KILLS</div>
              <div className="text-center">CRYSTALS</div>
              <div className="text-right">TROPHIES</div>
            </div>
            {MATCH_HISTORY.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`grid grid-cols-5 gap-2 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${
                  m.result === 'WIN' ? 'border-l-2 border-l-green-500' : 'border-l-2 border-l-red-500'
                }`}
              >
                <div className="text-slate-300 text-sm font-medium">{m.mode}</div>
                <div className={`font-heading font-black text-sm ${m.result === 'WIN' ? 'text-green-400' : 'text-red-400'}`}>
                  {m.result}
                </div>
                <div className="text-center text-white text-sm font-bold">{m.kills}</div>
                <div className="text-center text-cyan-400 text-sm font-bold">💎 {m.crystals}</div>
                <div className={`text-right font-heading font-black text-sm ${m.trophies.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {m.trophies}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ACHIEVEMENTS.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className={`glass rounded-2xl p-5 border text-center transition-all ${
                  a.unlocked ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5 opacity-50'
                }`}
              >
                <div className={`text-5xl mb-3 ${a.unlocked ? '' : 'grayscale opacity-40'}`}>{a.icon}</div>
                <h4 className={`font-heading font-bold text-base mb-1 ${a.unlocked ? 'text-white' : 'text-slate-500'}`}>{a.name}</h4>
                <p className="text-slate-500 text-xs">{a.desc}</p>
                {a.unlocked && <div className="mt-3 text-xs font-heading font-bold text-amber-400">✓ UNLOCKED</div>}
                {!a.unlocked && <div className="mt-3 text-xs font-heading font-bold text-slate-600">🔒 LOCKED</div>}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
