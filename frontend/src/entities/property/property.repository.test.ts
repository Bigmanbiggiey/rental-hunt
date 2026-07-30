import { describe, expect, it, vi } from 'vitest';

/**
 * `propertyRepository.list()`'s query is a long, deliberately data-driven
 * chain (composable filters, an amenities RPC, cursor `.or()` predicates) —
 * faithfully faking that chain risks exactly the "mock that might silently
 * do nothing" failure mode this project has already hit twice with
 * `eslint-plugin-boundaries` (ADR-021/022). `list()`/`listFeatured()`'s real
 * behavior — embeds, cursor pagination, amenities AND-filtering, RLS
 * guest-visibility — is proven against the real local Supabase stack instead
 * (`property.rls.test.ts`, `pages/PropertiesPage.test.tsx`), which is more
 * reliable evidence than a mock could give. This file covers only what a
 * fake client is genuinely good for: forcing an error condition that's
 * awkward to trigger for real, matching `profile.repository.test.ts`'s
 * own `getById` not-found case.
 */
const mockReturns = vi.fn();
const mockSingle = vi.fn();
const mockLimit = vi.fn(() => ({ returns: mockReturns }));
const mockOrder = vi.fn(() => ({ limit: mockLimit }));
// getBySlug's chain ends on .eq().single(); list/listFeatured's on
// .eq().order()... — both hops need to be available on the same mock.
const mockEq = vi.fn(() => ({ order: mockOrder, single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));

// archive()/updateAvailability()'s chain: .update().eq().select().single().
// A separate, narrower mock from the read-path above — mirrors
// profile.repository.test.ts's getById/update split.
const mockUpdateSingle = vi.fn();
const mockUpdateSelect = vi.fn(() => ({ single: mockUpdateSingle }));
const mockUpdateEq = vi.fn(() => ({ select: mockUpdateSelect }));
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

const mockRpc = vi.fn();

const mockFrom = vi.fn(() => ({ select: mockSelect, update: mockUpdate }));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}));

const { propertyRepository } = await import('./property.repository');

describe('propertyRepository.listFeatured (unit, fake Supabase client)', () => {
  it('normalizes a database error via the shared error mapper', async () => {
    mockReturns.mockResolvedValueOnce({
      data: null,
      error: { code: '57014', message: 'statement timeout', details: '', hint: '' },
    });

    await expect(propertyRepository.listFeatured()).rejects.toMatchObject({ code: 'DATABASE_ERROR' });
  });

  it('returns an empty array (not an error) when no properties are featured', async () => {
    mockReturns.mockResolvedValueOnce({ data: [], error: null });

    const result = await propertyRepository.listFeatured();
    expect(result).toEqual([]);
    expect(mockFrom).toHaveBeenCalledWith('properties');
    expect(mockEq).toHaveBeenCalledWith('is_featured', true);
  });
});

describe('propertyRepository.getBySlug (unit, fake Supabase client)', () => {
  it('normalizes a "no rows" error to PROPERTY_NOT_FOUND', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'no rows', details: '', hint: '' },
    });

    await expect(propertyRepository.getBySlug('missing-slug')).rejects.toMatchObject({
      code: 'PROPERTY_NOT_FOUND',
    });
  });
});

const MINIMAL_ROW = {
  id: 'p1',
  slug: 'test-property',
  title: 'Test Property',
  description: 'A test property.',
  agency_id: 'agency-1',
  agent_id: 'agent-1',
  property_type_id: 'type-1',
  county_id: 'county-1',
  location_id: 'location-1',
  latitude: -1.29,
  longitude: 36.78,
  bedrooms: 2,
  bathrooms: 2,
  rent_amount: 50000,
  deposit_amount: 50000,
  currency: 'KES',
  availability_status: 'available' as const,
  verification_status: 'verified' as const,
  last_verified_at: null,
  is_featured: false,
  is_archived: false,
  view_count: 0,
  created_at: '2026-07-29T00:00:00.000Z',
  updated_at: '2026-07-29T00:00:00.000Z',
  property_type: null,
  county: null,
  location: null,
  images: [],
  amenities: [],
  agent: null,
};

describe('propertyRepository.archive (unit, fake Supabase client)', () => {
  it('sets is_archived and maps the returned row', async () => {
    mockUpdateSingle.mockResolvedValueOnce({ data: { ...MINIMAL_ROW, is_archived: true }, error: null });

    const result = await propertyRepository.archive('p1');

    expect(mockUpdate).toHaveBeenCalledWith({ is_archived: true });
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'p1');
    expect(result.isArchived).toBe(true);
  });

  it('un-archives when called with archived: false', async () => {
    mockUpdateSingle.mockResolvedValueOnce({ data: { ...MINIMAL_ROW, is_archived: false }, error: null });

    await propertyRepository.archive('p1', false);

    expect(mockUpdate).toHaveBeenCalledWith({ is_archived: false });
  });

  it('normalizes a "no rows" error to PROPERTY_NOT_FOUND', async () => {
    mockUpdateSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'no rows', details: '', hint: '' },
    });

    await expect(propertyRepository.archive('missing')).rejects.toMatchObject({
      code: 'PROPERTY_NOT_FOUND',
    });
  });
});

describe('propertyRepository.updateAvailability (unit, fake Supabase client)', () => {
  it('sets availability_status and maps the returned row', async () => {
    mockUpdateSingle.mockResolvedValueOnce({
      data: { ...MINIMAL_ROW, availability_status: 'occupied' },
      error: null,
    });

    const result = await propertyRepository.updateAvailability('p1', 'occupied');

    expect(mockUpdate).toHaveBeenCalledWith({ availability_status: 'occupied' });
    expect(result.availabilityStatus).toBe('occupied');
  });

  it('normalizes a "no rows" error to PROPERTY_NOT_FOUND', async () => {
    mockUpdateSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'no rows', details: '', hint: '' },
    });

    await expect(propertyRepository.updateAvailability('missing', 'available')).rejects.toMatchObject({
      code: 'PROPERTY_NOT_FOUND',
    });
  });
});

describe('propertyRepository.incrementViewCount (unit, fake Supabase client)', () => {
  it('calls the increment_property_view_count RPC with the property id', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    await propertyRepository.incrementViewCount('p1');

    expect(mockRpc).toHaveBeenCalledWith('increment_property_view_count', { p_property_id: 'p1' });
  });

  it('normalizes an RPC error via the shared error mapper', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { code: '57014', message: 'statement timeout', details: '', hint: '' },
    });

    await expect(propertyRepository.incrementViewCount('p1')).rejects.toMatchObject({
      code: 'DATABASE_ERROR',
    });
  });
});
