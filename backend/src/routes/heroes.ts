import { Router, Request, Response } from 'express';
import { query } from '../db/postgres.js';
import { cacheGet, cacheSet, cacheDel, CACHE_KEYS } from '../db/redis.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { z } from 'zod';

export const heroesRouter = Router();

// ─── GET /api/heroes ──────────────────────────────────────────────────────────
heroesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    // Try cache first (heroes rarely change)
    const cached = await cacheGet(CACHE_KEYS.heroStats);
    if (cached) return res.json({ heroes: cached, cached: true });

    const result = await query(
      `SELECT id, slug, name, class, rarity, health, attack_damage,
              movement_speed, attack_range, attack_cooldown_ms, ammo_count,
              normal_attack, normal_attack_desc, super_ability, super_ability_desc,
              gadget, gadget_desc, passive, passive_desc,
              description, color_hex, emoji, is_default, unlock_cost_coins
       FROM heroes
       ORDER BY
         CASE rarity
           WHEN 'Legendary' THEN 1
           WHEN 'Epic' THEN 2
           WHEN 'Super Rare' THEN 3
           WHEN 'Rare' THEN 4
         END, name`
    );

    const heroes = result.rows;
    await cacheSet(CACHE_KEYS.heroStats, heroes, 300); // 5-minute cache

    return res.json({ heroes });
  } catch (err) {
    console.error('[Heroes] GET / error:', err);
    return res.status(500).json({ error: 'Failed to fetch heroes' });
  }
});

// ─── GET /api/heroes/:slug ────────────────────────────────────────────────────
heroesRouter.get('/:slug', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM heroes WHERE slug = $1`,
      [req.params.slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hero not found' });
    }

    return res.json({ hero: result.rows[0] });
  } catch (err) {
    console.error('[Heroes] GET /:slug error:', err);
    return res.status(500).json({ error: 'Failed to fetch hero' });
  }
});

// ─── POST /api/heroes (admin only) ───────────────────────────────────────────
const heroSchema = z.object({
  slug: z.string().min(2).max(32),
  name: z.string().min(2).max(32),
  class: z.enum(['Damage', 'Assassin', 'Tank', 'Support', 'Controller']),
  rarity: z.enum(['Legendary', 'Epic', 'Super Rare', 'Rare']),
  health: z.number().int().positive(),
  attack_damage: z.number().int().positive(),
  movement_speed: z.number().int().positive(),
  attack_range: z.number().int().positive(),
  attack_cooldown_ms: z.number().int().positive().default(500),
  ammo_count: z.number().int().positive().default(3),
  normal_attack: z.string(),
  normal_attack_desc: z.string(),
  super_ability: z.string(),
  super_ability_desc: z.string(),
  gadget: z.string().default('None'),
  gadget_desc: z.string().default(''),
  passive: z.string(),
  passive_desc: z.string(),
  description: z.string(),
  color_hex: z.string().default('#ff4444'),
  emoji: z.string().default('⚔️'),
  is_default: z.boolean().default(false),
  unlock_cost_coins: z.number().int().default(0),
});

heroesRouter.post('/', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = heroSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const h = parsed.data;
  try {
    const result = await query(
      `INSERT INTO heroes (slug, name, class, rarity, health, attack_damage, movement_speed,
        attack_range, attack_cooldown_ms, ammo_count, normal_attack, normal_attack_desc,
        super_ability, super_ability_desc, gadget, gadget_desc, passive, passive_desc,
        description, color_hex, emoji, is_default, unlock_cost_coins)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING *`,
      [h.slug, h.name, h.class, h.rarity, h.health, h.attack_damage, h.movement_speed,
       h.attack_range, h.attack_cooldown_ms, h.ammo_count, h.normal_attack, h.normal_attack_desc,
       h.super_ability, h.super_ability_desc, h.gadget, h.gadget_desc, h.passive, h.passive_desc,
       h.description, h.color_hex, h.emoji, h.is_default, h.unlock_cost_coins]
    );

    // Invalidate hero cache
    await cacheDel(CACHE_KEYS.heroStats);

    return res.status(201).json({ hero: result.rows[0] });
  } catch (err) {
    console.error('[Heroes] POST error:', err);
    return res.status(500).json({ error: 'Failed to create hero' });
  }
});
