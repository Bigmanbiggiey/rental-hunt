import { Sentry } from './sentry';

/**
 * coding-standards.md §22 — the single logging call site in the codebase.
 * `console.warn`/`console.error` are never called directly elsewhere
 * (enforced by the `no-console` ESLint rule); this exists so the transport
 * can change without touching any call site — the transport changed in
 * Sprint 10: `error()` now also reports to Sentry (a no-op locally, where
 * `VITE_SENTRY_DSN` is unset — see `sentry.ts`).
 *
 * `meta` is for debugging context (route, action, error code) — never PII
 * (no email, no full profile, no booking notes), per §22's "Error reporting"
 * row.
 */
export const logger = {
  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[Rental Hunt KE] ${message}`, meta ?? {});
  },
  error(message: string, meta?: Record<string, unknown>): void {
    console.error(`[Rental Hunt KE] ${message}`, meta ?? {});
    Sentry.captureMessage(message, { level: 'error', extra: meta });
  },
};
