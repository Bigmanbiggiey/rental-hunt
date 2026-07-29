import { describe, expect, it, vi } from 'vitest';

/**
 * `list()`'s query chain (embedded `PROPERTY_COLUMNS`, offset pagination) is
 * proven against the real local Supabase stack instead
 * (`favorites.rls.test.ts`) — same precedent as
 * `property.repository.test.ts`'s reasoning for skipping a faithful fake of
 * a similarly data-driven chain. This file covers `save`/`remove`/`listIds`,
 * whose chains are simple enough to fake reliably.
 */
const mockAuthGetUser = vi.fn();
const mockUpsert = vi.fn();
const mockMatch = vi.fn();
const mockDelete = vi.fn(() => ({ match: mockMatch }));
const mockReturns = vi.fn();
const mockSelect = vi.fn(() => ({ returns: mockReturns }));
const mockFrom = vi.fn(() => ({ upsert: mockUpsert, delete: mockDelete, select: mockSelect }));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom, auth: { getUser: mockAuthGetUser } },
}));

const { favoritesRepository } = await import('./favorites.repository');

describe('favoritesRepository.save (unit, fake Supabase client)', () => {
  it('throws UNAUTHENTICATED when no session exists', async () => {
    mockAuthGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(favoritesRepository.save('p1')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('normalizes a database error via the shared error mapper', async () => {
    mockAuthGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    mockUpsert.mockResolvedValueOnce({
      error: { code: '23503', message: 'fk violation', details: '', hint: '' },
    });

    await expect(favoritesRepository.save('missing-property')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });
});

describe('favoritesRepository.remove (unit, fake Supabase client)', () => {
  it('is a no-op success even for a non-favorited property', async () => {
    mockAuthGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    mockMatch.mockResolvedValueOnce({ error: null });

    await expect(favoritesRepository.remove('p1')).resolves.toBeUndefined();
  });
});

describe('favoritesRepository.listIds (unit, fake Supabase client)', () => {
  it('returns an empty array when nothing is favorited', async () => {
    mockReturns.mockResolvedValueOnce({ data: [], error: null });

    const result = await favoritesRepository.listIds();
    expect(result).toEqual([]);
  });

  it('normalizes a database error via the shared error mapper', async () => {
    mockReturns.mockResolvedValueOnce({
      data: null,
      error: { code: '57014', message: 'statement timeout', details: '', hint: '' },
    });

    await expect(favoritesRepository.listIds()).rejects.toMatchObject({ code: 'DATABASE_ERROR' });
  });
});
