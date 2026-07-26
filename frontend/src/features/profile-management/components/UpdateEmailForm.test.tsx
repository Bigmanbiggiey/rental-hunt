import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { UpdateEmailForm } from './UpdateEmailForm';

/**
 * Integration test against the real local Supabase stack — see
 * ResetPasswordForm.test.tsx. `credentialsRepository.updateEmail` only
 * requests the change (`supabase.auth.updateUser({ email })`); the address
 * isn't live until the emailed confirmation link is clicked, so this test
 * verifies the request succeeds and the form reflects that, not that the
 * account's email has actually changed (a real inbox click is Supabase's
 * own tested default behavior, not re-verified here).
 */
function renderUpdateEmailForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <UpdateEmailForm />
    </QueryClientProvider>,
  );
}

describe('UpdateEmailForm (integration, local Supabase)', () => {
  it('shows the current email and submits a change request successfully', async () => {
    const email = `rtl-update-email-${Date.now()}@example.com`;
    await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Update Email Test' } },
    });

    const user = userEvent.setup();
    renderUpdateEmailForm();

    expect(await screen.findByText(new RegExp(email))).toBeInTheDocument();

    await user.type(screen.getByLabelText(/new email/i), `new-${email}`);
    await user.click(screen.getByRole('button', { name: /update email/i }));

    // The form only calls reset() in onSuccess, so an emptied field is a
    // reliable signal the mutation actually succeeded.
    await waitFor(() => expect(screen.getByLabelText(/new email/i)).toHaveValue(''), {
      timeout: 10000,
    });

    await supabase.auth.signOut();
  });

  it('shows a validation error and never submits for an invalid email', async () => {
    const email = `rtl-update-email-invalid-${Date.now()}@example.com`;
    await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Update Email Invalid' } },
    });

    const user = userEvent.setup();
    renderUpdateEmailForm();

    await screen.findByText(new RegExp(email));

    await user.type(screen.getByLabelText(/new email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /update email/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new email/i)).toHaveValue('not-an-email');

    await supabase.auth.signOut();
  });
});
