import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

import { query } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const app = express();

app.set('trust proxy', 1); // Render terminates TLS in front of us
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(express.json());

// ---------------------------------------------------------------------------
//  API
// ---------------------------------------------------------------------------
const api = express.Router();

api.get('/health', async (req, res) => {
  try {
    const { rows } = await query('SELECT now() AS db_time');
    res.json({ status: 'ok', db_time: rows[0].db_time });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/api', api);

// ---------------------------------------------------------------------------
//  Static client (production only - in dev the Vite server hosts the SPA)
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

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Chowly API on http://localhost:${port}`));
