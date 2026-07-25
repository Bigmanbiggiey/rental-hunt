import { supabase } from '@/shared/lib/supabase';
import { AppError, mapSupabaseError } from '@/shared/lib/errors';
import { profileRepository, type Profile, type Session, type UUID } from '@/entities/user';

export interface AuthRepository {
  register(input: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<{ user: Profile; session: Session }>;
  login(input: { email: string; password: string }): Promise<{ user: Profile; session: Session }>;
  logout(): Promise<void>;
  refreshSession(): Promise<{ session: Session }>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(input: { newPassword: string }): Promise<void>;
  getCurrentUser(): Promise<Profile | null>;
}

function toSession(supabaseSession: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}): Session {
  return {
    accessToken: supabaseSession.access_token,
    refreshToken: supabaseSession.refresh_token,
    expiresAt: supabaseSession.expires_at
      ? new Date(supabaseSession.expires_at * 1000).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * A signUp/signInWithPassword response's `user` row is the raw
 * `auth.users` shape, not a `profiles` row — the `handle_new_user` trigger
 * (database.md §5.1) creates the profile in the same transaction, so a
 * fresh `profileRepository.getById` immediately after reads it back.
 */
async function loadProfile(id: UUID): Promise<Profile> {
  return profileRepository.getById(id);
}

export const authRepository: AuthRepository = {
  async register({ email, password, fullName }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw mapSupabaseError(error);
    if (!data.session || !data.user) {
      throw new AppError('UNEXPECTED_ERROR', 'Registration succeeded but no session was returned.');
    }
    const user = await loadProfile(data.user.id);
    return { user, session: toSession(data.session) };
  },

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw mapSupabaseError(error);
    const user = await loadProfile(data.user.id);
    return { user, session: toSession(data.session) };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw mapSupabaseError(error);
  },

  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      throw mapSupabaseError(error ?? new AppError('SESSION_EXPIRED', 'Your session has expired.'));
    }
    return { session: toSession(data.session) };
  },

  async requestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    // Deliberately not thrown for "no such account" — api-design.md §5.5
    // requires the same generic success response regardless, to avoid
    // account enumeration. A genuine infra failure still surfaces.
    if (error) throw mapSupabaseError(error);
  },

  async resetPassword({ newPassword }) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw mapSupabaseError(error);
  },

  async getCurrentUser() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    return loadProfile(data.session.user.id);
  },
};
