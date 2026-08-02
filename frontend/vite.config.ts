import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Sprint 8 bundle investigation (docs/roadmap.md §12) — only active when
    // explicitly requested, never affects a normal dev/test/build run.
    ...(process.env.ANALYZE
      ? [
          visualizer({
            filename: 'dist/stats.json',
            template: 'raw-data',
            gzipSize: true,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  test: {
    // Sprint 2 (Authentication) added the first component/DOM tests
    // (RegisterForm etc.) — jsdom replaced the earlier 'node' environment
    // that sufficed while the only test was a pure utility function.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: {
      // RLS-sensitive integration tests (coding-standards.md §19) always hit
      // the local Supabase stack (`supabase start`), never whatever project
      // .env.local happens to point at — these are Supabase's fixed, public
      // local-dev-only demo keys, identical on every machine, not a secret.
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    },
  },
});
