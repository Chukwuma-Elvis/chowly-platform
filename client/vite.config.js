import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev the Vite server hosts the SPA on :5173 and proxies API calls to the
// Express server on :3000. In production Express serves the built bundle.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist',
  },
});
