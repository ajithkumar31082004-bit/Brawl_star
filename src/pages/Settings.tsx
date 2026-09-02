import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Bell, BellOff, Globe, LogOut, ChevronRight, Shield, User, Headphones, Settings2, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-all cursor-pointer duration-300 ${enabled ? 'bg-purple-600' : 'bg-white/20'}`}
    >
      <motion.div
        animate={{ x: enabled ? 24 : 4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
      />
    </button>
  );
}

const SECTIONS = [
  { id: 'general', label: 'GENERAL', icon: <Settings2 className="w-4 h-4" /> },
  { id: 'controls', label: 'CONTROLS', icon: <Globe className="w-4 h-4" /> },
  { id: 'sound', label: 'SOUND', icon: <Volume2 className="w-4 h-4" /> },
  { id: 'notifications', label: 'NOTIFICATIONS', icon: <Bell className="w-4 h-4" /> },
  { id: 'account', label: 'ACCOUNT', icon: <User className="w-4 h-4" /> },
  { id: 'support', label: 'SUPPORT', icon: <HelpCircle className="w-4 h-4" /> },
];

function SettingRow({ label, children, desc }: { label: string; children: React.ReactNode; desc?: string }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div>
        <div className="text-white font-medium text-sm">{label}</div>
        {desc && <div className="text-slate-500 text-xs mt-0.5">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

export const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
    music: true,
    sfx: true,
    notifications: true,
    showNames: true,
    haptic: true,
    autoAim: false,
    qualityFps: true,
    pushAlerts: false,
    friendRequests: true,
    matchInvites: true,
  });
  const [language, setLanguage] = useState('English');
  const [region, setRegion] = useState('India (IN)');

  const toggle = (key: keyof typeof settings) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-heading font-black text-5xl text-white mb-2">SETTINGS</h1>
          <p className="text-slate-400">Customize your BATTLEVERSE experience</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-52 flex-shrink-0"
          >
            <div className="glass rounded-2xl p-3 border border-white/8">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-heading font-semibold text-sm tracking-wider mb-1 last:mb-0 transition-all cursor-pointer text-left ${
                    activeSection === s.id
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>
          </motion.aside>

          {/* Content */}
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 glass rounded-2xl p-6 border border-white/8"
          >
            {activeSection === 'general' && (
              <div>
                <h2 className="font-heading font-bold text-xl text-white mb-6">General Settings</h2>
                <SettingRow label="Show Player Names" desc="Display names above heroes in game">
                  <Toggle enabled={settings.showNames} onChange={() => toggle('showNames')} />
                </SettingRow>
                <SettingRow label="High FPS Mode" desc="Enable 60 FPS for smoother gameplay">
                  <Toggle enabled={settings.qualityFps} onChange={() => toggle('qualityFps')} />
                </SettingRow>
                <SettingRow label="Language">
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="bg-[#1a2035] border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none cursor-pointer"
                  >
                    {['English', 'Hindi', 'Tamil', 'Spanish', 'French', 'German', 'Japanese', 'Korean'].map(l => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </SettingRow>
                <SettingRow label="Region">
                  <select
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    className="bg-[#1a2035] border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none cursor-pointer"
                  >
                    {['India (IN)', 'USA (US)', 'Europe (EU)', 'Asia (AS)', 'Brazil (BR)'].map(r => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </SettingRow>
              </div>
            )}

            {activeSection === 'controls' && (
              <div>
                <h2 className="font-heading font-bold text-xl text-white mb-6">Controls</h2>
                <SettingRow label="Haptic Feedback" desc="Vibration feedback on mobile">
                  <Toggle enabled={settings.haptic} onChange={() => toggle('haptic')} />
                </SettingRow>
                <SettingRow label="Auto-Aim Assist" desc="Slight aim correction towards enemies">
                  <Toggle enabled={settings.autoAim} onChange={() => toggle('autoAim')} />
                </SettingRow>
                <div className="mt-6">
                  <h3 className="font-heading font-bold text-sm text-slate-400 tracking-wider uppercase mb-3">Desktop Key Bindings</h3>
                  {[
                    { action: 'Move', key: 'WASD' },
                    { action: 'Aim', key: 'Mouse' },
                    { action: 'Attack', key: 'Left Click' },
                    { action: 'Super', key: 'Right Click' },
                    { action: 'Dash', key: 'Space' },
                    { action: 'Emote', key: 'E' },
                  ].map((k) => (
                    <div key={k.action} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                      <span className="text-slate-400 text-sm">{k.action}</span>
                      <kbd className="glass px-3 py-1 rounded-lg font-mono text-sm text-white border border-white/20">{k.key}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'sound' && (
              <div>
                <h2 className="font-heading font-bold text-xl text-white mb-6">Sound Settings</h2>
                <SettingRow label="Music" desc="Background music and lobby themes">
                  <Toggle enabled={settings.music} onChange={() => toggle('music')} />
                </SettingRow>
                <SettingRow label="Sound Effects" desc="Attack, explosion, and UI sounds">
                  <Toggle enabled={settings.sfx} onChange={() => toggle('sfx')} />
                </SettingRow>
                <div className="mt-4 space-y-4">
                  {[
                    { label: 'Music Volume', value: 70 },
                    { label: 'Effects Volume', value: 85 },
                    { label: 'Voice Volume', value: 60 },
                  ].map((v) => (
                    <div key={v.label}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">{v.label}</span>
                        <span className="text-white font-bold">{v.value}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        defaultValue={v.value}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div>
                <h2 className="font-heading font-bold text-xl text-white mb-6">Notifications</h2>
                <SettingRow label="All Notifications" desc="Master notification toggle">
                  <Toggle enabled={settings.notifications} onChange={() => toggle('notifications')} />
                </SettingRow>
                <SettingRow label="Friend Requests" desc="When someone adds you as a friend">
                  <Toggle enabled={settings.friendRequests} onChange={() => toggle('friendRequests')} />
                </SettingRow>
                <SettingRow label="Match Invites" desc="When a friend invites you to play">
                  <Toggle enabled={settings.matchInvites} onChange={() => toggle('matchInvites')} />
                </SettingRow>
                <SettingRow label="Push Alerts" desc="Receive alerts when the app is closed">
                  <Toggle enabled={settings.pushAlerts} onChange={() => toggle('pushAlerts')} />
                </SettingRow>
              </div>
            )}

            {activeSection === 'account' && (
              <div>
                <h2 className="font-heading font-bold text-xl text-white mb-6">Account Settings</h2>
                {user && (
                  <div className="glass rounded-xl p-4 border border-white/8 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-2xl">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="font-heading font-bold text-white">{user.username}</div>
                        <div className="text-slate-400 text-sm">{user.email}</div>
                      </div>
                    </div>
                  </div>
                )}
                {[
                  { label: 'Change Username', chevron: true },
                  { label: 'Change Email', chevron: true },
                  { label: 'Change Password', chevron: true },
                  { label: 'Linked Accounts', chevron: true },
                  { label: 'Delete Account', danger: true },
                ].map((item) => (
                  <button
                    key={item.label}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl mb-2 text-sm font-medium transition-all cursor-pointer ${
                      item.danger
                        ? 'text-red-400 hover:bg-red-500/10 border border-red-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                    {item.chevron && <ChevronRight className="w-4 h-4 text-slate-600" />}
                  </button>
                ))}

                <div className="mt-6 pt-4 border-t border-white/10 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-xl font-heading font-bold text-sm cursor-pointer transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    LOG OUT
                  </motion.button>
                  <button className="flex items-center gap-2 px-6 py-3 glass border border-white/20 text-slate-300 hover:text-white rounded-xl font-heading font-bold text-sm cursor-pointer transition-all">
                    <Shield className="w-4 h-4" />
                    SUPPORT
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'support' && (
              <div>
                <h2 className="font-heading font-bold text-xl text-white mb-6">Support Center</h2>
                {[
                  { icon: '📋', label: 'Report a Bug', desc: 'Found something broken? Let us know!' },
                  { icon: '💬', label: 'Contact Support', desc: 'Chat with our support team' },
                  { icon: '❓', label: 'FAQ & Help Center', desc: 'Find answers to common questions' },
                  { icon: '📜', label: 'Terms of Service', desc: 'Read our Terms of Service' },
                  { icon: '🔒', label: 'Privacy Policy', desc: 'Understand how we protect your data' },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-start gap-4 px-4 py-4 rounded-xl mb-2 hover:bg-white/5 transition-all text-left cursor-pointer"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="text-white font-medium text-sm">{item.label}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{item.desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 ml-auto mt-0.5 flex-shrink-0" />
                  </button>
                ))}
                <div className="mt-6 text-center text-slate-600 text-xs">
                  BATTLEVERSE v1.0.0 • Build 2026.09.02
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
