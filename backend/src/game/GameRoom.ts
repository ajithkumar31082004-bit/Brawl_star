/**
 * GameRoom — server-authoritative game simulation.
 *
 * Runs at 30 TPS (33ms tick interval).
 * Clients send inputs → server validates → server broadcasts state.
 * Clients NEVER decide: damage, HP, kills, crystal collection, or victory.
 */

import { EventEmitter } from 'events';
import { getHeroConfig, HeroConfig } from './HeroStats.js';
import type { Server as IOServer } from 'socket.io';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RoomStatus = 'WAITING' | 'STARTING' | 'RUNNING' | 'OVERTIME' | 'FINISHED';

export interface PlayerInput {
  dx: number;       // -1 to 1 normalised direction
  dy: number;
  aimX: number;     // world-space aim target
  aimY: number;
  firing: boolean;
  usingSuper: boolean;
  sequenceNumber: number; // for client-side reconciliation
}

interface Bullet {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  range: number;    // pixels remaining before despawn
  travelledSq: number;
  createdAt: number;
}

interface Crystal {
  id: string;
  x: number;
  y: number;
  alive: boolean;
}

export interface ServerPlayer {
  socketId: string;
  userId: string;
  username: string;
  heroSlug: string;
  heroConfig: HeroConfig;
  team: 'blue' | 'red';
  isBot?: boolean;

  // Position
  x: number;
  y: number;

  // Combat state
  hp: number;
  maxHp: number;
  ammo: number;
  lastShotAt: number;        // timestamp ms
  lastAmmoRechargeAt: number;
  superCharge: number;       // 0–100
  isDead: boolean;
  respawnAt: number;         // timestamp ms, 0 if alive
  deathCount: number;

  // Stats
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  crystalsHeld: number;

  // Anti-cheat
  lastProcessedSequence: number;
  lastValidX: number;
  lastValidY: number;

  // Pending input
  pendingInput: PlayerInput | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TICK_RATE_MS   = 33;          // ~30 TPS
const MAP_WIDTH      = 1400;
const MAP_HEIGHT     = 1000;
const PLAYER_RADIUS  = 24;          // px, used for collision
const BULLET_SPEED   = 600;         // px/s
const BULLET_RADIUS  = 8;
const RESPAWN_MS     = 5000;
const CRYSTALS_TO_WIN = 10;
const COUNTDOWN_SECS = 5;
const OVERTIME_SECS  = 60;

// Map zones: crystal spawn area (center of map)
const CRYSTAL_SPAWN_ZONE = { x: 550, y: 350, w: 300, h: 300 };

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ─── GameRoom class ───────────────────────────────────────────────────────────

export class GameRoom extends EventEmitter {
  readonly id: string;
  readonly gameMode: string;
  readonly mapName: string;

  status: RoomStatus = 'WAITING';
  players = new Map<string, ServerPlayer>(); // socketId → player

  private bullets: Bullet[] = [];
  private crystals: Crystal[] = [];
  private blueScore = 0;
  private redScore = 0;

  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private countdownTimeout: ReturnType<typeof setTimeout> | null = null;
  private startTime = 0;
  private lastTickAt = 0;

  private io: IOServer;

  constructor(id: string, io: IOServer, gameMode = 'gem_grab', mapName = 'Crystal Cavern') {
    super();
    this.id = id;
    this.io = io;
    this.gameMode = gameMode;
    this.mapName = mapName;
    this.spawnCrystals();
    console.log(`[GameRoom] Created room ${id} (${gameMode})`);
  }

  // ─── Player management ──────────────────────────────────────────────────────

  addPlayer(socketId: string, userId: string, username: string, heroSlug: string, team: 'blue' | 'red', isBot = false): void {
    let heroConfig: HeroConfig;
    try {
      heroConfig = getHeroConfig(heroSlug);
    } catch {
      heroConfig = getHeroConfig('blaze'); // fallback
    }

    const spawnX = team === 'blue' ? 150 + Math.random() * 100 : 1150 + Math.random() * 100;
    const spawnY = 300 + Math.random() * 400;

    const player: ServerPlayer = {
      socketId, userId, username, heroSlug, heroConfig, team, isBot,
      x: spawnX, y: spawnY,
      hp: heroConfig.health, maxHp: heroConfig.health,
      ammo: heroConfig.ammoCount,
      lastShotAt: 0,
      lastAmmoRechargeAt: Date.now(),
      superCharge: 0,
      isDead: false, respawnAt: 0,
      kills: 0, deaths: 0, assists: 0, damageDealt: 0, crystalsHeld: 0,
      deathCount: 0,
      lastProcessedSequence: 0,
      lastValidX: spawnX, lastValidY: spawnY,
      pendingInput: null,
    };

    this.players.set(socketId, player);
    console.log(`[GameRoom] ${username} (${heroSlug}) joined room ${this.id} on team ${team}`);
  }

  removePlayer(socketId: string): void {
    const p = this.players.get(socketId);
    if (p && p.crystalsHeld > 0) {
      // Drop crystals on disconnect
      this.dropCrystals(p.x, p.y, p.crystalsHeld);
      p.crystalsHeld = 0;
    }
    this.players.delete(socketId);
    console.log(`[GameRoom] Player ${socketId} left room ${this.id}`);
  }

  // ─── Input handling ─────────────────────────────────────────────────────────

  /** Called by Socket.IO handler — stores input for next tick */
  receiveInput(socketId: string, input: PlayerInput): void {
    const player = this.players.get(socketId);
    if (!player || player.isDead || this.status !== 'RUNNING') return;
    player.pendingInput = input;
  }

  // ─── Room lifecycle ─────────────────────────────────────────────────────────

  startCountdown(): void {
    if (this.status !== 'WAITING') return;
    this.status = 'STARTING';
    this.io.to(this.id).emit('game:countdown', { seconds: COUNTDOWN_SECS });

    this.countdownTimeout = setTimeout(() => {
      this.startMatch();
    }, COUNTDOWN_SECS * 1000);
  }

  private startMatch(): void {
    this.status = 'RUNNING';
    this.startTime = Date.now();
    this.lastTickAt = Date.now();
    this.tickInterval = setInterval(() => this.tick(), TICK_RATE_MS);
    this.io.to(this.id).emit('game:start', { mapName: this.mapName });
    console.log(`[GameRoom] Match STARTED in room ${this.id}`);
  }

  private endMatch(winningTeam: 'blue' | 'red' | 'draw', reason = 'score'): void {
    if (this.status === 'FINISHED') return;
    this.status = 'FINISHED';

    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.countdownTimeout) clearTimeout(this.countdownTimeout);

    const duration = Math.round((Date.now() - this.startTime) / 1000);
    const results = this.buildResults(winningTeam, duration);

    this.io.to(this.id).emit('game:over', results);
    console.log(`[GameRoom] Match ENDED in room ${this.id} — winner: ${winningTeam} (${reason})`);

    // Emit for external persistence
    this.emit('match:complete', {
      roomId: this.id,
      gameMode: this.gameMode,
      mapName: this.mapName,
      winningTeam,
      durationSeconds: duration,
      blueScore: this.blueScore,
      redScore: this.redScore,
      players: [...this.players.values()].map(p => ({
        userId:      p.userId,
        heroId:      p.heroConfig.id,
        team:        p.team,
        kills:       p.kills,
        deaths:      p.deaths,
        assists:     p.assists,
        damageDealt: p.damageDealt,
        healingDone: 0,
        score:       p.crystalsHeld + (p.kills * 100),
        isMvp:       false,
      })),
    });

    // Cleanup after 10s
    setTimeout(() => this.emit('room:close', this.id), 10_000);
  }

  // ─── Main game tick ─────────────────────────────────────────────────────────

  private tick(): void {
    const now = Date.now();
    const dt = (now - this.lastTickAt) / 1000; // seconds since last tick
    this.lastTickAt = now;

    this.updateBotAI(dt, now);
    this.processInputs(dt, now);
    this.updateBullets(dt, now);
    this.checkCrystalPickups(now);
    this.checkRespawns(now);
    this.rechargeAmmo(now);
    this.checkWinCondition(now);
    this.broadcastState(now);
  }

  // ─── Bot AI ────────────────────────────────────────────────────────────────
  private updateBotAI(_dt: number, now: number): void {
    for (const player of this.players.values()) {
      if (!player.isBot || player.isDead) continue;

      const enemies = [...this.players.values()].filter(p => p.team !== player.team && !p.isDead);
      const crystals = this.crystals.filter(c => c.alive);

      let targetX = MAP_WIDTH / 2;
      let targetY = MAP_HEIGHT / 2;
      let shouldFire = false;
      let aimX = targetX;
      let aimY = targetY;

      let closestEnemy: ServerPlayer | null = null;
      let closestDist = Infinity;
      for (const e of enemies) {
        const d = distance(player.x, player.y, e.x, e.y);
        if (d < closestDist) {
          closestDist = d;
          closestEnemy = e;
        }
      }

      if (closestEnemy && closestDist <= player.heroConfig.attackRange + 120) {
        aimX = closestEnemy.x + (Math.random() * 20 - 10);
        aimY = closestEnemy.y + (Math.random() * 20 - 10);
        shouldFire = true;
      }

      if (crystals.length > 0 && player.crystalsHeld < 6) {
        let nearestCrystal = crystals[0];
        let minDist = distance(player.x, player.y, crystals[0].x, crystals[0].y);
        for (const c of crystals) {
          const d = distance(player.x, player.y, c.x, c.y);
          if (d < minDist) {
            minDist = d;
            nearestCrystal = c;
          }
        }
        targetX = nearestCrystal.x;
        targetY = nearestCrystal.y;
      } else if (closestEnemy) {
        if (player.hp < player.maxHp * 0.3) {
          targetX = player.team === 'blue' ? 120 : 1280;
          targetY = player.y;
        } else {
          const optimalDist = player.heroConfig.attackRange * 0.7;
          if (closestDist > optimalDist) {
            targetX = closestEnemy.x;
            targetY = closestEnemy.y;
          } else {
            const angle = Math.atan2(player.y - closestEnemy.y, player.x - closestEnemy.x) + 0.4;
            targetX = closestEnemy.x + Math.cos(angle) * optimalDist;
            targetY = closestEnemy.y + Math.sin(angle) * optimalDist;
          }
        }
      }

      const moveDx = targetX - player.x;
      const moveDy = targetY - player.y;
      const moveLen = Math.sqrt(moveDx * moveDx + moveDy * moveDy) || 1;

      player.pendingInput = {
        dx: moveDx / moveLen,
        dy: moveDy / moveLen,
        aimX,
        aimY,
        firing: shouldFire && player.ammo > 0,
        usingSuper: player.superCharge >= 100,
        sequenceNumber: player.lastProcessedSequence + 1,
      };
    }
  }

  // ─── Input processing with anti-cheat ──────────────────────────────────────

  private processInputs(dt: number, now: number): void {
    for (const player of this.players.values()) {
      if (player.isDead || !player.pendingInput) continue;

      const input = player.pendingInput;
      player.pendingInput = null;

      // Anti-cheat: validate sequence number order
      if (input.sequenceNumber <= player.lastProcessedSequence) continue;
      player.lastProcessedSequence = input.sequenceNumber;

      // Anti-cheat: validate movement magnitude (normalise direction)
      let dx = input.dx;
      let dy = input.dy;
      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag > 1.0) { dx /= mag; dy /= mag; } // clamp to unit vector

      // Calculate new position
      const speed = player.heroConfig.movementSpeed;
      const newX = clamp(player.x + dx * speed * dt, PLAYER_RADIUS, MAP_WIDTH - PLAYER_RADIUS);
      const newY = clamp(player.y + dy * speed * dt, PLAYER_RADIUS, MAP_HEIGHT - PLAYER_RADIUS);

      // Anti-cheat: max movement per tick
      const maxMovement = speed * dt * 1.5; // 50% tolerance
      const actualMovement = distance(player.x, player.y, newX, newY);

      if (actualMovement <= maxMovement) {
        player.x = newX;
        player.y = newY;
        player.lastValidX = newX;
        player.lastValidY = newY;
      } else {
        // Teleport attempt — reject and log
        console.warn(`[AntiCheat] ${player.username} moved ${actualMovement.toFixed(1)}px (max ${maxMovement.toFixed(1)}px) — REJECTED`);
        // Snap back to last valid position
        player.x = player.lastValidX;
        player.y = player.lastValidY;
      }

      // Handle firing
      if (input.firing) {
        this.processShot(player, input.aimX, input.aimY, now);
      }
    }
  }

  private processShot(player: ServerPlayer, aimX: number, aimY: number, now: number): void {
    const cfg = player.heroConfig;

    // Anti-cheat: enforce attack cooldown
    if (now - player.lastShotAt < cfg.attackCooldownMs) return;
    // Anti-cheat: must have ammo
    if (player.ammo <= 0) return;

    player.lastShotAt = now;
    player.ammo -= 1;

    // Calculate bullet direction
    const dx = aimX - player.x;
    const dy = aimY - player.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const vx = (dx / len) * BULLET_SPEED;
    const vy = (dy / len) * BULLET_SPEED;

    const bullet: Bullet = {
      id: randomId(),
      ownerId: player.socketId,
      x: player.x,
      y: player.y,
      vx, vy,
      damage: cfg.attackDamage,      // FROM DB — not from client
      range: cfg.attackRange,
      travelledSq: 0,
      createdAt: now,
    };

    this.bullets.push(bullet);
  }

  // ─── Bullet physics & hit detection ────────────────────────────────────────

  private updateBullets(dt: number, _now: number): void {
    const toRemove: number[] = [];

    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];

      // Move bullet
      const moveX = b.vx * dt;
      const moveY = b.vy * dt;
      b.x += moveX;
      b.y += moveY;
      b.travelledSq += moveX * moveX + moveY * moveY;

      // Remove if out of range or map bounds
      if (
        b.travelledSq > b.range * b.range ||
        b.x < 0 || b.x > MAP_WIDTH ||
        b.y < 0 || b.y > MAP_HEIGHT
      ) {
        toRemove.push(i);
        continue;
      }

      // Check player collisions
      const shooter = this.players.get(b.ownerId);
      if (!shooter) { toRemove.push(i); continue; }

      let hit = false;
      for (const target of this.players.values()) {
        // Skip: shooter, same team, dead players
        if (target.socketId === b.ownerId) continue;
        if (target.team === shooter.team) continue;
        if (target.isDead) continue;

        const dist = distance(b.x, b.y, target.x, target.y);
        if (dist <= PLAYER_RADIUS + BULLET_RADIUS) {
          this.applyDamage(shooter, target, b.damage);
          hit = true;
          break;
        }
      }

      if (hit) toRemove.push(i);
    }

    // Remove bullets in reverse order to preserve indices
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.bullets.splice(toRemove[i], 1);
    }
  }

  private applyDamage(attacker: ServerPlayer, target: ServerPlayer, damage: number): void {
    target.hp = Math.max(0, target.hp - damage);
    attacker.damageDealt += damage;

    // Super charge for attacker
    attacker.superCharge = Math.min(100, attacker.superCharge + attacker.heroConfig.superChargePerHit);

    // Broadcast damage event
    this.io.to(this.id).emit('player:damaged', {
      targetId: target.socketId,
      attackerId: attacker.socketId,
      damage,
      remainingHp: target.hp,
      maxHp: target.maxHp,
    });

    if (target.hp <= 0) {
      this.handleDeath(target, attacker);
    }
  }

  private handleDeath(victim: ServerPlayer, killer: ServerPlayer): void {
    victim.isDead = true;
    victim.deaths += 1;
    victim.deathCount += 1;
    victim.respawnAt = Date.now() + RESPAWN_MS;

    killer.kills += 1;

    // Drop held crystals
    if (victim.crystalsHeld > 0) {
      this.dropCrystals(victim.x, victim.y, victim.crystalsHeld);
      victim.crystalsHeld = 0;
    }

    this.io.to(this.id).emit('player:died', {
      victimId: victim.socketId,
      victimName: victim.username,
      killerId: killer.socketId,
      killerName: killer.username,
      respawnInMs: RESPAWN_MS,
    });
  }

  private checkRespawns(now: number): void {
    for (const player of this.players.values()) {
      if (player.isDead && player.respawnAt > 0 && now >= player.respawnAt) {
        this.respawnPlayer(player);
      }
    }
  }

  private respawnPlayer(player: ServerPlayer): void {
    player.isDead = false;
    player.respawnAt = 0;
    player.hp = player.maxHp;
    player.ammo = player.heroConfig.ammoCount;

    // Respawn at team spawn
    player.x = player.team === 'blue'
      ? 150 + Math.random() * 100
      : 1150 + Math.random() * 100;
    player.y = 300 + Math.random() * 400;
    player.lastValidX = player.x;
    player.lastValidY = player.y;

    this.io.to(this.id).emit('player:respawned', {
      playerId: player.socketId,
      x: player.x,
      y: player.y,
    });
  }

  // ─── Ammo recharge ─────────────────────────────────────────────────────────

  private rechargeAmmo(now: number): void {
    for (const player of this.players.values()) {
      if (player.isDead) continue;
      if (player.ammo >= player.heroConfig.ammoCount) continue;
      if (now - player.lastAmmoRechargeAt >= player.heroConfig.ammoRechargeMs) {
        player.ammo = Math.min(player.heroConfig.ammoCount, player.ammo + 1);
        player.lastAmmoRechargeAt = now;
      }
    }
  }

  // ─── Crystal system ─────────────────────────────────────────────────────────

  private spawnCrystals(): void {
    for (let i = 0; i < 7; i++) {
      this.crystals.push({
        id: randomId(),
        x: CRYSTAL_SPAWN_ZONE.x + Math.random() * CRYSTAL_SPAWN_ZONE.w,
        y: CRYSTAL_SPAWN_ZONE.y + Math.random() * CRYSTAL_SPAWN_ZONE.h,
        alive: true,
      });
    }
  }

  private dropCrystals(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      this.crystals.push({
        id: randomId(),
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        alive: true,
      });
    }
  }

  private checkCrystalPickups(_now: number): void {
    for (const player of this.players.values()) {
      if (player.isDead) continue;
      for (const crystal of this.crystals) {
        if (!crystal.alive) continue;
        if (distance(player.x, player.y, crystal.x, crystal.y) <= PLAYER_RADIUS + 20) {
          crystal.alive = false;
          player.crystalsHeld += 1;

          // Crystals held count toward team score
          this.updateTeamScore();

          this.io.to(this.id).emit('crystal:collected', {
            crystalId: crystal.id,
            playerId: player.socketId,
            playerCrystals: player.crystalsHeld,
            blueScore: this.blueScore,
            redScore: this.redScore,
          });
        }
      }
    }

    // Remove dead crystals
    this.crystals = this.crystals.filter(c => c.alive);
  }

  private updateTeamScore(): void {
    let blue = 0;
    let red = 0;
    for (const p of this.players.values()) {
      if (!p.isDead) {
        if (p.team === 'blue') blue += p.crystalsHeld;
        else red += p.crystalsHeld;
      }
    }
    this.blueScore = blue;
    this.redScore = red;
  }

  // ─── Win condition ──────────────────────────────────────────────────────────

  private checkWinCondition(now: number): void {
    if (this.status !== 'RUNNING') return;

    if (this.gameMode === 'gem_grab') {
      if (this.blueScore >= CRYSTALS_TO_WIN) return this.endMatch('blue', 'crystals');
      if (this.redScore >= CRYSTALS_TO_WIN) return this.endMatch('red', 'crystals');

      // Overtime: if countdown was reached
      const elapsed = now - this.startTime;
      if (elapsed >= (3 * 60 * 1000) && this.status === 'RUNNING') {
        this.status = 'OVERTIME';
        this.io.to(this.id).emit('game:overtime', { seconds: OVERTIME_SECS });
        setTimeout(() => {
          if (this.status === 'OVERTIME') {
            const winner = this.blueScore > this.redScore ? 'blue'
                         : this.redScore > this.blueScore ? 'red'
                         : 'draw';
            this.endMatch(winner as 'blue' | 'red' | 'draw', 'overtime');
          }
        }, OVERTIME_SECS * 1000);
      }
    }
  }

  // ─── State broadcast ────────────────────────────────────────────────────────

  private broadcastState(_now: number): void {
    // Delta-only state — only send what changed
    const playerStates = [...this.players.values()].map(p => ({
      id:          p.socketId,
      userId:      p.userId,
      username:    p.username,
      heroSlug:    p.heroSlug,
      team:        p.team,
      x:           Math.round(p.x),
      y:           Math.round(p.y),
      hp:          p.hp,
      maxHp:       p.maxHp,
      ammo:        p.ammo,
      superCharge: Math.round(p.superCharge),
      isDead:      p.isDead,
      respawnAt:   p.respawnAt,
      kills:       p.kills,
      deaths:      p.deaths,
      crystals:    p.crystalsHeld,
      lastSeq:     p.lastProcessedSequence,
    }));

    const bulletStates = this.bullets.map(b => ({
      id: b.id,
      x: Math.round(b.x),
      y: Math.round(b.y),
    }));

    const crystalStates = this.crystals
      .filter(c => c.alive)
      .map(c => ({ id: c.id, x: Math.round(c.x), y: Math.round(c.y) }));

    this.io.to(this.id).emit('game:state', {
      players: playerStates,
      bullets: bulletStates,
      crystals: crystalStates,
      blueScore: this.blueScore,
      redScore: this.redScore,
      status: this.status,
      serverTime: Date.now(),
    });
  }

  // ─── Results ────────────────────────────────────────────────────────────────

  private buildResults(winningTeam: 'blue' | 'red' | 'draw', duration: number) {
    const playerResults = [...this.players.values()].map(p => {
      const won = p.team === winningTeam;
      return {
        socketId:     p.socketId,
        userId:       p.userId,
        username:     p.username,
        heroSlug:     p.heroSlug,
        team:         p.team,
        won,
        kills:        p.kills,
        deaths:       p.deaths,
        assists:      p.assists,
        damageDealt:  p.damageDealt,
        crystals:     p.crystalsHeld,
        trophiesDelta: won ? 25 : -5,
        xpGained:     won ? 500 + p.kills * 50 : 150 + p.kills * 25,
        coinsGained:  won ? 250 : 50,
      };
    });

    // Determine MVP (most damage on winning team)
    const winners = playerResults.filter(p => p.won);
    if (winners.length > 0) {
      const mvp = winners.reduce((a, b) => a.damageDealt > b.damageDealt ? a : b);
      mvp['isMvp' as keyof typeof mvp] = true as never;
    }

    return {
      winningTeam,
      duration,
      blueScore: this.blueScore,
      redScore: this.redScore,
      players: playerResults,
    };
  }

  get playerCount(): number {
    return this.players.size;
  }
}
