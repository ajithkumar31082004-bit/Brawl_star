/**
 * GameRoom — server-authoritative 3v3 game simulation.
 *
 * Runs at 30 TPS (33ms tick interval).
 * - Full circle-to-AABB wall sliding collision
 * - Raycast bullet-wall obstruction
 * - Bush stealth detection
 * - Central Crystal Mine periodic spawner
 * - Multi-projectile spread, melee cleave, piercing, and knockback
 * - Unique hero Supers (Fire Storm, Lightning Dash, Hammer Quake, Ice Burst, Star Beam, Shield Wall)
 * - 30-second disconnect grace period with instant bot takeover and seamless reconnect
 */

import { EventEmitter } from 'events';
import { getHeroConfig, HeroConfig } from './HeroStats.js';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  CRYSTAL_MINE,
  BLUE_BASE,
  RED_BASE,
  resolveWallSliding,
  checkLineWallIntersection,
  isPointInBush,
} from './MapLayout.js';
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
  team: 'blue' | 'red';
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  rangeRemaining: number;
  knockback: number;
  piercing: boolean;
  hitPlayerIds: Set<string>;
  createdAt: number;
}

interface Crystal {
  id: string;
  x: number;
  y: number;
  alive: boolean;
}

interface AOEZone {
  id: string;
  ownerId: string;
  team: 'blue' | 'red';
  x: number;
  y: number;
  radius: number;
  dps: number;
  expiresAt: number;
  lastTickAt: number;
  type: 'fire' | 'slow';
}

export interface ServerPlayer {
  socketId: string;
  userId: string;
  username: string;
  heroSlug: string;
  heroConfig: HeroConfig;
  team: 'blue' | 'red';
  isBot?: boolean;
  isDisconnected?: boolean;
  disconnectedAt?: number;

  // Position & movement
  x: number;
  y: number;
  isInBush: boolean;
  knockbackVx: number;
  knockbackVy: number;

  // Combat state
  hp: number;
  maxHp: number;
  shield: number;            // temporary shield buffer
  ammo: number;
  lastShotAt: number;        // timestamp ms
  lastAmmoRechargeAt: number;
  superCharge: number;       // 0–100
  isDead: boolean;
  respawnAt: number;         // timestamp ms, 0 if alive
  deathCount: number;
  slowedUntil: number;       // ms timestamp
  stunnedUntil: number;      // ms timestamp

  // Stats
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  healingDone: number;
  crystalsHeld: number;

  // Anti-cheat & reconciliation
  lastProcessedSequence: number;
  lastValidX: number;
  lastValidY: number;

  // Pending input
  pendingInput: PlayerInput | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TICK_RATE_MS    = 33;         // ~30 TPS
const PLAYER_RADIUS   = 24;         // px, used for collision
const RESPAWN_MS      = 4500;
const CRYSTALS_TO_WIN = 10;
const WIN_COUNTDOWN_S = 15;         // hold 10 gems for 15s to win
const COUNTDOWN_SECS  = 3;
const OVERTIME_SECS   = 60;
const DISCONNECT_GRACE_MS = 30_000; // 30s reconnect window

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
  private aoeZones: AOEZone[] = [];
  private blueScore = 0;
  private redScore = 0;

  // Gem grab countdown
  private gemHolderTeam: 'blue' | 'red' | null = null;
  private gemCountdownEnd = 0;

  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private countdownTimeout: ReturnType<typeof setTimeout> | null = null;
  private startTime = 0;
  private lastTickAt = 0;
  private lastMineSpawnAt = 0;

  private io: IOServer;

  constructor(id: string, io: IOServer, gameMode = 'crystal_clash', mapName = 'Crystal Cavern') {
    super();
    this.id = id;
    this.io = io;
    this.gameMode = gameMode;
    this.mapName = mapName;
    this.initialCrystals();
    console.log(`[GameRoom] Created room ${id} (${gameMode})`);
  }

  // ─── Player management ──────────────────────────────────────────────────────

  addPlayer(
    socketId: string,
    userId: string,
    username: string,
    heroSlug: string,
    team: 'blue' | 'red',
    isBot = false
  ): void {
    let heroConfig: HeroConfig;
    try {
      heroConfig = getHeroConfig(heroSlug);
    } catch {
      heroConfig = getHeroConfig('blaze');
    }

    const spawnBase = team === 'blue' ? BLUE_BASE : RED_BASE;
    const spawnX = spawnBase.x + (Math.random() * 60 - 30);
    const spawnY = spawnBase.y + (Math.random() * 120 - 60);

    const player: ServerPlayer = {
      socketId, userId, username, heroSlug, heroConfig, team, isBot,
      isDisconnected: false,
      disconnectedAt: 0,
      x: spawnX, y: spawnY,
      isInBush: false,
      knockbackVx: 0,
      knockbackVy: 0,
      hp: heroConfig.health, maxHp: heroConfig.health,
      shield: 0,
      ammo: heroConfig.ammoCount,
      lastShotAt: 0,
      lastAmmoRechargeAt: Date.now(),
      superCharge: 0,
      isDead: false, respawnAt: 0,
      deathCount: 0,
      slowedUntil: 0,
      stunnedUntil: 0,
      kills: 0, deaths: 0, assists: 0, damageDealt: 0, healingDone: 0, crystalsHeld: 0,
      lastProcessedSequence: 0,
      lastValidX: spawnX, lastValidY: spawnY,
      pendingInput: null,
    };

    this.players.set(socketId, player);
    console.log(`[GameRoom] ${username} (${heroSlug}) joined room ${this.id} on team ${team}`);
  }

  /**
   * Called when a player's socket drops.
   * Enables bot takeover so the match proceeds, keeping player record for 30s.
   */
  handlePlayerDisconnect(socketId: string): void {
    const player = this.players.get(socketId);
    if (!player) return;

    player.isDisconnected = true;
    player.disconnectedAt = Date.now();
    player.isBot = true; // Bot AI seamlessly steps in

    console.log(`[GameRoom] ${player.username} disconnected. Bot AI activated for 30s.`);
    this.io.to(this.id).emit('player:disconnected', {
      socketId,
      username: player.username,
      gracePeriodMs: DISCONNECT_GRACE_MS,
    });
  }

  /**
   * Reconnects a returning player with a new socket ID.
   */
  reconnectPlayer(newSocketId: string, userId: string): boolean {
    for (const [oldSocketId, player] of this.players.entries()) {
      if (player.userId === userId) {
        // Re-assign socket
        this.players.delete(oldSocketId);
        player.socketId = newSocketId;
        player.isDisconnected = false;
        player.disconnectedAt = 0;
        player.isBot = false;
        this.players.set(newSocketId, player);

        this.io.sockets.sockets.get(newSocketId)?.join(this.id);

        console.log(`[GameRoom] ✅ ${player.username} reconnected with new socket ${newSocketId}!`);

        // Send full sync state
        this.io.to(newSocketId).emit('game:reconnect_sync', {
          roomId: this.id,
          gameMode: this.gameMode,
          mapName: this.mapName,
          status: this.status,
          blueScore: this.blueScore,
          redScore: this.redScore,
          crystalsHeld: player.crystalsHeld,
          playerState: this.serializePlayer(player),
        });

        this.io.to(this.id).emit('player:reconnected', {
          socketId: newSocketId,
          username: player.username,
        });

        return true;
      }
    }
    return false;
  }

  removePlayer(socketId: string): void {
    const p = this.players.get(socketId);
    if (p && p.crystalsHeld > 0) {
      this.dropCrystals(p.x, p.y, p.crystalsHeld);
      p.crystalsHeld = 0;
    }
    this.players.delete(socketId);
  }

  // ─── Crystals & Central Mine ───────────────────────────────────────────────

  private initialCrystals(): void {
    // Start with 2 initial crystals near the mine
    this.crystals = [
      { id: 'crys_init_1', x: CRYSTAL_MINE.x - 25, y: CRYSTAL_MINE.y - 15, alive: true },
      { id: 'crys_init_2', x: CRYSTAL_MINE.x + 25, y: CRYSTAL_MINE.y + 15, alive: true },
    ];
    this.lastMineSpawnAt = Date.now();
  }

  private updateCrystalMine(now: number): void {
    if (this.status !== 'RUNNING' && this.status !== 'OVERTIME') return;

    if (now - this.lastMineSpawnAt >= CRYSTAL_MINE.spawnIntervalMs) {
      this.lastMineSpawnAt = now;

      const activeCount = this.crystals.filter(c => c.alive).length;
      if (activeCount < CRYSTAL_MINE.maxCrystals) {
        const offsetDist = 20 + Math.random() * 35;
        const angle = Math.random() * Math.PI * 2;
        const spawnX = clamp(CRYSTAL_MINE.x + Math.cos(angle) * offsetDist, 580, 820);
        const spawnY = clamp(CRYSTAL_MINE.y + Math.sin(angle) * offsetDist, 380, 620);

        const newCrystal: Crystal = {
          id: `crystal_${now}_${Math.floor(Math.random() * 1000)}`,
          x: spawnX,
          y: spawnY,
          alive: true,
        };

        this.crystals.push(newCrystal);

        this.io.to(this.id).emit('crystal:spawned', {
          id: newCrystal.id,
          x: newCrystal.x,
          y: newCrystal.y,
        });
      }
    }
  }

  private dropCrystals(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 30 + Math.random() * 25;
      const crystalX = clamp(x + Math.cos(angle) * r, 80, MAP_WIDTH - 80);
      const crystalY = clamp(y + Math.sin(angle) * r, 80, MAP_HEIGHT - 80);

      this.crystals.push({
        id: `drop_${Date.now()}_${i}`,
        x: crystalX,
        y: crystalY,
        alive: true,
      });
    }
  }

  // ─── Input receiving ───────────────────────────────────────────────────────

  receiveInput(socketId: string, input: PlayerInput): void {
    const player = this.players.get(socketId);
    if (!player || player.isDead) return;

    player.pendingInput = input;
  }

  // ─── Match Lifecycle ───────────────────────────────────────────────────────

  startCountdown(): void {
    this.status = 'STARTING';
    let remaining = COUNTDOWN_SECS;

    console.log(`[GameRoom] Starting countdown in room ${this.id}`);

    const interval = setInterval(() => {
      this.io.to(this.id).emit('game:countdown', { seconds: remaining });
      remaining--;

      if (remaining < 0) {
        clearInterval(interval);
        this.startMatch();
      }
    }, 1000);
  }

  private startMatch(): void {
    this.status = 'RUNNING';
    this.startTime = Date.now();
    this.lastTickAt = Date.now();
    this.lastMineSpawnAt = Date.now();
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

    // Emit for database persistence & progression
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
        healingDone: p.healingDone,
        score:       p.crystalsHeld * 150 + p.kills * 100,
        isMvp:       false,
      })),
    });

    // Cleanup after 10s
    setTimeout(() => this.emit('room:close', this.id), 10_000);
  }

  // ─── Main Game Tick (30 TPS) ───────────────────────────────────────────────

  private tick(): void {
    const now = Date.now();
    const dt = (now - this.lastTickAt) / 1000;
    this.lastTickAt = now;

    this.updateCrystalMine(now);
    this.updateAOEZones(dt, now);
    this.updateBotAI(dt, now);
    this.processInputs(dt, now);
    this.updateBullets(dt, now);
    this.checkCrystalPickups(now);
    this.checkRespawns(now);
    this.rechargeAmmo(now);
    this.checkWinCondition(now);
    this.broadcastState(now);
  }

  // ─── AOE Zones (e.g. Blaze Fire Storm) ─────────────────────────────────────

  private updateAOEZones(dt: number, now: number): void {
    for (let i = this.aoeZones.length - 1; i >= 0; i--) {
      const zone = this.aoeZones[i];
      if (now >= zone.expiresAt) {
        this.aoeZones.splice(i, 1);
        continue;
      }

      // Apply tick damage every 500ms
      if (now - zone.lastTickAt >= 500) {
        zone.lastTickAt = now;
        const tickDamage = Math.round(zone.dps * 0.5);

        for (const player of this.players.values()) {
          if (player.team !== zone.team && !player.isDead) {
            if (distance(player.x, player.y, zone.x, zone.y) <= zone.radius) {
              this.applyDamage(player, tickDamage, zone.ownerId);
            }
          }
        }
      }
    }
  }

  // ─── Bot AI ────────────────────────────────────────────────────────────────

  private updateBotAI(_dt: number, now: number): void {
    for (const player of this.players.values()) {
      if (!player.isBot || player.isDead) continue;

      const enemies = [...this.players.values()].filter(p => p.team !== player.team && !p.isDead);
      const crystals = this.crystals.filter(c => c.alive);

      let targetX = CRYSTAL_MINE.x;
      let targetY = CRYSTAL_MINE.y;
      let shouldFire = false;
      let useSuper = player.superCharge >= 100;
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
        let nearest = crystals[0];
        let minDist = distance(player.x, player.y, crystals[0].x, crystals[0].y);
        for (const c of crystals) {
          const d = distance(player.x, player.y, c.x, c.y);
          if (d < minDist) {
            minDist = d;
            nearest = c;
          }
        }
        targetX = nearest.x;
        targetY = nearest.y;
      } else if (closestEnemy) {
        if (player.hp < player.maxHp * 0.3) {
          // Low HP: retreat toward own spawn base
          const base = player.team === 'blue' ? BLUE_BASE : RED_BASE;
          targetX = base.x;
          targetY = base.y;
        } else {
          // Combat positioning: keep optimal range
          const optimalDist = player.heroConfig.attackRange * 0.7;
          if (closestDist > optimalDist) {
            targetX = closestEnemy.x;
            targetY = closestEnemy.y;
          } else {
            const angle = Math.atan2(player.y - closestEnemy.y, player.x - closestEnemy.x) + 0.5;
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
        usingSuper: useSuper,
        sequenceNumber: player.lastProcessedSequence + 1,
      };
    }
  }

  // ─── Input Processing & Wall Collision ─────────────────────────────────────

  private processInputs(dt: number, now: number): void {
    for (const player of this.players.values()) {
      if (player.isDead) continue;

      // Handle knockback decay
      if (Math.abs(player.knockbackVx) > 5 || Math.abs(player.knockbackVy) > 5) {
        player.x += player.knockbackVx * dt;
        player.y += player.knockbackVy * dt;
        player.knockbackVx *= 0.85;
        player.knockbackVy *= 0.85;
      }

      if (!player.pendingInput) continue;

      const input = player.pendingInput;
      player.pendingInput = null;

      // Anti-cheat: validate sequence
      if (input.sequenceNumber <= player.lastProcessedSequence) continue;
      player.lastProcessedSequence = input.sequenceNumber;

      // Check stun
      if (now < player.stunnedUntil) continue;

      // Speed calculation (with slow modifier)
      let speed = player.heroConfig.movementSpeed;
      if (now < player.slowedUntil) {
        speed *= 0.5; // 50% slow
      }

      // Normalise direction vector
      let dx = input.dx;
      let dy = input.dy;
      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag > 1.0) { dx /= mag; dy /= mag; }

      // Desired new position
      const desiredX = clamp(player.x + dx * speed * dt, PLAYER_RADIUS, MAP_WIDTH - PLAYER_RADIUS);
      const desiredY = clamp(player.y + dy * speed * dt, PLAYER_RADIUS, MAP_HEIGHT - PLAYER_RADIUS);

      // Slide along arena walls
      const resolved = resolveWallSliding(player.x, player.y, desiredX, desiredY, PLAYER_RADIUS);

      player.x = resolved.x;
      player.y = resolved.y;
      player.lastValidX = resolved.x;
      player.lastValidY = resolved.y;

      // Check bush stealth
      player.isInBush = isPointInBush(player.x, player.y);

      // Handle Super activation
      if (input.usingSuper && player.superCharge >= 100) {
        this.executeSuper(player, input.aimX, input.aimY, now);
      }

      // Handle Basic Attack
      if (input.firing) {
        this.processShot(player, input.aimX, input.aimY, now);
      }
    }
  }

  // ─── Super Execution ───────────────────────────────────────────────────────

  private executeSuper(player: ServerPlayer, aimX: number, aimY: number, now: number): void {
    player.superCharge = 0;
    const cfg = player.heroConfig;

    console.log(`[GameRoom] 💥 ${player.username} cast SUPER: ${cfg.superType}`);

    switch (cfg.superType) {
      case 'fire_storm': {
        // Drop burning AOE zone at target location (clamped to max range)
        const dist = Math.min(distance(player.x, player.y, aimX, aimY), cfg.attackRange + 150);
        const angle = Math.atan2(aimY - player.y, aimX - player.x);
        const zoneX = player.x + Math.cos(angle) * dist;
        const zoneY = player.y + Math.sin(angle) * dist;

        this.aoeZones.push({
          id: `aoe_${now}`,
          ownerId: player.socketId,
          team: player.team,
          x: zoneX,
          y: zoneY,
          radius: 130,
          dps: cfg.superValue,
          expiresAt: now + cfg.superDurationMs,
          lastTickAt: now,
          type: 'fire',
        });

        this.io.to(this.id).emit('super:effect', {
          heroSlug: cfg.slug,
          type: 'fire_storm',
          x: zoneX,
          y: zoneY,
          radius: 130,
        });
        break;
      }

      case 'lightning_dash': {
        // Instant dash forward damaging enemies along line
        const angle = Math.atan2(aimY - player.y, aimX - player.x);
        const dashDist = 260;
        const targetX = clamp(player.x + Math.cos(angle) * dashDist, PLAYER_RADIUS, MAP_WIDTH - PLAYER_RADIUS);
        const targetY = clamp(player.y + Math.sin(angle) * dashDist, PLAYER_RADIUS, MAP_HEIGHT - PLAYER_RADIUS);

        // Slide along walls during dash
        const finalPos = resolveWallSliding(player.x, player.y, targetX, targetY, PLAYER_RADIUS);

        // Damage any opposing players near the dash line
        for (const enemy of this.players.values()) {
          if (enemy.team !== player.team && !enemy.isDead) {
            const d = distance(enemy.x, enemy.y, finalPos.x, finalPos.y);
            if (d < 80) {
              this.applyDamage(enemy, cfg.superValue, player.socketId);
              enemy.knockbackVx = Math.cos(angle) * cfg.knockbackForce;
              enemy.knockbackVy = Math.sin(angle) * cfg.knockbackForce;
            }
          }
        }

        player.x = finalPos.x;
        player.y = finalPos.y;

        this.io.to(this.id).emit('super:effect', {
          heroSlug: cfg.slug,
          type: 'lightning_dash',
          startX: player.x,
          startY: player.y,
          endX: finalPos.x,
          endY: finalPos.y,
        });
        break;
      }

      case 'hammer_quake': {
        // Area shockwave around Titan: damages, stuns, and knocks back all nearby enemies
        const quakeRadius = 170;
        for (const enemy of this.players.values()) {
          if (enemy.team !== player.team && !enemy.isDead) {
            const d = distance(player.x, player.y, enemy.x, enemy.y);
            if (d <= quakeRadius) {
              this.applyDamage(enemy, cfg.superValue, player.socketId);
              enemy.stunnedUntil = now + 900; // 0.9s stun
              const pushAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
              enemy.knockbackVx = Math.cos(pushAngle) * cfg.knockbackForce;
              enemy.knockbackVy = Math.sin(pushAngle) * cfg.knockbackForce;
            }
          }
        }

        this.io.to(this.id).emit('super:effect', {
          heroSlug: cfg.slug,
          type: 'hammer_quake',
          x: player.x,
          y: player.y,
          radius: quakeRadius,
        });
        break;
      }

      case 'ice_burst': {
        // Frost AOE blast that slows enemies by 50%
        const burstRadius = 180;
        for (const enemy of this.players.values()) {
          if (enemy.team !== player.team && !enemy.isDead) {
            const d = distance(player.x, player.y, enemy.x, enemy.y);
            if (d <= burstRadius) {
              this.applyDamage(enemy, cfg.superValue, player.socketId);
              enemy.slowedUntil = now + cfg.superDurationMs;
            }
          }
        }

        this.io.to(this.id).emit('super:effect', {
          heroSlug: cfg.slug,
          type: 'ice_burst',
          x: player.x,
          y: player.y,
          radius: burstRadius,
        });
        break;
      }

      case 'star_beam': {
        // Luna restores 1200 HP to self and all nearby teammates
        const healRadius = 240;
        for (const ally of this.players.values()) {
          if (ally.team === player.team && !ally.isDead) {
            const d = distance(player.x, player.y, ally.x, ally.y);
            if (d <= healRadius) {
              ally.hp = Math.min(ally.maxHp, ally.hp + cfg.superValue);
              player.healingDone += cfg.superValue;
            }
          }
        }

        this.io.to(this.id).emit('super:effect', {
          heroSlug: cfg.slug,
          type: 'star_beam',
          x: player.x,
          y: player.y,
          radius: healRadius,
        });
        break;
      }

      case 'shield_wall': {
        // Buster gains temporary absorption shield
        player.shield = cfg.superValue;
        this.io.to(this.id).emit('super:effect', {
          heroSlug: cfg.slug,
          type: 'shield_wall',
          x: player.x,
          y: player.y,
          value: cfg.superValue,
        });
        break;
      }
    }
  }

  // ─── Weapon Firing & Projectiles ───────────────────────────────────────────

  private processShot(player: ServerPlayer, aimX: number, aimY: number, now: number): void {
    const cfg = player.heroConfig;

    if (now - player.lastShotAt < cfg.attackCooldownMs) return;
    if (player.ammo <= 0) return;

    player.lastShotAt = now;
    player.ammo -= 1;

    // Firing reveals player from stealth bushes
    player.isInBush = false;

    const baseAngle = Math.atan2(aimY - player.y, aimX - player.x);
    const count = cfg.projectilesPerShot;
    const spreadRad = (cfg.spreadAngle * Math.PI) / 180;

    for (let i = 0; i < count; i++) {
      let angle = baseAngle;
      if (count > 1) {
        const offset = (i / (count - 1) - 0.5) * spreadRad;
        angle += offset;
      }

      const vx = Math.cos(angle) * cfg.bulletSpeed;
      const vy = Math.sin(angle) * cfg.bulletSpeed;

      this.bullets.push({
        id: `bullet_${now}_${randomId()}`,
        ownerId: player.socketId,
        team: player.team,
        x: player.x + Math.cos(angle) * (PLAYER_RADIUS + 4),
        y: player.y + Math.sin(angle) * (PLAYER_RADIUS + 4),
        vx,
        vy,
        damage: cfg.attackDamage,
        radius: cfg.projectileRadius,
        rangeRemaining: cfg.attackRange,
        knockback: cfg.knockbackForce,
        piercing: cfg.attackPattern === 'pierce',
        hitPlayerIds: new Set(),
        createdAt: now,
      });
    }
  }

  // ─── Bullet Updates & Wall Collision ───────────────────────────────────────

  private updateBullets(dt: number, now: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];

      const moveX = b.vx * dt;
      const moveY = b.vy * dt;
      const moveDist = Math.sqrt(moveX * moveX + moveY * moveY);

      const oldX = b.x;
      const oldY = b.y;
      const newX = b.x + moveX;
      const newY = b.y + moveY;

      // 1. Wall collision check — wall absorbs bullet
      const wallHit = checkLineWallIntersection(oldX, oldY, newX, newY);
      if (wallHit) {
        this.bullets.splice(i, 1);
        continue;
      }

      b.x = newX;
      b.y = newY;
      b.rangeRemaining -= moveDist;

      // Out of range or out of arena bounds
      if (
        b.rangeRemaining <= 0 ||
        b.x < 0 || b.x > MAP_WIDTH ||
        b.y < 0 || b.y > MAP_HEIGHT
      ) {
        this.bullets.splice(i, 1);
        continue;
      }

      // 2. Player hit detection (Circle vs Circle)
      let bulletHit = false;
      for (const target of this.players.values()) {
        if (target.team === b.team || target.isDead) continue;
        if (b.hitPlayerIds.has(target.socketId)) continue;

        const hitDist = distance(b.x, b.y, target.x, target.y);
        if (hitDist <= PLAYER_RADIUS + b.radius) {
          b.hitPlayerIds.add(target.socketId);

          this.applyDamage(target, b.damage, b.ownerId);

          // Apply knockback
          if (b.knockback > 0) {
            const angle = Math.atan2(b.vy, b.vx);
            target.knockbackVx = Math.cos(angle) * b.knockback;
            target.knockbackVy = Math.sin(angle) * b.knockback;
          }

          // Charge shooter's Super
          const shooter = this.players.get(b.ownerId);
          if (shooter) {
            shooter.superCharge = Math.min(100, shooter.superCharge + shooter.heroConfig.superChargePerHit);
          }

          if (!b.piercing) {
            bulletHit = true;
            break;
          }
        }
      }

      if (bulletHit) {
        this.bullets.splice(i, 1);
      }
    }
  }

  // ─── Damage & Health ───────────────────────────────────────────────────────

  private applyDamage(victim: ServerPlayer, amount: number, attackerSocketId: string): void {
    if (victim.isDead) return;

    const attacker = this.players.get(attackerSocketId);
    let netDamage = amount;

    // Absorption shield first
    if (victim.shield > 0) {
      if (victim.shield >= netDamage) {
        victim.shield -= netDamage;
        netDamage = 0;
      } else {
        netDamage -= victim.shield;
        victim.shield = 0;
      }
    }

    victim.hp = Math.max(0, victim.hp - netDamage);

    if (attacker) {
      attacker.damageDealt += amount;
    }

    this.io.to(this.id).emit('player:damaged', {
      targetId: victim.socketId,
      damage: amount,
      remainingHp: victim.hp,
      shield: victim.shield,
    });

    if (victim.hp <= 0) {
      this.handlePlayerKill(victim, attacker);
    }
  }

  private handlePlayerKill(victim: ServerPlayer, killer?: ServerPlayer): void {
    victim.isDead = true;
    victim.hp = 0;
    victim.shield = 0;
    victim.deaths += 1;
    victim.respawnAt = Date.now() + RESPAWN_MS;

    if (killer) {
      killer.kills += 1;
    }

    // Drop held crystals on death!
    if (victim.crystalsHeld > 0) {
      this.dropCrystals(victim.x, victim.y, victim.crystalsHeld);
      victim.crystalsHeld = 0;
      this.recalculateScores();
    }

    this.io.to(this.id).emit('player:died', {
      victimId: victim.socketId,
      victimName: victim.username,
      killerId: killer?.socketId ?? '',
      killerName: killer?.username ?? 'The Arena',
      respawnInMs: RESPAWN_MS,
    });
  }

  // ─── Respawns & Ammo Recharge ──────────────────────────────────────────────

  private checkRespawns(now: number): void {
    for (const player of this.players.values()) {
      if (player.isDead && player.respawnAt > 0 && now >= player.respawnAt) {
        const base = player.team === 'blue' ? BLUE_BASE : RED_BASE;
        player.isDead = false;
        player.respawnAt = 0;
        player.hp = player.maxHp;
        player.ammo = player.heroConfig.ammoCount;
        player.shield = 0;
        player.x = base.x + (Math.random() * 40 - 20);
        player.y = base.y + (Math.random() * 80 - 40);
        player.lastValidX = player.x;
        player.lastValidY = player.y;

        this.io.to(this.id).emit('player:respawned', {
          playerId: player.socketId,
          x: player.x,
          y: player.y,
        });
      }
    }
  }

  private rechargeAmmo(now: number): void {
    for (const player of this.players.values()) {
      if (player.isDead) continue;
      const cfg = player.heroConfig;
      if (player.ammo < cfg.ammoCount) {
        if (now - player.lastAmmoRechargeAt >= cfg.ammoRechargeMs) {
          player.ammo += 1;
          player.lastAmmoRechargeAt = now;
        }
      } else {
        player.lastAmmoRechargeAt = now;
      }
    }
  }

  // ─── Crystal Pickups & Scores ──────────────────────────────────────────────

  private checkCrystalPickups(now: number): void {
    for (const player of this.players.values()) {
      if (player.isDead) continue;

      for (const crystal of this.crystals) {
        if (!crystal.alive) continue;

        if (distance(player.x, player.y, crystal.x, crystal.y) <= PLAYER_RADIUS + 16) {
          crystal.alive = false;
          player.crystalsHeld += 1;
          this.recalculateScores();

          this.io.to(this.id).emit('crystal:collected', {
            crystalId: crystal.id,
            collectorId: player.socketId,
            team: player.team,
            crystalsHeld: player.crystalsHeld,
            blueScore: this.blueScore,
            redScore: this.redScore,
          });
        }
      }
    }

    // Prune dead crystals
    this.crystals = this.crystals.filter(c => c.alive);
  }

  private recalculateScores(): void {
    let blue = 0;
    let red = 0;
    for (const p of this.players.values()) {
      if (p.team === 'blue') blue += p.crystalsHeld;
      else red += p.crystalsHeld;
    }
    this.blueScore = blue;
    this.redScore = red;
  }

  // ─── Win Condition (Crystal Clash 10-gem hold) ─────────────────────────────

  private checkWinCondition(now: number): void {
    if (this.status !== 'RUNNING' && this.status !== 'OVERTIME') return;

    const leaderTeam = this.blueScore >= CRYSTALS_TO_WIN ? 'blue' :
                       this.redScore  >= CRYSTALS_TO_WIN ? 'red'  : null;

    if (leaderTeam) {
      if (this.gemHolderTeam !== leaderTeam) {
        this.gemHolderTeam = leaderTeam;
        this.gemCountdownEnd = now + WIN_COUNTDOWN_S * 1000;
        this.io.to(this.id).emit('game:win_countdown_start', {
          team: leaderTeam,
          secondsRemaining: WIN_COUNTDOWN_S,
        });
      } else if (now >= this.gemCountdownEnd) {
        this.endMatch(leaderTeam, 'crystals');
      }
    } else {
      if (this.gemHolderTeam !== null) {
        this.gemHolderTeam = null;
        this.gemCountdownEnd = 0;
        this.io.to(this.id).emit('game:win_countdown_cancelled');
      }
    }
  }

  // ─── State Broadcast ───────────────────────────────────────────────────────

  private broadcastState(now: number): void {
    const payload = {
      serverTime: now,
      status:     this.status,
      blueScore:  this.blueScore,
      redScore:   this.redScore,
      players:    [...this.players.values()].map(p => this.serializePlayer(p)),
      bullets:    this.bullets.map(b => ({ id: b.id, x: Math.round(b.x), y: Math.round(b.y) })),
      crystals:   this.crystals.map(c => ({ id: c.id, x: Math.round(c.x), y: Math.round(c.y) })),
      aoeZones:   this.aoeZones.map(z => ({ id: z.id, x: Math.round(z.x), y: Math.round(z.y), radius: z.radius, type: z.type })),
    };

    this.io.to(this.id).emit('game:state', payload);
  }

  private serializePlayer(p: ServerPlayer) {
    return {
      id:          p.socketId,
      userId:      p.userId,
      username:    p.username,
      heroSlug:    p.heroSlug,
      team:        p.team,
      x:           Math.round(p.x),
      y:           Math.round(p.y),
      hp:          p.hp,
      maxHp:       p.maxHp,
      shield:      p.shield,
      ammo:        p.ammo,
      superCharge: Math.round(p.superCharge),
      isDead:      p.isDead,
      isInBush:    p.isInBush,
      isDisconnected: p.isDisconnected ?? false,
      respawnAt:   p.respawnAt,
      kills:       p.kills,
      deaths:      p.deaths,
      crystals:    p.crystalsHeld,
      lastSeq:     p.lastProcessedSequence,
    };
  }

  private buildResults(winningTeam: 'blue' | 'red' | 'draw', durationSeconds: number) {
    return {
      roomId:          this.id,
      gameMode:        this.gameMode,
      mapName:         this.mapName,
      winningTeam,
      durationSeconds,
      blueScore:       this.blueScore,
      redScore:        this.redScore,
      players: [...this.players.values()].map((p) => {
        const won = p.team === winningTeam;
        return {
          userId:       p.userId,
          username:     p.username,
          heroSlug:     p.heroSlug,
          team:         p.team,
          won,
          kills:        p.kills,
          deaths:       p.deaths,
          crystals:     p.crystalsHeld,
          damageDealt:  p.damageDealt,
          score:        p.crystalsHeld * 150 + p.kills * 100,
          trophiesDelta: won ? 25 : -5,
          xpGained:     won ? 500 : 100,
          coinsGained:  won ? 250 : 50,
        };
      }),
    };
  }

  get playerCount(): number {
    return this.players.size;
  }
}
