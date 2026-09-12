/**
 * Matchmaker — trophy-based matchmaking queue.
 *
 * Matches players based on:
 *   - Trophy range (±300, expanding by ±100 every 10s)
 *   - Game mode
 *   - Region
 *
 * Once 6 players are matched, creates a GameRoom and notifies them.
 */

import { EventEmitter } from 'events';
import type { Server as IOServer } from 'socket.io';
import { GameRoom } from './GameRoom.js';

export interface QueueEntry {
  socketId:  string;
  userId:    string;
  username:  string;
  heroSlug:  string;
  trophies:  number;
  region:    string;
  gameMode:  string;
  enteredAt: number;
  waitMs:    number;   // total time in queue
}

const PLAYERS_PER_MATCH = 6;  // 3v3
const BASE_TROPHY_RANGE  = 300;
const RANGE_EXPAND_STEP  = 100;
const RANGE_EXPAND_EVERY = 10_000; // expand range every 10s
const TICK_INTERVAL_MS   = 1_000;  // check queue every 1s
const BOT_WAIT_THRESHOLD_MS = 3_000; // after 3s, backfill with bots so solo player can play immediately
const BOT_HEROES = ['blaze', 'volt', 'titan', 'frost', 'rocket', 'luna', 'buster', 'pico'];
const BOT_NAMES = ['VortexBot', 'NovaStrike', 'MechaFury', 'CyberGhost', 'PixelPhantom', 'ThunderBot'];

function randomId(): string {
  return 'ROOM-' + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export class Matchmaker extends EventEmitter {
  private queue = new Map<string, QueueEntry>(); // socketId → entry
  private rooms = new Map<string, GameRoom>();
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private io: IOServer;

  constructor(io: IOServer) {
    super();
    this.io = io;
  }

  start(): void {
    this.tickInterval = setInterval(() => this.tick(), TICK_INTERVAL_MS);
    console.log('[Matchmaker] ✅ Started');
  }

  stop(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);
    console.log('[Matchmaker] Stopped');
  }

  // ─── Queue management ───────────────────────────────────────────────────────

  enqueue(entry: Omit<QueueEntry, 'enteredAt' | 'waitMs'>): void {
    if (this.queue.has(entry.socketId)) return; // already queued

    this.queue.set(entry.socketId, {
      ...entry,
      enteredAt: Date.now(),
      waitMs: 0,
    });

    console.log(
      `[Matchmaker] ${entry.username} (${entry.trophies}🏆) entered queue` +
      ` | Mode: ${entry.gameMode} | Queue size: ${this.queue.size}`
    );

    // Notify the player they are in queue
    this.io.to(entry.socketId).emit('matchmaking:queued', {
      position: this.queue.size,
      mode: entry.gameMode,
    });
  }

  dequeue(socketId: string): void {
    if (this.queue.delete(socketId)) {
      console.log(`[Matchmaker] ${socketId} left queue`);
    }
  }

  /** Called when a socket disconnects — clean up queue and trigger 30s reconnect window */
  handleDisconnect(socketId: string): void {
    this.dequeue(socketId);

    // Notify room of disconnect for grace period / bot AI
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) {
        room.handlePlayerDisconnect(socketId);
        break;
      }
    }
  }

  /** Called when a client reconnects — checks if they belong to an active live match */
  handleReconnect(socketId: string, userId: string): boolean {
    for (const room of this.rooms.values()) {
      if (room.reconnectPlayer(socketId, userId)) {
        return true;
      }
    }
    return false;
  }

  // ─── Tick: try to form matches ───────────────────────────────────────────────

  private tick(): void {
    const now = Date.now();

    // Update wait times
    for (const entry of this.queue.values()) {
      entry.waitMs = now - entry.enteredAt;
    }

    // Group by game mode
    const byMode = new Map<string, QueueEntry[]>();
    for (const entry of this.queue.values()) {
      const list = byMode.get(entry.gameMode) || [];
      list.push(entry);
      byMode.set(entry.gameMode, list);
    }

    for (const [mode, entries] of byMode.entries()) {
      if (entries.length < PLAYERS_PER_MATCH) {
        // If someone has waited long enough, fill the lobby with bots
        const eligibleForBotMatch = entries.filter(e => e.waitMs >= BOT_WAIT_THRESHOLD_MS);
        if (eligibleForBotMatch.length > 0) {
          const humans = entries.slice(0, Math.min(entries.length, PLAYERS_PER_MATCH));
          for (const h of humans) {
            this.queue.delete(h.socketId);
          }
          this.createMatchWithBots(humans, mode);
          continue;
        }

        // Not enough players — send queue update
        for (const e of entries) {
          this.io.to(e.socketId).emit('matchmaking:searching', {
            playersFound: entries.length,
            playersNeeded: PLAYERS_PER_MATCH,
            waitMs: e.waitMs,
          });
        }
        continue;
      }

      // Sort by trophies
      entries.sort((a, b) => a.trophies - b.trophies);

      // Sliding window match
      for (let i = 0; i <= entries.length - PLAYERS_PER_MATCH; i++) {
        const window = entries.slice(i, i + PLAYERS_PER_MATCH);
        const minTrophies = window[0].trophies;
        const maxTrophies = window[PLAYERS_PER_MATCH - 1].trophies;

        // Calculate dynamic range based on longest wait time in window
        const longestWait = Math.max(...window.map(e => e.waitMs));
        const expansions = Math.floor(longestWait / RANGE_EXPAND_EVERY);
        const allowedRange = BASE_TROPHY_RANGE + expansions * RANGE_EXPAND_STEP;

        if (maxTrophies - minTrophies <= allowedRange) {
          this.createMatch(window, mode);
          // Remove matched players from queue
          for (const entry of window) {
            this.queue.delete(entry.socketId);
          }
          break;
        }
      }
    }
  }

  // ─── Create match ────────────────────────────────────────────────────────────

  private createMatch(players: QueueEntry[], gameMode: string): void {
    const roomId = randomId();
    const room = new GameRoom(roomId, this.io, gameMode);
    this.rooms.set(roomId, room);

    // Assign teams (top 3 trophies = blue, bottom 3 = red for fairness)
    const sorted = [...players].sort((a, b) => b.trophies - a.trophies);
    const blueTeam = [sorted[0], sorted[2], sorted[4]];
    const redTeam  = [sorted[1], sorted[3], sorted[5]];

    for (const entry of blueTeam) {
      room.addPlayer(entry.socketId, entry.userId, entry.username, entry.heroSlug, 'blue');
      this.io.sockets.sockets.get(entry.socketId)?.join(roomId);
    }
    for (const entry of redTeam) {
      room.addPlayer(entry.socketId, entry.userId, entry.username, entry.heroSlug, 'red');
      this.io.sockets.sockets.get(entry.socketId)?.join(roomId);
    }

    // Notify all matched players
    this.io.to(roomId).emit('match:found', {
      roomId,
      gameMode,
      mapName: 'Crystal Cavern',
      blueTeam: blueTeam.map(e => ({ username: e.username, heroSlug: e.heroSlug, trophies: e.trophies })),
      redTeam:  redTeam.map(e => ({ username: e.username, heroSlug: e.heroSlug, trophies: e.trophies })),
    });

    console.log(
      `[Matchmaker] ✅ Match created: ${roomId}\n` +
      `  Blue: ${blueTeam.map(e => e.username).join(', ')}\n` +
      `  Red:  ${redTeam.map(e => e.username).join(', ')}`
    );

    // Countdown after brief delay for players to see match card
    setTimeout(() => room.startCountdown(), 3000);

    // Wire room events
    room.on('match:complete', (data) => {
      this.emit('match:complete', data);
    });

    room.on('room:close', (id: string) => {
      this.rooms.delete(id);
      console.log(`[Matchmaker] Room ${id} closed`);
    });
  }

  // ─── Create match with bots ──────────────────────────────────────────────────

  private createMatchWithBots(humans: QueueEntry[], gameMode: string): void {
    const roomId = randomId();
    const room = new GameRoom(roomId, this.io, gameMode);
    this.rooms.set(roomId, room);

    const blueTeam: Array<{ socketId: string; userId: string; username: string; heroSlug: string; trophies: number; isBot: boolean }> = [];
    const redTeam: Array<{ socketId: string; userId: string; username: string; heroSlug: string; trophies: number; isBot: boolean }> = [];

    // Distribute humans
    humans.forEach((h, idx) => {
      const target = idx % 2 === 0 ? blueTeam : redTeam;
      target.push({
        socketId: h.socketId,
        userId: h.userId,
        username: h.username,
        heroSlug: h.heroSlug,
        trophies: h.trophies,
        isBot: false,
      });
    });

    let botIdx = 0;
    while (blueTeam.length < 3) {
      const hero = BOT_HEROES[Math.floor(Math.random() * BOT_HEROES.length)];
      const name = BOT_NAMES[botIdx % BOT_NAMES.length];
      botIdx++;
      blueTeam.push({
        socketId: `bot_${roomId}_blue_${blueTeam.length}`,
        userId: `bot_user_${name.toLowerCase()}`,
        username: `[BOT] ${name}`,
        heroSlug: hero,
        trophies: 450 + Math.floor(Math.random() * 200),
        isBot: true,
      });
    }

    while (redTeam.length < 3) {
      const hero = BOT_HEROES[Math.floor(Math.random() * BOT_HEROES.length)];
      const name = BOT_NAMES[botIdx % BOT_NAMES.length];
      botIdx++;
      redTeam.push({
        socketId: `bot_${roomId}_red_${redTeam.length}`,
        userId: `bot_user_${name.toLowerCase()}`,
        username: `[BOT] ${name}`,
        heroSlug: hero,
        trophies: 450 + Math.floor(Math.random() * 200),
        isBot: true,
      });
    }

    for (const p of blueTeam) {
      room.addPlayer(p.socketId, p.userId, p.username, p.heroSlug, 'blue', p.isBot);
      if (!p.isBot) {
        this.io.sockets.sockets.get(p.socketId)?.join(roomId);
      }
    }
    for (const p of redTeam) {
      room.addPlayer(p.socketId, p.userId, p.username, p.heroSlug, 'red', p.isBot);
      if (!p.isBot) {
        this.io.sockets.sockets.get(p.socketId)?.join(roomId);
      }
    }

    this.io.to(roomId).emit('match:found', {
      roomId,
      gameMode,
      mapName: 'Crystal Cavern',
      blueTeam: blueTeam.map(e => ({ username: e.username, heroSlug: e.heroSlug, trophies: e.trophies })),
      redTeam:  redTeam.map(e => ({ username: e.username, heroSlug: e.heroSlug, trophies: e.trophies })),
    });

    console.log(
      `[Matchmaker] ✅ Bot match created: ${roomId}\n` +
      `  Blue: ${blueTeam.map(e => e.username).join(', ')}\n` +
      `  Red:  ${redTeam.map(e => e.username).join(', ')}`
    );

    setTimeout(() => room.startCountdown(), 2500);

    room.on('match:complete', (data) => {
      this.emit('match:complete', data);
    });

    room.on('room:close', (id: string) => {
      this.rooms.delete(id);
      console.log(`[Matchmaker] Room ${id} closed`);
    });
  }

  // ─── Input forwarding ────────────────────────────────────────────────────────

  receiveInput(socketId: string, input: Parameters<GameRoom['receiveInput']>[1]): void {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) {
        room.receiveInput(socketId, input);
        return;
      }
    }
  }

  get queueSize(): number {
    return this.queue.size;
  }

  get activeRooms(): number {
    return this.rooms.size;
  }
}
