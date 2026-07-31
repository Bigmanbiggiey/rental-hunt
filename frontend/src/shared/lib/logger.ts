/**
 * coding-standards.md §22 — the single logging call site in the codebase.
 * `console.warn`/`console.error` are never called directly elsewhere
 * (enforced by the `no-console` ESLint rule); this exists so the transport
 * can change (e.g. a future Sentry integration, per §22's "Future monitoring
 * integrations" row) without touching any call site.
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
  },
};
