import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockSignInWithPassword = vi.fn();

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
      signInWithPassword: mockSignInWithPassword,
    },
  },
}));

const { credentialsRepository } = await import('./credentials.repository');

beforeEach(() => {
  mockGetUser.mockReset();
  mockUpdateUser.mockReset();
  mockSignInWithPassword.mockReset();
});

describe('credentialsRepository (unit, fake Supabase client)', () => {
  describe('getCurrentEmail', () => {
    it('returns the current session email', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { email: 'amina@example.com' } }, error: null });

      await expect(credentialsRepository.getCurrentEmail()).resolves.toBe('amina@example.com');
    });

    it('normalizes a Supabase Auth error via the shared error mapper', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { code: 'session_not_found', message: 'no session' },
      });

      await expect(credentialsRepository.getCurrentEmail()).rejects.toMatchObject({
        code: 'UNAUTHENTICATED',
      });
    });
  });

  describe('updateEmail', () => {
    it('calls supabase.auth.updateUser with the new email', async () => {
      mockUpdateUser.mockResolvedValueOnce({ data: {}, error: null });

      await credentialsRepository.updateEmail('new@example.com');

      expect(mockUpdateUser).toHaveBeenCalledWith({ email: 'new@example.com' });
    });

    it('normalizes a duplicate-email error to EMAIL_ALREADY_REGISTERED', async () => {
      mockUpdateUser.mockResolvedValueOnce({
        data: {},
        error: { code: 'email_exists', message: 'already registered' },
      });

      await expect(credentialsRepository.updateEmail('taken@example.com')).rejects.toMatchObject({
        code: 'EMAIL_ALREADY_REGISTERED',
      });
    });
  });

  describe('updatePassword', () => {
    it('re-authenticates with the current password before applying the new one', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { email: 'amina@example.com' } }, error: null });
      mockSignInWithPassword.mockResolvedValueOnce({ data: {}, error: null });
      mockUpdateUser.mockResolvedValueOnce({ data: {}, error: null });

      await credentialsRepository.updatePassword({
        currentPassword: 'oldPass1',
        newPassword: 'newPass2',
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'amina@example.com',
        password: 'oldPass1',
      });
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newPass2' });
    });

    it('rejects with INVALID_CREDENTIALS and never applies the change when the current password is wrong', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { email: 'amina@example.com' } }, error: null });
      mockSignInWithPassword.mockResolvedValueOnce({
        data: {},
        error: { code: 'invalid_credentials', message: 'wrong password' },
      });

      await expect(
        credentialsRepository.updatePassword({ currentPassword: 'wrong', newPassword: 'newPass2' }),
      ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('throws UNAUTHENTICATED when there is no current session to re-authenticate against', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      await expect(
        credentialsRepository.updatePassword({ currentPassword: 'x', newPassword: 'newPass2' }),
      ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });
  });
});
