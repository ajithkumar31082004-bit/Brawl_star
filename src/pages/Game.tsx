import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ============ GAME CONSTANTS ============
const CANVAS_W = 960;
const CANVAS_H = 640;
const PLAYER_SPEED = 3.5;
const BULLET_SPEED = 7;
const BULLET_DAMAGE = 120;
const PLAYER_MAX_HP = 3000;
const SUPER_DAMAGE = 500;
const CRYSTAL_GOAL = 10;

interface Vec2 { x: number; y: number; }
interface Entity { id: string; x: number; y: number; }

interface Player extends Entity {
  hp: number; maxHp: number; radius: number;
  vx: number; vy: number; team: 'blue' | 'red';
  name: string; emoji: string; superCharge: number;
  isHuman: boolean; respawnTimer: number;
}

interface Bullet extends Entity {
  vx: number; vy: number; team: 'blue' | 'red';
  damage: number; isSuper: boolean;
}

interface Crystal extends Entity {
  collected: boolean; respawnTimer: number;
}

// ============ HUD OVERLAY ============
interface HUDProps {
  blueCrystals: number; redCrystals: number;
  timer: number; playerHp: number; maxHp: number;
  superCharge: number;
  onAttack: () => void; onSuper: () => void; onDash: () => void;
}

function HUD({ blueCrystals, redCrystals, timer, playerHp, maxHp, superCharge, onAttack, onSuper, onDash }: HUDProps) {
  const mins = Math.floor(timer / 60);
  const secs = timer % 60;
  const hpPct = (playerHp / maxHp) * 100;
  const superPct = Math.min(superCharge, 100);

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3">
        {/* Blue team */}
        <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 border border-blue-500/30">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="font-heading font-black text-white text-lg">{blueCrystals} 💎</span>
          <span className="text-blue-400 text-xs font-medium">/{CRYSTAL_GOAL}</span>
        </div>

        {/* Timer */}
        <div className="glass px-5 py-2 rounded-xl border border-white/20">
          <div className="font-heading font-black text-white text-2xl text-center">
            {mins}:{String(secs).padStart(2, '0')}
          </div>
        </div>

        {/* Red team */}
        <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 border border-red-500/30">
          <span className="text-red-400 text-xs font-medium">{CRYSTAL_GOAL}/</span>
          <span className="font-heading font-black text-white text-lg">💎 {redCrystals}</span>
          <div className="w-3 h-3 rounded-full bg-red-500" />
        </div>
      </div>

      {/* Health bar */}
      <div className="absolute bottom-24 left-4 right-4 sm:left-8 sm:right-auto sm:w-64">
        <div className="glass rounded-xl p-3 border border-white/10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-green-400 text-xs font-heading font-bold">❤️ HP</span>
            <span className="text-white text-xs font-bold ml-auto">{playerHp} / {maxHp}</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${hpPct}%`,
                background: hpPct > 50 ? '#10B981' : hpPct > 25 ? '#F59E0B' : '#EF4444',
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400 text-xs font-heading font-bold">⚡ SUPER</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200 bg-gradient-to-r from-purple-600 to-indigo-500"
                style={{ width: `${superPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-purple-400">{Math.floor(superPct)}%</span>
          </div>
        </div>
      </div>

      {/* Mobile controls — bottom right */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onSuper}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 border-2 border-purple-400/50 flex items-center justify-center text-xl shadow-lg shadow-purple-500/40 cursor-pointer"
          >
            ⚡
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onDash}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border border-white/20 flex items-center justify-center text-sm shadow-lg cursor-pointer"
          >
            💨
          </motion.button>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onAttack}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 border-4 border-amber-300/50 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/40 cursor-pointer"
        >
          🔥
        </motion.button>
      </div>

      {/* WASD hints (desktop) */}
      <div className="absolute bottom-4 left-4 hidden sm:block">
        <div className="glass rounded-xl p-3 border border-white/10 text-slate-500 text-xs font-mono leading-relaxed">
          <div className="text-center mb-1">W</div>
          <div className="flex gap-1 justify-center">A S D</div>
          <div className="mt-1 text-[10px] text-slate-600">Click = Attack</div>
          <div className="text-[10px] text-slate-600">Space = Dash</div>
        </div>
      </div>
    </div>
  );
}

// ============ VICTORY SCREEN ============
function VictoryScreen({ won, onPlayAgain, onLobby, stats }: {
  won: boolean; onPlayAgain: () => void; onLobby: () => void;
  stats: { kills: number; deaths: number; crystals: number; damage: number };
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.7, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="glass-dark rounded-3xl p-8 sm:p-12 max-w-md w-full mx-4 border text-center"
        style={{ borderColor: won ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)' }}
      >
        <div className="text-7xl mb-4">{won ? '🏆' : '💀'}</div>
        <h1
          className="font-heading font-black text-5xl sm:text-6xl mb-6"
          style={{ color: won ? '#F59E0B' : '#EF4444' }}
        >
          {won ? 'VICTORY!' : 'DEFEAT'}
        </h1>

        {/* Rewards */}
        <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
          {won ? (
            <>
              <div className="glass rounded-xl px-4 py-2 text-center border border-amber-500/30">
                <div className="font-heading font-black text-amber-400 text-xl">🏆 +25</div>
                <div className="text-slate-500 text-xs">Trophies</div>
              </div>
              <div className="glass rounded-xl px-4 py-2 text-center border border-purple-500/30">
                <div className="font-heading font-black text-purple-400 text-xl">⭐ +500</div>
                <div className="text-slate-500 text-xs">XP</div>
              </div>
              <div className="glass rounded-xl px-4 py-2 text-center border border-amber-500/20">
                <div className="font-heading font-black text-amber-400 text-xl">🪙 +250</div>
                <div className="text-slate-500 text-xs">Coins</div>
              </div>
            </>
          ) : (
            <div className="glass rounded-xl px-4 py-2 text-center border border-red-500/30">
              <div className="font-heading font-black text-red-400 text-xl">🏆 -5</div>
              <div className="text-slate-500 text-xs">Trophies</div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { label: 'Kills', value: stats.kills },
            { label: 'Deaths', value: stats.deaths },
            { label: 'Damage', value: stats.damage.toLocaleString() },
            { label: 'Crystals', value: stats.crystals },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-3 border border-white/8">
              <div className="font-heading font-black text-white text-xl">{s.value}</div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onPlayAgain}
            className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-xl font-heading font-black text-sm cursor-pointer shadow-lg"
          >
            PLAY AGAIN
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLobby}
            className="flex-1 py-3.5 glass border border-white/20 text-white rounded-xl font-heading font-bold text-sm cursor-pointer"
          >
            RETURN TO LOBBY
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============ MAIN GAME CANVAS ============
function GameCanvas({ onGameEnd }: { onGameEnd: (won: boolean, stats: { kills: number; deaths: number; crystals: number; damage: number }) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    player: {
      id: 'p1', x: CANVAS_W / 4, y: CANVAS_H / 2,
      hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP, radius: 18,
      vx: 0, vy: 0, team: 'blue' as const,
      name: 'You', emoji: '🔥', superCharge: 0,
      isHuman: true, respawnTimer: 0,
    } as Player,
    enemies: [
      { id: 'e1', x: CANVAS_W * 0.75, y: CANVAS_H * 0.35, hp: 2500, maxHp: 2500, radius: 18, vx: 0, vy: 0, team: 'red' as const, name: 'ShadowX', emoji: '⚡', superCharge: 0, isHuman: false, respawnTimer: 0 },
      { id: 'e2', x: CANVAS_W * 0.75, y: CANVAS_H * 0.65, hp: 2500, maxHp: 2500, radius: 18, vx: 0, vy: 0, team: 'red' as const, name: 'ProGamer', emoji: '🛡️', superCharge: 0, isHuman: false, respawnTimer: 0 },
    ] as Player[],
    bullets: [] as Bullet[],
    crystals: [
      { id: 'c1', x: CANVAS_W / 2 - 40, y: CANVAS_H / 2 - 30, collected: false, respawnTimer: 0 },
      { id: 'c2', x: CANVAS_W / 2 + 40, y: CANVAS_H / 2 + 30, collected: false, respawnTimer: 0 },
      { id: 'c3', x: CANVAS_W / 2, y: CANVAS_H / 2, collected: false, respawnTimer: 0 },
    ] as Crystal[],
    blueCrystals: 0,
    redCrystals: 0,
    timer: 120,
    kills: 0,
    deaths: 0,
    damage: 0,
    crystalsCollected: 0,
    keys: {} as Record<string, boolean>,
    mouseX: CANVAS_W / 2,
    mouseY: CANVAS_H / 2,
    lastBulletTime: 0,
    lastEnemyBulletTime: 0,
    gameOver: false,
    timerTick: 0,
  });

  const hudRef = useRef({ blueCrystals: 0, redCrystals: 0, timer: 120, playerHp: PLAYER_MAX_HP, superCharge: 0 });
  const [hudState, setHudState] = useState(hudRef.current);
  const animRef = useRef<number>(0);

  // Walls
  const walls = [
    { x: 100, y: 80, w: 120, h: 20 }, { x: 740, y: 80, w: 120, h: 20 },
    { x: 100, y: 540, w: 120, h: 20 }, { x: 740, y: 540, w: 120, h: 20 },
    { x: 300, y: 180, w: 20, h: 100 }, { x: 640, y: 180, w: 20, h: 100 },
    { x: 300, y: 360, w: 20, h: 100 }, { x: 640, y: 360, w: 20, h: 100 },
    { x: 430, y: 120, w: 100, h: 20 }, { x: 430, y: 500, w: 100, h: 20 },
  ];

  const spawnBullet = useCallback((fromPlayer: Player, toX: number, toY: number, isSuper = false) => {
    const dx = toX - fromPlayer.x, dy = toY - fromPlayer.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const s = stateRef.current;
    s.bullets.push({
      id: `b${Date.now()}_${Math.random()}`,
      x: fromPlayer.x, y: fromPlayer.y,
      vx: (dx / len) * BULLET_SPEED,
      vy: (dy / len) * BULLET_SPEED,
      team: fromPlayer.team,
      damage: isSuper ? SUPER_DAMAGE : BULLET_DAMAGE,
      isSuper,
    });
  }, []);

  const manualAttack = useCallback(() => {
    const s = stateRef.current;
    if (s.player.hp <= 0) return;
    spawnBullet(s.player, s.mouseX, s.mouseY);
    s.player.superCharge = Math.min(100, s.player.superCharge + 8);
  }, [spawnBullet]);

  const manualSuper = useCallback(() => {
    const s = stateRef.current;
    if (s.player.hp <= 0 || s.player.superCharge < 100) return;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      s.bullets.push({ id: `sb${Date.now()}_${i}`, x: s.player.x, y: s.player.y, vx: Math.cos(angle) * BULLET_SPEED, vy: Math.sin(angle) * BULLET_SPEED, team: 'blue', damage: SUPER_DAMAGE, isSuper: true });
    }
    s.player.superCharge = 0;
  }, []);

  const manualDash = useCallback(() => {
    const s = stateRef.current;
    const dx = s.mouseX - s.player.x, dy = s.mouseY - s.player.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    s.player.x += (dx / len) * 60;
    s.player.y += (dy / len) * 60;
    s.player.x = Math.max(20, Math.min(CANVAS_W - 20, s.player.x));
    s.player.y = Math.max(20, Math.min(CANVAS_H - 20, s.player.y));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const s = stateRef.current;

    const onKey = (e: KeyboardEvent, down: boolean) => { s.keys[e.key.toLowerCase()] = down; e.preventDefault(); };
    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      s.mouseX = (e.clientX - rect.left) * scaleX;
      s.mouseY = (e.clientY - rect.top) * scaleY;
    };
    const onClick = () => {
      if (s.player.hp > 0) {
        spawnBullet(s.player, s.mouseX, s.mouseY);
        s.player.superCharge = Math.min(100, s.player.superCharge + 8);
      }
    };
    const onSpace = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); manualDash(); } };

    window.addEventListener('keydown', (e) => { onKey(e, true); onSpace(e); });
    window.addEventListener('keyup', (e) => onKey(e, false));
    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('click', onClick);

    let lastTime = 0;
    const TICK_MS = 1000;

    function collides(ax: number, ay: number, ar: number, bx: number, by: number, br: number) {
      const dx = ax - bx, dy = ay - by;
      return dx * dx + dy * dy < (ar + br) * (ar + br);
    }

    function hitWall(x: number, y: number, r: number) {
      return walls.some(w => x + r > w.x && x - r < w.x + w.w && y + r > w.y && y - r < w.y + w.h);
    }

    function loop(time: number) {
      if (s.gameOver) return;
      const dt = time - lastTime;
      lastTime = time;

      // Timer
      s.timerTick += dt;
      if (s.timerTick >= TICK_MS) {
        s.timerTick -= TICK_MS;
        s.timer = Math.max(0, s.timer - 1);
        if (s.timer <= 0) { s.gameOver = true; onGameEnd(s.blueCrystals > s.redCrystals, { kills: s.kills, deaths: s.deaths, crystals: s.crystalsCollected, damage: s.damage }); return; }
      }

      // Player movement
      const p = s.player;
      if (p.hp > 0) {
        if (p.respawnTimer > 0) { p.respawnTimer -= dt; if (p.respawnTimer <= 0) { p.hp = p.maxHp; p.x = CANVAS_W / 4; p.y = CANVAS_H / 2; } }
        else {
          let nx = p.x, ny = p.y;
          if (s.keys['w'] || s.keys['arrowup']) ny -= PLAYER_SPEED;
          if (s.keys['s'] || s.keys['arrowdown']) ny += PLAYER_SPEED;
          if (s.keys['a'] || s.keys['arrowleft']) nx -= PLAYER_SPEED;
          if (s.keys['d'] || s.keys['arrowright']) nx += PLAYER_SPEED;
          nx = Math.max(p.radius, Math.min(CANVAS_W - p.radius, nx));
          ny = Math.max(p.radius, Math.min(CANVAS_H - p.radius, ny));
          if (!hitWall(nx, ny, p.radius)) { p.x = nx; p.y = ny; }
        }
      }

      // Enemy AI
      s.enemies.forEach(e => {
        if (e.respawnTimer > 0) { e.respawnTimer -= dt; if (e.respawnTimer <= 0) { e.hp = e.maxHp; e.x = CANVAS_W * 0.75; e.y = CANVAS_H * 0.5; } return; }
        if (e.hp <= 0) return;
        // Move toward player
        const dx = p.x - e.x, dy = p.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 80) {
          const speed = 1.8;
          let nx = e.x + (dx / dist) * speed;
          let ny = e.y + (dy / dist) * speed;
          nx = Math.max(e.radius, Math.min(CANVAS_W - e.radius, nx));
          ny = Math.max(e.radius, Math.min(CANVAS_H - e.radius, ny));
          if (!hitWall(nx, ny, e.radius)) { e.x = nx; e.y = ny; }
        }
        // Enemy shoots
        if (time - s.lastEnemyBulletTime > 1200 && dist < 350 && p.hp > 0) {
          s.lastEnemyBulletTime = time;
          spawnBullet(e, p.x, p.y);
        }
      });

      // Bullets
      s.bullets = s.bullets.filter(b => {
        b.x += b.vx; b.y += b.vy;
        if (b.x < 0 || b.x > CANVAS_W || b.y < 0 || b.y > CANVAS_H) return false;
        if (walls.some(w => b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h)) return false;

        // Hit player
        if (b.team === 'red' && p.hp > 0 && collides(b.x, b.y, 5, p.x, p.y, p.radius)) {
          p.hp = Math.max(0, p.hp - b.damage);
          if (p.hp <= 0) { s.deaths++; p.respawnTimer = 5000; }
          return false;
        }
        // Hit enemies
        for (const e of s.enemies) {
          if (b.team === 'blue' && e.hp > 0 && collides(b.x, b.y, 5, e.x, e.y, e.radius)) {
            e.hp = Math.max(0, e.hp - b.damage);
            s.damage += b.damage;
            if (e.hp <= 0) { s.kills++; e.respawnTimer = 5000; }
            return false;
          }
        }
        return true;
      });

      // Crystals
      s.crystals.forEach(c => {
        if (c.collected) {
          c.respawnTimer += dt;
          if (c.respawnTimer >= 8000) { c.collected = false; c.respawnTimer = 0; c.x = CANVAS_W / 2 + (Math.random() - 0.5) * 120; c.y = CANVAS_H / 2 + (Math.random() - 0.5) * 120; }
          return;
        }
        // Player picks up
        if (p.hp > 0 && collides(c.x, c.y, 12, p.x, p.y, p.radius)) {
          c.collected = true; c.respawnTimer = 0;
          s.blueCrystals++; s.crystalsCollected++;
          if (s.blueCrystals >= CRYSTAL_GOAL) { s.gameOver = true; setTimeout(() => onGameEnd(true, { kills: s.kills, deaths: s.deaths, crystals: s.crystalsCollected, damage: s.damage }), 500); }
        }
        // Enemies pick up
        s.enemies.forEach(e => {
          if (e.hp > 0 && collides(c.x, c.y, 12, e.x, e.y, e.radius)) {
            c.collected = true; c.respawnTimer = 0;
            s.redCrystals++;
            if (s.redCrystals >= CRYSTAL_GOAL) { s.gameOver = true; setTimeout(() => onGameEnd(false, { kills: s.kills, deaths: s.deaths, crystals: s.crystalsCollected, damage: s.damage }), 500); }
          }
        });
      });

      // ---- DRAW ----
      // Background
      ctx.fillStyle = '#1a3a1a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
      for (let y = 0; y < CANVAS_H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }

      // Arena outline
      ctx.strokeStyle = 'rgba(108,99,255,0.3)';
      ctx.lineWidth = 3;
      ctx.strokeRect(1, 1, CANVAS_W - 2, CANVAS_H - 2);

      // Center zone
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, CANVAS_H / 2, 80, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 217, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Walls
      walls.forEach(w => {
        ctx.fillStyle = '#2d4a6b';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = 'rgba(108,99,255,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      });

      // Crystals
      s.crystals.forEach(c => {
        if (c.collected) return;
        const pulse = Math.sin(time / 400) * 3;
        ctx.save();
        ctx.translate(c.x, c.y);
        // Glow
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 18 + pulse);
        grad.addColorStop(0, 'rgba(0, 217, 255, 0.6)');
        grad.addColorStop(1, 'rgba(0, 217, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, 18 + pulse, 0, Math.PI * 2); ctx.fill();
        // Crystal
        ctx.fillStyle = '#00D9FF';
        ctx.beginPath();
        ctx.moveTo(0, -12); ctx.lineTo(8, 0); ctx.lineTo(0, 12); ctx.lineTo(-8, 0);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });

      // Bullets
      s.bullets.forEach(b => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.isSuper ? 8 : 5, 0, Math.PI * 2);
        ctx.fillStyle = b.team === 'blue' ? (b.isSuper ? '#F59E0B' : '#6C63FF') : '#EF4444';
        ctx.shadowBlur = b.isSuper ? 20 : 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
        ctx.restore();
      });

      function drawHero(unit: Player) {
        if (unit.respawnTimer > 0) return;
        ctx.save();
        ctx.translate(unit.x, unit.y);
        const isBlue = unit.team === 'blue';

        // Shadow
        ctx.beginPath(); ctx.ellipse(0, unit.radius - 2, unit.radius * 0.8, unit.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();

        // Body glow
        ctx.beginPath(); ctx.arc(0, 0, unit.radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = isBlue ? 'rgba(108,99,255,0.25)' : 'rgba(239,68,68,0.25)';
        ctx.fill();

        // Body
        ctx.beginPath(); ctx.arc(0, 0, unit.radius, 0, Math.PI * 2);
        const bodyGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, unit.radius);
        bodyGrad.addColorStop(0, isBlue ? '#8B85FF' : '#F87171');
        bodyGrad.addColorStop(1, isBlue ? '#4B44CC' : '#B91C1C');
        ctx.fillStyle = bodyGrad; ctx.fill();
        ctx.strokeStyle = isBlue ? '#00D9FF' : '#FCA5A5'; ctx.lineWidth = 2; ctx.stroke();

        // Emoji
        ctx.font = `${unit.radius * 0.85}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(unit.emoji, 0, 1);

        // HP bar
        const barW = unit.radius * 2.2;
        const hpPct = unit.hp / unit.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.roundRect(-barW / 2, -unit.radius - 14, barW, 6, 3); ctx.fill();
        ctx.fillStyle = hpPct > 0.5 ? '#10B981' : hpPct > 0.25 ? '#F59E0B' : '#EF4444';
        ctx.roundRect(-barW / 2, -unit.radius - 14, barW * hpPct, 6, 3); ctx.fill();

        // Name
        if (!unit.isHuman) {
          ctx.font = '10px Inter'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.fillText(unit.name, 0, -unit.radius - 16);
        }
        ctx.restore();
      }

      // Draw all units
      drawHero(s.player);
      s.enemies.forEach(e => drawHero(e));

      // Respawn timers
      if (s.player.respawnTimer > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = 'bold 13px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(`RESPAWN ${Math.ceil(s.player.respawnTimer / 1000)}s`, CANVAS_W / 4, CANVAS_H / 2);
      }

      // Update HUD
      const newHud = { blueCrystals: s.blueCrystals, redCrystals: s.redCrystals, timer: s.timer, playerHp: Math.max(0, s.player.hp), superCharge: s.player.superCharge };
      if (JSON.stringify(newHud) !== JSON.stringify(hudRef.current)) {
        hudRef.current = newHud;
        setHudState({ ...newHud });
      }

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', onKey as EventListener);
      window.removeEventListener('keyup', onKey as EventListener);
      canvas.removeEventListener('mousemove', onMouse);
      canvas.removeEventListener('click', onClick);
    };
  }, [spawnBullet, onGameEnd, manualDash]);

  return (
    <div className="relative w-full" style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full h-full rounded-xl"
        style={{ cursor: 'crosshair', imageRendering: 'pixelated' }}
      />
      <HUD
        blueCrystals={hudState.blueCrystals}
        redCrystals={hudState.redCrystals}
        timer={hudState.timer}
        playerHp={hudState.playerHp}
        maxHp={PLAYER_MAX_HP}
        superCharge={hudState.superCharge}
        onAttack={manualAttack}
        onSuper={manualSuper}
        onDash={manualDash}
      />
    </div>
  );
}

// ============ MAIN GAME PAGE ============
export const Game: React.FC = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'playing' | 'ended'>('playing');
  const [won, setWon] = useState(false);
  const [stats, setStats] = useState({ kills: 0, deaths: 0, crystals: 0, damage: 0 });
  const [key, setKey] = useState(0);

  const handleGameEnd = useCallback((didWin: boolean, gameStats: typeof stats) => {
    setWon(didWin);
    setStats(gameStats);
    setGameState('ended');
  }, []);

  const handlePlayAgain = () => {
    setGameState('playing');
    setKey(k => k + 1);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
      {/* Mini navbar */}
      <div className="glass-dark px-4 py-3 flex items-center justify-between border-b border-white/8">
        <button onClick={() => navigate('/play')} className="text-slate-400 hover:text-white transition-colors text-sm font-heading font-bold cursor-pointer flex items-center gap-2">
          ← LOBBY
        </button>
        <div className="font-heading font-black text-white text-sm tracking-widest">
          CRYSTAL CLASH • ARENA-1
        </div>
        <div className="text-xs text-slate-500">WASD to move • Click to attack • Space to dash</div>
      </div>

      {/* Game canvas */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="w-full max-w-5xl relative">
          <GameCanvas key={key} onGameEnd={handleGameEnd} />
          <AnimatePresence>
            {gameState === 'ended' && (
              <VictoryScreen
                won={won}
                stats={stats}
                onPlayAgain={handlePlayAgain}
                onLobby={() => navigate('/play')}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
