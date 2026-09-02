import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Phaser from 'phaser';
import { ArenaScene, GameEventCallbacks } from './scenes/ArenaScene';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSound } from '../hooks/useSound';

interface PhaserGameProps {
  onGameOver?: (won: boolean, stats: { kills: number; deaths: number; crystals: number; damage: number }) => void;
}

export const PhaserGame: React.FC<PhaserGameProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<ArenaScene | null>(null);
  const navigate = useNavigate();
  const { playSound } = useSound();

  const [blueScore, setBlueScore] = useState(0);
  const [redScore, setRedScore] = useState(0);
  const [playerHp, setPlayerHp] = useState(3200);
  const [maxHp, setMaxHp] = useState(3200);
  const [superCharge, setSuperCharge] = useState(0);
  const [matchTime, setMatchTime] = useState(120);
  const [isEnded, setIsEnded] = useState(false);
  const [didWin, setDidWin] = useState(false);
  const [stats, setStats] = useState({ kills: 0, deaths: 0, crystals: 0, damage: 0 });

  const handleGameOver = useCallback((won: boolean, matchStats: typeof stats) => {
    setIsEnded(true);
    setDidWin(won);
    setStats(matchStats);
    playSound(won ? 'victory' : 'defeat');
  }, [playSound]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const callbacks: GameEventCallbacks = {
      onScoreUpdate: (blue, red) => {
        setBlueScore(blue);
        setRedScore(red);
        playSound('crystal');
      },
      onHealthUpdate: (cur, max, sup) => {
        setPlayerHp(cur);
        setMaxHp(max);
        setSuperCharge(sup);
      },
      onGameOver: handleGameOver,
    };

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 960,
      height: 640,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [ArenaScene],
      backgroundColor: '#0a1128',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.once('ready', () => {
      const arena = game.scene.getScene('ArenaScene') as ArenaScene;
      sceneRef.current = arena;
      arena.scene.restart({ callbacks });
    });

    const timer = setInterval(() => {
      setMatchTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [handleGameOver, playSound]);

  const triggerAttack = () => {
    if (sceneRef.current) {
      playSound('attack');
      sceneRef.current.shootBullet(600, 320);
    }
  };

  const triggerSuper = () => {
    if (sceneRef.current && superCharge >= 100) {
      playSound('super');
      sceneRef.current.activateSuper();
    }
  };

  const triggerDash = () => {
    if (sceneRef.current) {
      playSound('dash');
      sceneRef.current.performDash();
    }
  };

  const mins = Math.floor(matchTime / 60);
  const secs = matchTime % 60;
  const hpPercent = Math.max(0, Math.min(100, (playerHp / maxHp) * 100));

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl bg-[#0a1128]">
      {/* Phaser Mount */}
      <div ref={containerRef} className="w-full aspect-[3/2] max-h-[640px]" />

      {/* Top HUD Overlay */}
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex items-center justify-between pointer-events-none z-20">
        {/* Blue Team Score */}
        <div className="glass px-3.5 py-1.5 rounded-2xl flex items-center gap-2 border border-cyan-500/40 bg-[#0a0e1a]/80 shadow-lg">
          <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
          <span className="font-heading font-black text-cyan-300 text-base sm:text-lg">
            💎 {blueScore} <span className="text-xs text-slate-400">/ 10</span>
          </span>
        </div>

        {/* Timer */}
        <div className="glass px-4 py-1.5 rounded-2xl border border-white/20 bg-[#0a0e1a]/80 shadow-lg">
          <span className="font-heading font-black text-white text-lg sm:text-xl font-mono">
            {mins}:{secs < 10 ? `0${secs}` : secs}
          </span>
        </div>

        {/* Red Team Score */}
        <div className="glass px-3.5 py-1.5 rounded-2xl flex items-center gap-2 border border-red-500/40 bg-[#0a0e1a]/80 shadow-lg">
          <span className="font-heading font-black text-red-400 text-base sm:text-lg">
            <span className="text-xs text-slate-400">10 /</span> {redScore} 💎
          </span>
          <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500" />
        </div>
      </div>

      {/* Bottom Left: Player Status Bar */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:flex flex-col gap-1.5 glass p-3 rounded-2xl border border-white/10 bg-[#0a0e1a]/80 max-w-xs w-full">
        {/* HP */}
        <div className="flex items-center justify-between text-xs font-bold font-heading text-green-400">
          <span>❤️ HP</span>
          <span>{playerHp} / {maxHp}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
            style={{ width: `${hpPercent}%` }}
          />
        </div>

        {/* Super */}
        <div className="flex items-center justify-between text-xs font-bold font-heading text-purple-400 mt-1">
          <span>⚡ SUPER</span>
          <span>{superCharge}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all"
            style={{ width: `${superCharge}%` }}
          />
        </div>
      </div>

      {/* Touch Action Controls (Mobile & Clickable) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
        <div className="flex gap-2">
          {/* Super Blast */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={triggerSuper}
            disabled={superCharge < 100}
            className={`w-12 h-12 rounded-full font-heading font-black text-lg flex items-center justify-center cursor-pointer shadow-lg border ${
              superCharge >= 100
                ? 'bg-gradient-to-br from-purple-600 to-pink-500 border-yellow-300 text-white animate-pulse shadow-purple-500/50'
                : 'bg-white/10 border-white/10 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            ⚡
          </motion.button>

          {/* Dash */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={triggerDash}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/20 text-white font-heading font-bold text-sm flex items-center justify-center cursor-pointer shadow-md"
          >
            💨
          </motion.button>
        </div>

        {/* Main Attack */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={triggerAttack}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 border-2 border-yellow-300 text-black font-heading font-black text-2xl sm:text-3xl flex items-center justify-center cursor-pointer shadow-2xl shadow-amber-500/40"
        >
          🔥
        </motion.button>
      </div>

      {/* Victory / Defeat Modal */}
      <AnimatePresence>
        {isEnded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className={`glass-dark rounded-3xl p-6 sm:p-8 max-w-md w-full border text-center ${
                didWin ? 'border-amber-500/50 shadow-2xl shadow-amber-500/30' : 'border-red-500/50 shadow-2xl shadow-red-500/30'
              }`}
            >
              <div className="text-6xl sm:text-7xl mb-3">{didWin ? '🏆' : '💀'}</div>
              <h2
                className="font-heading font-black text-4xl sm:text-5xl mb-4 tracking-wider"
                style={{ color: didWin ? '#F59E0B' : '#EF4444' }}
              >
                {didWin ? 'VICTORY!' : 'DEFEAT'}
              </h2>

              {/* Rewards */}
              <div className="flex items-center justify-center gap-3 mb-6">
                {didWin ? (
                  <>
                    <div className="glass px-3 py-2 rounded-xl text-center border border-amber-500/30">
                      <div className="font-heading font-black text-amber-400 text-lg">🏆 +25</div>
                      <div className="text-[10px] text-slate-400">Trophies</div>
                    </div>
                    <div className="glass px-3 py-2 rounded-xl text-center border border-purple-500/30">
                      <div className="font-heading font-black text-purple-400 text-lg">⭐ +500</div>
                      <div className="text-[10px] text-slate-400">XP</div>
                    </div>
                    <div className="glass px-3 py-2 rounded-xl text-center border border-cyan-500/30">
                      <div className="font-heading font-black text-cyan-400 text-lg">🪙 +250</div>
                      <div className="text-[10px] text-slate-400">Coins</div>
                    </div>
                  </>
                ) : (
                  <div className="glass px-4 py-2 rounded-xl text-center border border-red-500/30">
                    <div className="font-heading font-black text-red-400 text-lg">🏆 -5</div>
                    <div className="text-[10px] text-slate-400">Trophies</div>
                  </div>
                )}
              </div>

              {/* Match Stats */}
              <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
                <div className="glass p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400">Eliminations:</span>{' '}
                  <strong className="text-white">{stats.kills}</strong>
                </div>
                <div className="glass p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400">Deaths:</span>{' '}
                  <strong className="text-white">{stats.deaths}</strong>
                </div>
                <div className="glass p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400">Crystals:</span>{' '}
                  <strong className="text-cyan-400">💎 {stats.crystals}</strong>
                </div>
                <div className="glass p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400">Damage:</span>{' '}
                  <strong className="text-red-400">{stats.damage}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-heading font-black text-sm rounded-xl cursor-pointer hover:brightness-110 shadow-lg"
                >
                  PLAY AGAIN
                </button>
                <button
                  onClick={() => navigate('/lobby')}
                  className="flex-1 py-3 glass border border-white/20 text-white font-heading font-bold text-sm rounded-xl cursor-pointer hover:bg-white/10"
                >
                  LOBBY
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
