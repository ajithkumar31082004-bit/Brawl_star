import pg, { QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Connection pool — reuses connections efficiently
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                // max pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected pool error:', err.message);
});

/**
 * Execute a parameterized query.
 * Usage: query('SELECT * FROM users WHERE id = $1', [userId])
 */
export async function query<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DB] query executed in ${duration}ms | rows: ${result.rowCount}`);
  }
  return result;
}

/**
 * Run queries inside a transaction.
 * Usage: withTransaction(async (client) => { ... })
 */
export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Test the DB connection on startup */
export async function connectDB(): Promise<void> {
  const client = await pool.connect();
  const result = await client.query('SELECT NOW() AS now');
  client.release();
  console.log(`[PostgreSQL] ✅ Connected — server time: ${result.rows[0].now}`);
}
