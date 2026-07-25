import { describe, expect, it, vi } from 'vitest';

// select().eq().single() (getById) and update().eq().select().single() both
// end on a `single`, so `select`'s return needs both `eq` (getById's next
// hop) and `single` (update's next hop) available on the same object.
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq, single: mockSingle }));
const mockUpdateEq = vi.fn(() => ({ select: mockSelect }));
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect, update: mockUpdate }));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

const { profileRepository } = await import('./profile.repository');

const ROW = {
  id: 'u1',
  role: 'customer' as const,
  full_name: 'Amina Yusuf',
  phone: null,
  avatar_url: null,
  notification_preferences: {},
  is_active: true,
  created_at: '2026-07-24T00:00:00.000Z',
};

describe('profileRepository (unit, fake Supabase client)', () => {
  it('getById maps a profiles row to the camelCase Profile DTO', async () => {
    mockSingle.mockResolvedValueOnce({ data: ROW, error: null });

    const result = await profileRepository.getById('u1');

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockEq).toHaveBeenCalledWith('id', 'u1');
    expect(result).toEqual({
      id: 'u1',
      role: 'customer',
      fullName: 'Amina Yusuf',
      phone: null,
      avatarUrl: null,
      notificationPreferences: {},
      isActive: true,
      createdAt: '2026-07-24T00:00:00.000Z',
    });
  });

  it('getById normalizes a "no rows" error to PROFILE_NOT_FOUND', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'no rows', details: '', hint: '' },
    });

    await expect(profileRepository.getById('missing')).rejects.toMatchObject({
      code: 'PROFILE_NOT_FOUND',
    });
  });

  it('update sends only the snake_case columns and maps the returned row', async () => {
    mockSingle.mockResolvedValueOnce({ data: { ...ROW, full_name: 'New Name' }, error: null });

    const result = await profileRepository.update('u1', { fullName: 'New Name' });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: 'New Name', phone: undefined }),
    );
    expect(result.fullName).toBe('New Name');
  });

  it('update normalizes an RLS rejection to FORBIDDEN via the shared error mapper', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: '42501', message: 'permission denied', details: '', hint: '' },
    });

    await expect(profileRepository.update('u1', { fullName: 'X' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});
