import pg from 'pg';

const { Pool } = pg;

// Find the Postgres connection string. Locally it's DATABASE_URL (server/.env).
// Managed hosts vary: Render sets DATABASE_URL; Vercel's Neon integration sets a
// whole family of vars and, depending on the prefix chosen, the pooled URL can
// be POSTGRES_URL, DATABASE_URL_POSTGRES_URL, etc. So: take an explicit name if
// present, otherwise scan the environment for the best postgres:// URL.
function resolveConnectionString() {
  const explicit =
    process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
  if (explicit) return explicit;

  const urls = Object.entries(process.env).filter(
    ([, v]) => typeof v === 'string' && /^postgres(ql)?:\/\/[^/]+\//i.test(v),
  );
  const score = ([key]) => {
    let s = 0;
    if (/NON_?POOLING|UNPOOLED/i.test(key)) s -= 4; // direct connection — bad for serverless
    if (/NO_?SSL/i.test(key)) s -= 6;               // no TLS
    if (/PRISMA/i.test(key)) s -= 1;                // works, but carries extra params
    if (/(^|_)(POSTGRES_URL|DATABASE_URL)$/i.test(key)) s += 3;
    return s;
  };
  urls.sort((a, b) => score(b) - score(a));
  return urls[0]?.[1];
}

export const connectionString = resolveConnectionString();

if (!connectionString) {
  console.warn('db: no Postgres connection string found in the environment.');
}

// Local Postgres does not do TLS; every managed host does and requires it.
const isLocal =
  !connectionString || /@(localhost|127\.0\.0\.1|\[::1\]):/i.test(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

// Thin helper so routes read cleanly:  query('SELECT ...', [a, b])
export function query(text, params) {
  return pool.query(text, params);
}
