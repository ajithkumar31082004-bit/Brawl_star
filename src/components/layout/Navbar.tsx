import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Coins, Gem, User, ChevronDown, Settings, LogOut, Shield } from 'lucide-react';
import { useAuthStore, loginWithMock } from '../../store/authStore';

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
    const handleScroll = () => setScrolled(window.scrollY > 20);
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
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass-dark shadow-2xl shadow-black/50' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <Link to="/" className="flex flex-col leading-tight select-none">
              <span className="font-heading font-black text-lg lg:text-xl tracking-widest text-white text-glow-cyan">
                BATTLE<span className="text-[#00D9FF]">VERSE</span>
              </span>
              <span className="text-[9px] font-heading tracking-[0.3em] text-purple-400 uppercase">
                3V3 Hero Arena
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-2 text-sm font-heading font-semibold tracking-widest transition-all duration-200 rounded-lg ${
                    location.pathname === link.path
                      ? 'text-[#00D9FF]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                  {location.pathname === link.path && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#00D9FF] rounded-full"
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {isAuthenticated && user ? (
                <>
                  {/* Currency */}
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="glass flex items-center gap-1.5 px-3 py-1.5 rounded-xl">
                      <span className="text-amber-400 text-sm">🪙</span>
                      <span className="text-amber-400 font-heading font-bold text-sm">{user.coins.toLocaleString()}</span>
                    </div>
                    <div className="glass flex items-center gap-1.5 px-3 py-1.5 rounded-xl">
                      <span className="text-cyan-400 text-sm">💎</span>
                      <span className="text-cyan-400 font-heading font-bold text-sm">{user.gems.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* User Menu */}
                  <div className="relative" ref={menuRef}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="glass flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-sm">
                        {user.avatar}
                      </div>
                      <div className="hidden sm:flex flex-col items-start leading-tight">
                        <span className="text-white font-heading font-bold text-xs tracking-wide">{user.username.toUpperCase()}</span>
                        <span className="text-purple-400 text-[10px] font-medium">LV {user.level}</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </motion.button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 w-52 glass-dark rounded-2xl overflow-hidden shadow-2xl border border-purple-500/20"
                        >
                          <div className="p-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-lg">
                                {user.avatar}
                              </div>
                              <div>
                                <p className="font-heading font-bold text-white text-sm">{user.username}</p>
                                <p className="text-purple-400 text-xs">{RANK_ICONS[user.rank] || '🏅'} {user.rank}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2 text-xs">
                              <span className="flex items-center gap-1 text-amber-400"><span>🪙</span>{user.coins.toLocaleString()}</span>
                              <span className="flex items-center gap-1 text-cyan-400 ml-2"><span>💎</span>{user.gems.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="p-2">
                            {[
                              { icon: <User className="w-4 h-4" />, label: 'Profile', path: '/profile' },
                              { icon: <Shield className="w-4 h-4" />, label: 'Friends', path: '/friends' },
                              { icon: <Settings className="w-4 h-4" />, label: 'Settings', path: '/settings' },
                            ].map((item) => (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-150 text-sm"
                              >
                                {item.icon}
                                {item.label}
                              </Link>
                            ))}
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150 text-sm mt-1"
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
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-heading font-semibold tracking-wider text-slate-300 hover:text-white transition-colors"
                  >
                    LOGIN
                  </Link>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/register"
                      className="px-5 py-2 text-sm font-heading font-bold tracking-wider text-black bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-500/30"
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
                className="lg:hidden p-2 rounded-lg glass cursor-pointer"
              >
                {mobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
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
              className="lg:hidden glass-dark border-t border-white/10"
            >
              <div className="px-4 py-4 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-3 rounded-xl font-heading font-semibold text-sm tracking-widest ${
                      location.pathname === link.path
                        ? 'bg-purple-600/20 text-[#00D9FF] border border-purple-500/30'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {isAuthenticated && user ? (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 text-amber-400 text-sm">🪙 {user.coins.toLocaleString()}</div>
                      <div className="flex items-center gap-2 text-cyan-400 text-sm">💎 {user.gems.toLocaleString()}</div>
                    </div>
                    <Link to="/profile" className="block px-4 py-3 rounded-xl text-slate-300 hover:bg-white/10 text-sm font-semibold">👤 Profile</Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 text-sm font-semibold">🚪 Logout</button>
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-2">
                    <Link to="/login" className="px-4 py-3 rounded-xl text-center font-heading font-bold text-sm text-slate-300 border border-white/20">LOGIN</Link>
                    <Link to="/register" className="px-4 py-3 rounded-xl text-center font-heading font-bold text-sm text-black bg-gradient-to-r from-amber-400 to-orange-500">SIGN UP</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};
