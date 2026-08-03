import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import { supabase } from '@/shared/lib/supabase';
import { LoginForm } from './LoginForm';

/** Integration test against the real local Supabase stack — see RegisterForm.test.tsx. */
function renderLoginForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<div>Home page</div>} />
          {/* A plain customer signup lands on /dashboard, not the guest
              homepage — the login redirect is role-aware. */}
          <Route path="/dashboard" element={<div>Dashboard page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginForm (integration, local Supabase)', () => {
  it('logs an existing user in and redirects a customer to /dashboard', async () => {
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
