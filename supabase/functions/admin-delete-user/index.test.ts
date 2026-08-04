import { assertEquals } from 'jsr:@std/assert@1';
import { hasBlockingActivity, validateDeleteRequest } from './index.ts';

Deno.test('validateDeleteRequest - accepts a real userId different from the caller', () => {
  const result = validateDeleteRequest({ userId: 'user-123' }, 'admin-999');
  assertEquals(result.ok, true);
  if (result.ok) assertEquals(result.userId, 'user-123');
});

Deno.test('validateDeleteRequest - rejects a missing userId', () => {
  assertEquals(validateDeleteRequest({}, 'admin-999').ok, false);
});

Deno.test('validateDeleteRequest - rejects an admin deleting their own account', () => {
  const result = validateDeleteRequest({ userId: 'admin-999' }, 'admin-999');
  assertEquals(result.ok, false);
});

const EMPTY = { properties: 0, agentBookings: 0, customerBookings: 0, reviews: 0, verifiedProperties: 0 };

Deno.test('hasBlockingActivity - false when every count is zero', () => {
  assertEquals(hasBlockingActivity(EMPTY), false);
});

Deno.test('hasBlockingActivity - true when any single count is nonzero', () => {
  assertEquals(hasBlockingActivity({ ...EMPTY, properties: 1 }), true);
  assertEquals(hasBlockingActivity({ ...EMPTY, reviews: 3 }), true);
});

Deno.test('hasBlockingActivity - true when only verifiedProperties is nonzero', () => {
  // Regression case for a real bug found via manual testing, 2026-08-04:
  // properties.verified_by is `on delete set null`, not `restrict`, but
  // enforce_verification_authority()'s trigger still blocks even a
  // cascaded SET NULL write to it — a profile recorded as a verifier on
  // any property must count as blocked too, not just agent/customer/
  // reviewer activity.
  assertEquals(hasBlockingActivity({ ...EMPTY, verifiedProperties: 7 }), true);
});
