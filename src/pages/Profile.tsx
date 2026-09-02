import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

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
  { day: 'Mon', wins: 6, losses: 3 },
  { day: 'Tue', wins: 8, losses: 2 },
  { day: 'Wed', wins: 4, losses: 5 },
  { day: 'Thu', wins: 10, losses: 1 },
  { day: 'Fri', wins: 7, losses: 3 },
  { day: 'Sat', wins: 9, losses: 2 },
  { day: 'Sun', wins: 5, losses: 4 },
];

const RADAR_SKILLS = [
  { label: 'Damage', value: 85 },
  { label: 'Survival', value: 72 },
  { label: 'Support', value: 58 },
  { label: 'Mobility', value: 78 },
  { label: 'Crystal', value: 92 },
  { label: 'Teamwork', value: 68 },
];

const FAVORITE_HEROES = [
  { name: 'BLAZE', icon: '🔥', winRate: 67, matches: 180, class: 'Damage' },
  { name: 'VOLT', icon: '⚡', winRate: 61, matches: 120, class: 'Assassin' },
  { name: 'TITAN', icon: '🛡️', winRate: 52, matches: 90, class: 'Tank' },
];

const MATCH_HISTORY = [
  { mode: 'Crystal Clash', result: 'WIN', kills: 8, crystals: 5, trophies: '+25', time: '2 min ago' },
  { mode: 'Ranked Arena', result: 'WIN', kills: 6, crystals: 3, trophies: '+35', time: '15 min ago' },
  { mode: 'Showdown', result: 'LOSS', kills: 2, crystals: 0, trophies: '-5', time: '32 min ago' },
  { mode: 'Crystal Clash', result: 'WIN', kills: 10, crystals: 7, trophies: '+25', time: '1 hr ago' },
  { mode: 'Ranked Arena', result: 'LOSS', kills: 3, crystals: 1, trophies: '-15', time: '2 hr ago' },
];

function XPBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
        <span>XP: {current.toLocaleString()}</span>
        <span>{max.toLocaleString()} XP</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 shadow-md shadow-purple-500/50"
        />
      </div>
    </div>
  );
}

// Custom Gaming Bar Chart Component
function GamingBarChart() {
  const maxVal = 12;
  return (
    <div className="w-full pt-2">
      <div className="flex items-end justify-between gap-2 h-44 px-2">
        {HISTORY_DATA.map((item) => {
          const winH = (item.wins / maxVal) * 100;
          const lossH = (item.losses / maxVal) * 100;
          return (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <div className="w-full flex items-end justify-center gap-1 h-32 relative">
                {/* Wins Bar */}
                <div
                  className="w-3.5 sm:w-4 bg-gradient-to-t from-purple-700 to-cyan-400 rounded-t-md transition-all duration-300 group-hover:brightness-125 relative"
                  style={{ height: `${winH}%` }}
                >
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-cyan-300 bg-black/80 px-1 rounded transition-opacity pointer-events-none">
                    {item.wins}
                  </span>
                </div>
                {/* Losses Bar */}
                <div
                  className="w-3.5 sm:w-4 bg-gradient-to-t from-red-800 to-rose-500 rounded-t-md transition-all duration-300 group-hover:brightness-125 relative"
                  style={{ height: `${lossH}%` }}
                >
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-rose-300 bg-black/80 px-1 rounded transition-opacity pointer-events-none">
                    {item.losses}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-heading font-bold text-slate-400 group-hover:text-white transition-colors">
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-white/5 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-cyan-400 shadow-sm shadow-cyan-400/50" />
          <span className="text-slate-300 font-medium">Wins</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-rose-500 shadow-sm shadow-rose-500/50" />
          <span className="text-slate-300 font-medium">Losses</span>
        </div>
      </div>
    </div>
  );
}

// Custom Gaming Radar Skill Component
function GamingRadarSkill() {
  const size = 220;
  const center = size / 2;
  const radius = 75;
  const angleStep = (Math.PI * 2) / RADAR_SKILLS.length;

  const points = RADAR_SKILLS.map((skill, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (skill.value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grid Hexagons */}
        {[0.25, 0.5, 0.75, 1].map((level) => {
          const gridPoints = RADAR_SKILLS.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const r = radius * level;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ');
          return (
            <polygon
              key={level}
              points={gridPoints}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axes */}
        {RADAR_SKILLS.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Filled Data Polygon */}
        <polygon
          points={points}
          fill="rgba(0, 217, 255, 0.25)"
          stroke="#00D9FF"
          strokeWidth="2"
        />

        {/* Vertex Dots and Labels */}
        {RADAR_SKILLS.map((skill, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const r = (skill.value / 100) * radius;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          const labelX = center + (radius + 20) * Math.cos(angle);
          const labelY = center + (radius + 16) * Math.sin(angle);

          return (
            <g key={skill.label}>
              <circle cx={x} cy={y} r="3.5" fill="#00D9FF" stroke="#0a0e1a" strokeWidth="1.5" />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#94a3b8"
                fontSize="10"
                fontFamily="Orbitron, sans-serif"
                fontWeight="bold"
              >
                {skill.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'achievements'>('stats');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-md text-center border border-white/10">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-heading font-black text-2xl text-white mb-2">Access Required</h2>
          <p className="text-slate-400 text-sm mb-6">Please log in to view your gaming profile.</p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-heading font-black rounded-xl text-sm"
          >
            LOG IN
          </a>
        </div>
      </div>
    );
  }

  const winRate = ((user.wins / user.matches) * 100).toFixed(1);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 sm:p-8 border border-purple-500/20 mb-8 bg-gradient-to-br from-[#111827] via-[#0f1629] to-[#0a0e1a] shadow-2xl"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-4xl sm:text-5xl shadow-xl border border-purple-400/30">
                {user.avatar}
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-heading font-black text-xs text-black shadow-lg border-2 border-[#0a0e1a]">
                {user.level}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-3 mb-1.5">
                <h1 className="font-heading font-black text-2xl sm:text-4xl text-white tracking-wide truncate">
                  {user.username.toUpperCase()}
                </h1>
                <span className="glass px-3 py-1 rounded-full text-xs sm:text-sm text-cyan-400 font-bold border border-cyan-500/30 flex items-center gap-1.5">
                  💠 {user.rank}
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mb-3 font-mono">#BV8842</p>

              <div className="max-w-md">
                <XPBar current={user.xp} max={user.maxXp} />
              </div>
            </div>

            {/* Trophy count */}
            <div className="w-full sm:w-auto text-left sm:text-right pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="font-heading font-black text-3xl sm:text-5xl text-amber-400 flex items-center gap-2 sm:justify-end"
              >
                🏆 {user.trophies.toLocaleString()}
              </motion.div>
              <div className="text-slate-400 text-xs sm:text-sm font-heading tracking-wider mt-1">CURRENT TROPHIES</div>
              <div className="text-slate-500 text-xs mt-0.5">Highest: 12,800 🏆</div>
            </div>
          </div>
        </motion.div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { label: 'MATCHES PLAYED', value: user.matches, icon: '🎮', color: '#6C63FF' },
            { label: 'VICTORIES', value: user.wins, icon: '🏆', color: '#F59E0B' },
            { label: 'WIN RATE', value: `${winRate}%`, icon: '📊', color: '#10B981' },
            { label: 'BEST STREAK', value: '10', icon: '🔥', color: '#EF4444' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-4 sm:p-5 border border-white/8 text-center bg-[#111827]/80"
            >
              <div className="text-2xl sm:text-3xl mb-1.5">{stat.icon}</div>
              <div className="font-heading font-black text-xl sm:text-3xl mb-1" style={{ color: stat.color }}>
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </div>
              <div className="text-slate-500 text-[10px] sm:text-xs font-heading font-bold tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 glass rounded-2xl p-1.5 mb-8 w-fit border border-white/10">
          {[
            { id: 'stats', label: 'ANALYTICS' },
            { id: 'history', label: 'MATCH LOG' },
            { id: 'achievements', label: 'ACHIEVEMENTS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 sm:px-6 py-2 rounded-xl font-heading font-bold text-xs sm:text-sm tracking-wider transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Analytics Column 1 & 2 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Weekly Performance Bar Chart */}
              <div className="glass rounded-3xl p-6 border border-white/10 bg-[#111827]/80 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg text-white tracking-wide">
                    Weekly Match Results
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Last 7 Days</span>
                </div>
                <GamingBarChart />
              </div>

              {/* Radar Performance Chart */}
              <div className="glass rounded-3xl p-6 border border-white/10 bg-[#111827]/80 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-bold text-lg text-white tracking-wide">
                    Player Performance Radar
                  </h3>
                  <span className="text-xs text-cyan-400 font-bold">PRO TIER</span>
                </div>
                <GamingRadarSkill />
              </div>
            </div>

            {/* Column 3: Favorite Heroes & Career */}
            <div className="space-y-6">
              <div className="glass rounded-3xl p-6 border border-white/10 bg-[#111827]/80 shadow-xl">
                <h3 className="font-heading font-bold text-lg text-white mb-4 tracking-wide">Favorite Heroes</h3>
                <div className="space-y-3">
                  {FAVORITE_HEROES.map((h) => (
                    <div key={h.name} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-colors">
                      <div className="text-3xl">{h.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-heading font-bold text-white text-sm truncate">{h.name}</div>
                        <div className="text-slate-500 text-xs">{h.matches} matches • {h.class}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-heading font-bold text-green-400 text-sm">{h.winRate}%</div>
                        <div className="text-slate-500 text-[10px]">WIN RATE</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-3xl p-6 border border-white/10 bg-[#111827]/80 shadow-xl">
                <h3 className="font-heading font-bold text-lg text-white mb-4 tracking-wide">Career Highlights</h3>
                {[
                  { label: 'Most Kills (Single Match)', value: '15', icon: '⚔️' },
                  { label: 'Longest Win Streak', value: '10', icon: '🔥' },
                  { label: 'Best Rank Achieved', value: 'Diamond I', icon: '💠' },
                  { label: 'Total Crystals Collected', value: '8,240', icon: '💎' },
                  { label: 'Highest Trophies', value: '12,800', icon: '🏆' },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                    <span className="text-slate-400 text-xs sm:text-sm flex items-center gap-2">
                      <span>{s.icon}</span>{s.label}
                    </span>
                    <span className="font-heading font-bold text-white text-xs sm:text-sm">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="glass rounded-3xl border border-white/10 overflow-hidden bg-[#111827]/90 shadow-2xl">
            <div className="grid grid-cols-5 gap-2 px-6 py-4 border-b border-white/10 text-slate-400 text-xs font-heading font-bold tracking-widest bg-white/[0.02]">
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
                transition={{ delay: i * 0.05 }}
                className={`grid grid-cols-5 gap-2 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors items-center ${
                  m.result === 'WIN' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
                }`}
              >
                <div>
                  <div className="text-white text-sm font-semibold">{m.mode}</div>
                  <div className="text-[11px] text-slate-500">{m.time}</div>
                </div>
                <div>
                  <span className={`font-heading font-black text-xs px-2.5 py-1 rounded-full ${
                    m.result === 'WIN' ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}>
                    {m.result}
                  </span>
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`glass rounded-2xl p-5 border text-center transition-all ${
                  a.unlocked
                    ? 'border-amber-500/30 bg-amber-500/5 shadow-lg shadow-amber-500/10'
                    : 'border-white/5 bg-white/[0.02] opacity-50'
                }`}
              >
                <div className={`text-4xl sm:text-5xl mb-3 ${a.unlocked ? '' : 'grayscale opacity-30'}`}>{a.icon}</div>
                <h4 className={`font-heading font-bold text-sm sm:text-base mb-1 ${a.unlocked ? 'text-white' : 'text-slate-500'}`}>{a.name}</h4>
                <p className="text-slate-400 text-xs mb-3">{a.desc}</p>
                {a.unlocked ? (
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-heading font-black text-amber-400 bg-amber-500/10 border border-amber-500/30">
                    ✓ UNLOCKED
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-heading font-bold text-slate-600 bg-white/5">
                    🔒 LOCKED
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
