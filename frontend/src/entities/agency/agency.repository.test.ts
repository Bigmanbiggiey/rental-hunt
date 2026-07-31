import { describe, expect, it, vi } from 'vitest';

const mockReturns = vi.fn();
const mockSingle = vi.fn();
const mockEqAfterOrder = vi.fn(() => ({ returns: mockReturns }));
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

const mockFrom = vi.fn(() => ({ select: mockSelect, insert: mockInsert, update: mockUpdate }));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom },
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
};

describe('agencyRepository.list (unit, fake Supabase client)', () => {
  it('maps every returned row to the camelCase Agency DTO', async () => {
    mockReturns.mockResolvedValueOnce({ data: [ROW], error: null });

    const result = await agencyRepository.list();

    expect(mockFrom).toHaveBeenCalledWith('agencies');
    expect(result).toEqual([
      {
        id: 'agency-1',
        name: 'Nairobi Homes Realty',
        slug: 'nairobi-homes-realty',
        description: 'A trusted agency.',
        logoUrl: null,
        phone: '+254700000001',
        email: 'info@nairobihomes.test',
        countyId: 'county-1',
        isActive: true,
      },
    ]);
  });

  it('applies a county filter when provided', async () => {
    mockReturns.mockResolvedValueOnce({ data: [], error: null });

    await agencyRepository.list({ county: 'county-1' });

    expect(mockEqAfterOrder).toHaveBeenCalledWith('county_id', 'county-1');
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

    const insertArg = (mockInsert.mock.calls[0] as unknown as [Record<string, unknown>])[0];
    expect(insertArg.name).toBe('Nairobi Homes Realty');
    expect(insertArg.slug).toMatch(/^nairobi-homes-realty-[a-z0-9]+$/);
    expect(insertArg.phone).toBe('+254700000001');
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
