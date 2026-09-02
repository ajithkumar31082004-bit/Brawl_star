import * as Phaser from 'phaser';

export interface GameEventCallbacks {
  onScoreUpdate: (blue: number, red: number) => void;
  onHealthUpdate: (current: number, max: number, superCharge: number) => void;
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
  private enemies: Array<{
    sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    hp: number;
    maxHp: number;
    name: string;
    lastShot: number;
    team: 'red';
  }> = [];

  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private blueCrystals = 0;
  private redCrystals = 0;
  private playerHp = 3200;
  private playerMaxHp = 3200;
  private superCharge = 0;
  private kills = 0;
  private deaths = 0;
  private totalDamage = 0;
  private crystalsCollected = 0;
  private isGameOver = false;

  private callbacks!: GameEventCallbacks;

  constructor() {
    super('ArenaScene');
  }

  init(data: { callbacks: GameEventCallbacks }) {
    this.callbacks = data.callbacks;
  }

  create() {
    // Arena Dimensions
    const width = 960;
    const height = 640;

    // Background Arena Grid
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a1128);

    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1e293b, 0.4);
    for (let x = 0; x < width; x += 40) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 40) {
      graphics.lineBetween(0, y, width, y);
    }

    // Center Crystal Ring
    graphics.lineStyle(2, 0x00d9ff, 0.3);
    graphics.strokeCircle(width / 2, height / 2, 70);

    // Walls Static Group
    this.walls = this.physics.add.staticGroup();
    const wallColor = 0x1e2952;
    const wallBorder = 0x6c63ff;

    const wallRects = [
      { x: 140, y: 100, w: 100, h: 24 },
      { x: 820, y: 100, w: 100, h: 24 },
      { x: 140, y: 540, w: 100, h: 24 },
      { x: 820, y: 540, w: 100, h: 24 },
      { x: 300, y: 200, w: 24, h: 100 },
      { x: 660, y: 200, w: 24, h: 100 },
      { x: 300, y: 440, w: 24, h: 100 },
      { x: 660, y: 440, w: 24, h: 100 },
      { x: 480, y: 120, w: 90, h: 24 },
      { x: 480, y: 520, w: 90, h: 24 },
    ];

    wallRects.forEach((r) => {
      const rect = this.add.rectangle(r.x, r.y, r.w, r.h, wallColor);
      rect.setStrokeStyle(1, wallBorder, 0.6);
      this.physics.add.existing(rect, true);
      this.walls.add(rect);
    });

    // Create Textures
    this.createPlayerTexture();
    this.createBulletTexture();
    this.createCrystalTexture();

    // Groups
    this.bullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image });
    this.enemyBullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image });
    this.crystals = this.physics.add.group();

    // Spawn Player
    this.player = this.physics.add.sprite(200, 320, 'player_hero');
    this.player.setCollideWorldBounds(true);
    this.player.setCircle(18);

    // Keyboard Inputs
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as unknown as {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
      };
    }

    // Spawn 2 AI Bot Enemies
    this.spawnEnemy(760, 240, 'ShadowX');
    this.spawnEnemy(760, 400, 'ProGamer');

    // Spawn Initial Crystals
    this.spawnCrystal(width / 2 - 30, height / 2 - 20);
    this.spawnCrystal(width / 2 + 30, height / 2 + 20);
    this.spawnCrystal(width / 2, height / 2);

    // Periodic Crystal Spawner
    this.time.addEvent({
      delay: 7000,
      callback: () => {
        if (!this.isGameOver && this.crystals.countActive() < 6) {
          const offsetX = Phaser.Math.Between(-60, 60);
          const offsetY = Phaser.Math.Between(-60, 60);
          this.spawnCrystal(width / 2 + offsetX, height / 2 + offsetY);
        }
      },
      loop: true,
    });

    // Collisions
    this.physics.add.collider(this.player, this.walls);
    this.enemies.forEach((e) => this.physics.add.collider(e.sprite, this.walls));

    this.physics.add.overlap(this.player, this.crystals, (_p, crystal) => {
      this.collectCrystal(crystal as Phaser.Physics.Arcade.Image, 'blue');
    });

    this.enemies.forEach((e) => {
      this.physics.add.overlap(e.sprite, this.crystals, (_enemy, crystal) => {
        this.collectCrystal(crystal as Phaser.Physics.Arcade.Image, 'red');
      });
    });

    // Bullets vs Walls
    this.physics.add.collider(this.bullets, this.walls, (bullet) => bullet.destroy());
    this.physics.add.collider(this.enemyBullets, this.walls, (bullet) => bullet.destroy());

    // Mouse Attack
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown() && !this.isGameOver && this.player.active) {
        this.shootBullet(pointer.worldX, pointer.worldY);
      }
    });
  }

  private createPlayerTexture() {
    if (this.textures.exists('player_hero')) return;
    const g = this.add.graphics();
    g.fillStyle(0x6c63ff, 1);
    g.fillCircle(20, 20, 18);
    g.lineStyle(2, 0x00d9ff, 1);
    g.strokeCircle(20, 20, 18);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(24, 16, 4);
    g.generateTexture('player_hero', 40, 40);
    g.destroy();

    const eg = this.add.graphics();
    eg.fillStyle(0xef4444, 1);
    eg.fillCircle(20, 20, 18);
    eg.lineStyle(2, 0xfca5a5, 1);
    eg.strokeCircle(20, 20, 18);
    eg.fillStyle(0xffffff, 1);
    eg.fillCircle(16, 16, 4);
    eg.generateTexture('enemy_hero', 40, 40);
    eg.destroy();
  }

  private createBulletTexture() {
    if (this.textures.exists('bullet_blue')) return;
    const g = this.add.graphics();
    g.fillStyle(0x00d9ff, 1);
    g.fillCircle(6, 6, 6);
    g.generateTexture('bullet_blue', 12, 12);
    g.destroy();

    const eg = this.add.graphics();
    eg.fillStyle(0xf97316, 1);
    eg.fillCircle(6, 6, 6);
    eg.generateTexture('bullet_red', 12, 12);
    eg.destroy();
  }

  private createCrystalTexture() {
    if (this.textures.exists('crystal_gem')) return;
    const g = this.add.graphics();
    g.fillStyle(0x00d9ff, 1);
    g.beginPath();
    g.moveTo(10, 0);
    g.lineTo(20, 10);
    g.lineTo(10, 20);
    g.lineTo(0, 10);
    g.closePath();
    g.fill();
    g.lineStyle(1, 0xffffff, 0.9);
    g.stroke();
    g.generateTexture('crystal_gem', 20, 20);
    g.destroy();
  }

  private spawnEnemy(x: number, y: number, name: string) {
    const enemySprite = this.physics.add.sprite(x, y, 'enemy_hero');
    enemySprite.setCollideWorldBounds(true);
    enemySprite.setCircle(18);

    const enemyData = {
      sprite: enemySprite,
      hp: 2600,
      maxHp: 2600,
      name,
      lastShot: 0,
      team: 'red' as const,
    };
    this.enemies.push(enemyData);

    // Bullet overlap with enemy
    this.physics.add.overlap(this.bullets, enemySprite, (bullet) => {
      bullet.destroy();
      const dmg = 150;
      enemyData.hp -= dmg;
      this.totalDamage += dmg;
      this.superCharge = Math.min(100, this.superCharge + 10);
      this.callbacks.onHealthUpdate(this.playerHp, this.playerMaxHp, this.superCharge);

      if (enemyData.hp <= 0) {
        this.kills += 1;
        enemySprite.setPosition(760, Phaser.Math.Between(150, 490));
        enemyData.hp = enemyData.maxHp;
      }
    });

    // Enemy bullets vs player
    this.physics.add.overlap(this.enemyBullets, this.player, (bullet) => {
      bullet.destroy();
      this.playerHp -= 120;
      if (this.playerHp <= 0) {
        this.deaths += 1;
        this.playerHp = this.playerMaxHp;
        this.player.setPosition(200, 320);
      }
      this.callbacks.onHealthUpdate(this.playerHp, this.playerMaxHp, this.superCharge);
    });
  }

  private spawnCrystal(x: number, y: number) {
    const gem = this.crystals.create(x, y, 'crystal_gem') as Phaser.Physics.Arcade.Image;
    gem.setCollideWorldBounds(true);
  }

  private collectCrystal(crystal: Phaser.Physics.Arcade.Image, team: 'blue' | 'red') {
    crystal.destroy();
    if (team === 'blue') {
      this.blueCrystals += 1;
      this.crystalsCollected += 1;
    } else {
      this.redCrystals += 1;
    }
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

  public shootBullet(targetX: number, targetY: number) {
    if (!this.player.active) return;
    const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet_blue') as Phaser.Physics.Arcade.Image;
    if (!bullet) return;

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    const speed = 450;
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    this.time.delayedCall(1200, () => {
      if (bullet.active) bullet.destroy();
    });
  }

  public activateSuper() {
    if (this.superCharge < 100 || !this.player.active) return;
    this.superCharge = 0;
    this.callbacks.onHealthUpdate(this.playerHp, this.playerMaxHp, this.superCharge);

    // 8-directional super blast
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet_blue') as Phaser.Physics.Arcade.Image;
      if (bullet) {
        bullet.setScale(1.5);
        bullet.setVelocity(Math.cos(angle) * 550, Math.sin(angle) * 550);
        this.time.delayedCall(1200, () => bullet.active && bullet.destroy());
      }
    }
  }

  public performDash() {
    if (!this.player.active) return;
    const body = this.player.body;
    if (body.velocity.length() > 0) {
      this.player.x += (body.velocity.x / 200) * 45;
      this.player.y += (body.velocity.y / 200) * 45;
    }
  }

  public handleMobileMove(dirX: number, dirY: number) {
    const speed = 200;
    this.player.setVelocity(dirX * speed, dirY * speed);
  }

  update(time: number) {
    if (this.isGameOver) return;

    // Player WASD controls
    const speed = 200;
    let vx = 0;
    let vy = 0;

    if (this.wasdKeys?.A.isDown || this.cursors?.left.isDown) vx -= speed;
    if (this.wasdKeys?.D.isDown || this.cursors?.right.isDown) vx += speed;
    if (this.wasdKeys?.W.isDown || this.cursors?.up.isDown) vy -= speed;
    if (this.wasdKeys?.S.isDown || this.cursors?.down.isDown) vy += speed;

    if (vx !== 0 || vy !== 0) {
      this.player.setVelocity(vx, vy);
    } else {
      this.player.setVelocity(0, 0);
    }

    // AI Enemy Behavior
    this.enemies.forEach((enemy) => {
      const dx = this.player.x - enemy.sprite.x;
      const dy = this.player.y - enemy.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 120) {
        enemy.sprite.setVelocity((dx / dist) * 110, (dy / dist) * 110);
      } else {
        enemy.sprite.setVelocity(0, 0);
      }

      if (time - enemy.lastShot > 1400 && dist < 380) {
        enemy.lastShot = time;
        const eBullet = this.enemyBullets.create(enemy.sprite.x, enemy.sprite.y, 'bullet_red') as Phaser.Physics.Arcade.Image;
        if (eBullet) {
          const angle = Phaser.Math.Angle.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y);
          eBullet.setVelocity(Math.cos(angle) * 320, Math.sin(angle) * 320);
          this.time.delayedCall(1200, () => eBullet.active && eBullet.destroy());
        }
      }
    });
  }
}
