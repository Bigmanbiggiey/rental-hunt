import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor, sortAscending, sortColumn } from './cursor';

describe('cursor (unit)', () => {
  it('round-trips a decoded cursor through encode/decode unchanged', () => {
    const decoded = { sortValue: '2026-07-20T00:00:00.000Z', id: 'abc-123', sort: 'newest' as const };
    expect(decodeCursor(encodeCursor(decoded))).toEqual(decoded);
  });

  it('is opaque base64, never inspected/constructed by callers other than these helpers', () => {
    const cursor = encodeCursor({ sortValue: '55000', id: 'p1', sort: 'price_asc' });
    expect(() => JSON.parse(cursor)).toThrow(); // not raw JSON — proves it's actually encoded
    expect(typeof cursor).toBe('string');
  });

  it('sortColumn maps price sorts to rent_amount and newest to created_at', () => {
    expect(sortColumn('price_asc')).toBe('rent_amount');
    expect(sortColumn('price_desc')).toBe('rent_amount');
    expect(sortColumn('newest')).toBe('created_at');
  });

  it('sortAscending is true only for price_asc', () => {
    expect(sortAscending('price_asc')).toBe(true);
    expect(sortAscending('price_desc')).toBe(false);
    expect(sortAscending('newest')).toBe(false);
  });
});
