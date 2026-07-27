import { describe, expect, it } from 'vitest';
import { parsePropertyFilters } from './propertyFilters.schema';

describe('parsePropertyFilters (unit) — lenient URL-filter parsing', () => {
  it('parses a fully valid filter set unchanged', () => {
    const filters = parsePropertyFilters({
      q: 'Kilimani',
      county: '11111111-1111-4111-8111-111111111111',
      bedroomsMin: '2',
      minPrice: '10000',
      sort: 'price_asc',
    });
    expect(filters).toMatchObject({
      q: 'Kilimani',
      county: '11111111-1111-4111-8111-111111111111',
      bedroomsMin: 2,
      minPrice: 10000,
      sort: 'price_asc',
    });
  });

  it('never throws on malformed input — DISC-002/006 require a degrade, never a crash', () => {
    expect(() =>
      parsePropertyFilters({
        county: 'not-a-uuid',
        bedroomsMin: 'abc',
        minPrice: '-5',
        sort: 'literally_invalid',
      }),
    ).not.toThrow();
  });

  it('falls back malformed numeric/uuid/enum values to undefined rather than rejecting the whole request', () => {
    const filters = parsePropertyFilters({
      county: 'not-a-uuid',
      bedroomsMin: 'abc',
      sort: 'literally_invalid' as never,
    });
    expect(filters.county).toBeUndefined();
    expect(filters.bedroomsMin).toBeUndefined();
    expect(filters.sort).toBeUndefined();
  });

  it('coerces a negative price/bedrooms to undefined (min(0) constraint)', () => {
    const filters = parsePropertyFilters({ minPrice: '-100', bedroomsMin: '-1' });
    expect(filters.minPrice).toBeUndefined();
    expect(filters.bedroomsMin).toBeUndefined();
  });

  it('drops an amenities entry that is not a valid uuid rather than failing the whole array', () => {
    const filters = parsePropertyFilters({ amenities: ['not-a-uuid'] });
    expect(filters.amenities).toBeUndefined();
  });

  it('treats an empty amenities array as "no amenities filter" (undefined, not [])', () => {
    const filters = parsePropertyFilters({ amenities: [] });
    expect(filters.amenities).toBeUndefined();
  });

  it('leaves every field undefined when no params are present at all', () => {
    const filters = parsePropertyFilters({});
    expect(filters).toEqual({
      q: undefined,
      county: undefined,
      propertyType: undefined,
      bedroomsMin: undefined,
      bedroomsMax: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      amenities: undefined,
      sort: undefined,
    });
  });
});
