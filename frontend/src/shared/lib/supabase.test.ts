import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateClient = vi.fn().mockReturnValue({});
vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

beforeEach(() => {
  vi.resetModules();
  mockCreateClient.mockClear();
});

/**
 * Regression test for the dev-only per-tab session isolation
 * (session-management review, 2026-08-04): `sessionStorage` in
 * `npm run dev` (a developer testing multiple roles across tabs), the
 * unmodified `supabase-js` default (`localStorage`) in production (real
 * users expect "open in new tab" to share their session). Mocks
 * `@/shared/config` directly rather than juggling `import.meta.env` — this
 * module already reads `env.isDev`, not `import.meta.env` itself.
 */
describe('supabase client (unit, mocked createClient)', () => {
  it('uses sessionStorage when env.isDev is true', async () => {
    vi.doMock('@/shared/config', () => ({
      env: { supabaseUrl: 'http://example.test', supabaseAnonKey: 'anon-key', isDev: true },
    }));
    await import('./supabase');

    expect(mockCreateClient).toHaveBeenCalledWith(
      'http://example.test',
      'anon-key',
      expect.objectContaining({ auth: { storage: window.sessionStorage } }),
    );
  });

  it('leaves auth storage at the supabase-js default (localStorage) when env.isDev is false', async () => {
    vi.doMock('@/shared/config', () => ({
      env: { supabaseUrl: 'http://example.test', supabaseAnonKey: 'anon-key', isDev: false },
    }));
    await import('./supabase');

    expect(mockCreateClient).toHaveBeenCalledWith(
      'http://example.test',
      'anon-key',
      expect.objectContaining({ auth: undefined }),
    );
  });
});
