import { describe, expect, it, vi } from 'vitest';

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

const { agentRepository } = await import('./agent.repository');

const ROW = {
  id: 'agent-1',
  profile_id: 'profile-1',
  agency_id: 'agency-1',
  job_title: 'Leasing Agent',
  bio: 'Ten years in Nairobi rentals.',
  is_active: true,
  profile: { full_name: 'James Mwangi', avatar_url: null },
};

describe('agentRepository (unit, fake Supabase client)', () => {
  it('getCurrentAgent maps an agents row (joined to profiles) to the camelCase Agent DTO', async () => {
    mockSingle.mockResolvedValueOnce({ data: ROW, error: null });

    const result = await agentRepository.getCurrentAgent('profile-1');

    expect(mockFrom).toHaveBeenCalledWith('agents');
    expect(mockEq).toHaveBeenCalledWith('profile_id', 'profile-1');
    expect(result).toEqual({
      id: 'agent-1',
      profileId: 'profile-1',
      agencyId: 'agency-1',
      fullName: 'James Mwangi',
      avatarUrl: null,
      jobTitle: 'Leasing Agent',
      bio: 'Ten years in Nairobi rentals.',
      isActive: true,
    });
  });

  it('getCurrentAgent normalizes a "no rows" error to AGENT_NOT_FOUND', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'no rows', details: '', hint: '' },
    });

    await expect(agentRepository.getCurrentAgent('missing')).rejects.toMatchObject({
      code: 'AGENT_NOT_FOUND',
    });
  });
});
