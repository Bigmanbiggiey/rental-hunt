import { describe, expect, it } from 'vitest';
import { VerificationActionSchema } from './verificationAction.schema';

describe('VerificationActionSchema (unit)', () => {
  it('accepts an approval with no reason', () => {
    const result = VerificationActionSchema.safeParse({ status: 'verified' });
    expect(result.success).toBe(true);
  });

  it('rejects a rejection with no reason', () => {
    const result = VerificationActionSchema.safeParse({ status: 'rejected' });
    expect(result.success).toBe(false);
  });

  it('rejects a rejection with only whitespace as the reason', () => {
    const result = VerificationActionSchema.safeParse({ status: 'rejected', reason: '   ' });
    expect(result.success).toBe(false);
  });

  it('accepts a rejection with a real reason', () => {
    const result = VerificationActionSchema.safeParse({
      status: 'rejected',
      reason: 'Photos do not match the description.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown status value', () => {
    const result = VerificationActionSchema.safeParse({ status: 'bogus' });
    expect(result.success).toBe(false);
  });
});
