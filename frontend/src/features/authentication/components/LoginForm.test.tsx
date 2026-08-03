import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import { supabase } from '@/shared/lib/supabase';
import { serviceClient } from '@/shared/lib/testing/rlsTestHelpers';
import { LoginForm } from './LoginForm';

/** Integration test against the real local Supabase stack — see RegisterForm.test.tsx. */
function renderLoginForm(initialEntries: (string | { pathname: string; state?: unknown })[] = ['/login']) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<div>Home page</div>} />
          {/* A plain customer signup lands on /user-dashboard, not the guest
              homepage — the login redirect is role-aware. */}
          <Route path="/user-dashboard" element={<div>Dashboard page</div>} />
          <Route path="/admin-dashboard" element={<div>Admin dashboard page</div>} />
          <Route path="/agent-dashboard" element={<div>Agent dashboard page</div>} />
          <Route path="/moderator-dashboard" element={<div>Moderator dashboard page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginForm (integration, local Supabase)', () => {
  it('logs an existing user in and redirects a customer to /user-dashboard', async () => {
    const email = `rtl-login-${Date.now()}@example.com`;
    await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Login Test' } },
    });
    await supabase.auth.signOut();

    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText(/email/i), email);
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'Kilimani2026');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(screen.getByText('Dashboard page')).toBeInTheDocument(), {
      timeout: 10000,
    });

    const { data } = await supabase.auth.getUser();
    expect(data.user?.email).toBe(email);
    await supabase.auth.signOut();
  });

  it('logs an admin in and redirects to /admin-dashboard — not the homepage', async () => {
    // Regression test for the exact bug reported 2026-08-04: every login
    // (regardless of role) was landing on the guest homepage. Also
    // exercises useLogin's cache-race fix — without it, ProtectedRoute's
    // very next render would still see the pre-login cached profile and
    // bounce straight back to /login instead of reaching /admin-dashboard.
    const email = `rtl-login-admin-${Date.now()}@example.com`;
    const { data } = await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Login Admin' } },
    });
    await serviceClient.from('profiles').update({ role: 'admin' }).eq('id', data.user!.id);
    await supabase.auth.signOut();

    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText(/email/i), email);
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'Kilimani2026');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(screen.getByText('Admin dashboard page')).toBeInTheDocument(), {
      timeout: 10000,
    });
    expect(screen.queryByText('Home page')).not.toBeInTheDocument();

    await supabase.auth.signOut();
  }, 15000);

  it('ignores state.from when the logged-in role cannot reach it, landing on that role\'s own dashboard instead', async () => {
    // Regression test for a real bug found 2026-08-04 manually testing the
    // new per-role dashboards: logging out of an agent account from
    // /agent-dashboard sets state.from to /agent-dashboard (ProtectedRoute's
    // own redirect). Naively honoring it after logging into a *different*
    // role's account sent that role to a page only agents can reach, which
    // ProtectedRoute then bounced to the guest homepage — landing nowhere
    // useful, not just "the wrong dashboard."
    const email = `rtl-login-modstate-${Date.now()}@example.com`;
    const { data } = await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Login Moderator' } },
    });
    await serviceClient.from('profiles').update({ role: 'moderator' }).eq('id', data.user!.id);
    await supabase.auth.signOut();

    const user = userEvent.setup();
    renderLoginForm([{ pathname: '/login', state: { from: { pathname: '/agent-dashboard', search: '' } } }]);

    await user.type(screen.getByLabelText(/email/i), email);
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'Kilimani2026');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(screen.getByText('Moderator dashboard page')).toBeInTheDocument(), {
      timeout: 10000,
    });
    expect(screen.queryByText('Agent dashboard page')).not.toBeInTheDocument();
    expect(screen.queryByText('Home page')).not.toBeInTheDocument();

    await supabase.auth.signOut();
  }, 15000);

  it('shows the generic INVALID_CREDENTIALS message for a wrong password, never revealing which field was wrong', async () => {
    const email = `rtl-badlogin-${Date.now()}@example.com`;
    await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Bad Login' } },
    });
    await supabase.auth.signOut();

    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText(/email/i), email);
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'TotallyWrongPassword1');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Login failed', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.getByText(/doesn.t match our records/i)).toBeInTheDocument();
    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
  });

  it('shows a password toggle button that reveals and hides the typed password', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    const passwordInput = screen.getByLabelText(/password/i, { selector: 'input' });
    await user.type(passwordInput, 'secret123');
    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toHaveValue('secret123');

    await user.click(screen.getByRole('button', { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
