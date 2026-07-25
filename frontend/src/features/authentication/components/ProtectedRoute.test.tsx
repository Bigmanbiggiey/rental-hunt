import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import { AuthProvider } from '@/entities/user';
import { supabase } from '@/shared/lib/supabase';
import { ProtectedRoute } from './ProtectedRoute';

/** Integration test against the real local Supabase stack — see RegisterForm.test.tsx. */
function renderProtectedTree(initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/login" element={<div>Login page</div>} />
            <Route path="/" element={<div>Home page</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Dashboard content</div>} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<div>Admin content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('ProtectedRoute (integration, local Supabase)', () => {
  it('redirects a guest to /login', async () => {
    await supabase.auth.signOut();
    renderProtectedTree('/dashboard');

    await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument());
  });

  it('renders the protected content for a signed-in user', async () => {
    const email = `rtl-protected-${Date.now()}@example.com`;
    await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Guard Test' } },
    });

    renderProtectedTree('/dashboard');

    await waitFor(() => expect(screen.getByText('Dashboard content')).toBeInTheDocument(), {
      timeout: 10000,
    });

    await supabase.auth.signOut();
  });

  it('blocks a Customer from an admin-only route, redirecting home (roadmap.md §6 acceptance test)', async () => {
    const email = `rtl-customer-blocked-${Date.now()}@example.com`;
    await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Customer Blocked' } },
    });

    renderProtectedTree('/admin');

    await waitFor(() => expect(screen.getByText('Home page')).toBeInTheDocument(), {
      timeout: 10000,
    });
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();

    await supabase.auth.signOut();
  });
});
