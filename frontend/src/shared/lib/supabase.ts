import { createClient } from '@supabase/supabase-js';
import { env } from '@/shared/config';

/**
 * The single Supabase client instance for the application (architecture.md §5,
 * §9). Every Repository (once Repositories exist) calls Supabase exclusively
 * through this client — nothing above the Repository layer imports it.
 *
 * Uses the public anon key only; session handling (persistence, refresh) is
 * left at supabase-js's own default, per api-design.md §19 — no custom token
 * storage is introduced here.
 *
 * Not yet typed against the database schema (`createClient<Database>`) since
 * no schema/migrations exist yet (database.md's schema hasn't been applied to
 * this project) — add the `Database` generic once `supabase gen types
 * typescript` has something real to generate from.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
