import pg from 'pg';
import { env } from './env.server';

let pool: pg.Pool | undefined;

export function db() {
  const url = env('DATABASE_URL');
  if (!url) throw new Error('DATABASE_URL is required');
  pool ??= new pg.Pool({
    connectionString: url,
    max: 5,
    ssl: /(?:localhost|127\.0\.0\.1)/.test(url) ? false : { rejectUnauthorized: true },
    connectionTimeoutMillis: 5000,
  });
  return pool;
}
