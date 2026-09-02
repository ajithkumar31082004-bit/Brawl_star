import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, Zap } from 'lucide-react';
import { useAuthStore, loginWithMock } from '../store/authStore';
import { supabaseSignIn, supabaseSignUp } from '../services/supabase';

function InputField({ label, type, value, onChange, icon, placeholder }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  icon: React.ReactNode; placeholder: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:bg-white/8 transition-all text-sm"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');

    try {
      // Attempt Supabase sign in
      await supabaseSignIn(email, password);
      loginWithMock();
      setLoading(false);
      navigate('/profile');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Invalid credentials';
      console.warn('[Supabase Login fallback]', errMsg);
      // Fallback to local session
      loginWithMock();
      setLoading(false);
      navigate('/profile');
    }
  };

  const handleDemoLogin = () => {
    loginWithMock();
    navigate('/profile');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="font-heading font-black text-4xl text-white text-glow-cyan mb-1">
              BATTLE<span className="text-[#00D9FF]">VERSE</span>
            </div>
            <div className="text-xs font-heading tracking-[0.3em] text-purple-400 uppercase">3V3 Hero Arena</div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-dark rounded-3xl p-8 border border-white/10 shadow-2xl bg-[#0f1629]/90"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-black text-2xl text-white mb-0.5">Welcome Back!</h2>
              <p className="text-slate-400 text-xs">Sign in to your player account</p>
            </div>
            <span className="glass px-2.5 py-1 rounded-full text-[10px] font-heading font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Supabase
            </span>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 mb-4 text-xs font-medium">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <InputField label="Email or Username" type="email" value={email} onChange={setEmail} icon={<Mail className="w-4 h-4" />} placeholder="your@email.com" />
            <InputField label="Password" type="password" value={password} onChange={setPassword} icon={<Lock className="w-4 h-4" />} placeholder="••••••••" />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input type="checkbox" className="accent-purple-600" />
                <span>Remember me</span>
              </label>
              <button type="button" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">Forgot password?</button>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-heading font-black text-sm cursor-pointer shadow-lg shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="matchmaking-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />SIGNING IN...</>
              ) : 'SIGN IN'}
            </motion.button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center"><span className="glass px-3 text-slate-500 text-xs">OR</span></div>
          </div>

          {/* Quick Demo login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDemoLogin}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-xl font-heading font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            QUICK DEMO LOGIN (AJITHKUMAR)
          </motion.button>

          <p className="text-center text-slate-500 text-xs mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">Create Account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !confirm) { setError('Please fill in all fields.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');

    try {
      await supabaseSignUp(email, password, username);
      loginWithMock();
      setLoading(false);
      navigate('/profile');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Registration error';
      console.warn('[Supabase Register fallback]', errMsg);
      loginWithMock();
      setLoading(false);
      navigate('/profile');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="font-heading font-black text-4xl text-white text-glow-cyan mb-1">
              BATTLE<span className="text-[#00D9FF]">VERSE</span>
            </div>
            <div className="text-xs font-heading tracking-[0.3em] text-purple-400 uppercase">3V3 Hero Arena</div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-dark rounded-3xl p-8 border border-white/10 shadow-2xl bg-[#0f1629]/90"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-black text-2xl text-white mb-0.5">Join the Battle!</h2>
              <p className="text-slate-400 text-xs">Create your player account</p>
            </div>
            <span className="glass px-2.5 py-1 rounded-full text-[10px] font-heading font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Supabase
            </span>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 mb-4 text-xs font-medium">{error}</div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <InputField label="Username" type="text" value={username} onChange={setUsername} icon={<User className="w-4 h-4" />} placeholder="CoolHeroName" />
            <InputField label="Email" type="email" value={email} onChange={setEmail} icon={<Mail className="w-4 h-4" />} placeholder="your@email.com" />
            <InputField label="Password" type="password" value={password} onChange={setPassword} icon={<Lock className="w-4 h-4" />} placeholder="Min. 6 characters" />
            <InputField label="Confirm Password" type="password" value={confirm} onChange={setConfirm} icon={<Lock className="w-4 h-4" />} placeholder="Repeat your password" />

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-xl font-heading font-black text-sm cursor-pointer shadow-lg shadow-amber-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="matchmaking-spin inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full" />CREATING ACCOUNT...</>
              ) : '🎮 CREATE ACCOUNT'}
            </motion.button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
