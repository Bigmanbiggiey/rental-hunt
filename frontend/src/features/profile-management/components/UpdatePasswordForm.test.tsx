import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { UpdatePasswordForm } from './UpdatePasswordForm';

/**
 * Integration test against the real local Supabase stack — see
 * ResetPasswordForm.test.tsx. Unlike a password *reset*, this flow requires
 * re-authenticating with the *current* password
 * (`credentialsRepository.updatePassword`), so each case signs a fresh user
 * up first to establish both the active session and a known current
 * password to confirm against.
 */
function renderUpdatePasswordForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <UpdatePasswordForm />
    </QueryClientProvider>,
  );
}

describe('UpdatePasswordForm (integration, local Supabase)', () => {
  it(
    'changes the password after confirming the current one, and the new password works for login',
    async () => {
      const email = `rtl-update-pw-${Date.now()}@example.com`;
      await supabase.auth.signUp({
        email,
        password: 'Kilimani2026',
        options: { data: { full_name: 'Update Password Test' } },
      });

      const user = userEvent.setup();
      renderUpdatePasswordForm();

      await user.type(screen.getByLabelText(/current password/i), 'Kilimani2026');
      await user.type(screen.getByLabelText(/^new password/i), 'NewKilimani2027');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewKilimani2027');
      await user.click(screen.getByRole('button', { name: /update password/i }));

      // The form only calls reset() in onSuccess, so an emptied current-password
      // field is a reliable signal the mutation actually succeeded.
      await waitFor(() => expect(screen.getByLabelText(/current password/i)).toHaveValue(''), {
        timeout: 10000,
      });

      await supabase.auth.signOut();

      const { error: oldPasswordError } = await supabase.auth.signInWithPassword({
        email,
        password: 'Kilimani2026',
      });
      expect(oldPasswordError).not.toBeNull();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'NewKilimani2027',
      });
      expect(error).toBeNull();
      expect(data.user?.email).toBe(email);
      await supabase.auth.signOut();
    },
    15000,
  );

  it('shows an error and does not change the password when the current password is wrong', async () => {
    const email = `rtl-update-pw-wrong-${Date.now()}@example.com`;
    await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Update Password Wrong' } },
    });

    const user = userEvent.setup();
    renderUpdatePasswordForm();

    await user.type(screen.getByLabelText(/current password/i), 'TotallyWrongPassword1');
    await user.type(screen.getByLabelText(/^new password/i), 'NewKilimani2027');
    await user.type(screen.getByLabelText(/confirm new password/i), 'NewKilimani2027');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(await screen.findByText(/update failed/i)).toBeInTheDocument();

    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({ email, password: 'Kilimani2026' });
    expect(error).toBeNull();
    await supabase.auth.signOut();
  });

  it('shows a validation error and never submits when the new passwords do not match', async () => {
    const email = `rtl-update-pw-mismatch-${Date.now()}@example.com`;
    await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Update Password Mismatch' } },
    });

    const user = userEvent.setup();
    renderUpdatePasswordForm();

    await user.type(screen.getByLabelText(/current password/i), 'Kilimani2026');
    await user.type(screen.getByLabelText(/^new password/i), 'NewKilimani2027');
    await user.type(screen.getByLabelText(/confirm new password/i), 'SomethingElse2027');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();

    await supabase.auth.signOut();
  });
});
