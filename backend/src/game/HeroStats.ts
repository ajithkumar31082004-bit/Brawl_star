/**
 * HeroStats — authoritative hero configuration.
 * Single source of truth for combat calculations, projectile physics, and Super mechanics.
 */

import { query } from '../db/postgres.js';
import { cacheGet, cacheSet } from '../db/redis.js';

export type AttackPattern = 'single' | 'spread' | 'melee' | 'pierce';
export type SuperType = 'fire_storm' | 'lightning_dash' | 'shield_wall' | 'ice_burst' | 'star_beam' | 'hammer_quake';

export interface HeroConfig {
  id: string;
  slug: string;
  name: string;
  health: number;
  attackDamage: number;
  movementSpeed: number;       // pixels per second
  attackRange: number;         // pixels
  attackCooldownMs: number;    // ms between shots
  superChargePerHit: number;   // % charge per bullet that hits
  ammoCount: number;
  ammoRechargeMs: number;

  // Distinct Attack Mechanics
  attackPattern: AttackPattern;
  projectilesPerShot: number;
  spreadAngle: number;         // degrees between outermost projectiles
  projectileRadius: number;    // hitbox radius
  bulletSpeed: number;         // projectile velocity (px/s)

  // Super Ability
  superType: SuperType;
  superValue: number;          // damage, heal, or shield value
  superDurationMs: number;
  knockbackForce: number;      // px knocked back on hit
}

export const HERO_DEFAULTS: Record<string, HeroConfig> = {
  blaze: {
    id: 'hero_blaze',
    slug: 'blaze',
    name: 'Blaze',
    health: 4800,
    attackDamage: 540,
    movementSpeed: 290,
    attackRange: 460,
    attackCooldownMs: 400,
    superChargePerHit: 16,
    ammoCount: 3,
    ammoRechargeMs: 1400,
    attackPattern: 'single',
    projectilesPerShot: 1,
    spreadAngle: 0,
    projectileRadius: 9,
    bulletSpeed: 660,
    superType: 'fire_storm',
    superValue: 180,           // 180 dmg/tick in AOE field
    superDurationMs: 4000,
    knockbackForce: 0,
  },
  volt: {
    id: 'hero_volt',
    slug: 'volt',
    name: 'Volt',
    health: 3800,
    attackDamage: 680,
    movementSpeed: 330,        // very fast assassin
    attackRange: 420,
    attackCooldownMs: 350,
    superChargePerHit: 20,
    ammoCount: 3,
    ammoRechargeMs: 1200,
    attackPattern: 'single',
    projectilesPerShot: 1,
    spreadAngle: 0,
    projectileRadius: 7,
    bulletSpeed: 820,
    superType: 'lightning_dash',
    superValue: 750,           // burst damage on dash strike
    superDurationMs: 300,
    knockbackForce: 140,
  },
  titan: {
    id: 'hero_titan',
    slug: 'titan',
    name: 'Titan',
    health: 7600,              // huge tank HP
    attackDamage: 720,
    movementSpeed: 260,
    attackRange: 220,          // melee cleave
    attackCooldownMs: 700,
    superChargePerHit: 25,
    ammoCount: 3,
    ammoRechargeMs: 1600,
    attackPattern: 'melee',
    projectilesPerShot: 1,
    spreadAngle: 45,
    projectileRadius: 28,      // wide hammer arc
    bulletSpeed: 380,
    superType: 'hammer_quake',
    superValue: 950,           // seismic slam + stun
    superDurationMs: 1500,
    knockbackForce: 280,
  },
  frost: {
    id: 'hero_frost',
    slug: 'frost',
    name: 'Frost',
    health: 4400,
    attackDamage: 320,          // per shard (x3 = 960 burst)
    movementSpeed: 280,
    attackRange: 500,
    attackCooldownMs: 500,
    superChargePerHit: 12,
    ammoCount: 3,
    ammoRechargeMs: 1500,
    attackPattern: 'spread',
    projectilesPerShot: 3,     // 3-shard fan
    spreadAngle: 24,
    projectileRadius: 7,
    bulletSpeed: 600,
    superType: 'ice_burst',
    superValue: 550,           // AOE freeze / slow
    superDurationMs: 3000,
    knockbackForce: 50,
  },
  rocket: {
    id: 'hero_rocket',
    slug: 'rocket',
    name: 'Rocket',
    health: 4000,
    attackDamage: 850,         // heavy single rocket
    movementSpeed: 270,
    attackRange: 560,
    attackCooldownMs: 750,
    superChargePerHit: 22,
    ammoCount: 3,
    ammoRechargeMs: 1800,
    attackPattern: 'single',
    projectilesPerShot: 1,
    spreadAngle: 0,
    projectileRadius: 15,     // big explosive rocket
    bulletSpeed: 520,
    superType: 'fire_storm',
    superValue: 240,
    superDurationMs: 3500,
    knockbackForce: 200,
  },
  luna: {
    id: 'hero_luna',
    slug: 'luna',
    name: 'Luna',
    health: 4200,
    attackDamage: 480,
    movementSpeed: 290,
    attackRange: 520,
    attackCooldownMs: 450,
    superChargePerHit: 18,
    ammoCount: 3,
    ammoRechargeMs: 1300,
    attackPattern: 'pierce',    // passes through enemies
    projectilesPerShot: 1,
    spreadAngle: 0,
    projectileRadius: 9,
    bulletSpeed: 700,
    superType: 'star_beam',
    superValue: 1200,          // healing pulse to allies or heavy beam
    superDurationMs: 1200,
    knockbackForce: 0,
  },
  buster: {
    id: 'hero_buster',
    slug: 'buster',
    name: 'Buster',
    health: 5400,
    attackDamage: 240,          // per pellet (x4 = 960 point-blank)
    movementSpeed: 290,
    attackRange: 380,
    attackCooldownMs: 600,
    superChargePerHit: 10,
    ammoCount: 3,
    ammoRechargeMs: 1500,
    attackPattern: 'spread',
    projectilesPerShot: 4,     // shotgun blast
    spreadAngle: 36,
    projectileRadius: 8,
    bulletSpeed: 640,
    superType: 'shield_wall',
    superValue: 1500,          // shield absorption
    superDurationMs: 4000,
    knockbackForce: 90,
  },
  pico: {
    id: 'hero_pico',
    slug: 'pico',
    name: 'Pico',
    health: 3600,
    attackDamage: 620,
    movementSpeed: 310,
    attackRange: 600,          // sniper range
    attackCooldownMs: 420,
    superChargePerHit: 22,
    ammoCount: 3,
    ammoRechargeMs: 1350,
    attackPattern: 'single',
    projectilesPerShot: 1,
    spreadAngle: 0,
    projectileRadius: 6,
    bulletSpeed: 780,
    superType: 'lightning_dash',
    superValue: 600,
    superDurationMs: 350,
    knockbackForce: 60,
  },
};

// In-memory map for O(1) lookup during game ticks
const heroCache = new Map<string, HeroConfig>();

// Preload defaults
for (const [slug, cfg] of Object.entries(HERO_DEFAULTS)) {
  heroCache.set(slug, cfg);
}

function rowToConfig(row: Record<string, unknown>): HeroConfig {
  const slug = String(row.slug);
  const base = HERO_DEFAULTS[slug] || HERO_DEFAULTS.blaze;

  return {
    ...base,
    id:                String(row.id || base.id),
    slug:              slug,
    name:              String(row.name || base.name),
    health:            Number(row.health) || base.health,
    attackDamage:      Number(row.attack_damage) || base.attackDamage,
    movementSpeed:     Number(row.movement_speed) || base.movementSpeed,
    attackRange:       Number(row.attack_range) || base.attackRange,
    attackCooldownMs:  Number(row.attack_cooldown_ms) || base.attackCooldownMs,
    superChargePerHit: Number(row.super_charge_per_hit) || base.superChargePerHit,
    ammoCount:         Number(row.ammo_count) || base.ammoCount,
    ammoRechargeMs:    Number(row.ammo_recharge_ms) || base.ammoRechargeMs,
  };
}

/** Load all heroes from DB into memory. Call once at server startup. */
export async function loadHeroStats(): Promise<void> {
  const CACHE_KEY = 'hero_stats:server';

  // Try Redis first
  try {
    const cached = await cacheGet<HeroConfig[]>(CACHE_KEY);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      cached.forEach(h => heroCache.set(h.slug, h));
      console.log(`[HeroStats] ✅ Loaded ${heroCache.size} heroes from Redis cache`);
      return;
    }
  } catch {
    // Redis unavailable, proceed to DB
  }

  try {
    const result = await query<Record<string, unknown>>(
      `SELECT id, slug, name, health, attack_damage, movement_speed,
              attack_range, attack_cooldown_ms, super_charge_per_hit,
              ammo_count, ammo_recharge_ms
       FROM heroes ORDER BY name`
    );

    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        const config = rowToConfig(row);
        heroCache.set(config.slug, config);
      });
      console.log(`[HeroStats] ✅ Loaded ${heroCache.size} heroes from PostgreSQL`);
      try {
        await cacheSet(CACHE_KEY, [...heroCache.values()], 600);
      } catch {}
      return;
    }
  } catch {
    // DB offline — fallback to preloaded in-memory defaults
  }

  console.log(`[HeroStats] ℹ️ Using ${heroCache.size} pre-configured hero profiles`);
}

/** Get hero config by slug. */
export function getHeroConfig(slug: string): HeroConfig {
  const config = heroCache.get(slug) || HERO_DEFAULTS[slug] || HERO_DEFAULTS.blaze;
  return config;
}

/** All hero slugs */
export function allHeroSlugs(): string[] {
  return [...heroCache.keys()];
}
