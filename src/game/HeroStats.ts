/**
 * Client-Side Hero Configuration & Constants.
 * Matches backend/src/game/HeroStats.ts 1:1 for authoritative client prediction.
 */

export interface HeroSpeedConfig {
  slug: string;
  name: string;
  movementSpeed: number;
  attackRange: number;
  superType: string;
}

export const HERO_SPEEDS: Record<string, number> = {
  volt:   330,
  pico:   310,
  blaze:  290,
  luna:   290,
  buster: 290,
  frost:  280,
  rocket: 270,
  titan:  260,
};

export const HERO_STATS: Record<string, HeroSpeedConfig> = {
  blaze: {
    slug: 'blaze',
    name: 'Blaze',
    movementSpeed: 290,
    attackRange: 460,
    superType: 'fire_storm',
  },
  volt: {
    slug: 'volt',
    name: 'Volt',
    movementSpeed: 330,
    attackRange: 420,
    superType: 'lightning_dash',
  },
  titan: {
    slug: 'titan',
    name: 'Titan',
    movementSpeed: 260,
    attackRange: 220,
    superType: 'hammer_quake',
  },
  frost: {
    slug: 'frost',
    name: 'Frost',
    movementSpeed: 280,
    attackRange: 480,
    superType: 'ice_burst',
  },
  rocket: {
    slug: 'rocket',
    name: 'Rocket',
    movementSpeed: 270,
    attackRange: 560,
    superType: 'star_beam',
  },
  luna: {
    slug: 'luna',
    name: 'Luna',
    movementSpeed: 290,
    attackRange: 400,
    superType: 'star_beam',
  },
  buster: {
    slug: 'buster',
    name: 'Buster',
    movementSpeed: 290,
    attackRange: 320,
    superType: 'shield_wall',
  },
  pico: {
    slug: 'pico',
    name: 'Pico',
    movementSpeed: 310,
    attackRange: 380,
    superType: 'lightning_dash',
  },
};

export function getHeroMovementSpeed(heroSlug: string): number {
  return HERO_SPEEDS[heroSlug.toLowerCase()] ?? 290;
}
