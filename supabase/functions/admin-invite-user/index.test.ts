import { assertEquals } from 'jsr:@std/assert@1';
import { validateInvite } from './index.ts';

Deno.test('validateInvite - accepts a well-formed invite', () => {
  const result = validateInvite({ email: 'Agent@Example.com', fullName: 'Jane Wanjiru', role: 'agent' });
  assertEquals(result.ok, true);
  if (result.ok) {
    // lowercased/trimmed — matches how auth.users itself normalizes email.
    assertEquals(result.value.email, 'agent@example.com');
    assertEquals(result.value.role, 'agent');
  }
});

Deno.test('validateInvite - defaults role to customer when omitted', () => {
  const result = validateInvite({ email: 'a@b.com', fullName: 'A B' });
  assertEquals(result.ok, true);
  if (result.ok) assertEquals(result.value.role, 'customer');
});

Deno.test('validateInvite - rejects a missing/invalid email', () => {
  assertEquals(validateInvite({ fullName: 'A B', role: 'agent' }).ok, false);
  assertEquals(validateInvite({ email: 'not-an-email', fullName: 'A B' }).ok, false);
});

Deno.test('validateInvite - rejects a missing or too-short full name', () => {
  assertEquals(validateInvite({ email: 'a@b.com' }).ok, false);
  assertEquals(validateInvite({ email: 'a@b.com', fullName: 'A' }).ok, false);
});

Deno.test('validateInvite - rejects an unknown role', () => {
  const result = validateInvite({ email: 'a@b.com', fullName: 'A B', role: 'superuser' });
  assertEquals(result.ok, false);
});
