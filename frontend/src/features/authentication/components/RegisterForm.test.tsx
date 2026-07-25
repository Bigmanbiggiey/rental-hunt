import { describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import { supabase } from '@/shared/lib/supabase';
import { RegisterForm } from './RegisterForm';

/**
 * Integration test against the real local Supabase stack (`supabase start`)
 * — coding-standards.md §19 requires this for anything RLS-sensitive, and
 * registration/profile-read is exactly that (§9's own migration exercised
 * end-to-end: signUp → handle_new_user trigger → RLS-gated profile read).
 * Requires the local stack to be running; not run in CI (no Docker there
 * yet) — see docs/project-state.md for the manual `supabase start` step.
 */
function renderRegisterForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/" element={<div>Home page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('RegisterForm (integration, local Supabase)', () => {
  it('registers a new user end-to-end: signs up, creates a profile row, and navigates home', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    const uniqueEmail = `rtl-test-${Date.now()}@example.com`;

    await user.type(screen.getByLabelText(/full name/i), 'Test Integration User');
    await user.type(screen.getByLabelText(/email/i), uniqueEmail);
    await user.type(screen.getByLabelText(/password/i), 'Kilimani2026');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(screen.getByText('Home page')).toBeInTheDocument(), {
      timeout: 10000,
    });

    const { data: authUser } = await supabase.auth.getUser();
    expect(authUser.user?.email).toBe(uniqueEmail);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', authUser.user!.id)
      .single();

    expect(error).toBeNull();
    expect(profile).toMatchObject({ role: 'customer', full_name: 'Test Integration User' });

    await supabase.auth.signOut();
  });

  it('shows a field-level error and does not submit when the password is too short', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    await user.type(screen.getByLabelText(/full name/i), 'Bad Password User');
    await user.type(screen.getByLabelText(/email/i), `rtl-badpw-${Date.now()}@example.com`);
    await user.type(screen.getByLabelText(/password/i), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.queryByText('Home page')).not.toBeInTheDocument();
  });

  it('shows the EMAIL_ALREADY_REGISTERED error for a duplicate email', async () => {
    const user = userEvent.setup();
    const duplicateEmail = `rtl-dup-${Date.now()}@example.com`;

    // First registration succeeds and establishes the email.
    renderRegisterForm();
    await user.type(screen.getByLabelText(/full name/i), 'First User');
    await user.type(screen.getByLabelText(/email/i), duplicateEmail);
    await user.type(screen.getByLabelText(/password/i), 'Kilimani2026');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(screen.getByText('Home page')).toBeInTheDocument(), {
      timeout: 10000,
    });
    await supabase.auth.signOut();
    cleanup();

    // Second registration with the same email should surface a clear error.
    renderRegisterForm();
    await user.type(screen.getByLabelText(/full name/i), 'Second User');
    await user.type(screen.getByLabelText(/email/i), duplicateEmail);
    await user.type(screen.getByLabelText(/password/i), 'Kilimani2026');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      await screen.findByText('Registration failed', {}, { timeout: 10000 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/already exists/i)).toBeInTheDocument();
  });
});
