import { describe, expect, it, vi } from 'vitest';

const mockReturns = vi.fn();
const mockRange = vi.fn(() => ({ returns: mockReturns }));
const mockOrder = vi.fn(() => ({ range: mockRange }));
const mockIsAfterEq = vi.fn(() => ({ order: mockOrder }));
const mockEqSelect = vi.fn(() => ({ is: mockIsAfterEq }));
const mockSelect = vi.fn(() => ({ eq: mockEqSelect }));

const mockMaybeSingle = vi.fn();
const mockSummaryEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSummarySelect = vi.fn(() => ({ eq: mockSummaryEq }));

const mockInsertSingle = vi.fn();
const mockInsertSelect = vi.fn(() => ({ single: mockInsertSingle }));
const mockInsert = vi.fn(() => ({ select: mockInsertSelect }));

const mockFrom = vi.fn((table: string) => {
  if (table === 'agency_rating_summary' || table === 'agent_rating_summary') {
    return { select: mockSummarySelect };
  }
  return { select: mockSelect, insert: mockInsert };
});

const mockGetUser = vi.fn();

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom, auth: { getUser: mockGetUser } },
}));

const { reviewRepository } = await import('./review.repository');

const ROW = {
  id: 'review-1',
  viewing_request_id: 'vr-1',
  agency_id: 'agency-1',
  agent_id: 'agent-1',
  property_id: 'property-1',
  rating: 5,
  comment: 'Great!',
  created_at: '2026-08-05T00:00:00.000Z',
};

describe('reviewRepository.listForAgency (unit, fake Supabase client)', () => {
  it('maps rows and computes offset pagination meta', async () => {
    mockReturns.mockResolvedValueOnce({ data: [ROW], error: null, count: 1 });

    const result = await reviewRepository.listForAgency('agency-1', 1, 10);

    expect(mockFrom).toHaveBeenCalledWith('reviews');
    expect(mockEqSelect).toHaveBeenCalledWith('agency_id', 'agency-1');
    expect(mockIsAfterEq).toHaveBeenCalledWith('deleted_at', null);
    expect(result).toEqual({
      data: [
        {
          id: 'review-1',
          viewingRequestId: 'vr-1',
          agencyId: 'agency-1',
          agentId: 'agent-1',
          propertyId: 'property-1',
          rating: 5,
          comment: 'Great!',
          createdAt: '2026-08-05T00:00:00.000Z',
        },
      ],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });
  });
});

describe('reviewRepository.getAgencyRatingSummary/getAgentRatingSummary (unit, fake Supabase client)', () => {
  it('returns null average/zero count when the agency has no reviews yet (no summary row)', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await reviewRepository.getAgencyRatingSummary('agency-with-no-reviews');

    expect(result).toEqual({ averageRating: null, reviewCount: 0 });
  });

  it('numerifies the view\'s numeric-as-string average_rating', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { average_rating: '4.50', review_count: 3 }, error: null });

    const result = await reviewRepository.getAgentRatingSummary('agent-1');

    expect(result).toEqual({ averageRating: 4.5, reviewCount: 3 });
  });
});

describe('reviewRepository.create (unit, fake Supabase client)', () => {
  it('inserts only customer_id/viewing_request_id/rating/comment — never agency_id/agent_id/property_id', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'customer-1' } }, error: null });
    mockInsertSingle.mockResolvedValueOnce({ data: ROW, error: null });

    await reviewRepository.create({ viewingRequestId: 'vr-1', rating: 5, comment: 'Great!' });

    const insertArg = (mockInsert.mock.calls[0] as unknown as [Record<string, unknown>])[0];
    expect(insertArg).toEqual({
      customer_id: 'customer-1',
      viewing_request_id: 'vr-1',
      rating: 5,
      comment: 'Great!',
    });
  });

  it('throws UNAUTHENTICATED when there is no signed-in user', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(reviewRepository.create({ viewingRequestId: 'vr-1', rating: 5 })).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });
});
