interface Env {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly isDev: boolean;
}

function loadEnv(): Env {
  const missing: string[] = [];

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');

  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Copy frontend/.env.example to frontend/.env.local and fill in real values from the ' +
        'Supabase dashboard (Project Settings > API) before starting the app.',
    );
  }

  return { supabaseUrl, supabaseAnonKey, isDev: import.meta.env.DEV };
}

/**
 * Validated application environment configuration. Every required `VITE_`-prefixed
 * variable is checked once, here, when this module is first imported — throws
 * immediately with the names of any missing variables rather than failing later
 * with a confusing error at the point of use.
 *
 * This is the only place in the app that reads `import.meta.env` directly —
 * everything else imports `env` from here (`coding-standards.md` §21).
 */
export const env: Env = loadEnv();
