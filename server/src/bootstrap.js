import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', '..', 'db');

// Strip the psql-only meta-commands (\echo, \gexec) that node-postgres can't run.
const clean = (sql) =>
  sql.split('\n').filter((line) => !/^\s*\\/.test(line)).join('\n');

// On a hosted platform without a shell (Render free tier), load the schema, seed
// and menu images automatically the first time the server starts against an empty
// database. It is a no-op once menu_item exists, so redeploys never touch data.
export async function bootstrapDatabase() {
  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    console.warn('bootstrap: database not reachable yet, skipping —', err.message);
    return;
  }
  try {
    const { rows } = await client.query("SELECT to_regclass('public.menu_item') AS t");
    if (rows[0].t) return; // already set up

    console.log('bootstrap: empty database — loading schema, seed and menu images…');
    for (const file of ['schema.sql', 'seed.sql', 'menu_images.sql']) {
      const full = path.join(DB_DIR, file);
      if (!existsSync(full)) continue;
      await client.query(clean(readFileSync(full, 'utf8')));
      console.log(`bootstrap: applied ${file}`);
    }
    console.log('bootstrap: done.');
  } catch (err) {
    console.error('bootstrap: failed —', err.message);
  } finally {
    client.release();
  }
}
