import 'dotenv/config';
import app, { ensureReady } from './app.js';

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Chowly API on http://localhost:${port}`));

// Kick off the first-boot database load now rather than on the first request.
ensureReady();
