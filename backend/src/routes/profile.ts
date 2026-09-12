import { Router, Request, Response } from 'express';
import { query } from '../db/postgres.js';
import { requireAuth } from '../middleware/auth.js';

export const profileRouter = Router();

// ─── GET /api/profile/:userId ─────────────────────────────────────────────────
profileRouter.get('/:userId', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const [userResult, heroesResult, matchResult, leaderboardResult] = await Promise.all([
      // Base user data
      query<Record<string, unknown>>(
        `SELECT id, username, email, avatar, level, xp, max_xp,
                trophies, highest_trophies, coins, gems, rank_tier,
                wins, losses, is_active, role, created_at, last_login_at
         FROM users WHERE id = $1`,
        [userId]
      ),
      // Unlocked heroes
      query<Record<string, unknown>>(
        `SELECT
           h.slug, h.name, h.class, h.rarity, h.emoji, h.color_hex,
           uh.power_level, uh.trophies AS hero_trophies, uh.mastery_points
         FROM user_heroes uh
         JOIN heroes h ON uh.hero_id = h.id
         WHERE uh.user_id = $1
         ORDER BY uh.trophies DESC`,
        [userId]
      ),
      // Match stats aggregated
      query<Record<string, unknown>>(
        `SELECT
           COUNT(*) AS total_matches,
           SUM(kills) AS total_kills,
           SUM(deaths) AS total_deaths,
           SUM(damage_dealt) AS total_damage,
           AVG(NULLIF(damage_dealt, 0)) AS avg_damage,
           SUM(CASE WHEN mp.team = m.winning_team THEN 1 ELSE 0 END) AS wins,
           COUNT(CASE WHEN is_mvp THEN 1 END) AS mvp_count
         FROM match_players mp
         JOIN matches m ON mp.match_id = m.id
         WHERE mp.user_id = $1`,
        [userId]
      ),
      // Leaderboard standing
      query<Record<string, unknown>>(
        `SELECT global_rank, trophies, victories, win_rate, country_code, season_id
         FROM leaderboards WHERE user_id = $1`,
        [userId]
      ),
    ]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const user = userResult.rows[0];
    const stats = matchResult.rows[0];
    const wins = Number(user.wins);
    const losses = Number(user.losses);
    const totalMatches = wins + losses;
    const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0.0';

    return res.json({
      profile: {
        id:          user.id,
        username:    user.username,
        email:       user.email,
        avatar:      user.avatar,
        level:       user.level,
        xp:          user.xp,
        maxXp:       user.max_xp,
        trophies:    user.trophies,
        highestTrophies: user.highest_trophies,
        coins:       user.coins,
        gems:        user.gems,
        rank:        user.rank_tier,
        createdAt:   user.created_at,
        lastLoginAt: user.last_login_at,
      },
      stats: {
        wins,
        losses,
        totalMatches,
        winRate: parseFloat(winRate),
        kills:       Number(stats?.total_kills || 0),
        deaths:      Number(stats?.total_deaths || 0),
        kd: stats?.total_deaths && Number(stats.total_deaths) > 0
          ? (Number(stats.total_kills) / Number(stats.total_deaths)).toFixed(2)
          : String(stats?.total_kills || 0),
        totalDamage: Number(stats?.total_damage || 0),
        avgDamage:   Math.round(Number(stats?.avg_damage || 0)),
        mvpCount:    Number(stats?.mvp_count || 0),
      },
      heroes:      heroesResult.rows,
      leaderboard: leaderboardResult.rows[0] || null,
    });
  } catch (err) {
    console.error('[Profile] GET error:', err);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─── GET /api/profile/me (self) ───────────────────────────────────────────────
profileRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  req.params.userId = req.user!.userId;
  return res.redirect(307, `/api/profile/${req.user!.userId}`);
});


// ─── PUT /api/profile ─────────────────────────────────────────────────────────
profileRouter.put('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { avatar } = req.body;

  // Only allow changing avatar for now
  const allowedAvatars = ['🔥','⚡','🛡️','❄️','🚀','🌙','👊','🤖','💀','🎯','🌊','🌪️'];
  if (avatar && !allowedAvatars.includes(avatar)) {
    return res.status(400).json({ error: 'Invalid avatar' });
  }

  try {
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (avatar) {
      updates.push(`avatar = $${idx++}`);
      values.push(avatar);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    values.push(userId);
    await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx}`,
      values
    );

    return res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error('[Profile] PUT error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});
