import pg from 'pg';

const { Pool } = pg;

// The connection string comes from the environment: server/.env locally, the
// host's config vars when deployed. Vercel's Neon integration may inject it as
// POSTGRES_URL rather than DATABASE_URL, so accept either.
export const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

// One pool for the whole app.
export const pool = new Pool({
  connectionString,
  // Managed Postgres (Render/Neon) requires SSL; local Postgres does not.
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Thin helper so routes read cleanly:  query('SELECT ...', [a, b])
export function query(text, params) {
  return pool.query(text, params);
}
