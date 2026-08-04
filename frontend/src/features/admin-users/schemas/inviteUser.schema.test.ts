import { describe, expect, it } from 'vitest';
import { InviteUserSchema } from './inviteUser.schema';

describe('InviteUserSchema (unit)', () => {
  it('accepts a well-formed invite', () => {
    expect(
      InviteUserSchema.safeParse({ email: 'agent@example.com', fullName: 'Jane Wanjiru', role: 'agent' }).success,
    ).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(
      InviteUserSchema.safeParse({ email: 'not-an-email', fullName: 'Jane Wanjiru', role: 'agent' }).success,
    ).toBe(false);
  });

  it('rejects a too-short full name', () => {
    expect(InviteUserSchema.safeParse({ email: 'a@b.com', fullName: 'J', role: 'agent' }).success).toBe(false);
  });

  it('rejects a missing role', () => {
    expect(InviteUserSchema.safeParse({ email: 'a@b.com', fullName: 'Jane Wanjiru' }).success).toBe(false);
  });

  it('rejects an unknown role', () => {
    expect(
      InviteUserSchema.safeParse({ email: 'a@b.com', fullName: 'Jane Wanjiru', role: 'superuser' }).success,
    ).toBe(false);
  });
});
