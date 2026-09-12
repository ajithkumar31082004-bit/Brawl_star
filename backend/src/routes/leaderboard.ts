import { Router, Request, Response } from 'express';
import { query } from '../db/postgres.js';
import { cacheGet, cacheSet, CACHE_KEYS } from '../db/redis.js';
import { requireAuth } from '../middleware/auth.js';

export const leaderboardRouter = Router();

// ─── GET /api/leaderboard ─────────────────────────────────────────────────────
leaderboardRouter.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const limit = Math.min(100, Math.max(10, parseInt(String(req.query.limit || '50'))));
  const offset = (page - 1) * limit;

  const cacheKey = CACHE_KEYS.leaderboard(page);

  try {
    // Redis cache (5 min TTL)
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ ...cached as object, cached: true });

    const [boardResult, countResult, seasonResult] = await Promise.all([
      query<Record<string, unknown>>(
        `SELECT
           l.global_rank AS rank,
           u.username,
           u.avatar,
           u.rank_tier AS rank_tier,
           u.wins,
           u.losses,
           l.trophies,
           l.victories,
           l.win_rate,
           l.country_code AS country,
           (u.wins + u.losses) AS matches_played
         FROM leaderboards l
         JOIN users u ON l.user_id = u.id
         WHERE u.is_active = TRUE
         ORDER BY l.trophies DESC, l.victories DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      query('SELECT COUNT(*) AS total FROM leaderboards l JOIN users u ON l.user_id = u.id WHERE u.is_active = TRUE'),
      query('SELECT id, name, ends_at FROM seasons WHERE is_active = TRUE LIMIT 1'),
    ]);

    const payload = {
      leaderboard: boardResult.rows,
      pagination: {
        page,
        limit,
        total: Number(countResult.rows[0]?.total || 0),
        totalPages: Math.ceil(Number(countResult.rows[0]?.total || 0) / limit),
      },
      season: seasonResult.rows[0] || null,
    };

    await cacheSet(cacheKey, payload, 300); // 5-minute cache

    return res.json(payload);
  } catch (err) {
    console.error('[Leaderboard] error:', err);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ─── GET /api/leaderboard/friends ─────────────────────────────────────────────
leaderboardRouter.get('/friends', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    const result = await query<Record<string, unknown>>(
      `SELECT
         ROW_NUMBER() OVER (ORDER BY l.trophies DESC) AS rank,
         u.username,
         u.avatar,
         u.rank_tier,
         l.trophies,
         l.victories,
         l.win_rate,
         l.country_code AS country,
         (u.id = $1) AS is_current_user
       FROM leaderboards l
       JOIN users u ON l.user_id = u.id
       WHERE
         u.id = $1
         OR u.id IN (
           SELECT friend_id FROM friends WHERE user_id = $1 AND status = 'accepted'
           UNION
           SELECT user_id FROM friends WHERE friend_id = $1 AND status = 'accepted'
         )
       ORDER BY l.trophies DESC
       LIMIT 50`,
      [userId]
    );

    return res.json({ leaderboard: result.rows });
  } catch (err) {
    console.error('[Leaderboard] friends error:', err);
    return res.status(500).json({ error: 'Failed to fetch friends leaderboard' });
  }
});

// ─── GET /api/leaderboard/me ──────────────────────────────────────────────────
// Returns the current user's rank + surrounding players
leaderboardRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    const result = await query<Record<string, unknown>>(
      `WITH ranked AS (
         SELECT
           user_id,
           trophies,
           victories,
           win_rate,
           RANK() OVER (ORDER BY trophies DESC) AS rank
         FROM leaderboards
       )
       SELECT rank, trophies, victories, win_rate
       FROM ranked WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not on leaderboard yet' });
    }

    return res.json({ standing: result.rows[0] });
  } catch (err) {
    console.error('[Leaderboard] /me error:', err);
    return res.status(500).json({ error: 'Failed to fetch standing' });
  }
});
