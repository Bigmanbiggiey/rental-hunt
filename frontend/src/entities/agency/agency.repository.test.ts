import { describe, expect, it, vi } from 'vitest';

const mockReturns = vi.fn();
const mockSingle = vi.fn();
const mockEqAfterOrder = vi.fn(() => ({ returns: mockReturns, eq: mockEqAfterOrder }));
const mockOrder = vi.fn(() => ({ returns: mockReturns, eq: mockEqAfterOrder }));
const mockEqSelect = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ order: mockOrder, eq: mockEqSelect }));

const mockUpdateSingle = vi.fn();
const mockUpdateSelect = vi.fn(() => ({ single: mockUpdateSingle }));
const mockUpdateEq = vi.fn(() => ({ select: mockUpdateSelect }));
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

const mockInsertSingle = vi.fn();
const mockInsertSelect = vi.fn(() => ({ single: mockInsertSingle }));
const mockInsert = vi.fn(() => ({ select: mockInsertSelect }));

const mockRpcSingle = vi.fn();
const mockRpc = vi.fn(() => ({ single: mockRpcSingle }));

const mockFrom = vi.fn(() => ({ select: mockSelect, insert: mockInsert, update: mockUpdate }));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}));

const { agencyRepository } = await import('./agency.repository');

const ROW = {
  id: 'agency-1',
  name: 'Nairobi Homes Realty',
  slug: 'nairobi-homes-realty',
  description: 'A trusted agency.',
  logo_url: null,
  phone: '+254700000001',
  email: 'info@nairobihomes.test',
  county_id: 'county-1',
  is_active: true,
  social_links: { website: 'https://nairobihomes.test' },
  onboarding_status: 'approved',
  applied_by: null,
  rejection_reason: null,
};

const MAPPED = {
  id: 'agency-1',
  name: 'Nairobi Homes Realty',
  slug: 'nairobi-homes-realty',
  description: 'A trusted agency.',
  logoUrl: null,
  phone: '+254700000001',
  email: 'info@nairobihomes.test',
  countyId: 'county-1',
  isActive: true,
  socialLinks: { website: 'https://nairobihomes.test' },
  onboardingStatus: 'approved',
  appliedBy: null,
  rejectionReason: null,
};

describe('agencyRepository.list (unit, fake Supabase client)', () => {
  it('maps every returned row to the camelCase Agency DTO', async () => {
    mockReturns.mockResolvedValueOnce({ data: [ROW], error: null });

    const result = await agencyRepository.list();

    expect(mockFrom).toHaveBeenCalledWith('agencies');
    expect(result).toEqual([MAPPED]);
  });

  it('applies a county filter when provided', async () => {
    mockReturns.mockResolvedValueOnce({ data: [], error: null });

    await agencyRepository.list({ county: 'county-1' });

    expect(mockEqAfterOrder).toHaveBeenCalledWith('county_id', 'county-1');
  });

  it('applies an onboardingStatus filter when provided (Epic 12 admin applications queue)', async () => {
    mockReturns.mockResolvedValueOnce({ data: [], error: null });

    await agencyRepository.list({ onboardingStatus: 'pending_review' });

    expect(mockEqAfterOrder).toHaveBeenCalledWith('onboarding_status', 'pending_review');
  });
});

describe('agencyRepository.getById (unit, fake Supabase client)', () => {
  it('normalizes a "no rows" error to AGENCY_NOT_FOUND', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'no rows', details: '', hint: '' },
    });

    await expect(agencyRepository.getById('missing')).rejects.toMatchObject({
      code: 'AGENCY_NOT_FOUND',
    });
  });
});

describe('agencyRepository.create (unit, fake Supabase client)', () => {
  it('slugifies the name and inserts the mapped column set', async () => {
    mockInsertSingle.mockResolvedValueOnce({ data: ROW, error: null });

    await agencyRepository.create({ name: 'Nairobi Homes Realty', phone: '+254700000001' });

    const insertArg = (mockInsert.mock.calls.at(-1) as unknown as [Record<string, unknown>])[0];
    expect(insertArg.name).toBe('Nairobi Homes Realty');
    expect(insertArg.slug).toMatch(/^nairobi-homes-realty-[a-z0-9]+$/);
    expect(insertArg.phone).toBe('+254700000001');
    expect(insertArg.social_links).toEqual({});
  });
});

describe('agencyRepository.update (unit, fake Supabase client)', () => {
  it('only patches fields that were actually provided', async () => {
    mockUpdateSingle.mockResolvedValueOnce({ data: { ...ROW, is_active: false }, error: null });

    await agencyRepository.update('agency-1', { isActive: false });

    expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'agency-1');
  });

  it('normalizes a "no rows" error to AGENCY_NOT_FOUND', async () => {
    mockUpdateSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'no rows', details: '', hint: '' },
    });

    await expect(agencyRepository.update('missing', { name: 'X' })).rejects.toMatchObject({
      code: 'AGENCY_NOT_FOUND',
    });
  });
});

describe('agencyRepository.applySelf (unit, fake Supabase client, Epic 12)', () => {
  it('inserts the mapped column set without ever sending applied_by/onboarding_status/is_active', async () => {
    mockInsertSingle.mockResolvedValueOnce({
      data: { ...ROW, onboarding_status: 'pending_review', is_active: false },
      error: null,
    });

    await agencyRepository.applySelf({ name: 'New Agency', socialLinks: { instagram: 'newagency' } });

    const insertArg = (mockInsert.mock.calls.at(-1) as unknown as [Record<string, unknown>])[0];
    expect(insertArg).not.toHaveProperty('applied_by');
    expect(insertArg).not.toHaveProperty('onboarding_status');
    expect(insertArg).not.toHaveProperty('is_active');
    expect(insertArg.social_links).toEqual({ instagram: 'newagency' });
  });
});

describe('agencyRepository.approve/reject (unit, fake Supabase client, Epic 12)', () => {
  it('approve calls approve_agency_application with p_agency_id and maps the returned row', async () => {
    mockRpcSingle.mockResolvedValueOnce({ data: { ...ROW, onboarding_status: 'approved' }, error: null });

    const result = await agencyRepository.approve('agency-1');

    expect(mockRpc).toHaveBeenCalledWith('approve_agency_application', { p_agency_id: 'agency-1' });
    expect(result.onboardingStatus).toBe('approved');
  });

  it('reject calls reject_agency_application with the reason and maps the returned row', async () => {
    mockRpcSingle.mockResolvedValueOnce({
      data: { ...ROW, onboarding_status: 'rejected', rejection_reason: 'Duplicate.' },
      error: null,
    });

    const result = await agencyRepository.reject('agency-1', 'Duplicate.');

    expect(mockRpc).toHaveBeenCalledWith('reject_agency_application', {
      p_agency_id: 'agency-1',
      p_reason: 'Duplicate.',
    });
    expect(result.rejectionReason).toBe('Duplicate.');
  });

  it('normalizes a not-found/not-pending RPC error to AGENCY_NOT_FOUND', async () => {
    mockRpcSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'no rows', details: '', hint: '' },
    });

    await expect(agencyRepository.approve('missing')).rejects.toMatchObject({
      code: 'AGENCY_NOT_FOUND',
    });
  });
});
