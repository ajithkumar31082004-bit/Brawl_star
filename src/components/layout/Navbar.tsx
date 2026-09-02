import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, ChevronDown, Settings, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const NAV_LINKS = [
  { label: 'HOME', path: '/' },
  { label: 'HEROES', path: '/heroes' },
  { label: 'MODES', path: '/modes' },
  { label: 'RANKING', path: '/ranking' },
  { label: 'SHOP', path: '/shop' },
];

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const RANK_ICONS: Record<string, string> = {
    'Bronze': '🥉', 'Silver': '🥈', 'Gold': '🥇', 'Diamond I': '💠',
    'Diamond II': '💠', 'Master': '👑', 'Legend': '⭐',
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0a0e1a]/95 backdrop-blur-xl border-b border-purple-500/20 shadow-2xl shadow-black/80 py-2.5'
            : 'bg-[#0a0e1a]/80 backdrop-blur-md border-b border-white/5 py-3'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 select-none flex-shrink-0">
              <div className="flex flex-col leading-tight">
                <span className="font-heading font-black text-xl sm:text-2xl tracking-wider text-white text-glow-cyan">
                  BATTLE<span className="text-[#00D9FF]">VERSE</span>
                </span>
                <span className="text-[9px] font-heading tracking-[0.25em] text-purple-400 uppercase -mt-0.5">
                  3V3 Hero Arena
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1 sm:gap-2">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-3.5 py-2 text-xs sm:text-sm font-heading font-bold tracking-wider transition-all duration-200 rounded-xl ${
                      isActive
                        ? 'text-[#00D9FF] bg-cyan-500/10 border border-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-[#00D9FF] rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isAuthenticated && user ? (
                <>
                  {/* Currency */}
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="glass flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/20">
                      <span className="text-sm">🪙</span>
                      <span className="text-amber-400 font-heading font-bold text-xs sm:text-sm">
                        {user.coins.toLocaleString()}
                      </span>
                    </div>
                    <div className="glass flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/20">
                      <span className="text-sm">💎</span>
                      <span className="text-cyan-400 font-heading font-bold text-xs sm:text-sm">
                        {user.gems.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* User Menu */}
                  <div className="relative" ref={menuRef}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="glass flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer border border-purple-500/30 hover:border-purple-400"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-sm shadow-md">
                        {user.avatar}
                      </div>
                      <div className="hidden sm:flex flex-col items-start leading-none">
                        <span className="text-white font-heading font-bold text-xs tracking-wide">
                          {user.username.toUpperCase()}
                        </span>
                        <span className="text-purple-400 text-[10px] font-semibold mt-0.5">
                          LV {user.level}
                        </span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </motion.button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 w-56 glass-dark rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30 bg-[#0f1629]/95 backdrop-blur-2xl z-50"
                        >
                          <div className="p-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-lg shadow-md">
                                {user.avatar}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-heading font-bold text-white text-sm truncate">{user.username}</p>
                                <p className="text-purple-400 text-xs font-semibold">{RANK_ICONS[user.rank] || '🏅'} {user.rank}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-3 text-xs">
                              <span className="flex items-center gap-1 text-amber-400 font-bold">
                                <span>🪙</span>{user.coins.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1 text-cyan-400 font-bold">
                                <span>💎</span>{user.gems.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="p-2 space-y-0.5">
                            {[
                              { icon: <User className="w-4 h-4 text-cyan-400" />, label: 'Profile', path: '/profile' },
                              { icon: <Shield className="w-4 h-4 text-purple-400" />, label: 'Friends', path: '/friends' },
                              { icon: <Settings className="w-4 h-4 text-slate-300" />, label: 'Settings', path: '/settings' },
                            ].map((item) => (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                              >
                                {item.icon}
                                {item.label}
                              </Link>
                            ))}
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm font-medium mt-1 cursor-pointer"
                            >
                              <LogOut className="w-4 h-4" />
                              Logout
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-xs sm:text-sm font-heading font-bold tracking-wider text-slate-300 hover:text-white transition-colors"
                  >
                    LOGIN
                  </Link>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/register"
                      className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-heading font-black tracking-wider text-black bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-500/30 hover:from-amber-300 hover:to-orange-400 transition-all block"
                    >
                      SIGN UP
                    </Link>
                  </motion.div>
                </div>
              )}

              {/* Mobile hamburger */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-xl glass border border-white/10 text-white cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-dark border-t border-white/10 bg-[#0a0e1a]/95 backdrop-blur-2xl"
            >
              <div className="px-4 py-4 flex flex-col gap-1.5">
                {NAV_LINKS.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`px-4 py-3 rounded-xl font-heading font-bold text-sm tracking-widest ${
                        isActive
                          ? 'bg-cyan-500/20 text-[#00D9FF] border border-cyan-500/40'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                {isAuthenticated && user ? (
                  <div className="mt-2 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-3 px-2">
                      <div className="flex items-center gap-1.5 text-amber-400 text-sm font-bold">
                        🪙 {user.coins.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-cyan-400 text-sm font-bold">
                        💎 {user.gems.toLocaleString()}
                      </div>
                    </div>
                    <Link to="/profile" className="block px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/10 text-sm font-semibold">👤 Profile</Link>
                    <Link to="/friends" className="block px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/10 text-sm font-semibold">🛡️ Friends</Link>
                    <Link to="/settings" className="block px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/10 text-sm font-semibold">⚙️ Settings</Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-sm font-semibold">🚪 Logout</button>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
                    <Link to="/login" className="px-4 py-3 rounded-xl text-center font-heading font-bold text-sm text-slate-300 border border-white/20">LOGIN</Link>
                    <Link to="/register" className="px-4 py-3 rounded-xl text-center font-heading font-bold text-sm text-black bg-gradient-to-r from-amber-400 to-orange-500">SIGN UP</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};
