import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

// Particle background component
const ParticleBg: React.FC = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {/* Gradient orbs */}
    <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl animate-float" style={{ animationDelay: '0s' }} />
    <div className="absolute top-3/4 right-1/4 w-80 h-80 rounded-full bg-cyan-500/8 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
    <div className="absolute top-1/2 left-3/4 w-64 h-64 rounded-full bg-blue-600/8 blur-3xl animate-float" style={{ animationDelay: '4s' }} />
    {/* Dots */}
    {Array.from({ length: 20 }).map((_, i) => (
      <div
        key={i}
        className="particle w-1 h-1 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          backgroundColor: i % 3 === 0 ? '#6C63FF' : i % 3 === 1 ? '#00D9FF' : '#F59E0B',
          opacity: 0.3 + Math.random() * 0.4,
          animationDelay: `${Math.random() * 6}s`,
          animationDuration: `${4 + Math.random() * 4}s`,
          width: `${2 + Math.random() * 3}px`,
          height: `${2 + Math.random() * 3}px`,
        }}
      />
    ))}
    {/* Grid lines */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: 'linear-gradient(rgba(108,99,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }}
    />
  </div>
);

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0e1a] relative">
      <ParticleBg />
      <Navbar />
      <main className="relative z-10 pt-20 sm:pt-24">
        <Outlet />
      </main>
      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-20 py-8 px-4 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="font-heading font-black text-xl text-white mb-1">
            BATTLE<span className="text-[#00D9FF]">VERSE</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 BattleVerse. All rights reserved. Original game concept.</p>
        </div>
      </footer>
    </div>
  );
};

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0e1a] relative flex items-center justify-center">
      <ParticleBg />
      <div className="relative z-10 w-full">
        <Outlet />
      </div>
    </div>
  );
};

export const GameLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0e1a] relative">
      <Outlet />
    </div>
  );
};
