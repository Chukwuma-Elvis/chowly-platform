// Loads db/schema.sql then db/seed.sql into the database.
//
//   node db/setup.mjs            # uses DATABASE_URL from server/.env (or the shell)
//   node db/setup.mjs --schema   # only schema.sql
//   node db/setup.mjs --seed     # only seed.sql
//
// Shells out to `psql` so the \echo meta-commands in the .sql files still work.
// `psql` must be on your PATH (it ships with PostgreSQL).

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// Minimal .env reader - no dependency. Shell env wins over the file.
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnvFile(join(here, '..', 'server', '.env'));

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set (checked the shell and server/.env).');
  process.exit(1);
}

const only = process.argv[2];
const files = [];
if (only === '--seed') files.push('seed.sql');
else if (only === '--schema') files.push('schema.sql');
else files.push('schema.sql', 'seed.sql');

for (const file of files) {
  console.log(`\n>>> psql -f db/${file}`);
  execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-f', join(here, file)], {
    stdio: 'inherit',
  });
}
console.log('\nDone.');
