import * as Phaser from 'phaser';
import { networkManager, GameSnapshot, PlayerState } from '../NetworkManager';

// ─── Callbacks from PhaserGame (React HUD) ─────────────────────────────────

export interface GameEventCallbacks {
  onScoreUpdate:  (blue: number, red: number) => void;
  onHealthUpdate: (current: number, max: number, superCharge: number, powerCubes: number, ammo: number) => void;
  onGameOver:     (won: boolean, stats: { kills: number; deaths: number; crystals: number; damage: number }) => void;
}

// ─── Init data from PhaserGame ──────────────────────────────────────────────

export interface ArenaInitData {
  callbacks:  GameEventCallbacks;
  roomId:     string;
  heroSlug:   string;
  mySocketId: string;
}

// ─── Internal sprite registry ───────────────────────────────────────────────

interface PlayerSprite {
  body:      Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  nameLabel: Phaser.GameObjects.Text;
  hpBarBg:   Phaser.GameObjects.Rectangle;
  hpBar:     Phaser.GameObjects.Rectangle;
  ammoBar:   Phaser.GameObjects.Rectangle[];
  deadOverlay?: Phaser.GameObjects.Graphics;
  team:      'blue' | 'red';
  isLocal:   boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAP_W   = 1400;
const MAP_H   = 1000;
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
  // Server data
  private callbacks!: GameEventCallbacks;
  private roomId  = '';
  private heroSlug = 'blaze';
  private mySocketId = '';

  // Sprite registry keyed by socketId
  private playerSprites = new Map<string, PlayerSprite>();

  // Bullet + crystal visuals
  private bulletSprites = new Map<string, Phaser.GameObjects.Arc>();
  private crystalSprites = new Map<string, Phaser.GameObjects.Image>();

  // Graphics layers
  private aimGraphics!: Phaser.GameObjects.Graphics;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private bushes!: Phaser.Physics.Arcade.StaticGroup;

  // Client-side input state (prediction)
  private wasdKeys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private aimTarget  = { x: 0, y: 0 };
  private isFiring   = false;
  private seqNumber  = 0;

  // Local player predicted position
  private predictX = 280;
  private predictY = 500;

  // Last known server state for local player
  private lastLocalServerState: PlayerState | null = null;

  // HUD state cached from server
  private cachedHp         = 5200;
  private cachedMaxHp      = 5200;
  private cachedAmmo       = 3;
  private cachedSuper      = 0;

  // Countdown
  private countdownText!: Phaser.GameObjects.Text;
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
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    this.generateArenaTextures();
    this.renderMapEnvironment();

    this.walls  = this.physics.add.staticGroup();
    this.bushes = this.physics.add.staticGroup();
    this.buildMapObstacles();

    this.aimGraphics = this.add.graphics().setDepth(25);

    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.setZoom(1.05);

    // Keyboard
    if (this.input.keyboard) {
      this.cursors  = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
    }

    // Aim via pointer
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
    this.countdownText = this.add.text(MAP_W / 2, MAP_H / 2, '', {
      fontFamily: 'Montserrat Black, sans-serif',
      fontSize: '96px',
      color: '#FACC15',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);

    // Wire Socket.IO callbacks into scene
    networkManager.setCallbacks({
      onGameState:      (snapshot) => this.renderServerState(snapshot),
      onPlayerDamaged:  (data) => this.showDamageText(data.targetId, data.damage),
      onPlayerDied:     (data) => this.handlePlayerDeath(data.victimId, data.killerId, data.killerName ?? '', data.respawnInMs),
      onPlayerRespawned:(data) => this.handlePlayerRespawn(data.playerId, data.x, data.y),
      onCountdown:      (data) => this.showCountdown(data.seconds),
      onGameStart:      () => { this.isMatchRunning = true; this.countdownText.setVisible(false); },
      onGameOver:       (data) => this.handleGameOver(data as Record<string, unknown>),
      onDisconnect:     (reason) => console.warn('[Arena] Disconnected:', reason),
    });
  }

  // ─── update (60 FPS) ──────────────────────────────────────────────────────

  update(_time: number, delta: number) {
    const dt = delta / 1000;

    // Gather input
    let dx = 0;
    let dy = 0;
    if (this.wasdKeys?.A.isDown || this.cursors?.left.isDown)  dx -= 1;
    if (this.wasdKeys?.D.isDown || this.cursors?.right.isDown) dx += 1;
    if (this.wasdKeys?.W.isDown || this.cursors?.up.isDown)    dy -= 1;
    if (this.wasdKeys?.S.isDown || this.cursors?.down.isDown)  dy += 1;

    // Normalise diagonal
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    // Client-side prediction for local player
    const speed = 80 * 2; // pixels/s (matches server movementSpeed * 2 for snappiness)
    this.predictX = Phaser.Math.Clamp(this.predictX + dx * speed * dt, 24, MAP_W - 24);
    this.predictY = Phaser.Math.Clamp(this.predictY + dy * speed * dt, 24, MAP_H - 24);

    // Move local sprite to predicted position
    const localSprite = this.playerSprites.get(this.mySocketId);
    if (localSprite) {
      localSprite.body.setPosition(this.predictX, this.predictY);
      this.cameras.main.startFollow(localSprite.body, true, 0.08, 0.08);
      this.updatePlayerLabelPos(localSprite);
    }

    // Send input to server (NetworkManager batches at 20 TPS)
    networkManager.setInput({
      dx,
      dy,
      aimX:       this.aimTarget.x,
      aimY:       this.aimTarget.y,
      firing:     this.isFiring,
      usingSuper: false,
    });

    // Draw aim indicator
    this.drawAimLine();
  }

  // ─── Server state renderer ───────────────────────────────────────────────

  private renderServerState(snapshot: GameSnapshot) {
    // Reconcile local player position with server
    const me = snapshot.players.find(p => p.id === this.mySocketId);
    if (me) {
      // Snap prediction if too far off (teleport detection / reconcile)
      const dist = Phaser.Math.Distance.Between(this.predictX, this.predictY, me.x, me.y);
      if (dist > 80) {
        this.predictX = me.x;
        this.predictY = me.y;
      }
      this.lastLocalServerState = me;

      // Update HUD from server
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
        this.callbacks.onHealthUpdate(me.hp, me.maxHp, me.superCharge, 0, me.ammo);
      }
    }

    // Update score
    this.callbacks.onScoreUpdate(snapshot.blueScore, snapshot.redScore);

    // Update remote player sprites
    snapshot.players.forEach(p => {
      if (p.id === this.mySocketId) return; // handled by prediction
      const existing = this.playerSprites.get(p.id);
      if (existing) {
        if (!p.isDead) {
          existing.body.setPosition(p.x, p.y);
          this.updatePlayerLabelPos(existing);
          this.updateHpBar(existing, p.hp, p.maxHp);
        }
      } else {
        this.spawnPlayerSprite(p);
      }
    });

    // Spawn local sprite if not yet created (first state packet)
    if (me && !this.playerSprites.has(this.mySocketId)) {
      this.spawnPlayerSprite({ ...me, x: this.predictX, y: this.predictY });
      this.predictX = me.x;
      this.predictY = me.y;
    }

    // Crystals — sync with server
    const serverCrystalIds = new Set(snapshot.crystals.map(c => c.id));
    this.crystalSprites.forEach((sprite, id) => {
      if (!serverCrystalIds.has(id)) {
        sprite.destroy();
        this.crystalSprites.delete(id);
      }
    });
    snapshot.crystals.forEach(c => {
      if (!this.crystalSprites.has(c.id)) {
        const img = this.add.image(c.x, c.y, 'gem_crystal').setDepth(13);
        this.crystalSprites.set(c.id, img);
      } else {
        this.crystalSprites.get(c.id)!.setPosition(c.x, c.y);
      }
    });

    // Bullets — sync with server
    const serverBulletIds = new Set(snapshot.bullets.map(b => b.id));
    this.bulletSprites.forEach((sprite, id) => {
      if (!serverBulletIds.has(id)) {
        sprite.destroy();
        this.bulletSprites.delete(id);
      }
    });
    snapshot.bullets.forEach(b => {
      if (!this.bulletSprites.has(b.id)) {
        const circle = this.add.circle(b.x, b.y, 8, 0xf97316).setDepth(16);
        this.bulletSprites.set(b.id, circle as unknown as Phaser.GameObjects.Arc);
      } else {
        this.bulletSprites.get(b.id)!.setPosition(b.x, b.y);
      }
    });
  }

  // ─── Sprite management ────────────────────────────────────────────────────

  private spawnPlayerSprite(p: PlayerState) {
    const isLocal  = p.id === this.mySocketId;
    const texKey   = isLocal
      ? (HERO_TEXTURES[this.heroSlug] || 'hero_blaze')
      : (p.team === 'blue' ? 'hero_ally' : 'hero_enemy');

    const sprite = this.physics.add.sprite(p.x, p.y, texKey);
    sprite.setDepth(15);
    sprite.setCircle(22, 4, 4);
    sprite.setCollideWorldBounds(true);
    this.physics.add.collider(sprite, this.walls);

    // Name label
    const nameLabel = this.add.text(p.x, p.y - 40, p.username, {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: '11px',
      color: isLocal ? '#00D9FF' : p.team === 'blue' ? '#60A5FA' : '#F87171',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);

    // HP bar
    const barW = 44;
    const hpBarBg = this.add.rectangle(p.x, p.y - 34, barW, 6, 0x000000, 0.7).setDepth(21);
    const hpBar   = this.add.rectangle(p.x - barW / 2, p.y - 34, barW, 6, isLocal ? 0x22c55e : p.team === 'blue' ? 0x60a5fa : 0xef4444, 1).setDepth(22).setOrigin(0, 0.5);

    // Ammo dots (local only)
    const ammoBar: Phaser.GameObjects.Rectangle[] = [];
    if (isLocal) {
      for (let i = 0; i < 3; i++) {
        const dot = this.add.rectangle(p.x - 14 + i * 14, p.y - 27, 11, 3, 0xf97316).setDepth(22);
        ammoBar.push(dot);
      }
    }

    // Local player indicator ring
    if (isLocal) {
      this.add.circle(p.x, p.y, 26, 0x00d9ff, 0.15).setDepth(14);
    }

    const ps: PlayerSprite = { body: sprite, nameLabel, hpBarBg, hpBar, ammoBar, team: p.team, isLocal };
    this.playerSprites.set(p.id, ps);
  }

  private updatePlayerLabelPos(ps: PlayerSprite) {
    const x = ps.body.x;
    const y = ps.body.y;
    ps.nameLabel.setPosition(x, y - 40);
    ps.hpBarBg.setPosition(x, y - 34);
    ps.hpBar.setPosition(x - 22, y - 34);
    ps.ammoBar.forEach((dot, i) => dot.setPosition(x - 14 + i * 14, y - 27));
  }

  private updateHpBar(ps: PlayerSprite, hp: number, maxHp: number) {
    const pct = Math.max(0, hp / maxHp);
    const barW = 44;
    ps.hpBar.setSize(barW * pct, 6);
  }

  // ─── Events from server ───────────────────────────────────────────────────

  private showDamageText(targetId: string, damage: number) {
    const ps = this.playerSprites.get(targetId);
    if (!ps) return;
    const x = ps.body.x;
    const y = ps.body.y - 25;
    const label = this.add.text(x, y, `-${damage}`, {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: '14px',
      color: '#EF4444',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(35);
    this.tweens.add({ targets: label, y: y - 35, alpha: 0, duration: 900, onComplete: () => label.destroy() });
  }

  private handlePlayerDeath(victimId: string, _killerId: string, killerName: string, respawnInMs: number) {
    const ps = this.playerSprites.get(victimId);
    if (!ps) return;

    ps.body.setVisible(false);

    // Death FX
    this.cameras.main.shake(200, 0.012);
    const killText = killerName ? `💀 Eliminated by ${killerName}` : '💀 Eliminated!';
    const label = this.add.text(ps.body.x, ps.body.y - 45, killText, {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: '13px',
      color: '#F59E0B',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(35);
    this.tweens.add({ targets: label, y: label.y - 40, alpha: 0, duration: 1400, onComplete: () => label.destroy() });

    if (victimId === this.mySocketId) {
      // Show respawn countdown
      this.time.delayedCall(respawnInMs - 100, () => {
        ps.body.setVisible(true);
      });
    }
  }

  private handlePlayerRespawn(playerId: string, x: number, y: number) {
    const ps = this.playerSprites.get(playerId);
    if (!ps) return;
    ps.body.setPosition(x, y);
    ps.body.setVisible(true);

    if (playerId === this.mySocketId) {
      this.predictX = x;
      this.predictY = y;
      // Spawn invulnerability flash
      this.tweens.add({ targets: ps.body, alpha: 0.3, duration: 200, yoyo: true, repeat: 5 });
    }
  }

  private showCountdown(seconds: number) {
    this.isMatchRunning = false;
    this.countdownText.setVisible(true);
    let remaining = seconds;
    const tick = () => {
      if (remaining <= 0) {
        this.countdownText.setText('FIGHT!').setColor('#22C55E');
        this.tweens.add({
          targets: this.countdownText,
          scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 600,
          onComplete: () => this.countdownText.setVisible(false),
        });
        return;
      }
      this.countdownText.setText(String(remaining)).setColor('#FACC15');
      this.tweens.add({ targets: this.countdownText, scaleX: 1.2, scaleY: 1.2, duration: 300, yoyo: true });
      remaining--;
      this.time.delayedCall(1000, tick);
    };
    tick();
  }

  private handleGameOver(data: Record<string, unknown>) {
    const players = (data.players as Array<{ userId: string; won: boolean; kills: number; deaths: number; damageDealt: number; crystals: number }>) || [];
    const myData = players.find(p => p.userId === this.mySocketId) || players[0];
    const won = myData?.won ?? false;

    this.callbacks.onGameOver(won, {
      kills:    myData?.kills    ?? 0,
      deaths:   myData?.deaths   ?? 0,
      crystals: myData?.crystals ?? 0,
      damage:   myData?.damageDealt ?? 0,
    });
  }

  // ─── Aim line ─────────────────────────────────────────────────────────────

  private drawAimLine() {
    this.aimGraphics.clear();
    if (!this.isFiring) return;
    const ps = this.playerSprites.get(this.mySocketId);
    if (!ps) return;

    const angle = Phaser.Math.Angle.Between(ps.body.x, ps.body.y, this.aimTarget.x, this.aimTarget.y);
    const range = 260;
    const endX = ps.body.x + Math.cos(angle) * range;
    const endY = ps.body.y + Math.sin(angle) * range;

    this.aimGraphics.lineStyle(3, 0x00d9ff, 0.8);
    this.aimGraphics.beginPath();
    this.aimGraphics.moveTo(ps.body.x, ps.body.y);
    this.aimGraphics.lineTo(endX, endY);
    this.aimGraphics.strokePath();
    this.aimGraphics.lineStyle(1.5, 0xfacc15, 0.9);
    this.aimGraphics.strokeCircle(endX, endY, 14);
  }

  // ─── Public API (PhaserGame buttons) ─────────────────────────────────────

  /**
   * Called by the Super button in PhaserGame HUD
   */
  public activateSuper() {
    // Send super input — server validates charge and applies effect
    networkManager.setInput({
      dx: 0, dy: 0,
      aimX: this.aimTarget.x, aimY: this.aimTarget.y,
      firing: false,
      usingSuper: true,
    });
    this.cameras.main.shake(250, 0.015);
  }

  /**
   * Dash gadget — client visual only, server validates
   */
  public performDash() {
    const ps = this.playerSprites.get(this.mySocketId);
    if (!ps) return;
    this.showFloatingText(ps.body.x, ps.body.y - 20, '💨 DASH', '#00D9FF');
  }

  /** Called by touch attack button */
  public shootPlayerAttack(aimX: number, aimY: number) {
    this.aimTarget = { x: aimX, y: aimY };
    this.isFiring = true;
    this.time.delayedCall(100, () => { this.isFiring = false; });
  }

  // ─── Map Building ─────────────────────────────────────────────────────────

  private generateArenaTextures() {
    // Hero textures — one per hero class
    const heroConfigs = [
      { key: 'hero_blaze',  color: 0xef4444, rim: 0xfacc15, inner: 0xf97316 },
      { key: 'hero_volt',   color: 0xfbbf24, rim: 0xfef08a, inner: 0xf59e0b },
      { key: 'hero_titan',  color: 0x3b82f6, rim: 0x93c5fd, inner: 0x1d4ed8 },
      { key: 'hero_frost',  color: 0x06b6d4, rim: 0xa5f3fc, inner: 0x0891b2 },
      { key: 'hero_rocket', color: 0xf97316, rim: 0xfed7aa, inner: 0xea580c },
      { key: 'hero_luna',   color: 0xa855f7, rim: 0xe9d5ff, inner: 0x7c3aed },
      { key: 'hero_buster', color: 0x92400e, rim: 0xd97706, inner: 0x78350f },
      { key: 'hero_pico',   color: 0x22c55e, rim: 0xbbf7d0, inner: 0x16a34a },
      { key: 'hero_ally',   color: 0x3b82f6, rim: 0x00d9ff, inner: 0x1d4ed8 },
      { key: 'hero_enemy',  color: 0xd946ef, rim: 0xff0055, inner: 0x9d174d },
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

    // Bullet
    if (!this.textures.exists('fire_shot')) {
      const g = this.add.graphics();
      g.fillStyle(0xf97316, 1); g.fillCircle(10, 10, 8);
      g.fillStyle(0xfef08a, 1); g.fillCircle(10, 10, 4);
      g.generateTexture('fire_shot', 20, 20); g.destroy();
    }

    // Crystal
    if (!this.textures.exists('gem_crystal')) {
      const g = this.add.graphics();
      g.fillStyle(0x00d9ff, 1);
      g.beginPath();
      g.moveTo(14, 0); g.lineTo(28, 12); g.lineTo(14, 28); g.lineTo(0, 12);
      g.closePath(); g.fill();
      g.lineStyle(2, 0xffffff, 0.9); g.stroke();
      g.generateTexture('gem_crystal', 28, 28); g.destroy();
    }
  }

  private renderMapEnvironment() {
    const g = this.add.graphics();
    g.fillStyle(0x0a1128, 1);
    g.fillRect(0, 0, MAP_W, MAP_H);
    g.lineStyle(1, 0x1e293b, 0.25);
    for (let x = 0; x < MAP_W; x += 60) g.lineBetween(x, 0, x, MAP_H);
    for (let y = 0; y < MAP_H; y += 60) g.lineBetween(0, y, MAP_W, y);
    // Crystal mine center
    g.fillStyle(0x111827, 0.9); g.fillCircle(MAP_W / 2, MAP_H / 2, 90);
    g.lineStyle(4, 0x00d9ff, 0.7); g.strokeCircle(MAP_W / 2, MAP_H / 2, 90);
    g.fillStyle(0x000000, 0.95); g.fillCircle(MAP_W / 2, MAP_H / 2, 40);
    g.lineStyle(2, 0x38bdf8, 1); g.strokeCircle(MAP_W / 2, MAP_H / 2, 40);

    // Team spawn zones
    g.fillStyle(0x00d9ff, 0.06); g.fillRect(0, 0, 200, MAP_H);     // blue
    g.fillStyle(0xef4444, 0.06); g.fillRect(MAP_W - 200, 0, 200, MAP_H); // red
  }

  private buildMapObstacles() {
    const bushData = [
      { x: 380, y: 300, w: 140, h: 100 }, { x: 1020, y: 300, w: 140, h: 100 },
      { x: 380, y: 700, w: 140, h: 100 }, { x: 1020, y: 700, w: 140, h: 100 },
      { x: 700, y: 220, w: 180, h: 90  }, { x: 700,  y: 780, w: 180, h: 90  },
    ];
    bushData.forEach(b => {
      const r = this.add.rectangle(b.x, b.y, b.w, b.h, 0x15803d, 0.85);
      r.setStrokeStyle(2, 0x4ade80, 0.7).setDepth(10);
      this.physics.add.existing(r, true);
      this.bushes.add(r);
    });

    const wallData = [
      { x: 220,  y: 200, w: 140, h: 36 }, { x: 1180, y: 200, w: 140, h: 36 },
      { x: 220,  y: 800, w: 140, h: 36 }, { x: 1180, y: 800, w: 140, h: 36 },
      { x: 520,  y: 440, w: 36, h: 120 }, { x: 880,  y: 440, w: 36, h: 120 },
      { x: 520,  y: 560, w: 36, h: 120 }, { x: 880,  y: 560, w: 36, h: 120 },
    ];
    wallData.forEach(w => {
      const r = this.add.rectangle(w.x, w.y, w.w, w.h, 0x1e1b4b);
      r.setStrokeStyle(2, 0x818cf8, 0.8).setDepth(12);
      this.physics.add.existing(r, true);
      this.walls.add(r);
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private showFloatingText(x: number, y: number, text: string, color: string) {
    const label = this.add.text(x, y, text, {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: '14px',
      color, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(35);
    this.tweens.add({ targets: label, y: y - 35, alpha: 0, duration: 900, onComplete: () => label.destroy() });
  }
}
