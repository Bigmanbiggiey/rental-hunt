/**
 * `javascript:`/`data:`/`vbscript:` URIs pass `new URL()`/Zod's `.url()`
 * (they're syntactically valid) but execute as script when used as an
 * `href`/`src` — this is the actual security boundary for any user-supplied
 * URL this app renders as a link or image (found via the Sprint 10 security
 * review, agency social links). Used both at the Zod-validation boundary and
 * defensively at the render sink, since client-side validation alone can be
 * bypassed by a direct API call.
 */
export function isHttpUrl(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
