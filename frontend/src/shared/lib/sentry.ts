import * as Sentry from '@sentry/react';

/**
 * Sprint 10 (coding-standards.md §22's already-documented "swap the
 * transport behind the same interface" plan) — the only file that imports
 * `@sentry/react`. Called once at app startup (`main.tsx`), before
 * anything else renders, so early errors are still captured.
 *
 * A no-op when `VITE_SENTRY_DSN` is unset (local dev, or before the
 * developer has created a Sentry project) — `Sentry.init()` with an empty
 * `dsn` disables the SDK entirely rather than erroring, so this is safe to
 * call unconditionally.
 *
 * Deliberately minimal: no BrowserTracing/Replay integrations (both add
 * meaningful bundle weight for capability this MVP doesn't need yet) — just
 * error capture, matching `logger.ts`'s existing scope.
 */
export function initSentry(): void {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN,
  });
}

export { Sentry };
