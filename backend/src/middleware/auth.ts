import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'battleverse_dev_secret_CHANGE_ME';

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

/** Extend Express Request to carry authenticated user */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware: verify JWT access token.
 * Attaches decoded payload to req.user.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
}

/**
 * Middleware: require admin role.
 * Must be used AFTER requireAuth.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

/** Generate a short-lived access token (15 min) */
export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: Number(process.env.ACCESS_TOKEN_TTL) || 900, // 15 minutes
  });
}

/** Generate a long-lived refresh token (7 days) */
export function signRefreshToken(userId: string): string {
  const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';
  return jwt.sign({ userId }, REFRESH_SECRET, {
    expiresIn: Number(process.env.REFRESH_TOKEN_TTL) || 604800, // 7 days
  });
}

/** Verify a refresh token and return the userId */
export function verifyRefreshToken(token: string): { userId: string } {
  const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';
  return jwt.verify(token, REFRESH_SECRET) as { userId: string };
}
