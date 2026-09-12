import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { connectDB } from './db/postgres.js';
import { connectRedis, redisPublisher, redisSubscriber } from './db/redis.js';
import { loadHeroStats } from './game/HeroStats.js';
import { Matchmaker } from './game/Matchmaker.js';

import { authRouter }        from './routes/auth.js';
import { heroesRouter }      from './routes/heroes.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { profileRouter }     from './routes/profile.js';
import { matchesRouter }     from './routes/matches.js';
import { requireAuth }       from './middleware/auth.js';

const app    = express();
const server = http.createServer(app);
const PORT   = Number(process.env.PORT) || 5000;

// ─── Security & Middleware ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // handled by nginx in production
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            200,
  standardHeaders: true,
  legacyHeaders:  false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,       // Stricter limit for auth endpoints
  standardHeaders: true,
  legacyHeaders:  false,
  message: { error: 'Too many auth attempts, please try again later.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// ─── REST Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',        authRouter);
app.use('/api/heroes',      heroesRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/profile',     requireAuth, profileRouter);
app.use('/api/matches',     matchesRouter);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'battleverse-api',
    uptime: Math.round(process.uptime()),
    timestamp: new Date(),
    version: '2.0.0',
  });
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 20000,
  pingInterval: 10000,
});

// Instantiate matchmaker
const matchmaker = new Matchmaker(io);

// ─── WebSocket Authentication Middleware ──────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    import('jsonwebtoken').then((jwt) => {
      try {
        const payload = jwt.default.verify(
          String(token),
          process.env.JWT_SECRET || 'battleverse_dev_secret_CHANGE_ME'
        ) as { userId: string; username: string; role: string };

        socket.data.userId   = payload.userId;
        socket.data.username = payload.username;
        socket.data.role     = payload.role;
        next();
      } catch {
        next(new Error('Invalid or expired token'));
      }
    }).catch(() => next(new Error('Auth module load failed')));
  } catch {
    next(new Error('Authentication error'));
  }
});

// ─── Socket.IO Event Handlers ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  const { userId, username } = socket.data as { userId: string; username: string };
  console.log(`[Socket.IO] ${username} (${socket.id}) connected`);

  // Check if player has an active live match to reconnect to
  const wasReconnected = matchmaker.handleReconnect(socket.id, userId);
  if (wasReconnected) {
    console.log(`[Socket.IO] 🔄 ${username} reconnected to ongoing match!`);
  }

  // ── Matchmaking ──────────────────────────────────────────────────────────────

  socket.on('matchmaking:enter', ({
    heroSlug,
    gameMode = 'gem_grab',
    trophies = 0,
    region = 'global',
  }: {
    heroSlug: string;
    gameMode?: string;
    trophies?: number;
    region?: string;
  }) => {
    matchmaker.enqueue({
      socketId: socket.id,
      userId,
      username,
      heroSlug: heroSlug || 'blaze',
      trophies: Number(trophies),
      region,
      gameMode,
    });
  });

  socket.on('matchmaking:cancel', () => {
    matchmaker.dequeue(socket.id);
    socket.emit('matchmaking:cancelled');
  });

  // ── Game Input ───────────────────────────────────────────────────────────────

  /**
   * Client sends direction + aim at fixed rate (20 TPS).
   * Server validates movement speed, cooldowns, then simulates bullet.
   */
  socket.on('player:input', (input: {
    dx: number;
    dy: number;
    aimX: number;
    aimY: number;
    firing: boolean;
    usingSuper: boolean;
    sequenceNumber: number;
  }) => {
    matchmaker.receiveInput(socket.id, {
      dx: Number(input.dx) || 0,
      dy: Number(input.dy) || 0,
      aimX: Number(input.aimX) || 0,
      aimY: Number(input.aimY) || 0,
      firing: Boolean(input.firing),
      usingSuper: Boolean(input.usingSuper),
      sequenceNumber: Number(input.sequenceNumber) || 0,
    });
  });

  // ── Disconnect ───────────────────────────────────────────────────────────────

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] ${username} (${socket.id}) disconnected — ${reason}`);
    matchmaker.handleDisconnect(socket.id);
  });
});

// ── Match persistence ────────────────────────────────────────────────────────
matchmaker.on('match:complete', async (data) => {
  // Forward to matches API route for DB persistence
  try {
    const response = await fetch(`http://localhost:${PORT}/api/matches/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_SECRET || 'internal_secret_CHANGE_ME',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      console.error('[Server] Match persist failed:', await response.text());
    }
  } catch (err) {
    console.error('[Server] Match persist error:', err);
  }
});

// ─── Server Startup ───────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  try {
    // 1. Connect to PostgreSQL
    await connectDB();

    // 2. Connect to Redis
    await connectRedis();

    // 3. Attach Redis adapter to Socket.IO (enables multi-server pub/sub)
    io.adapter(createAdapter(redisPublisher, redisSubscriber));
    console.log('[Socket.IO] Redis adapter attached');

    // 4. Load hero stats into memory
    await loadHeroStats();

    // 5. Start matchmaker
    matchmaker.start();

    // 6. Start HTTP server
    server.listen(PORT, () => {
      console.log(`\n🚀 [BATTLEVERSE] Server v2.0 active on port ${PORT}`);
      console.log(`   API:       http://localhost:${PORT}/api`);
      console.log(`   Health:    http://localhost:${PORT}/api/health`);
      console.log(`   WebSocket: ws://localhost:${PORT}\n`);
    });
  } catch (err) {
    console.error('❌ [BATTLEVERSE] Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
