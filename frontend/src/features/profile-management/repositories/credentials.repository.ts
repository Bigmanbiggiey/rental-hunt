import { supabase } from '@/shared/lib/supabase';
import { AppError, mapSupabaseError } from '@/shared/lib/errors';

export interface CredentialsRepository {
  getCurrentEmail(): Promise<string | null>;
  updateEmail(newEmail: string): Promise<void>;
  updatePassword(input: { currentPassword: string; newPassword: string }): Promise<void>;
}

export const credentialsRepository: CredentialsRepository = {
  async getCurrentEmail() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw mapSupabaseError(error);
    return data.user?.email ?? null;
  },

  async updateEmail(newEmail) {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw mapSupabaseError(error);
  },

  /**
   * api-design.md §5.10: confirms the caller's current password via a real
   * `signInWithPassword` re-authentication (there is no separate "verify
   * password" Supabase Auth API) before applying the change.
   */
  async updatePassword({ currentPassword, newPassword }) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw mapSupabaseError(userError);

    const email = userData.user?.email;
    if (!email) throw new AppError('UNAUTHENTICATED', 'Please sign in to continue.');

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (reauthError) throw mapSupabaseError(reauthError);

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) throw mapSupabaseError(updateError);
  },
};
