import pg from 'pg';

const { Pool } = pg;

// One pool for the whole app. connectionString comes from the environment:
// server/.env locally, the host's config vars when deployed.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Managed Postgres (Render/Neon) requires SSL; local Postgres does not.
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Thin helper so routes read cleanly:  query('SELECT ...', [a, b])
export function query(text, params) {
  return pool.query(text, params);
}
