import { describe, expect, it } from 'vitest';
import { RescheduleViewingRequestSchema } from './rescheduleViewingRequest.schema';

describe('RescheduleViewingRequestSchema (unit)', () => {
  it('accepts a future date with a valid time', () => {
    const result = RescheduleViewingRequestSchema.safeParse({
      requestedDate: '2099-01-01',
      requestedTime: '14:00',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a past date', () => {
    const result = RescheduleViewingRequestSchema.safeParse({
      requestedDate: '2000-01-01',
      requestedTime: '14:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid time format', () => {
    const result = RescheduleViewingRequestSchema.safeParse({
      requestedDate: '2099-01-01',
      requestedTime: '25:00',
    });
    expect(result.success).toBe(false);
  });
});
