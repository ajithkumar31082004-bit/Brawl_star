import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { EVENTS } from '../data/events';

function Countdown({ days, hours, minutes }: { days: number; hours: number; minutes: number }) {
  const [time, setTime] = useState({ days, hours, minutes, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; days--; }
        if (days < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const units = [
    { label: 'DAYS', value: time.days },
    { label: 'HOURS', value: time.hours },
    { label: 'MINS', value: time.minutes },
    { label: 'SECS', value: time.seconds },
  ];

  return (
    <div className="flex items-center gap-2">
      {units.map((u, i) => (
        <React.Fragment key={u.label}>
          <div className="text-center">
            <div className="glass rounded-lg px-2.5 py-1.5 font-heading font-black text-xl text-white min-w-10 text-center">
              {String(u.value).padStart(2, '0')}
            </div>
            <div className="text-[9px] text-slate-500 font-heading tracking-widest mt-1 text-center">{u.label}</div>
          </div>
          {i < 3 && <span className="text-slate-500 font-black text-xl mb-3">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

export const Events: React.FC = () => {
  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full mb-4 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-medium text-amber-300">🔥 5 Active Events</span>
          </div>
          <h1 className="font-heading font-black text-5xl sm:text-6xl text-white mb-4">
            SPECIAL <span className="text-[#F59E0B]">EVENTS</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto">
            Limited-time events with exclusive rewards. Don't miss out!
          </p>
        </motion.div>

        {/* Featured Event */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-3xl overflow-hidden mb-8 border border-amber-500/30"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-orange-600/10 to-[#0f1629]" />
          <div className="absolute inset-0 bg-[#0f1629]/80" />
          <div className="relative p-8 sm:p-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="text-7xl sm:text-8xl">{EVENTS[0].emoji}</div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-heading font-black bg-amber-500 text-black">FEATURED</span>
                    <span className="px-3 py-1 rounded-full text-xs font-heading font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">{EVENTS[0].multiplier} MULTIPLIER</span>
                  </div>
                  <h2 className="font-heading font-black text-3xl sm:text-4xl text-white mb-2">{EVENTS[0].name}</h2>
                  <p className="text-slate-300 text-base max-w-lg">{EVENTS[0].description}</p>
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-3">
                <div className="text-slate-400 text-sm font-medium flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> ENDS IN:
                </div>
                <Countdown {...EVENTS[0].endsIn} />
                <button className="mt-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-xl font-heading font-black text-sm cursor-pointer hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/30">
                  PARTICIPATE NOW
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Event grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {EVENTS.slice(1).map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all group cursor-pointer"
            >
              <div className="absolute inset-0 bg-[#0f1629]" />
              <div className={`absolute inset-0 bg-gradient-to-br ${event.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${event.gradient}`} />

              <div className="relative p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${event.gradient} flex items-center justify-center text-3xl flex-shrink-0`}>
                    {event.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-heading font-black px-2 py-0.5 rounded-full bg-white/10 text-white">{event.badge}</span>
                    </div>
                    <h3 className="font-heading font-black text-xl text-white">{event.name}</h3>
                  </div>
                </div>

                <p className="text-slate-400 text-sm mb-4 leading-relaxed">{event.description}</p>

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> ENDS IN:
                    </div>
                    <Countdown {...event.endsIn} />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">REWARD</div>
                    <div className="font-heading font-black text-lg text-amber-400">🏆 {event.rewardAmount}</div>
                    <div className="text-xs text-slate-500">{event.reward}</div>
                  </div>
                </div>

                <button className={`w-full mt-4 py-2.5 rounded-xl font-heading font-bold text-sm cursor-pointer bg-gradient-to-r ${event.gradient} text-white shadow-lg hover:opacity-90 transition-opacity`}>
                  JOIN EVENT
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View all */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-10"
        >
          <button className="px-8 py-3.5 glass border border-white/20 rounded-xl font-heading font-bold text-white hover:border-white/40 transition-all cursor-pointer">
            VIEW ALL EVENTS
          </button>
        </motion.div>
      </div>
    </div>
  );
};
