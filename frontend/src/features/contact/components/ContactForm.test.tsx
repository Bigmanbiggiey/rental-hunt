import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/entities/user';
import { supabase } from '@/shared/lib/supabase';
import { ContactForm } from './ContactForm';

/**
 * Integration test against the real local Supabase stack — RLS-sensitive
 * (coding-standards.md §19): the guest-insert / own-user_id-only policies
 * (database.md §5.16) are exactly the kind of rule a mock can't fail.
 */
function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ContactForm />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('ContactForm (integration, local Supabase)', () => {
  it('a guest can submit a message and sees a confirmation', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/name/i), 'RTL Guest Submitter');
    await user.type(screen.getByLabelText(/email/i), `rtl-contact-${Date.now()}@example.com`);
    await user.type(screen.getByLabelText(/message/i), 'Is this listing still available for viewing?');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText('Message sent', {}, { timeout: 10000 })).toBeInTheDocument();
  }, 15000);

  it('shows a field-level error and does not submit when the message is too short', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/name/i), 'RTL Short Message');
    await user.type(screen.getByLabelText(/email/i), `rtl-contact-short-${Date.now()}@example.com`);
    await user.type(screen.getByLabelText(/message/i), 'too short');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
    expect(screen.queryByText('Message sent')).not.toBeInTheDocument();
  });

  it("pre-fills a signed-in user's name and email", async () => {
    const email = `rtl-contact-prefill-${Date.now()}@example.com`;
    await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Prefill Test User' } },
    });

    renderForm();

    expect(await screen.findByDisplayValue('Prefill Test User')).toBeInTheDocument();
    expect(await screen.findByDisplayValue(email)).toBeInTheDocument();

    await supabase.auth.signOut();
  }, 15000);
});
