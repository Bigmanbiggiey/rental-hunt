import { describe, expect, it } from 'vitest';
import { UpdateProfileSchema } from './updateProfile.schema';

describe('UpdateProfileSchema (unit, CUST-003)', () => {
  it('accepts a valid full name and E.164 phone number', () => {
    const result = UpdateProfileSchema.safeParse({
      fullName: 'Jane Wanjiru',
      phone: '+254712345678',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a name shorter than 2 characters', () => {
    const result = UpdateProfileSchema.safeParse({ fullName: 'J', phone: '+254712345678' });
    expect(result.success).toBe(false);
  });

  it('rejects a phone number not in international format', () => {
    const result = UpdateProfileSchema.safeParse({ fullName: 'Jane Wanjiru', phone: '0712345678' });
    expect(result.success).toBe(false);
  });
});
