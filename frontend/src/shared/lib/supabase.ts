import { createClient } from '@supabase/supabase-js';
import { env } from '@/shared/config';

/**
 * The single Supabase client instance for the application (architecture.md §5,
 * §9). Every Repository (once Repositories exist) calls Supabase exclusively
 * through this client — nothing above the Repository layer imports it.
 *
 * Uses the public anon key only; session handling (persistence, refresh) is
 * left at supabase-js's own default (`localStorage`), per api-design.md §19 —
 * no custom token storage in production.
 *
 * `npm run dev` only: the session storage is `sessionStorage` instead, which
 * the browser scopes per-tab rather than per-origin — so each tab gets an
 * independent session with no extra tooling, letting a developer manually
 * test multiple roles (e.g. admin, agent, customer) simultaneously, one per
 * tab, in the real app UI. Never applied in production: real users expect a
 * normal "open link in new tab" to share their existing session, which
 * `sessionStorage` would break — this is a dev-only testing convenience, not
 * a general session-storage change (session-management review, 2026-08-04).
 *
 * Not yet typed against the database schema (`createClient<Database>`) since
 * no schema/migrations exist yet (database.md's schema hasn't been applied to
 * this project) — add the `Database` generic once `supabase gen types
 * typescript` has something real to generate from.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: env.isDev ? { storage: window.sessionStorage } : undefined,
});
