import pg from 'pg';
import supabaseCa from './prod-ca-2021.crt?raw';
import { env } from './env.server';

let pool: pg.Pool | undefined;

export function db() {
  const url = env('DATABASE_URL');
  if (!url) throw new Error('DATABASE_URL is required');
  const host = new URL(url).hostname;
  const local = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  pool ??= new pg.Pool({
    connectionString: url,
    // One connection per warm serverless instance; Supabase's transaction pooler handles concurrency.
    max: 1,
    ssl: local ? false : { ca: supabaseCa, rejectUnauthorized: true },
    connectionTimeoutMillis: 5000,
  });
  return pool;
}
