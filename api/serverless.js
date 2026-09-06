// Vercel serverless entry - the whole Express app behind one function.
// vercel.json rewrites /api/* here; the SPA is served from the CDN.
import app from '../server/src/app.js';

export default function handler(req, res) {
  // Depending on how Vercel routes the rewrite, the function may see the path
  // with or without the /api prefix. Express mounts everything under /api.
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  return app(req, res);
}
