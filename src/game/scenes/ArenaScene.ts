import * as Phaser from 'phaser';

export interface GameEventCallbacks {
  onScoreUpdate: (blue: number, red: number) => void;
  onHealthUpdate: (current: number, max: number, superCharge: number, powerCubes: number, ammo: number) => void;
  onGameOver: (won: boolean, stats: { kills: number; deaths: number; crystals: number; damage: number }) => void;
}

export class ArenaScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  private bullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private crystals!: Phaser.Physics.Arcade.Group;
  private powerBoxes!: Phaser.Physics.Arcade.Group;
  private powerCubes!: Phaser.Physics.Arcade.Group;
  private bushes!: Phaser.Physics.Arcade.StaticGroup;
  private walls!: Phaser.Physics.Arcade.StaticGroup;

  private aimGraphics!: Phaser.GameObjects.Graphics;
  private hudGraphics!: Phaser.GameObjects.Graphics;
  private stormGraphics!: Phaser.GameObjects.Graphics;

  // 6 Players in 3v3 Arena (1 User + 2 Blue AI vs 3 Red AI)
  private blueTeam: Array<{
    sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    hp: number;
    maxHp: number;
    name: string;
    hero: string;
    isPlayer?: boolean;
    lastShot: number;
    crystals: number;
  }> = [];

  private redTeam: Array<{
    sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    hp: number;
    maxHp: number;
    name: string;
    hero: string;
    lastShot: number;
    crystals: number;
  }> = [];

  // Player Stats
  private playerHp = 4200;
  private playerMaxHp = 4200;
  private ammo = 3;
  private maxAmmo = 3;
  private ammoRechargeTime = 1300;
  private lastAmmoRecharge = 0;
  private superCharge = 0;
  private powerCubeCount = 0;
  private kills = 0;
  private deaths = 0;
  private totalDamage = 0;
  private crystalsCollected = 0;

  // Match State
  private blueCrystals = 0;
  private redCrystals = 0;
  private countdownTimer = 0;
  private countdownTeam: 'blue' | 'red' | null = null;
  private isGameOver = false;
  private isAiming = false;
  private aimTarget = { x: 0, y: 0 };
  private stormRadius = 900;
  private mapWidth = 1400;
  private mapHeight = 1000;

  private callbacks!: GameEventCallbacks;

  constructor() {
    super('ArenaScene');
  }

  init(data: { callbacks: GameEventCallbacks }) {
    this.callbacks = data.callbacks;
  }

  create() {
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

    // Create High-Res Procedural Graphics Textures
    this.generateArenaTextures();

    // Render Map Floor & Grid
    this.renderMapEnvironment();

    // Groups
    this.walls = this.physics.add.staticGroup();
    this.bushes = this.physics.add.staticGroup();
    this.bullets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.crystals = this.physics.add.group();
    this.powerBoxes = this.physics.add.group();
    this.powerCubes = this.physics.add.group();

    // Aim & Storm Layers
    this.aimGraphics = this.add.graphics().setDepth(25);
    this.hudGraphics = this.add.graphics().setDepth(30);
    this.stormGraphics = this.add.graphics().setDepth(28);

    // Build Tactical Map Geometry (Walls, Bushes, Obstacles)
    this.buildMapObstacles();

    // Spawn Main Player (BLAZE)
    this.player = this.physics.add.sprite(280, 500, 'hero_blaze');
    this.player.setCollideWorldBounds(true);
    this.player.setCircle(22, 4, 4);
    this.player.setDepth(15);

    // Camera follow player with smooth damping
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.05);

    // Setup 3v3 Teams
    this.setupTeams();

    // Spawn Breakable Power Boxes
    this.spawnMapPowerBoxes();

    // Center Crystal Mine Spawner
    this.spawnCenterCrystals();
    this.time.addEvent({
      delay: 5000,
      callback: () => this.mineProduceCrystal(),
      loop: true,
    });

    // Keyboard Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as unknown as {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
      };
    }

    // Aim & Shoot Input
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && !this.isGameOver) {
        this.isAiming = true;
        this.aimTarget = { x: pointer.worldX, y: pointer.worldY };
      } else {
        this.isAiming = false;
        this.aimGraphics.clear();
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isAiming = true;
      this.aimTarget = { x: pointer.worldX, y: pointer.worldY };
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.isAiming && !this.isGameOver && this.player.active) {
        this.shootPlayerAttack(pointer.worldX, pointer.worldY);
      }
      this.isAiming = false;
      this.aimGraphics.clear();
    });

    // Setup Collisions
    this.setupColliders();
  }

  private generateArenaTextures() {
    // 1. Blaze Hero Texture (Illustrated with glow & shadow)
    if (!this.textures.exists('hero_blaze')) {
      const g = this.add.graphics();
      // Drop Shadow
      g.fillStyle(0x000000, 0.4);
      g.fillEllipse(26, 44, 38, 14);
      // Outer Armor Ring
      g.fillStyle(0xef4444, 1);
      g.fillCircle(26, 26, 22);
      g.lineStyle(3, 0xfacc15, 1);
      g.strokeCircle(26, 26, 22);
      // Hero Core Symbol (Flame)
      g.fillStyle(0xffffff, 1);
      g.fillCircle(26, 26, 12);
      g.fillStyle(0xf97316, 1);
      g.fillCircle(26, 26, 8);
      g.generateTexture('hero_blaze', 52, 52);
      g.destroy();
    }

    // 2. Enemy Red Hero Texture
    if (!this.textures.exists('hero_enemy')) {
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.4);
      g.fillEllipse(26, 44, 38, 14);
      g.fillStyle(0xd946ef, 1);
      g.fillCircle(26, 26, 22);
      g.lineStyle(3, 0xff0055, 1);
      g.strokeCircle(26, 26, 22);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(26, 26, 10);
      g.generateTexture('hero_enemy', 52, 52);
      g.destroy();
    }

    // 3. Blue Ally Hero Texture
    if (!this.textures.exists('hero_ally')) {
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.4);
      g.fillEllipse(26, 44, 38, 14);
      g.fillStyle(0x3b82f6, 1);
      g.fillCircle(26, 26, 22);
      g.lineStyle(3, 0x00d9ff, 1);
      g.strokeCircle(26, 26, 22);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(26, 26, 10);
      g.generateTexture('hero_ally', 52, 52);
      g.destroy();
    }

    // 4. Breakable Power Box (Wooden Crate with Metal Brackets)
    if (!this.textures.exists('crate_box')) {
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.35);
      g.fillEllipse(24, 42, 40, 14);
      g.fillStyle(0x854d0e, 1);
      g.fillRoundedRect(4, 4, 40, 40, 8);
      g.lineStyle(2.5, 0xfacc15, 1);
      g.strokeRoundedRect(4, 4, 40, 40, 8);
      // Metal Brackets & Cross
      g.fillStyle(0xca8a04, 1);
      g.fillRect(8, 8, 32, 6);
      g.fillRect(8, 34, 32, 6);
      g.lineStyle(2, 0x713f12, 1);
      g.lineBetween(8, 8, 40, 40);
      g.lineBetween(8, 40, 40, 8);
      g.generateTexture('crate_box', 48, 48);
      g.destroy();
    }

    // 5. Glowing Power Cube
    if (!this.textures.exists('power_cube_tex')) {
      const g = this.add.graphics();
      g.fillStyle(0x22c55e, 1);
      g.fillRoundedRect(2, 2, 22, 22, 5);
      g.lineStyle(2, 0xbbf7d0, 1);
      g.strokeRoundedRect(2, 2, 22, 22, 5);
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(13, 13, 5);
      g.generateTexture('power_cube_tex', 26, 26);
      g.destroy();
    }

    // 6. Projectiles
    if (!this.textures.exists('fire_shot')) {
      const g = this.add.graphics();
      g.fillStyle(0xf97316, 1);
      g.fillCircle(10, 10, 8);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(10, 10, 4);
      g.generateTexture('fire_shot', 20, 20);
      g.destroy();
    }

    if (!this.textures.exists('enemy_shot')) {
      const g = this.add.graphics();
      g.fillStyle(0xd946ef, 1);
      g.fillCircle(10, 10, 8);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(10, 10, 4);
      g.generateTexture('enemy_shot', 20, 20);
      g.destroy();
    }

    // 7. Crystal Gem
    if (!this.textures.exists('gem_crystal')) {
      const g = this.add.graphics();
      g.fillStyle(0x00d9ff, 1);
      g.beginPath();
      g.moveTo(14, 0); g.lineTo(28, 12); g.lineTo(14, 28); g.lineTo(0, 12);
      g.closePath();
      g.fill();
      g.lineStyle(2, 0xffffff, 0.9);
      g.stroke();
      g.generateTexture('gem_crystal', 28, 28);
      g.destroy();
    }
  }

  private renderMapEnvironment() {
    // Arena Terrain Base (Isometric styled arena ground)
    const g = this.add.graphics();
    g.fillStyle(0x0a1128, 1);
    g.fillRect(0, 0, this.mapWidth, this.mapHeight);

    // Stone tile grid
    g.lineStyle(1, 0x1e293b, 0.25);
    for (let x = 0; x < this.mapWidth; x += 60) g.lineBetween(x, 0, x, this.mapHeight);
    for (let y = 0; y < this.mapHeight; y += 60) g.lineBetween(0, y, this.mapWidth, y);

    // Center Crystal Mine Base Ring
    g.fillStyle(0x111827, 0.9);
    g.fillCircle(this.mapWidth / 2, this.mapHeight / 2, 90);
    g.lineStyle(4, 0x00d9ff, 0.7);
    g.strokeCircle(this.mapWidth / 2, this.mapHeight / 2, 90);

    // Center Mine Hole
    g.fillStyle(0x000000, 0.95);
    g.fillCircle(this.mapWidth / 2, this.mapHeight / 2, 40);
    g.lineStyle(2, 0x38bdf8, 1);
    g.strokeCircle(this.mapWidth / 2, this.mapHeight / 2, 40);
  }

  private buildMapObstacles() {
    // Dense Bushes (Player concealment)
    const bushData = [
      { x: 380, y: 300, w: 140, h: 100 },
      { x: 1020, y: 300, w: 140, h: 100 },
      { x: 380, y: 700, w: 140, h: 100 },
      { x: 1020, y: 700, w: 140, h: 100 },
      { x: 700, y: 220, w: 180, h: 90 },
      { x: 700, y: 780, w: 180, h: 90 },
    ];

    bushData.forEach(b => {
      const bushRect = this.add.rectangle(b.x, b.y, b.w, b.h, 0x15803d, 0.85);
      bushRect.setStrokeStyle(2, 0x4ade80, 0.7);
      bushRect.setDepth(10);
      this.physics.add.existing(bushRect, true);
      this.bushes.add(bushRect);
    });

    // Solid Stone Walls / Pillars
    const wallData = [
      { x: 220, y: 200, w: 140, h: 36 },
      { x: 1180, y: 200, w: 140, h: 36 },
      { x: 220, y: 800, w: 140, h: 36 },
      { x: 1180, y: 800, w: 140, h: 36 },
      { x: 520, y: 440, w: 36, h: 120 },
      { x: 880, y: 440, w: 36, h: 120 },
      { x: 520, y: 560, w: 36, h: 120 },
      { x: 880, y: 560, w: 36, h: 120 },
    ];

    wallData.forEach(w => {
      const wall = this.add.rectangle(w.x, w.y, w.w, w.h, 0x1e1b4b);
      wall.setStrokeStyle(2, 0x818cf8, 0.8);
      wall.setDepth(12);
      this.physics.add.existing(wall, true);
      this.walls.add(wall);
    });
  }

  private setupTeams() {
    // User hero
    this.blueTeam.push({
      sprite: this.player,
      hp: this.playerHp,
      maxHp: this.playerMaxHp,
      name: 'YOU (BLAZE)',
      hero: 'BLAZE',
      isPlayer: true,
      lastShot: 0,
      crystals: 0,
    });

    // 2 Blue AI Allies
    this.spawnHero(280, 380, 'VOLT (Ally)', 'hero_ally', 'blue');
    this.spawnHero(280, 620, 'TITAN (Ally)', 'hero_ally', 'blue');

    // 3 Red AI Enemies
    this.spawnHero(1120, 380, 'FROST (Enemy)', 'hero_enemy', 'red');
    this.spawnHero(1120, 500, 'ROCKET (Enemy)', 'hero_enemy', 'red');
    this.spawnHero(1120, 620, 'BUSTER (Enemy)', 'hero_enemy', 'red');
  }

  private spawnHero(x: number, y: number, name: string, texture: string, team: 'blue' | 'red') {
    const sprite = this.physics.add.sprite(x, y, texture);
    sprite.setCollideWorldBounds(true);
    sprite.setCircle(22, 4, 4);
    sprite.setDepth(15);

    const data = {
      sprite,
      hp: 3800,
      maxHp: 3800,
      name,
      hero: name.split(' ')[0],
      lastShot: 0,
      crystals: 0,
    };

    if (team === 'blue') {
      this.blueTeam.push(data);
    } else {
      this.redTeam.push(data);
    }
  }

  private spawnMapPowerBoxes() {
    const coords = [
      { x: 300, y: 220 }, { x: 300, y: 780 },
      { x: 1100, y: 220 }, { x: 1100, y: 780 },
      { x: 700, y: 120 }, { x: 700, y: 880 },
    ];
    coords.forEach(c => {
      const box = this.powerBoxes.create(c.x, c.y, 'crate_box') as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody & { hp?: number };
      box.setImmovable(true);
      box.setDepth(14);
      box.hp = 3000;
    });
  }

  private spawnCenterCrystals() {
    const cx = this.mapWidth / 2;
    const cy = this.mapHeight / 2;
    this.spawnCrystal(cx - 30, cy - 20);
    this.spawnCrystal(cx + 30, cy + 20);
    this.spawnCrystal(cx, cy);
  }

  private mineProduceCrystal() {
    if (this.isGameOver || this.crystals.countActive() >= 8) return;
    const cx = this.mapWidth / 2;
    const cy = this.mapHeight / 2;
    const offsetX = Phaser.Math.Between(-60, 60);
    const offsetY = Phaser.Math.Between(-60, 60);
    this.spawnCrystal(cx + offsetX, cy + offsetY);

    // Floating text above mine
    this.showFloatingText(cx, cy - 50, '💎 CRYSTAL SPAWNED!', '#00D9FF');
  }

  private spawnCrystal(x: number, y: number) {
    const gem = this.crystals.create(x, y, 'gem_crystal') as Phaser.Physics.Arcade.Image;
    gem.setCollideWorldBounds(true);
    gem.setDepth(13);
  }

  private spawnPowerCube(x: number, y: number) {
    const cube = this.powerCubes.create(x, y, 'power_cube_tex') as Phaser.Physics.Arcade.Image;
    cube.setCollideWorldBounds(true);
    cube.setDepth(13);
  }

  private setupColliders() {
    // Solid Collisions
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.powerBoxes);

    this.blueTeam.forEach(m => {
      this.physics.add.collider(m.sprite, this.walls);
      this.physics.add.collider(m.sprite, this.powerBoxes);
    });

    this.redTeam.forEach(e => {
      this.physics.add.collider(e.sprite, this.walls);
      this.physics.add.collider(e.sprite, this.powerBoxes);
    });

    // Bullets vs Walls
    this.physics.add.collider(this.bullets, this.walls, (b) => b.destroy());
    this.physics.add.collider(this.enemyBullets, this.walls, (b) => b.destroy());

    // Bullets vs Power Boxes
    this.physics.add.overlap(this.bullets, this.powerBoxes, (bullet, box) => {
      bullet.destroy();
      const pBox = box as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody & { hp?: number };
      const dmg = 450 + this.powerCubeCount * 60;
      pBox.hp = (pBox.hp || 3000) - dmg;
      this.showFloatingText(pBox.x, pBox.y - 20, `-${dmg}`, '#EF4444');

      if (pBox.hp <= 0) {
        this.spawnPowerCube(pBox.x, pBox.y);
        pBox.destroy();
      }
    });

    // Blue Bullets vs Red Team
    this.physics.add.overlap(this.bullets, this.redTeam.map(r => r.sprite), (bullet, targetSprite) => {
      bullet.destroy();
      const enemy = this.redTeam.find(r => r.sprite === targetSprite);
      if (!enemy) return;

      const dmg = 450 + this.powerCubeCount * 60;
      enemy.hp -= dmg;
      this.totalDamage += dmg;
      this.superCharge = Math.min(100, this.superCharge + 15);
      this.callbacks.onHealthUpdate(this.playerHp, this.playerMaxHp, this.superCharge, this.powerCubeCount, this.ammo);
      this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 25, `-${dmg}`, '#EF4444');

      if (enemy.hp <= 0) {
        this.kills += 1;
        this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 45, '💀 ELIMINATED!', '#F59E0B');
        // Drop crystals carried
        for (let i = 0; i < enemy.crystals; i++) {
          this.spawnCrystal(enemy.sprite.x + Phaser.Math.Between(-30, 30), enemy.sprite.y + Phaser.Math.Between(-30, 30));
        }
        enemy.crystals = 0;
        enemy.hp = enemy.maxHp;
        enemy.sprite.setPosition(1120, Phaser.Math.Between(300, 700));
      }
    });

    // Red Bullets vs Player & Blue Allies
    this.physics.add.overlap(this.enemyBullets, this.player, (bullet) => {
      bullet.destroy();
      const dmg = 240;
      this.playerHp = Math.max(0, this.playerHp - dmg);
      this.showFloatingText(this.player.x, this.player.y - 25, `-${dmg}`, '#EF4444');

      if (this.playerHp <= 0) {
        this.deaths += 1;
        this.playerHp = this.playerMaxHp;
        this.player.setPosition(280, 500);
      }
      this.callbacks.onHealthUpdate(this.playerHp, this.playerMaxHp, this.superCharge, this.powerCubeCount, this.ammo);
    });

    // Crystal Pickups
    this.physics.add.overlap(this.player, this.crystals, (_p, crystal) => {
      crystal.destroy();
      this.blueCrystals += 1;
      this.crystalsCollected += 1;
      this.blueTeam[0].crystals += 1;
      this.showFloatingText(this.player.x, this.player.y - 30, '+1 💎', '#00D9FF');
      this.checkCrystalWinCondition();
    });

    this.redTeam.forEach(e => {
      this.physics.add.overlap(e.sprite, this.crystals, (_sp, crystal) => {
        crystal.destroy();
        this.redCrystals += 1;
        e.crystals += 1;
        this.checkCrystalWinCondition();
      });
    });

    // Power Cube Pickups
    this.physics.add.overlap(this.player, this.powerCubes, (_p, cube) => {
      cube.destroy();
      this.powerCubeCount += 1;
      this.playerMaxHp += 400;
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 400);
      this.showFloatingText(this.player.x, this.player.y - 30, `+1 📦 (+400 HP)`, '#22C55E');
      this.callbacks.onHealthUpdate(this.playerHp, this.playerMaxHp, this.superCharge, this.powerCubeCount, this.ammo);
    });
  }

  private checkCrystalWinCondition() {
    this.callbacks.onScoreUpdate(this.blueCrystals, this.redCrystals);

    if (this.blueCrystals >= 10 && !this.isGameOver) {
      this.isGameOver = true;
      this.callbacks.onGameOver(true, {
        kills: this.kills,
        deaths: this.deaths,
        crystals: this.crystalsCollected,
        damage: this.totalDamage,
      });
    } else if (this.redCrystals >= 10 && !this.isGameOver) {
      this.isGameOver = true;
      this.callbacks.onGameOver(false, {
        kills: this.kills,
        deaths: this.deaths,
        crystals: this.crystalsCollected,
        damage: this.totalDamage,
      });
    }
  }

  public shootPlayerAttack(targetX: number, targetY: number) {
    if (this.ammo <= 0 || !this.player.active) return;
    this.ammo -= 1;
    this.callbacks.onHealthUpdate(this.playerHp, this.playerMaxHp, this.superCharge, this.powerCubeCount, this.ammo);

    const bullet = this.bullets.create(this.player.x, this.player.y, 'fire_shot') as Phaser.Physics.Arcade.Image;
    if (!bullet) return;

    bullet.setDepth(16);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    const speed = 600;
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    this.time.delayedCall(1200, () => {
      if (bullet.active) bullet.destroy();
    });
  }

  public activateSuper() {
    if (this.superCharge < 100 || !this.player.active) return;
    this.superCharge = 0;
    this.callbacks.onHealthUpdate(this.playerHp, this.playerMaxHp, this.superCharge, this.powerCubeCount, this.ammo);

    // Screen Shake & Mega Fire Barrage
    this.cameras.main.shake(250, 0.015);
    this.showFloatingText(this.player.x, this.player.y - 50, '🔥 FIRE STORM!', '#F59E0B');

    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const bullet = this.bullets.create(this.player.x, this.player.y, 'fire_shot') as Phaser.Physics.Arcade.Image;
      if (bullet) {
        bullet.setScale(1.8);
        bullet.setVelocity(Math.cos(angle) * 580, Math.sin(angle) * 580);
        this.time.delayedCall(1200, () => bullet.active && bullet.destroy());
      }
    }
  }

  public performDash() {
    if (!this.player.active) return;
    const body = this.player.body;
    if (body.velocity.length() > 0) {
      this.player.x += (body.velocity.x / 200) * 60;
      this.player.y += (body.velocity.y / 200) * 60;
      this.showFloatingText(this.player.x, this.player.y - 20, '💨 DASH', '#00D9FF');
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
      y: y - 35,
      alpha: 0,
      duration: 900,
      onComplete: () => label.destroy(),
    });
  }

  update(time: number) {
    if (this.isGameOver) return;

    // Recharge Ammo (3 segmented slots)
    if (this.ammo < this.maxAmmo && time - this.lastAmmoRecharge > this.ammoRechargeTime) {
      this.lastAmmoRecharge = time;
      this.ammo += 1;
      this.callbacks.onHealthUpdate(this.playerHp, this.playerMaxHp, this.superCharge, this.powerCubeCount, this.ammo);
    }

    // Player 8-way movement
    const speed = 230;
    let vx = 0;
    let vy = 0;

    if (this.wasdKeys?.A.isDown || this.cursors?.left.isDown) vx -= speed;
    if (this.wasdKeys?.D.isDown || this.cursors?.right.isDown) vx += speed;
    if (this.wasdKeys?.W.isDown || this.cursors?.up.isDown) vy -= speed;
    if (this.wasdKeys?.S.isDown || this.cursors?.down.isDown) vy += speed;

    this.player.setVelocity(vx, vy);

    // Bush Concealment
    let playerInBush = false;
    this.physics.overlap(this.player, this.bushes, () => {
      playerInBush = true;
    });
    this.player.setAlpha(playerInBush ? 0.45 : 1.0);

    // Red AI Logic (Roam, Hunt Crystals, Shoot)
    this.redTeam.forEach((enemy) => {
      const distToPlayer = Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y);
      const canSeePlayer = !playerInBush || distToPlayer < 120;

      if (canSeePlayer && distToPlayer > 130) {
        const angle = Phaser.Math.Angle.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y);
        enemy.sprite.setVelocity(Math.cos(angle) * 120, Math.sin(angle) * 120);
      } else {
        enemy.sprite.setVelocity(0, 0);
      }

      // Shoot player
      if (canSeePlayer && time - enemy.lastShot > 1500 && distToPlayer < 400) {
        enemy.lastShot = time;
        const eBullet = this.enemyBullets.create(enemy.sprite.x, enemy.sprite.y, 'enemy_shot') as Phaser.Physics.Arcade.Image;
        if (eBullet) {
          eBullet.setDepth(16);
          const angle = Phaser.Math.Angle.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y);
          eBullet.setVelocity(Math.cos(angle) * 360, Math.sin(angle) * 360);
          this.time.delayedCall(1200, () => eBullet.active && eBullet.destroy());
        }
      }
    });

    // Draw Aim Trajectory
    if (this.isAiming && this.player.active) {
      this.aimGraphics.clear();
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.aimTarget.x, this.aimTarget.y);
      const range = 260;

      this.aimGraphics.lineStyle(3, 0x00d9ff, 0.8);
      this.aimGraphics.beginPath();
      this.aimGraphics.moveTo(this.player.x, this.player.y);
      this.aimGraphics.lineTo(
        this.player.x + Math.cos(angle) * range,
        this.player.y + Math.sin(angle) * range
      );
      this.aimGraphics.strokePath();

      this.aimGraphics.lineStyle(1.5, 0xfacc15, 0.9);
      this.aimGraphics.strokeCircle(
        this.player.x + Math.cos(angle) * range,
        this.player.y + Math.sin(angle) * range,
        14
      );
    }

    // Render Overhead Health Bars & Ammo for all heroes
    this.renderOverheadBars();
  }

  private renderOverheadBars() {
    this.hudGraphics.clear();

    // Render for Player
    if (this.player.active) {
      const px = this.player.x;
      const py = this.player.y - 36;
      const barW = 44;
      const hpPct = Math.max(0, this.playerHp / this.playerMaxHp);

      // HP Bar
      this.hudGraphics.fillStyle(0x000000, 0.7);
      this.hudGraphics.fillRect(px - barW / 2, py, barW, 6);
      this.hudGraphics.fillStyle(0x22c55e, 1);
      this.hudGraphics.fillRect(px - barW / 2, py, barW * hpPct, 6);

      // 3 Ammo Slots
      const slotW = (barW - 4) / 3;
      for (let i = 0; i < 3; i++) {
        this.hudGraphics.fillStyle(0x000000, 0.8);
        this.hudGraphics.fillRect(px - barW / 2 + i * (slotW + 2), py + 8, slotW, 3);
        if (i < this.ammo) {
          this.hudGraphics.fillStyle(0xf97316, 1);
          this.hudGraphics.fillRect(px - barW / 2 + i * (slotW + 2), py + 8, slotW, 3);
        }
      }
    }

    // Render for Red Team
    this.redTeam.forEach(e => {
      if (!e.sprite.active) return;
      const ex = e.sprite.x;
      const ey = e.sprite.y - 36;
      const barW = 40;
      const hpPct = Math.max(0, e.hp / e.maxHp);

      this.hudGraphics.fillStyle(0x000000, 0.7);
      this.hudGraphics.fillRect(ex - barW / 2, ey, barW, 5);
      this.hudGraphics.fillStyle(0xef4444, 1);
      this.hudGraphics.fillRect(ex - barW / 2, ey, barW * hpPct, 5);
    });
  }
}
