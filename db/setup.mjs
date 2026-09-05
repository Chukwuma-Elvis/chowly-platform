// Loads db/schema.sql then db/seed.sql (then db/menu_images.sql if present).
//
//   node db/setup.mjs            # schema + seed + menu images
//   node db/setup.mjs --schema   # only schema.sql
//   node db/setup.mjs --seed     # only seed.sql
//   node db/setup.mjs --images   # only menu_images.sql
//
// Uses the `pg` driver (no external `psql` needed), so it runs the same on a
// laptop and in a hosted shell. Reads DATABASE_URL from the shell or server/.env.
// The psql-only meta-commands (\echo, \gexec) in the .sql files are stripped
// before the script is sent - they are just progress noise.

import pg from 'pg';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnvFile(join(here, '..', 'server', '.env'));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set (checked the shell and server/.env).');
  process.exit(1);
}

const only = process.argv[2];
let files;
if (only === '--seed') files = ['seed.sql'];
else if (only === '--schema') files = ['schema.sql'];
else if (only === '--images') files = ['menu_images.sql'];
else files = ['schema.sql', 'seed.sql', 'menu_images.sql'];

// menu_images.sql is optional - skip it silently if it was deleted.
files = files.filter((f) => f !== 'menu_images.sql' || existsSync(join(here, f)));

function stripMetaCommands(sql) {
  return sql
    .split('\n')
    .filter((line) => !/^\s*\\/.test(line)) // drop \echo, \gexec, ...
    .join('\n');
}

const client = new pg.Client({
  connectionString,
  ssl: /\bsslmode=require\b/.test(connectionString) || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

await client.connect();
try {
  for (const file of files) {
    process.stdout.write(`>>> ${file} ... `);
    await client.query(stripMetaCommands(readFileSync(join(here, file), 'utf8')));
    console.log('ok');
  }
  console.log('Done.');
} finally {
  await client.end();
}
