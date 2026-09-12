import { Router, Request, Response } from 'express';
import { query, withTransaction } from '../db/postgres.js';
import { requireAuth } from '../middleware/auth.js';
import { cacheDel } from '../db/redis.js';
import { notifyMatchCompleted } from '../services/snsService.js';

export const matchesRouter = Router();

// ─── GET /api/matches/history/:userId ─────────────────────────────────────────
matchesRouter.get('/history/:userId', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req.params;
  const page  = Math.max(1, parseInt(String(req.query.page || '1')));
  const limit = Math.min(50, Math.max(5, parseInt(String(req.query.limit || '20'))));
  const offset = (page - 1) * limit;

  try {
    const [historyResult, countResult] = await Promise.all([
      query<Record<string, unknown>>(
        `SELECT
           m.id AS match_id,
           m.game_mode,
           m.map_name,
           m.winning_team,
           m.duration_seconds,
           m.blue_score,
           m.red_score,
           m.started_at,
           m.ended_at,
           mp.team,
           mp.kills,
           mp.deaths,
           mp.assists,
           mp.damage_dealt,
           mp.score AS player_score,
           mp.trophies_delta,
           mp.xp_gained,
           mp.coins_gained,
           mp.is_mvp,
           h.name AS hero_name,
           h.emoji AS hero_emoji,
           h.slug AS hero_slug,
           (mp.team = m.winning_team) AS won
         FROM match_players mp
         JOIN matches m ON mp.match_id = m.id
         JOIN heroes h ON mp.hero_id = h.id
         WHERE mp.user_id = $1
         ORDER BY m.started_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      query('SELECT COUNT(*) AS total FROM match_players WHERE user_id = $1', [userId]),
    ]);

    return res.json({
      matches: historyResult.rows,
      pagination: {
        page,
        limit,
        total: Number(countResult.rows[0]?.total || 0),
        totalPages: Math.ceil(Number(countResult.rows[0]?.total || 0) / limit),
      },
    });
  } catch (err) {
    console.error('[Matches] history error:', err);
    return res.status(500).json({ error: 'Failed to fetch match history' });
  }
});

// ─── Match result payload type ────────────────────────────────────────────────
interface MatchPlayerResult {
  userId: string;
  heroId: string;
  team: 'blue' | 'red';
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  healingDone: number;
  score: number;        // crystals in gem_grab, kills in TDM, etc.
  isMvp: boolean;
  placement?: number;   // for showdown
}

interface MatchResult {
  roomId: string;
  gameMode: string;
  mapName: string;
  winningTeam: 'blue' | 'red' | 'draw';
  durationSeconds: number;
  blueScore: number;
  redScore: number;
  seasonId?: number;
  players: MatchPlayerResult[];
}

/**
 * Internal route called by the game server to persist match results.
 * Not called directly by the frontend.
 * Requires internal auth header.
 */
matchesRouter.post('/complete', async (req: Request, res: Response) => {
  // Validate internal secret (game server → API server)
  const internalSecret = req.headers['x-internal-secret'];
  if (internalSecret !== process.env.INTERNAL_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const data: MatchResult = req.body;
  if (!data.roomId || !data.players?.length) {
    return res.status(400).json({ error: 'Invalid match data' });
  }

  try {
    const matchId = await withTransaction(async (client) => {
      // 1. Insert match record
      const matchResult = await client.query<{ id: string }>(
        `INSERT INTO matches
           (room_id, game_mode, map_name, winning_team, duration_seconds, blue_score, red_score, season_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id`,
        [data.roomId, data.gameMode, data.mapName, data.winningTeam,
         data.durationSeconds, data.blueScore, data.redScore, data.seasonId || null]
      );
      const matchId = matchResult.rows[0].id;

      // 2. Calculate rewards and insert match_players
      for (const p of data.players) {
        const won = p.team === data.winningTeam;
        const trophiesDelta = won ? 25 : -5;
        const xpGained = won ? 500 + (p.kills * 50) : 150 + (p.kills * 25);
        const coinsGained = won ? 250 : 50;

        await client.query(
          `INSERT INTO match_players
             (match_id, user_id, hero_id, team, kills, deaths, assists,
              damage_dealt, healing_done, score, trophies_delta, xp_gained, coins_gained, is_mvp, placement)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [matchId, p.userId, p.heroId, p.team, p.kills, p.deaths, p.assists,
           p.damageDealt, p.healingDone, p.score, trophiesDelta, xpGained, coinsGained, p.isMvp, p.placement || null]
        );

        // 3. Update user stats (server-authoritative economy)
        await client.query(
          `UPDATE users SET
             trophies     = GREATEST(0, trophies + $1),
             highest_trophies = GREATEST(highest_trophies, trophies + $1),
             xp           = xp + $2,
             coins        = coins + $3,
             wins         = wins + $4,
             losses       = losses + $5,
             updated_at   = NOW()
           WHERE id = $6`,
          [trophiesDelta, xpGained, coinsGained,
           won ? 1 : 0, won ? 0 : 1,
           p.userId]
        );

        // 4. Update leaderboard
        await client.query(
          `UPDATE leaderboards SET
             trophies  = GREATEST(0, trophies + $1),
             victories = victories + $2,
             win_rate  = (
               SELECT ROUND((wins::numeric / NULLIF(wins + losses, 0)) * 100, 2)
               FROM users WHERE id = $3
             ),
             updated_at = NOW()
           WHERE user_id = $3`,
          [trophiesDelta, won ? 1 : 0, p.userId]
        );

        // 5. Log currency transaction
        if (coinsGained > 0) {
          await client.query(
            `INSERT INTO coins_transactions (user_id, currency, amount, balance_after, reason)
             SELECT $1, 'coins', $2, coins, $3 FROM users WHERE id = $1`,
            [p.userId, coinsGained, `match_reward_${won ? 'victory' : 'defeat'}`]
          );
        }
      }

      return matchId;
    });

    // Invalidate leaderboard cache
    for (let i = 1; i <= 5; i++) {
      await cacheDel(`leaderboard:page:${i}`);
    }

    // SNS notification (non-blocking)
    notifyMatchCompleted(matchId, data.winningTeam, data.durationSeconds).catch(() => {});


    return res.status(201).json({
      matchId,
      message: 'Match recorded and rewards distributed',
    });
  } catch (err) {
    console.error('[Matches] complete error:', err);
    return res.status(500).json({ error: 'Failed to record match' });
  }
});
