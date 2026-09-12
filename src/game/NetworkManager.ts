/**
 * NetworkManager — Socket.IO client wrapper with client prediction and interpolation buffer.
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const INPUT_RATE_MS = 50; // 20 TPS client input rate

// ─── Data Types ───────────────────────────────────────────────────────────────

export interface PlayerState {
  id: string;
  userId: string;
  username: string;
  heroSlug: string;
  team: 'blue' | 'red';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  shield?: number;
  ammo: number;
  superCharge: number;
  isDead: boolean;
  isInBush?: boolean;
  isDisconnected?: boolean;
  respawnAt: number;
  kills: number;
  deaths: number;
  crystals: number;
  lastSeq: number;
}

export interface BulletState {
  id: string;
  x: number;
  y: number;
}

export interface CrystalState {
  id: string;
  x: number;
  y: number;
}

export interface AOEZoneState {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: string;
}

export interface GameSnapshot {
  players:    PlayerState[];
  bullets:    BulletState[];
  crystals:   CrystalState[];
  aoeZones?:  AOEZoneState[];
  blueScore:  number;
  redScore:   number;
  status:     string;
  serverTime: number;
  receivedAt: number;  // local timestamp when received
}

export interface PendingInput {
  dx: number;
  dy: number;
  aimX: number;
  aimY: number;
  firing: boolean;
  usingSuper: boolean;
  sequenceNumber: number;
}

export interface SuperEffectData {
  heroSlug: string;
  type: string;
  x?: number;
  y?: number;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  radius?: number;
  value?: number;
}

export interface NetworkCallbacks {
  onMatchFound:    (data: { roomId: string; blueTeam: object[]; redTeam: object[] }) => void;
  onCountdown:     (data: { seconds: number }) => void;
  onGameStart:     (data: { mapName: string }) => void;
  onGameState:     (snapshot: GameSnapshot) => void;
  onPlayerDamaged: (data: { targetId: string; damage: number; remainingHp: number; shield?: number }) => void;
  onPlayerDied:    (data: { victimId: string; victimName?: string; killerId: string; killerName?: string; respawnInMs: number }) => void;
  onPlayerRespawned:(data: { playerId: string; x: number; y: number }) => void;
  onSuperEffect:   (data: SuperEffectData) => void;
  onCrystalSpawned:(data: { id: string; x: number; y: number }) => void;
  onCrystalCollected: (data: { crystalId: string; collectorId: string; team: string; crystalsHeld: number; blueScore: number; redScore: number }) => void;
  onWinCountdownStart: (data: { team: string; secondsRemaining: number }) => void;
  onWinCountdownCancelled: () => void;
  onPlayerDisconnected: (data: { socketId: string; username: string }) => void;
  onPlayerReconnected:  (data: { socketId: string; username: string }) => void;
  onGameOver:      (data: object) => void;
  onDisconnect:    (reason: string) => void;
  onError:         (err: string) => void;
}

export class NetworkManager {
  private socket: Socket | null = null;
  private callbacks: Partial<NetworkCallbacks> = {};
  private inputInterval: ReturnType<typeof setInterval> | null = null;
  private currentInput: PendingInput | null = null;
  private sequenceNumber = 0;
  private mySocketId: string | null = null;

  // Snapshot buffer for interpolation
  private snapshotBuffer: GameSnapshot[] = [];
  readonly MAX_BUFFER = 4;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.once('connect', () => {
        this.mySocketId = this.socket!.id ?? null;
        console.log(`[Network] Connected: ${this.mySocketId}`);
        this.startInputLoop();
        resolve();
      });

      this.socket.once('connect_error', (err) => {
        console.error('[Network] Connection failed:', err.message);
        reject(err);
      });

      this.registerHandlers();
    });
  }

  disconnect(): void {
    this.stopInputLoop();
    this.socket?.disconnect();
    this.socket = null;
    this.mySocketId = null;
    this.snapshotBuffer = [];
  }

  setCallbacks(callbacks: Partial<NetworkCallbacks>): void {
    this.callbacks = callbacks;
  }

  // ─── Matchmaking ───────────────────────────────────────────────────────────

  enterMatchmaking(heroSlug: string, gameMode = 'gem_grab', trophies = 0): void {
    this.socket?.emit('matchmaking:enter', { heroSlug, gameMode, trophies, region: 'global' });
  }

  cancelMatchmaking(): void {
    this.socket?.emit('matchmaking:cancel');
  }

  // ─── Input ─────────────────────────────────────────────────────────────────

  setInput(input: Omit<PendingInput, 'sequenceNumber'>): number {
    const seq = ++this.sequenceNumber;
    this.currentInput = { ...input, sequenceNumber: seq };
    return seq;
  }

  private startInputLoop(): void {
    this.inputInterval = setInterval(() => {
      if (!this.currentInput || !this.socket?.connected) return;
      this.socket.emit('player:input', this.currentInput);
    }, INPUT_RATE_MS);
  }

  private stopInputLoop(): void {
    if (this.inputInterval) clearInterval(this.inputInterval);
    this.inputInterval = null;
  }

  // ─── Snapshot buffer for interpolation ────────────────────────────────────

  getInterpolatedState(renderTime: number): GameSnapshot | null {
    const buf = this.snapshotBuffer;
    if (buf.length < 2) return buf[buf.length - 1] || null;

    let newer = buf[buf.length - 1];
    let older = buf[buf.length - 2];

    for (let i = buf.length - 1; i >= 1; i--) {
      if (buf[i].serverTime <= renderTime) {
        older = buf[i - 1];
        newer = buf[i];
        break;
      }
    }

    const duration = newer.serverTime - older.serverTime;
    if (duration <= 0) return newer;

    const t = Math.min(1, Math.max(0, (renderTime - older.serverTime) / duration));

    const players = newer.players.map((newP) => {
      const oldP = older.players.find(p => p.id === newP.id);
      if (!oldP) return newP;
      return {
        ...newP,
        x: oldP.x + (newP.x - oldP.x) * t,
        y: oldP.y + (newP.y - oldP.y) * t,
      };
    });

    return { ...newer, players };
  }

  get myId(): string | null {
    return this.mySocketId;
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ─── Socket handlers ───────────────────────────────────────────────────────

  private registerHandlers(): void {
    if (!this.socket) return;

    this.socket.on('match:found', (data) => {
      this.callbacks.onMatchFound?.(data);
    });

    this.socket.on('game:countdown', (data) => {
      this.callbacks.onCountdown?.(data);
    });

    this.socket.on('game:start', (data) => {
      this.callbacks.onGameStart?.(data);
    });

    this.socket.on('game:state', (snapshot: Omit<GameSnapshot, 'receivedAt'>) => {
      const enriched: GameSnapshot = { ...snapshot, receivedAt: Date.now() };

      this.snapshotBuffer.push(enriched);
      if (this.snapshotBuffer.length > this.MAX_BUFFER) {
        this.snapshotBuffer.shift();
      }

      this.callbacks.onGameState?.(enriched);
    });

    this.socket.on('player:damaged', (data) => {
      this.callbacks.onPlayerDamaged?.(data);
    });

    this.socket.on('player:died', (data) => {
      this.callbacks.onPlayerDied?.(data);
    });

    this.socket.on('player:respawned', (data) => {
      this.callbacks.onPlayerRespawned?.(data);
    });

    this.socket.on('super:effect', (data) => {
      this.callbacks.onSuperEffect?.(data);
    });

    this.socket.on('crystal:spawned', (data) => {
      this.callbacks.onCrystalSpawned?.(data);
    });

    this.socket.on('crystal:collected', (data) => {
      this.callbacks.onCrystalCollected?.(data);
    });

    this.socket.on('game:win_countdown_start', (data) => {
      this.callbacks.onWinCountdownStart?.(data);
    });

    this.socket.on('game:win_countdown_cancelled', () => {
      this.callbacks.onWinCountdownCancelled?.();
    });

    this.socket.on('player:disconnected', (data) => {
      this.callbacks.onPlayerDisconnected?.(data);
    });

    this.socket.on('player:reconnected', (data) => {
      this.callbacks.onPlayerReconnected?.(data);
    });

    this.socket.on('game:over', (data) => {
      this.callbacks.onGameOver?.(data);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[Network] Disconnected:', reason);
      this.callbacks.onDisconnect?.(reason);
    });

    this.socket.on('connect_error', (err) => {
      this.callbacks.onError?.(err.message);
    });
  }
}

export const networkManager = new NetworkManager();
