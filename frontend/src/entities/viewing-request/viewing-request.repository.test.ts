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
// After the first .eq('id', id), every Sprint 6 mutation chains a
// transition guard: either .in('status', [...]) (cancel/reschedule) or a
// second .eq('status', ...) (confirm/complete/markNoShow) — both need to
// land on .select().single().
const mockGuardEq = vi.fn(() => ({ select: mockSelect }));
const mockIn = vi.fn(() => ({ select: mockSelect }));
const mockEq = vi.fn(() => ({ select: mockSelect, in: mockIn, eq: mockGuardEq }));
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

  it('guards the transition with .in(status, [pending, confirmed]) — load-bearing for the agent path, per the repository comment', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'vr1',
        customer_id: 'c1',
        property_id: 'p1',
        agent_id: 'a1',
        requested_date: '2099-01-01',
        requested_time: '10:00',
        status: 'cancelled',
        notes: null,
        cancellation_reason: null,
        created_at: '2026-07-29T00:00:00.000Z',
        updated_at: '2026-07-29T00:00:00.000Z',
        property: null,
        customer: null,
      },
      error: null,
    });

    await viewingRequestRepository.cancel('vr1');

    expect(mockIn).toHaveBeenCalledWith('status', ['pending', 'confirmed']);
  });
});

describe('viewingRequestRepository.reschedule (unit, fake Supabase client)', () => {
  it('normalizes a "0 rows" result to INVALID_STATE_TRANSITION', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'no rows', details: '', hint: '' },
    });

    await expect(
      viewingRequestRepository.reschedule('vr1', { requestedDate: '2099-01-01', requestedTime: '10:00' }),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
  });
});

describe('viewingRequestRepository.confirm (unit, fake Supabase client)', () => {
  it('guards on status = pending and normalizes a "0 rows" result to INVALID_STATE_TRANSITION', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'no rows', details: '', hint: '' },
    });

    await expect(viewingRequestRepository.confirm('vr1')).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
    });
    expect(mockGuardEq).toHaveBeenCalledWith('status', 'pending');
  });
});

describe('viewingRequestRepository.complete (unit, fake Supabase client)', () => {
  it('guards on status = confirmed and normalizes a "0 rows" result to INVALID_STATE_TRANSITION', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'no rows', details: '', hint: '' },
    });

    await expect(viewingRequestRepository.complete('vr1')).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
    });
    expect(mockGuardEq).toHaveBeenCalledWith('status', 'confirmed');
  });
});

describe('viewingRequestRepository.markNoShow (unit, fake Supabase client)', () => {
  it('guards on status = confirmed and normalizes a "0 rows" result to INVALID_STATE_TRANSITION', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'no rows', details: '', hint: '' },
    });

    await expect(viewingRequestRepository.markNoShow('vr1')).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
    });
    expect(mockGuardEq).toHaveBeenCalledWith('status', 'confirmed');
  });
});
