import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import { supabase } from '@/shared/lib/supabase';
import { ResetPasswordForm } from './ResetPasswordForm';

/**
 * Integration test against the real local Supabase stack — see
 * RegisterForm.test.tsx. `authRepository.resetPassword` requires an active
 * session (`supabase.auth.updateUser`); a genuine emailed recovery link
 * establishes one automatically via supabase-js's default
 * `detectSessionInUrl` before ResetPasswordPage ever renders this form —
 * that link → session handoff is supabase-js's own tested default behavior,
 * not re-verified here. This test instead signs a fresh user up directly
 * (which also leaves an active session, the same precondition the form
 * depends on) to exercise the form's own submit/validation/redirect logic.
 */
function renderResetPasswordForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/reset-password']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordForm />} />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ResetPasswordForm (integration, local Supabase)', () => {
  it(
    'resets the password for the active session and the new password works for login',
    async () => {
      const email = `rtl-reset-${Date.now()}@example.com`;
      await supabase.auth.signUp({
        email,
        password: 'Kilimani2026',
        options: { data: { full_name: 'Reset Test' } },
      });

      const user = userEvent.setup();
      renderResetPasswordForm();

      await user.type(screen.getByLabelText(/^new password/i), 'NewKilimani2027');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewKilimani2027');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument(), {
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

  it('shows a validation error and never submits when the passwords do not match', async () => {
    const email = `rtl-reset-mismatch-${Date.now()}@example.com`;
    await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Reset Mismatch' } },
    });

    const user = userEvent.setup();
    renderResetPasswordForm();

    await user.type(screen.getByLabelText(/^new password/i), 'NewKilimani2027');
    await user.type(screen.getByLabelText(/confirm new password/i), 'SomethingElse2027');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();

    await supabase.auth.signOut();
  });
});
