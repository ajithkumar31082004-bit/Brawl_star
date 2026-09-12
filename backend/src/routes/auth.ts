import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { query, withTransaction } from '../db/postgres.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import { notifyUserRegistration } from '../services/snsService.js';

export const authRouter = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────
const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Helper: build user response ──────────────────────────────────────────────
function buildUserResponse(user: Record<string, unknown>) {
  return {
    id:       user.id,
    username: user.username,
    email:    user.email,
    avatar:   user.avatar,
    level:    user.level,
    xp:       user.xp,
    maxXp:    user.max_xp,
    trophies: user.trophies,
    coins:    user.coins,
    gems:     user.gems,
    rank:     user.rank_tier,
    wins:     user.wins,
    losses:   user.losses,
    matches:  Number(user.wins) + Number(user.losses),
    role:     user.role,
  };
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
authRouter.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { username, email, password } = parsed.data;

  try {
    // Check for existing user
    const existing = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email or username already taken' });
    }

    // Hash password with bcrypt (cost factor 12)
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user + initial leaderboard entry in a single transaction
    const result = await withTransaction(async (client) => {
      const userResult = await client.query<Record<string, unknown>>(
        `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [username, email, passwordHash]
      );
      const user = userResult.rows[0];

      // Add to leaderboard
      await client.query(
        `INSERT INTO leaderboards (user_id, global_rank, trophies, victories)
         VALUES ($1, (SELECT COALESCE(MAX(global_rank), 0) + 1 FROM leaderboards), 0, 0)`,
        [user.id]
      );

      // Unlock default hero (BLAZE) for new player
      await client.query(
        `INSERT INTO user_heroes (user_id, hero_id)
         SELECT $1, id FROM heroes WHERE is_default = TRUE
         ON CONFLICT DO NOTHING`,
        [user.id]
      );

      return user;
    });

    // Issue tokens
    const accessToken = signAccessToken({
      userId: String(result.id),
      username: String(result.username),
      role: String(result.role),
    });
    const refreshToken = signRefreshToken(String(result.id));

    // Store refresh token hash in DB (never store raw token)
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
      [result.id, tokenHash, req.ip, req.headers['user-agent'] || null]
    );

    // Fire SNS notification (non-blocking)
    notifyUserRegistration(String(result.username), email).catch(() => {});

    return res.status(201).json({
      message: 'Account created successfully!',
      accessToken,
      refreshToken,
      user: buildUserResponse(result),
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
authRouter.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { email, password } = parsed.data;

  try {
    const result = await query<Record<string, unknown>>(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );

    if (result.rows.length === 0) {
      // Constant-time response to prevent user enumeration
      await bcrypt.compare(password, '$2a$12$invalidhashfortimingattackprevention');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, String(user.password_hash));
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // Issue tokens
    const accessToken = signAccessToken({
      userId: String(user.id),
      username: String(user.username),
      role: String(user.role),
    });
    const refreshToken = signRefreshToken(String(user.id));

    // Store refresh token hash
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
      [user.id, tokenHash, req.ip, req.headers['user-agent'] || null]
    );

    return res.json({
      accessToken,
      refreshToken,
      user: buildUserResponse(user),
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const { userId } = verifyRefreshToken(refreshToken);

    // Verify token exists in DB (rotation check)
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const tokenResult = await query(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1 AND user_id = $2 AND expires_at > NOW()`,
      [tokenHash, userId]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Fetch current user
    const userResult = await query<Record<string, unknown>>(
      'SELECT * FROM users WHERE id = $1 AND is_active = TRUE',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or banned' });
    }

    const user = userResult.rows[0];

    // Rotate: delete old token, issue new pair
    await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);

    const newAccessToken = signAccessToken({
      userId: String(user.id),
      username: String(user.username),
      role: String(user.role),
    });
    const newRefreshToken = signRefreshToken(String(user.id));
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, newHash]
    );

    return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error('[Auth] Refresh error:', err);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
authRouter.post('/logout', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]).catch(() => {});
  }
  return res.json({ message: 'Logged out successfully' });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Validate token and return current user data
authRouter.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Token verification is done via requireAuth middleware in the caller
  // But here we also allow direct use — re-verify inline
  try {
    const jwt = await import('jsonwebtoken');
    const token = authHeader.slice(7);
    const payload = jwt.default.verify(token, process.env.JWT_SECRET || 'battleverse_dev_secret_CHANGE_ME') as { userId: string };

    const result = await query<Record<string, unknown>>(
      'SELECT * FROM users WHERE id = $1 AND is_active = TRUE',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: buildUserResponse(result.rows[0]) });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});
