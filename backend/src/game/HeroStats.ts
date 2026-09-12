/**
 * HeroStats — loads hero configuration from the database and caches it.
 * The game server uses these stats for all authoritative combat calculations.
 * Clients NEVER supply damage values.
 */

import { query } from '../db/postgres.js';
import { cacheGet, cacheSet } from '../db/redis.js';

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
}

// In-memory map for O(1) lookup during game ticks
const heroCache = new Map<string, HeroConfig>();

function rowToConfig(row: Record<string, unknown>): HeroConfig {
  return {
    id:                String(row.id),
    slug:              String(row.slug),
    name:              String(row.name),
    health:            Number(row.health),
    attackDamage:      Number(row.attack_damage),
    movementSpeed:     Number(row.movement_speed),
    attackRange:       Number(row.attack_range),
    attackCooldownMs:  Number(row.attack_cooldown_ms),
    superChargePerHit: Number(row.super_charge_per_hit),
    ammoCount:         Number(row.ammo_count),
    ammoRechargeMs:    Number(row.ammo_recharge_ms),
  };
}

/** Load all heroes from DB into memory. Call once at server startup. */
export async function loadHeroStats(): Promise<void> {
  const CACHE_KEY = 'hero_stats:server';

  // Try Redis first
  const cached = await cacheGet<HeroConfig[]>(CACHE_KEY);
  if (cached) {
    cached.forEach(h => heroCache.set(h.slug, h));
    console.log(`[HeroStats] ✅ Loaded ${heroCache.size} heroes from Redis cache`);
    return;
  }

  const result = await query<Record<string, unknown>>(
    `SELECT id, slug, name, health, attack_damage, movement_speed,
            attack_range, attack_cooldown_ms, super_charge_per_hit,
            ammo_count, ammo_recharge_ms
     FROM heroes ORDER BY name`
  );

  result.rows.forEach(row => {
    const config = rowToConfig(row);
    heroCache.set(config.slug, config);
  });

  // Cache in Redis for 10 minutes
  await cacheSet(CACHE_KEY, [...heroCache.values()], 600);
  console.log(`[HeroStats] ✅ Loaded ${heroCache.size} heroes from PostgreSQL`);
}

/** Get hero config by slug. Throws if hero not found. */
export function getHeroConfig(slug: string): HeroConfig {
  const config = heroCache.get(slug);
  if (!config) {
    throw new Error(`Unknown hero slug: "${slug}" — not in hero registry`);
  }
  return config;
}

/** All hero slugs */
export function allHeroSlugs(): string[] {
  return [...heroCache.keys()];
}
