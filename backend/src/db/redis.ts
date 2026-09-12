import { Redis } from 'ioredis';
import dotenv from 'dotenv';


dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Primary client — for general reads/writes
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

// Publisher — for Socket.IO pub/sub adapter
export const redisPublisher = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Subscriber — for Socket.IO pub/sub adapter
export const redisSubscriber = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => console.log('[Redis] ✅ Connected'));
redis.on('error', (err: Error) => console.error('[Redis] ❌ Error:', err.message));

export async function connectRedis(): Promise<void> {
  await Promise.all([
    redis.connect(),
    redisPublisher.connect(),
    redisSubscriber.connect(),
  ]);
  console.log('[Redis] ✅ All clients connected');
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Set a value with optional TTL in seconds */
export const cacheSet = (key: string, value: unknown, ttlSeconds?: number) => {
  const serialized = JSON.stringify(value);
  if (ttlSeconds) return redis.setex(key, ttlSeconds, serialized);
  return redis.set(key, serialized);
};

/** Get and deserialize a cached value */
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const raw = await redis.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
};

/** Delete a cache key */
export const cacheDel = (key: string) => redis.del(key);

// ─── Key helpers (consistent naming) ─────────────────────────────────────────
export const CACHE_KEYS = {
  leaderboard: (page: number) => `leaderboard:page:${page}`,
  userSession: (userId: string) => `session:${userId}`,
  matchmakingQueue: 'matchmaking:queue',
  roomState: (roomId: string) => `room:${roomId}:state`,
  heroStats: 'cache:heroes:all',
};
