import { describe, expect, it, vi } from 'vitest';

/**
 * `listPending()`'s chain and `setStatus()`'s "RPC then re-fetch" hop are
 * proven for real against the local Supabase stack
 * (`verification.rls.test.ts`) — matching `property.repository.test.ts`'s
 * own precedent that a data-driven Supabase query chain is more reliably
 * tested against a real backend than a faithfully-faked mock. This file
 * covers what a fake client is genuinely good for: forcing error conditions
 * that are awkward to trigger for real.
 */
const mockGetByIdAdmin = vi.fn();

vi.mock('@/entities/property', async () => {
  const actual = await vi.importActual<typeof import('@/entities/property')>('@/entities/property');
  return {
    ...actual,
    propertyRepository: { ...actual.propertyRepository, getByIdAdmin: mockGetByIdAdmin },
  };
});

const mockRpcSingle = vi.fn();
const mockRpc = vi.fn(() => ({ single: mockRpcSingle }));

const mockHistoryReturns = vi.fn();
const mockHistoryOrder = vi.fn(() => ({ returns: mockHistoryReturns }));
const mockHistoryEq = vi.fn(() => ({ order: mockHistoryOrder }));
const mockHistorySelect = vi.fn(() => ({ eq: mockHistoryEq }));
const mockFrom = vi.fn(() => ({ select: mockHistorySelect }));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}));

const { verificationRepository } = await import('./verification.repository');

const VERIFICATION_ROW = {
  id: 'verification-1',
  property_id: 'property-1',
  previous_status: 'pending_verification' as const,
  new_status: 'verified' as const,
  reviewed_by: 'moderator-1',
  reason: null,
  created_at: '2026-07-31T00:00:00.000Z',
};

describe('verificationRepository.setStatus (unit, fake Supabase client)', () => {
  it('calls the RPC with the mapped column names, then re-fetches the full Property DTO', async () => {
    mockRpcSingle.mockResolvedValueOnce({ data: VERIFICATION_ROW, error: null });
    mockGetByIdAdmin.mockResolvedValueOnce({ id: 'property-1', verificationStatus: 'verified' });

    const result = await verificationRepository.setStatus('property-1', { status: 'verified' });

    expect(mockRpc).toHaveBeenCalledWith('set_property_verification', {
      property_id: 'property-1',
      new_status: 'verified',
      reason: null,
    });
    expect(mockGetByIdAdmin).toHaveBeenCalledWith('property-1');
    expect(result.verification.reviewedBy).toBe('moderator-1');
    expect(result.property.verificationStatus).toBe('verified');
  });

  it('normalizes a FORBIDDEN (42501) RPC error via the shared error mapper', async () => {
    mockRpcSingle.mockResolvedValueOnce({
      data: null,
      error: { code: '42501', message: 'insufficient_privilege', details: '', hint: '' },
    });

    await expect(verificationRepository.setStatus('property-1', { status: 'verified' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('normalizes a "property not found" (P0002) RPC error to PROPERTY_NOT_FOUND', async () => {
    mockRpcSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'P0002', message: 'Property not found.', details: '', hint: '' },
    });

    await expect(verificationRepository.setStatus('missing', { status: 'verified' })).rejects.toMatchObject({
      code: 'PROPERTY_NOT_FOUND',
    });
  });
});

describe('verificationRepository.history (unit, fake Supabase client)', () => {
  it('maps every returned row to the camelCase PropertyVerification DTO', async () => {
    mockHistoryReturns.mockResolvedValueOnce({ data: [VERIFICATION_ROW], error: null });

    const result = await verificationRepository.history('property-1');

    expect(mockFrom).toHaveBeenCalledWith('property_verifications');
    expect(mockHistoryEq).toHaveBeenCalledWith('property_id', 'property-1');
    expect(result).toEqual([
      {
        id: 'verification-1',
        propertyId: 'property-1',
        previousStatus: 'pending_verification',
        newStatus: 'verified',
        reviewedBy: 'moderator-1',
        reason: null,
        createdAt: '2026-07-31T00:00:00.000Z',
      },
    ]);
  });
});
