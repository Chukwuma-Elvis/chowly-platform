import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

import { pool, query } from './db.js';
import { bootstrapDatabase } from './bootstrap.js';
import sessionRoutes from './routes/session.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const app = express();

// Run the first-boot database load at most once. index.js calls it eagerly on a
// long-lived host; on serverless (Vercel) the middleware below awaits it on the
// first request so the schema is in place before anything queries it.
let ready;
export function ensureReady() {
  if (!ready) ready = bootstrapDatabase().catch((err) => console.error('bootstrap:', err));
  return ready;
}

app.set('trust proxy', 1); // TLS is terminated by the platform in front of us
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(express.json());

// Liveness check for the host - deliberately does NOT touch the database.
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res, next) => { ensureReady().then(() => next(), () => next()); });

const PgStore = connectPgSimple(session);
app.use(session({
  store: new PgStore({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'chowly-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 12,
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
  },
}));

// ---------------------------------------------------------------------------
//  API
// ---------------------------------------------------------------------------
const api = express.Router();

api.get('/health/db', async (req, res) => {
  try {
    const { rows } = await query('SELECT now() AS db_time');
    res.json({ status: 'ok', db_time: rows[0].db_time });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

api.use(sessionRoutes);
api.use(menuRoutes);
api.use(orderRoutes);

app.use('/api', api);

// ---------------------------------------------------------------------------
//  Static client - only when this process also serves the SPA (Render, local
//  production). On Vercel the CDN serves client/dist and this block is skipped
//  because the folder isn't bundled with the function.
// ---------------------------------------------------------------------------
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (isProd && existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ---------------------------------------------------------------------------
//  Errors
// ---------------------------------------------------------------------------
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

export default app;
