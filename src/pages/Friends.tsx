import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, MessageCircle, X, UserMinus, Shield } from 'lucide-react';
import { FRIENDS_DATA } from '../data/leaderboard';
import { useAuthStore } from '../store/authStore';

const STATUS_CONFIG = {
  online: { label: 'ONLINE', color: '#10B981', dot: 'bg-green-400' },
  offline: { label: 'OFFLINE', color: '#6B7280', dot: 'bg-gray-400' },
  ingame: { label: 'IN GAME', color: '#F59E0B', dot: 'bg-amber-400' },
};

const TABS = ['FRIENDS', 'ONLINE', 'IN GAME', 'INVITES', 'RECENT'];

const HERO_ICONS: Record<string, string> = {
  BLAZE: '🔥', VOLT: '⚡', TITAN: '🛡️', FROST: '❄️',
  ROCKET: '🚀', LUNA: '🌙', BUSTER: '👊', PICO: '🤖',
};

const AVATAR_BG = ['from-purple-600 to-blue-600', 'from-red-600 to-orange-600', 'from-green-600 to-teal-600', 'from-pink-600 to-purple-600', 'from-blue-600 to-cyan-600', 'from-amber-600 to-orange-600'];

export const Friends: React.FC = () => {
  const [activeTab, setActiveTab] = useState('FRIENDS');
  const [invitedIds, setInvitedIds] = useState<Set<number>>(new Set());
  const [addInput, setAddInput] = useState('');
  const [addStatus, setAddStatus] = useState('');
  const { user } = useAuthStore();

  const filteredFriends = FRIENDS_DATA.filter((f) => {
    if (activeTab === 'FRIENDS') return true;
    if (activeTab === 'ONLINE') return f.status === 'online';
    if (activeTab === 'IN GAME') return f.status === 'ingame';
    if (activeTab === 'INVITES') return false;
    if (activeTab === 'RECENT') return true;
    return true;
  });

  const handleInvite = (id: number) => {
    setInvitedIds(prev => new Set([...prev, id]));
  };

  const handleAddFriend = () => {
    if (!addInput.trim()) return;
    setAddStatus(`✅ Friend request sent to "${addInput}"!`);
    setAddInput('');
    setTimeout(() => setAddStatus(''), 3000);
  };

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-heading font-black text-5xl sm:text-6xl text-white mb-2">
              YOUR <span className="text-[#00D9FF]">FRIENDS</span>
            </h1>
            <p className="text-slate-400 text-lg">{FRIENDS_DATA.filter(f => f.status === 'online').length} friends online right now</p>
          </div>
          {/* Add friend */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by username..."
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
              className="bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/60 w-48 sm:w-64"
            />
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAddFriend}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-black rounded-xl font-heading font-bold text-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              ADD
            </motion.button>
          </div>
        </motion.div>

        {addStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-3 border border-green-500/30 text-green-400 font-bold text-sm mb-4"
          >
            {addStatus}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 glass rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-heading font-bold text-xs tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
              {tab === 'INVITES' && <span className="ml-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] inline-flex items-center justify-center">2</span>}
            </button>
          ))}
        </div>

        {/* Friend list */}
        <div className="space-y-3">
          {filteredFriends.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center border border-white/8">
              <div className="text-5xl mb-3">👥</div>
              <h3 className="font-heading font-bold text-xl text-white mb-2">No friends here</h3>
              <p className="text-slate-400 text-sm">Add friends using the search above!</p>
            </div>
          ) : (
            filteredFriends.map((friend, i) => {
              const status = STATUS_CONFIG[friend.status];
              const isInvited = invitedIds.has(friend.id);
              const avatarBg = AVATAR_BG[i % AVATAR_BG.length];

              return (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ x: 4 }}
                  className="glass rounded-2xl p-4 border border-white/8 hover:border-white/18 transition-all flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarBg} flex items-center justify-center font-heading font-black text-lg`}>
                      {friend.username.charAt(0)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${status.dot} border-2 border-[#0a0e1a]`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold text-white text-base">{friend.username}</span>
                      <span className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-full" style={{ color: status.color, backgroundColor: `${status.color}20`, border: `1px solid ${status.color}40` }}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-amber-400 text-sm font-medium">🏆 {friend.trophies.toLocaleString()}</span>
                      <span className="text-slate-500 text-xs">Playing {HERO_ICONS[friend.hero] || '⚔️'} {friend.hero}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={() => handleInvite(friend.id)}
                      disabled={isInvited || friend.status === 'offline'}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-heading font-bold text-xs cursor-pointer transition-all ${
                        isInvited
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : friend.status === 'offline'
                          ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                          : 'bg-purple-600/80 hover:bg-purple-600 text-white'
                      }`}
                    >
                      {isInvited ? '✓ INVITED' : (
                        <><MessageCircle className="w-3 h-3" /> INVITE</>
                      )}
                    </motion.button>
                    <button className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Share code */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 glass rounded-2xl p-5 border border-purple-500/20 text-center"
        >
          <div className="text-2xl mb-2">🔗</div>
          <h3 className="font-heading font-bold text-lg text-white mb-1">Invite Friends</h3>
          <p className="text-slate-400 text-sm mb-4">Share your code and earn 500 coins for every friend who joins!</p>
          <div className="flex items-center justify-center gap-2">
            <div className="glass px-4 py-2.5 rounded-xl font-heading font-bold text-cyan-400 text-sm border border-cyan-500/30 tracking-widest">
              BVERSE-AJITH-8842
            </div>
            <button className="px-4 py-2.5 bg-cyan-500 text-black rounded-xl font-heading font-bold text-sm cursor-pointer hover:bg-cyan-400 transition-colors">
              COPY
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
