import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Phaser from 'phaser';
import { ArenaScene, GameEventCallbacks } from './scenes/ArenaScene';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSound } from '../hooks/useSound';
import { ntfyMatchVictory } from '../services/ntfy';

export const PhaserGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<ArenaScene | null>(null);
  const navigate = useNavigate();
  const { playSound } = useSound();

  const [blueScore, setBlueScore] = useState(0);
  const [redScore, setRedScore] = useState(0);
  const [playerHp, setPlayerHp] = useState(4200);
  const [maxHp, setMaxHp] = useState(4200);
  const [superCharge, setSuperCharge] = useState(0);
  const [powerCubes, setPowerCubes] = useState(0);
  const [ammo, setAmmo] = useState(3);
  const [gadgetCharges, setGadgetCharges] = useState(3);
  const [matchTime, setMatchTime] = useState(150);
  const [isEnded, setIsEnded] = useState(false);
  const [didWin, setDidWin] = useState(false);
  const [stats, setStats] = useState({ kills: 0, deaths: 0, crystals: 0, damage: 0 });

  const handleGameOver = useCallback((won: boolean, matchStats: typeof stats) => {
    setIsEnded(true);
    setDidWin(won);
    setStats(matchStats);
    playSound(won ? 'victory' : 'defeat');
    if (won) {
      ntfyMatchVictory(25);
    }
  }, [playSound]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const callbacks: GameEventCallbacks = {
      onScoreUpdate: (blue, red) => {
        setBlueScore(blue);
        setRedScore(red);
        playSound('crystal');
      },
      onHealthUpdate: (cur, max, sup, cubes, currentAmmo) => {
        setPlayerHp(cur);
        setMaxHp(max);
        setSuperCharge(sup);
        setPowerCubes(cubes);
        setAmmo(currentAmmo);
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
    if (sceneRef.current && ammo > 0) {
      playSound('attack');
      sceneRef.current.shootPlayerAttack(800, 500);
    }
  };

  const triggerSuper = () => {
    if (sceneRef.current && superCharge >= 100) {
      playSound('super');
      sceneRef.current.activateSuper();
    }
  };

  const triggerGadget = () => {
    if (sceneRef.current && gadgetCharges > 0) {
      playSound('dash');
      setGadgetCharges(prev => prev - 1);
      sceneRef.current.performDash();
    }
  };

  const mins = Math.floor(matchTime / 60);
  const secs = matchTime % 60;
  const hpPercent = Math.max(0, Math.min(100, (playerHp / maxHp) * 100));

  return (
    <div className="relative w-full max-w-6xl mx-auto rounded-3xl overflow-hidden border-2 border-purple-500/40 shadow-2xl bg-[#0a1128] select-none">
      {/* Phaser Canvas */}
      <div ref={containerRef} className="w-full aspect-[3/2] max-h-[640px]" />

      {/* TOP HEADER HUD (Score, Crystal Count & Match Timer) */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-none z-20">
        {/* Blue Team Score (Left) */}
        <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2.5 border-2 border-cyan-400/60 bg-[#070d1e]/90 shadow-xl">
          <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 animate-pulse shadow-md shadow-cyan-400" />
          <div>
            <div className="font-heading font-black text-cyan-300 text-lg sm:text-xl leading-none">
              💎 {blueScore} <span className="text-xs text-slate-400">/ 10</span>
            </div>
            <div className="text-[10px] font-heading font-bold text-cyan-400 uppercase tracking-wider">
              BLUE TEAM
            </div>
          </div>
        </div>

        {/* Center Timer & Crystal Countdown */}
        <div className="glass px-5 py-2 rounded-2xl border border-white/20 bg-[#070d1e]/90 shadow-2xl text-center">
          <span className="font-heading font-black text-white text-xl sm:text-2xl font-mono tracking-wider">
            {mins}:{secs < 10 ? `0${secs}` : secs}
          </span>
          <div className="text-[10px] font-heading font-bold text-amber-400">CRYSTAL CLASH 3V3</div>
        </div>

        {/* Red Team Score (Right) */}
        <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2.5 border-2 border-red-500/60 bg-[#070d1e]/90 shadow-xl">
          <div className="text-right">
            <div className="font-heading font-black text-red-400 text-lg sm:text-xl leading-none">
              <span className="text-xs text-slate-400">10 /</span> {redScore} 💎
            </div>
            <div className="text-[10px] font-heading font-bold text-red-400 uppercase tracking-wider">
              RED TEAM
            </div>
          </div>
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse shadow-md shadow-red-500" />
        </div>
      </div>

      {/* BOTTOM LEFT HUD: Player Health, Power Cubes & 3 Ammo Slots */}
      <div className="absolute bottom-5 left-5 z-20 pointer-events-none hidden sm:flex flex-col gap-2 glass p-4 rounded-3xl border border-white/10 bg-[#070d1e]/90 max-w-xs w-full shadow-2xl">
        <div className="flex items-center justify-between text-xs font-heading font-black">
          <span className="text-emerald-400 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-400" /> POWER CUBES: {powerCubes}
          </span>
          <span className="text-white">{playerHp} / {maxHp}</span>
        </div>

        {/* HP Meter */}
        <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-200"
            style={{ width: `${hpPercent}%` }}
          />
        </div>

        {/* 3 Ammo Slot Bars */}
        <div className="flex gap-1.5 pt-1">
          {[0, 1, 2].map((slotIdx) => (
            <div key={slotIdx} className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  slotIdx < ammo ? 'bg-orange-500 shadow-sm shadow-orange-500' : 'bg-transparent'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM RIGHT: Authentic Touch Controls (Gadget, Super, Main Attack) */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col items-end gap-3 pointer-events-auto">
        <div className="flex items-center gap-3">
          {/* Green Gadget Button (3 uses) */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={triggerGadget}
            disabled={gadgetCharges <= 0}
            className={`w-12 h-12 rounded-full flex flex-col items-center justify-center font-heading font-black text-xs cursor-pointer shadow-xl border-2 transition-all ${
              gadgetCharges > 0
                ? 'bg-gradient-to-br from-emerald-500 to-teal-700 border-emerald-300 text-white shadow-emerald-500/40'
                : 'bg-white/5 border-white/10 text-slate-600 cursor-not-allowed opacity-50'
            }`}
          >
            <span>🪤</span>
            <span className="text-[9px] font-mono leading-none">{gadgetCharges}/3</span>
          </motion.button>

          {/* Yellow Glowing Super Skull Button */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={triggerSuper}
            disabled={superCharge < 100}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center font-heading font-black cursor-pointer shadow-2xl border-2 transition-all ${
              superCharge >= 100
                ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 border-yellow-200 text-black animate-pulse shadow-yellow-500/60 scale-105'
                : 'bg-gradient-to-br from-purple-950 to-[#111827] border-purple-500/30 text-purple-400 opacity-70'
            }`}
          >
            <span className="text-xl leading-none">💀</span>
            <span className="text-[9px] font-mono">{superCharge}%</span>
          </motion.button>
        </div>

        {/* Big Red Main Attack Button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={triggerAttack}
          disabled={ammo <= 0}
          className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full flex flex-col items-center justify-center font-heading font-black cursor-pointer shadow-2xl border-4 transition-all ${
            ammo > 0
              ? 'bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 border-yellow-300 text-black shadow-orange-500/50 hover:brightness-110'
              : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
          }`}
        >
          <span className="text-3xl sm:text-4xl filter drop-shadow">🔥</span>
          <span className="text-[10px] uppercase tracking-wider font-bold">ATTACK</span>
        </motion.button>
      </div>

      {/* End-Of-Match Victory / Defeat Overlay */}
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
