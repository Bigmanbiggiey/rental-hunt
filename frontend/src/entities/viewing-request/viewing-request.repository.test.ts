import { describe, expect, it, vi } from 'vitest';

/**
 * `listForCustomer`'s query chain (order/range/optional status filter) is
 * proven against the real local Supabase stack instead
 * (`viewing-request.rls.test.ts`) — same precedent as
 * `property.repository.test.ts`'s own reasoning for skipping a faithful fake
 * of `list()`'s chain. This file covers only what a fake client is genuinely
 * good for: error-normalization paths that are awkward to trigger for real.
 */
const mockAuthGetUser = vi.fn();
const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockEq = vi.fn(() => ({ select: mockSelect }));
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockFrom = vi.fn(() => ({ insert: mockInsert, update: mockUpdate }));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom, auth: { getUser: mockAuthGetUser } },
}));

const { viewingRequestRepository } = await import('./viewing-request.repository');

const CREATE_INPUT = {
  propertyId: 'p1',
  agentId: 'a1',
  requestedDate: '2099-01-01',
  requestedTime: '10:00',
};

describe('viewingRequestRepository.create (unit, fake Supabase client)', () => {
  it('throws UNAUTHENTICATED when no session exists', async () => {
    mockAuthGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(viewingRequestRepository.create(CREATE_INPUT)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it('normalizes the prevent_booking_unavailable_property trigger (RH001) to PROPERTY_NOT_AVAILABLE', async () => {
    mockAuthGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'RH001', message: 'not available', details: '', hint: '' },
    });

    await expect(viewingRequestRepository.create(CREATE_INPUT)).rejects.toMatchObject({
      code: 'PROPERTY_NOT_AVAILABLE',
    });
  });
});

describe('viewingRequestRepository.cancel (unit, fake Supabase client)', () => {
  it('normalizes a "0 rows" result (not owned, or already terminal) to INVALID_STATE_TRANSITION', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'no rows', details: '', hint: '' },
    });

    await expect(viewingRequestRepository.cancel('vr1')).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
    });
  });
});
