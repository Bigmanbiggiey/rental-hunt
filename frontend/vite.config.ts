import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  test: {
    // 'node' is sufficient for today's only test (a pure utility function).
    // Switch to 'jsdom' (and add that dependency) once the first component
    // test arrives — no earlier, per CLAUDE.md §2's "avoid unnecessary complexity".
    environment: 'node',
  },
});
