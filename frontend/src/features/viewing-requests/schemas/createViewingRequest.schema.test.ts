import { describe, expect, it } from 'vitest';
import { CreateViewingRequestSchema } from './createViewingRequest.schema';

function tomorrow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function yesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

describe('CreateViewingRequestSchema (unit)', () => {
  it('accepts a valid future date, time, and optional notes', () => {
    const result = CreateViewingRequestSchema.safeParse({
      requestedDate: tomorrow(),
      requestedTime: '14:00',
      notes: 'Available after 1pm.',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.notes).toBe('Available after 1pm.');
  });

  it('rejects a past date (VIEW-002)', () => {
    const result = CreateViewingRequestSchema.safeParse({
      requestedDate: yesterday(),
      requestedTime: '14:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed time', () => {
    const result = CreateViewingRequestSchema.safeParse({
      requestedDate: tomorrow(),
      requestedTime: '25:99',
    });
    expect(result.success).toBe(false);
  });

  it('rejects notes over 500 characters', () => {
    const result = CreateViewingRequestSchema.safeParse({
      requestedDate: tomorrow(),
      requestedTime: '14:00',
      notes: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('transforms blank/whitespace-only notes to undefined rather than an empty string', () => {
    const result = CreateViewingRequestSchema.safeParse({
      requestedDate: tomorrow(),
      requestedTime: '14:00',
      notes: '   ',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.notes).toBeUndefined();
  });

  it('allows notes to be omitted entirely', () => {
    const result = CreateViewingRequestSchema.safeParse({
      requestedDate: tomorrow(),
      requestedTime: '14:00',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.notes).toBeUndefined();
  });
});
