import * as Phaser from 'phaser';
import { networkManager, GameSnapshot, PlayerState, SuperEffectData } from '../NetworkManager';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  ARENA_WALLS,
  ARENA_BUSHES,
  CRYSTAL_MINE,
  resolveWallSliding,
} from '../MapLayout';

// ─── Callbacks from PhaserGame (React HUD) ─────────────────────────────────

export interface GameEventCallbacks {
  onScoreUpdate:  (blue: number, red: number) => void;
  onHealthUpdate: (current: number, max: number, superCharge: number, powerCubes: number, ammo: number) => void;
  onGameOver:     (won: boolean, stats: { kills: number; deaths: number; crystals: number; damage: number }) => void;
  onWinAlert?:    (message: string | null) => void;
}

// ─── Init data from PhaserGame ──────────────────────────────────────────────

export interface ArenaInitData {
  callbacks:  GameEventCallbacks;
  roomId?:    string;
  heroSlug?:  string;
  mySocketId?:string;
}

// ─── Internal sprite registry ───────────────────────────────────────────────

interface PlayerSprite {
  body:        Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  nameLabel:   Phaser.GameObjects.Text;
  hpBarBg:     Phaser.GameObjects.Rectangle;
  hpBar:       Phaser.GameObjects.Rectangle;
  ammoBar:     Phaser.GameObjects.Rectangle[];
  deadOverlay?:Phaser.GameObjects.Graphics;
  team:        'blue' | 'red';
  isLocal:     boolean;
}

const HERO_TEXTURES: Record<string, string> = {
  blaze:  'hero_blaze',
  volt:   'hero_volt',
  titan:  'hero_titan',
  frost:  'hero_frost',
  rocket: 'hero_rocket',
  luna:   'hero_luna',
  buster: 'hero_buster',
  pico:   'hero_pico',
};

// ─── ArenaScene ─────────────────────────────────────────────────────────────

export class ArenaScene extends Phaser.Scene {
  private callbacks!: GameEventCallbacks;
  private roomId   = '';
  private heroSlug = 'blaze';
  private mySocketId = '';

  // Sprite registry keyed by socketId
  private playerSprites = new Map<string, PlayerSprite>();

  // Visuals
  private bulletSprites  = new Map<string, Phaser.GameObjects.Arc>();
  private crystalSprites = new Map<string, Phaser.GameObjects.Image>();
  private aoeVisuals     = new Map<string, Phaser.GameObjects.Arc>();

  // Graphics & Containers
  private aimGraphics!: Phaser.GameObjects.Graphics;
  private wallsGroup!:  Phaser.GameObjects.Group;
  private bushesGroup!: Phaser.GameObjects.Group;
  private mineCore!:    Phaser.GameObjects.Arc;
  private mineRing!:    Phaser.GameObjects.Arc;

  // Keyboard & Aim Input
  private wasdKeys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private aimTarget = { x: 0, y: 0 };
  private isFiring  = false;

  // Client-Side Prediction (Local Player)
  private predictX = 200;
  private predictY = 500;
  private inputHistory: Array<{ seq: number; dx: number; dy: number; dt: number }> = [];

  // Cached HUD state
  private cachedHp    = 4800;
  private cachedMaxHp = 4800;
  private cachedAmmo  = 3;
  private cachedSuper = 0;

  // Overlays
  private countdownText!: Phaser.GameObjects.Text;
  private alertBanner!:   Phaser.GameObjects.Text;
  private isMatchRunning = false;

  constructor() {
    super('ArenaScene');
  }

  init(data?: Partial<ArenaInitData>) {
    if (data?.callbacks) this.callbacks = data.callbacks;
    if (data?.roomId)    this.roomId = data.roomId;
    if (data?.heroSlug)  this.heroSlug = data.heroSlug;
    this.mySocketId = data?.mySocketId || networkManager.myId || '';
  }

  // ─── create ───────────────────────────────────────────────────────────────

  create() {
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    this.generateArenaTextures();
    this.renderMapEnvironment();
    this.buildMapObstacles();

    this.aimGraphics = this.add.graphics().setDepth(25);

    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.setZoom(1.05);

    // Keyboard inputs
    if (this.input.keyboard) {
      this.cursors  = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
    }

    // Pointer aiming & firing
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.aimTarget = { x: p.worldX, y: p.worldY };
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.isFiring  = true;
      this.aimTarget = { x: p.worldX, y: p.worldY };
    });
    this.input.on('pointerup', () => {
      this.isFiring = false;
    });

    // Countdown overlay
    this.countdownText = this.add.text(MAP_WIDTH / 2, MAP_HEIGHT / 2, '', {
      fontFamily: 'Montserrat Black, sans-serif',
      fontSize: '96px',
      color: '#FACC15',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);

    // Top Alert Banner (for Crystal 15s Countdown)
    this.alertBanner = this.add.text(MAP_WIDTH / 2, 70, '', {
      fontFamily: 'Montserrat Black, sans-serif',
      fontSize: '20px',
      color: '#FFFFFF',
      backgroundColor: '#991B1B',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(45).setScrollFactor(0).setVisible(false);

    // Wire Socket.IO callbacks into scene
    networkManager.setCallbacks({
      onGameState:          (snapshot) => this.renderServerState(snapshot),
      onPlayerDamaged:      (data) => this.handlePlayerDamaged(data.targetId, data.damage, data.shield),
      onPlayerDied:         (data) => this.handlePlayerDeath(data.victimId, data.killerId, data.killerName ?? '', data.respawnInMs),
      onPlayerRespawned:    (data) => this.handlePlayerRespawn(data.playerId, data.x, data.y),
      onSuperEffect:        (data) => this.renderSuperEffect(data),
      onCrystalCollected:   (data) => this.handleCrystalPickup(data.collectorId, data.blueScore, data.redScore),
      onWinCountdownStart:  (data) => this.showWinCountdown(data.team, data.secondsRemaining),
      onWinCountdownCancelled: () => this.hideWinCountdown(),
      onCountdown:          (data) => this.showCountdown(data.seconds),
      onGameStart:          () => { this.isMatchRunning = true; this.countdownText.setVisible(false); },
      onGameOver:           (data) => this.handleGameOver(data as Record<string, unknown>),
      onDisconnect:         (reason) => console.warn('[Arena] Disconnected:', reason),
    });
  }

  // ─── update (60 FPS) ──────────────────────────────────────────────────────

  update(_time: number, delta: number) {
    const dt = delta / 1000;

    // Gather movement input
    let dx = 0;
    let dy = 0;
    if (this.wasdKeys?.A.isDown || this.cursors?.left.isDown)  dx -= 1;
    if (this.wasdKeys?.D.isDown || this.cursors?.right.isDown) dx += 1;
    if (this.wasdKeys?.W.isDown || this.cursors?.up.isDown)    dy -= 1;
    if (this.wasdKeys?.S.isDown || this.cursors?.down.isDown)  dy += 1;

    // Normalise diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    // Client-side prediction with wall sliding
    const speed = 290;
    const targetX = Phaser.Math.Clamp(this.predictX + dx * speed * dt, 24, MAP_WIDTH - 24);
    const targetY = Phaser.Math.Clamp(this.predictY + dy * speed * dt, 24, MAP_HEIGHT - 24);
    const resolved = resolveWallSliding(this.predictX, this.predictY, targetX, targetY, 24);

    this.predictX = resolved.x;
    this.predictY = resolved.y;

    // Send input to server and record sequence
    const seq = networkManager.setInput({
      dx,
      dy,
      aimX:       this.aimTarget.x,
      aimY:       this.aimTarget.y,
      firing:     this.isFiring,
      usingSuper: false,
    });

    this.inputHistory.push({ seq, dx, dy, dt });
    if (this.inputHistory.length > 60) this.inputHistory.shift();

    // Position local player sprite at predicted location
    const localSprite = this.playerSprites.get(this.mySocketId);
    if (localSprite && !localSprite.deadOverlay?.visible) {
      localSprite.body.setPosition(this.predictX, this.predictY);
      this.cameras.main.startFollow(localSprite.body, true, 0.1, 0.1);
      this.updatePlayerLabelPos(localSprite);
    }

    // Aim Line
    this.drawAimLine();

    // Rotate Crystal Mine Ring
    if (this.mineRing) {
      this.mineRing.rotation += 0.02;
    }
  }

  // ─── Server State Renderer ────────────────────────────────────────────────

  private renderServerState(snapshot: GameSnapshot) {
    // 1. Reconcile Local Player
    const me = snapshot.players.find(p => p.id === this.mySocketId);
    if (me) {
      const errDist = Phaser.Math.Distance.Between(this.predictX, this.predictY, me.x, me.y);
      if (errDist > 40) {
        // Correct position and replay pending inputs newer than me.lastSeq
        this.predictX = me.x;
        this.predictY = me.y;
        this.inputHistory = this.inputHistory.filter(item => item.seq > me.lastSeq);
        for (const input of this.inputHistory) {
          const tX = Phaser.Math.Clamp(this.predictX + input.dx * 290 * input.dt, 24, MAP_WIDTH - 24);
          const tY = Phaser.Math.Clamp(this.predictY + input.dy * 290 * input.dt, 24, MAP_HEIGHT - 24);
          const res = resolveWallSliding(this.predictX, this.predictY, tX, tY, 24);
          this.predictX = res.x;
          this.predictY = res.y;
        }
      }

      // Update HUD
      if (
        me.hp !== this.cachedHp ||
        me.maxHp !== this.cachedMaxHp ||
        me.ammo !== this.cachedAmmo ||
        me.superCharge !== this.cachedSuper
      ) {
        this.cachedHp    = me.hp;
        this.cachedMaxHp = me.maxHp;
        this.cachedAmmo  = me.ammo;
        this.cachedSuper = me.superCharge;
        this.callbacks?.onHealthUpdate(me.hp, me.maxHp, me.superCharge, me.crystals, me.ammo);
      }
    }

    // 2. Render Players & Remote Interpolation
    const activeIds = new Set<string>();

    for (const p of snapshot.players) {
      activeIds.add(p.id);
      const isLocal = p.id === this.mySocketId;
      let ps = this.playerSprites.get(p.id);

      if (!ps) {
        ps = this.createPlayerSprite(p, isLocal);
        this.playerSprites.set(p.id, ps);
      }

      // If remote, interpolate position smoothly
      if (!isLocal) {
        this.tweens.add({
          targets: ps.body,
          x: p.x,
          y: p.y,
          duration: 33,
          ease: 'Linear',
        });
        this.updatePlayerLabelPos(ps);

        // Bush Stealth Visibility Logic
        if (p.isInBush) {
          if (me && p.team !== me.team) {
            // Enemy in bush: visible only if within 100px proximity
            const dist = Phaser.Math.Distance.Between(me.x, me.y, p.x, p.y);
            if (dist > 100) {
              ps.body.setAlpha(0);
              ps.nameLabel.setAlpha(0);
              ps.hpBar.setAlpha(0);
              ps.hpBarBg.setAlpha(0);
            } else {
              ps.body.setAlpha(0.45);
              ps.nameLabel.setAlpha(0.6);
              ps.hpBar.setAlpha(0.6);
              ps.hpBarBg.setAlpha(0.6);
            }
          } else {
            // Teammate in bush
            ps.body.setAlpha(0.6);
            ps.nameLabel.setAlpha(0.8);
            ps.hpBar.setAlpha(0.8);
            ps.hpBarBg.setAlpha(0.8);
          }
        } else {
          ps.body.setAlpha(1.0);
          ps.nameLabel.setAlpha(1.0);
          ps.hpBar.setAlpha(1.0);
          ps.hpBarBg.setAlpha(1.0);
        }
      } else {
        // Local player in bush
        ps.body.setAlpha(p.isInBush ? 0.65 : 1.0);
      }

      // Update HP bar
      const pct = Math.max(0, Math.min(1, p.hp / (p.maxHp || 1)));
      ps.hpBar.width = Math.round(44 * pct);
      ps.hpBar.fillColor = p.team === 'blue' ? 0x00D9FF : 0xEF4444;

      // Update Ammo pips
      for (let i = 0; i < 3; i++) {
        ps.ammoBar[i].fillColor = i < p.ammo ? 0xF97316 : 0x334155;
      }
    }

    // Cleanup disconnected sprites
    for (const [id, ps] of this.playerSprites.entries()) {
      if (!activeIds.has(id)) {
        ps.body.destroy();
        ps.nameLabel.destroy();
        ps.hpBarBg.destroy();
        ps.hpBar.destroy();
        ps.ammoBar.forEach(a => a.destroy());
        this.playerSprites.delete(id);
      }
    }

    // 3. Render Bullets
    const activeBulletIds = new Set<string>();
    for (const b of snapshot.bullets) {
      activeBulletIds.add(b.id);
      let bs = this.bulletSprites.get(b.id);
      if (!bs) {
        bs = this.add.circle(b.x, b.y, 6, 0xFACC15).setDepth(20);
        this.bulletSprites.set(b.id, bs);
      } else {
        bs.setPosition(b.x, b.y);
      }
    }
    for (const [id, bs] of this.bulletSprites.entries()) {
      if (!activeBulletIds.has(id)) {
        bs.destroy();
        this.bulletSprites.delete(id);
      }
    }

    // 4. Render Crystals
    const activeCrystalIds = new Set<string>();
    for (const c of snapshot.crystals) {
      activeCrystalIds.add(c.id);
      let cs = this.crystalSprites.get(c.id);
      if (!cs) {
        cs = this.add.image(c.x, c.y, 'gem_crystal').setDepth(15);
        this.tweens.add({
          targets: cs,
          y: c.y - 6,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        this.crystalSprites.set(c.id, cs);
      }
    }
    for (const [id, cs] of this.crystalSprites.entries()) {
      if (!activeCrystalIds.has(id)) {
        cs.destroy();
        this.crystalSprites.delete(id);
      }
    }

    // 5. Update Score
    this.callbacks?.onScoreUpdate(snapshot.blueScore, snapshot.redScore);
  }

  // ─── Super Visual Effects ──────────────────────────────────────────────────

  private renderSuperEffect(data: SuperEffectData) {
    switch (data.type) {
      case 'fire_storm': {
        const x = data.x ?? MAP_WIDTH / 2;
        const y = data.y ?? MAP_HEIGHT / 2;
        const r = data.radius ?? 130;
        const fire = this.add.circle(x, y, r, 0xEF4444, 0.35).setDepth(14);
        this.tweens.add({
          targets: fire,
          alpha: { from: 0.4, to: 0.15 },
          duration: 350,
          yoyo: true,
          repeat: 8,
          onComplete: () => fire.destroy(),
        });
        this.cameras.main.shake(200, 0.01);
        break;
      }

      case 'lightning_dash': {
        const line = this.add.graphics().setDepth(26);
        line.lineStyle(6, 0x38BDF8, 1);
        line.lineBetween(data.startX ?? 0, data.startY ?? 0, data.endX ?? 0, data.endY ?? 0);
        this.tweens.add({
          targets: line,
          alpha: 0,
          duration: 350,
          onComplete: () => line.destroy(),
        });
        this.cameras.main.shake(180, 0.015);
        break;
      }

      case 'hammer_quake': {
        const x = data.x ?? 0;
        const y = data.y ?? 0;
        const ring = this.add.circle(x, y, 10).setStrokeStyle(5, 0xFACC15, 1).setDepth(26);
        this.tweens.add({
          targets: ring,
          radius: data.radius ?? 170,
          alpha: 0,
          duration: 450,
          onComplete: () => ring.destroy(),
        });
        this.cameras.main.shake(350, 0.025);
        break;
      }

      case 'ice_burst': {
        const x = data.x ?? 0;
        const y = data.y ?? 0;
        const frost = this.add.circle(x, y, data.radius ?? 180, 0x06B6D4, 0.4).setDepth(14);
        this.tweens.add({
          targets: frost,
          alpha: 0,
          duration: 600,
          onComplete: () => frost.destroy(),
        });
        this.cameras.main.shake(150, 0.01);
        break;
      }

      case 'star_beam': {
        const x = data.x ?? 0;
        const y = data.y ?? 0;
        const aura = this.add.circle(x, y, data.radius ?? 240, 0x22C55E, 0.35).setDepth(14);
        this.tweens.add({
          targets: aura,
          alpha: 0,
          duration: 700,
          onComplete: () => aura.destroy(),
        });
        break;
      }
    }
  }

  // ─── Combat & Particle Effects ─────────────────────────────────────────────

  private handlePlayerDamaged(targetId: string, damage: number, shield?: number) {
    const ps = this.playerSprites.get(targetId);
    if (!ps) return;

    // Floating damage numbers
    const color = shield && shield > 0 ? '#38BDF8' : '#EF4444';
    this.showFloatingText(ps.body.x, ps.body.y - 28, `-${damage}`, color);

    // Hit impact flash
    ps.body.setTint(0xFFFFFF);
    this.time.delayedCall(80, () => ps.body.clearTint());
  }

  private handleCrystalPickup(collectorId: string, _blue: number, _red: number) {
    const ps = this.playerSprites.get(collectorId);
    if (ps) {
      this.showFloatingText(ps.body.x, ps.body.y - 24, '+1 💎', '#00D9FF');
    }
  }

  private handlePlayerDeath(victimId: string, _killerId: string, killerName: string, respawnInMs: number) {
    const ps = this.playerSprites.get(victimId);
    if (!ps) return;

    ps.body.setVisible(false);
    ps.nameLabel.setVisible(false);
    ps.hpBar.setVisible(false);
    ps.hpBarBg.setVisible(false);
    ps.ammoBar.forEach(a => a.setVisible(false));

    this.showFloatingText(ps.body.x, ps.body.y, `💀 ELIMINATED BY ${killerName}`, '#F43F5E');

    if (ps.isLocal) {
      this.countdownText.setText(`RESPAWN IN ${Math.ceil(respawnInMs / 1000)}s`).setVisible(true);
    }
  }

  private handlePlayerRespawn(playerId: string, x: number, y: number) {
    const ps = this.playerSprites.get(playerId);
    if (!ps) return;

    ps.body.setPosition(x, y).setVisible(true).setAlpha(1);
    ps.nameLabel.setVisible(true).setAlpha(1);
    ps.hpBar.setVisible(true).setAlpha(1);
    ps.hpBarBg.setVisible(true).setAlpha(1);
    ps.ammoBar.forEach(a => a.setVisible(true).setAlpha(1));

    if (ps.isLocal) {
      this.predictX = x;
      this.predictY = y;
      this.countdownText.setVisible(false);
    }
  }

  private showWinCountdown(team: string, seconds: number) {
    this.alertBanner
      .setText(`⚠️ ${team.toUpperCase()} TEAM HAS 10 GEMS! ${seconds}s TO WIN!`)
      .setBackgroundColor(team === 'blue' ? '#0369A1' : '#991B1B')
      .setVisible(true);
  }

  private hideWinCountdown() {
    this.alertBanner.setVisible(false);
  }

  private showCountdown(seconds: number) {
    if (seconds > 0) {
      this.countdownText.setText(`${seconds}`).setVisible(true);
    } else {
      this.countdownText.setText('FIGHT!').setColor('#22C55E');
      this.time.delayedCall(800, () => this.countdownText.setVisible(false));
    }
  }

  private handleGameOver(data: Record<string, unknown>) {
    this.isMatchRunning = false;
    const winningTeam = data.winningTeam as string;
    const localPlayer = this.playerSprites.get(this.mySocketId);
    const won = localPlayer ? localPlayer.team === winningTeam : false;

    this.callbacks?.onGameOver(won, {
      kills:    (data.kills as number)    ?? 0,
      deaths:   (data.deaths as number)   ?? 0,
      crystals: (data.crystals as number) ?? 0,
      damage:   (data.damage as number)   ?? 0,
    });
  }

  // ─── Public API (PhaserGame Buttons) ───────────────────────────────────────

  public activateSuper() {
    networkManager.setInput({
      dx: 0, dy: 0,
      aimX: this.aimTarget.x, aimY: this.aimTarget.y,
      firing: false,
      usingSuper: true,
    });
    this.cameras.main.shake(250, 0.015);
  }

  public performDash() {
    const ps = this.playerSprites.get(this.mySocketId);
    if (!ps) return;
    this.showFloatingText(ps.body.x, ps.body.y - 20, '💨 GADGET', '#00D9FF');
  }

  public shootPlayerAttack(aimX: number, aimY: number) {
    this.aimTarget = { x: aimX, y: aimY };
    this.isFiring = true;
    this.time.delayedCall(100, () => { this.isFiring = false; });
  }

  // ─── Sprite & Environment Builders ────────────────────────────────────────

  private createPlayerSprite(p: PlayerState, isLocal: boolean): PlayerSprite {
    const textureKey = HERO_TEXTURES[p.heroSlug] || 'hero_blaze';
    const body = this.physics.add.sprite(p.x, p.y, textureKey).setDepth(18);
    body.setCollideWorldBounds(true);

    const nameLabel = this.add.text(p.x, p.y - 34, p.username, {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: '11px',
      color: isLocal ? '#FACC15' : '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(19);

    const hpBarBg = this.add.rectangle(p.x, p.y - 22, 46, 6, 0x000000, 0.7).setDepth(19);
    const hpBar   = this.add.rectangle(p.x - 22, p.y - 22, 44, 4, p.team === 'blue' ? 0x00D9FF : 0xEF4444).setOrigin(0, 0.5).setDepth(20);

    const ammoBar = [0, 1, 2].map((idx) => {
      return this.add.rectangle(p.x - 16 + idx * 12, p.y - 16, 9, 3, 0xF97316).setOrigin(0, 0.5).setDepth(20);
    });

    return { body, nameLabel, hpBarBg, hpBar, ammoBar, team: p.team, isLocal };
  }

  private updatePlayerLabelPos(ps: PlayerSprite) {
    const x = ps.body.x;
    const y = ps.body.y;
    ps.nameLabel.setPosition(x, y - 34);
    ps.hpBarBg.setPosition(x, y - 22);
    ps.hpBar.setPosition(x - 22, y - 22);
    ps.ammoBar.forEach((bar, idx) => bar.setPosition(x - 16 + idx * 12, y - 16));
  }

  private drawAimLine() {
    this.aimGraphics.clear();
    const localSprite = this.playerSprites.get(this.mySocketId);
    if (!localSprite) return;

    const angle = Phaser.Math.Angle.Between(this.predictX, this.predictY, this.aimTarget.x, this.aimTarget.y);
    const aimLen = 140;
    const endX = this.predictX + Math.cos(angle) * aimLen;
    const endY = this.predictY + Math.sin(angle) * aimLen;

    this.aimGraphics.lineStyle(2, 0x00D9FF, 0.5);
    this.aimGraphics.lineBetween(this.predictX, this.predictY, endX, endY);
    this.aimGraphics.strokeCircle(endX, endY, 6);
  }

  private renderMapEnvironment() {
    const g = this.add.graphics();
    g.fillStyle(0x070D1E, 1);
    g.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Subtle Sci-Fi Grid
    g.lineStyle(1, 0x1E293B, 0.35);
    for (let x = 0; x < MAP_WIDTH; x += 60) g.lineBetween(x, 0, x, MAP_HEIGHT);
    for (let y = 0; y < MAP_HEIGHT; y += 60) g.lineBetween(0, y, MAP_WIDTH, y);

    // Base zones
    g.fillStyle(0x0284C7, 0.08); g.fillRect(0, 0, 220, MAP_HEIGHT);
    g.fillStyle(0xE11D48, 0.08); g.fillRect(MAP_WIDTH - 220, 0, 220, MAP_HEIGHT);

    // Central Mine platform
    g.fillStyle(0x0F172A, 0.9);
    g.fillCircle(CRYSTAL_MINE.x, CRYSTAL_MINE.y, 85);
    g.lineStyle(3, 0x00D9FF, 0.7);
    g.strokeCircle(CRYSTAL_MINE.x, CRYSTAL_MINE.y, 85);

    // Animated Mine Core & Energy Ring
    this.mineCore = this.add.circle(CRYSTAL_MINE.x, CRYSTAL_MINE.y, 28, 0x00D9FF, 0.85).setDepth(8);
    this.mineRing = this.add.circle(CRYSTAL_MINE.x, CRYSTAL_MINE.y, 42).setStrokeStyle(3, 0x38BDF8, 0.8).setDepth(9);

    this.tweens.add({
      targets: this.mineCore,
      scale: 1.2,
      alpha: 0.6,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private buildMapObstacles() {
    this.wallsGroup  = this.add.group();
    this.bushesGroup = this.add.group();

    // Render exact server bushes
    for (const b of ARENA_BUSHES) {
      const bush = this.add.rectangle(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h, 0x064E3B, 0.75);
      bush.setStrokeStyle(2, 0x10B981, 0.6).setDepth(10);
      this.bushesGroup.add(bush);
    }

    // Render exact server walls
    for (const w of ARENA_WALLS) {
      const wall = this.add.rectangle(w.x + w.w / 2, w.y + w.h / 2, w.w, w.h, 0x1E1B4B);
      wall.setStrokeStyle(2, 0x6366F1, 0.8).setDepth(12);
      this.wallsGroup.add(wall);
    }
  }

  private generateArenaTextures() {
    const heroConfigs = [
      { key: 'hero_blaze',  color: 0xef4444, rim: 0xfacc15, inner: 0xf97316 },
      { key: 'hero_volt',   color: 0xfbbf24, rim: 0xfef08a, inner: 0xf59e0b },
      { key: 'hero_titan',  color: 0x3b82f6, rim: 0x93c5fd, inner: 0x1d4ed8 },
      { key: 'hero_frost',  color: 0x06b6d4, rim: 0xa5f3fc, inner: 0x0891b2 },
      { key: 'hero_rocket', color: 0xf97316, rim: 0xfed7aa, inner: 0xea580c },
      { key: 'hero_luna',   color: 0xa855f7, rim: 0xe9d5ff, inner: 0x7c3aed },
      { key: 'hero_buster', color: 0x92400e, rim: 0xd97706, inner: 0x78350f },
      { key: 'hero_pico',   color: 0x22c55e, rim: 0xbbf7d0, inner: 0x16a34a },
    ];

    heroConfigs.forEach(({ key, color, rim, inner }) => {
      if (!this.textures.exists(key)) {
        const g = this.add.graphics();
        g.fillStyle(0x000000, 0.4);
        g.fillEllipse(26, 44, 38, 14);
        g.fillStyle(color, 1);
        g.fillCircle(26, 26, 22);
        g.lineStyle(3, rim, 1);
        g.strokeCircle(26, 26, 22);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(26, 26, 12);
        g.fillStyle(inner, 1);
        g.fillCircle(26, 26, 8);
        g.generateTexture(key, 52, 52);
        g.destroy();
      }
    });

    if (!this.textures.exists('gem_crystal')) {
      const g = this.add.graphics();
      g.fillStyle(0x00D9FF, 1);
      g.beginPath();
      g.moveTo(14, 0); g.lineTo(28, 12); g.lineTo(14, 28); g.lineTo(0, 12);
      g.closePath(); g.fill();
      g.lineStyle(2, 0xFFFFFF, 0.9); g.stroke();
      g.generateTexture('gem_crystal', 28, 28);
      g.destroy();
    }
  }

  private showFloatingText(x: number, y: number, text: string, color: string) {
    const label = this.add.text(x, y, text, {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: '14px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(35);

    this.tweens.add({
      targets: label,
      y: y - 36,
      alpha: 0,
      duration: 850,
      ease: 'Power1',
      onComplete: () => label.destroy(),
    });
  }
}
