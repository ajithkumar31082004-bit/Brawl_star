import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PhaserGame } from '../game/PhaserGame';
import { ArrowLeft, Shield, Zap } from 'lucide-react';

export const Game: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070b19] flex flex-col">
      {/* Top Arena Header */}
      <div className="px-4 py-3 bg-[#0a0e1a]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
        <button
          onClick={() => navigate('/lobby')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs sm:text-sm font-heading font-bold cursor-pointer glass px-3 py-1.5 rounded-xl border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          EXIT TO LOBBY
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
          <span className="font-heading font-black text-xs sm:text-sm text-white tracking-widest uppercase">
            CRYSTAL CLASH • ARENA-01
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-cyan-400" /> WASD Move</span>
          <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> Click Shoot</span>
        </div>
      </div>

      {/* Main Arena Game Mount */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
        <PhaserGame />
      </div>
    </div>
  );
};
