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
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom },
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
