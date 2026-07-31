import { describe, expect, it } from 'vitest';
import { AdminUpdateUserSchema } from './adminUpdateUser.schema';

describe('AdminUpdateUserSchema (unit)', () => {
  it('accepts a role-only update', () => {
    expect(AdminUpdateUserSchema.safeParse({ role: 'agent' }).success).toBe(true);
  });

  it('accepts an isActive-only update', () => {
    expect(AdminUpdateUserSchema.safeParse({ isActive: false }).success).toBe(true);
  });

  it('rejects an empty update (neither field provided)', () => {
    expect(AdminUpdateUserSchema.safeParse({}).success).toBe(false);
  });

  it('rejects an unknown role value', () => {
    expect(AdminUpdateUserSchema.safeParse({ role: 'superuser' }).success).toBe(false);
  });
});
