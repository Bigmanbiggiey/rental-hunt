import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { ForgotPasswordForm } from './ForgotPasswordForm';

/** Integration test against the real local Supabase stack — see RegisterForm.test.tsx. */
function renderForgotPasswordForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ForgotPasswordForm />
    </QueryClientProvider>,
  );
}

describe('ForgotPasswordForm (integration, local Supabase)', () => {
  it('shows the generic confirmation message for a real, registered email', async () => {
    const email = `rtl-forgot-real-${Date.now()}@example.com`;
    await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Forgot Real' } },
    });
    await supabase.auth.signOut();

    const user = userEvent.setup();
    renderForgotPasswordForm();

    await user.type(screen.getByLabelText(/email/i), email);
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText('Check your email', {}, { timeout: 10000 })).toBeInTheDocument();
  });

  it('shows the identical generic confirmation message for an unregistered email', async () => {
    const user = userEvent.setup();
    renderForgotPasswordForm();

    await user.type(
      screen.getByLabelText(/email/i),
      `rtl-forgot-nonexistent-${Date.now()}@example.com`,
    );
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText('Check your email', {}, { timeout: 10000 })).toBeInTheDocument();
  });

  it('shows a field-level validation error and never submits for an empty email', async () => {
    const user = userEvent.setup();
    renderForgotPasswordForm();

    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument();
  });
});
