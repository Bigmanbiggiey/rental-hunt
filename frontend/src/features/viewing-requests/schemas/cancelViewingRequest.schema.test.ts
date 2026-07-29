import { describe, expect, it } from 'vitest';
import { CancelViewingRequestSchema } from './cancelViewingRequest.schema';

describe('CancelViewingRequestSchema (unit)', () => {
  it('allows an omitted reason', () => {
    const result = CancelViewingRequestSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.reason).toBeUndefined();
  });

  it('accepts a real reason', () => {
    const result = CancelViewingRequestSchema.safeParse({ reason: 'Change of plans.' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.reason).toBe('Change of plans.');
  });

  it('transforms blank/whitespace-only reason to undefined', () => {
    const result = CancelViewingRequestSchema.safeParse({ reason: '   ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.reason).toBeUndefined();
  });

  it('rejects a reason over 500 characters', () => {
    const result = CancelViewingRequestSchema.safeParse({ reason: 'x'.repeat(501) });
    expect(result.success).toBe(false);
  });
});
