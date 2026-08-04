import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from '@/entities/user';
import { supabase } from '@/shared/lib/supabase';
import { UserDashboardOverviewPage } from './UserDashboardOverviewPage';

// Same class of environment limitation AgentPropertyFormPage.test.tsx
// already worked around: a real postgres_changes WebSocket subscription's
// connection handshake can complete after jsdom's environment tears down,
// surfacing as an unrelated-looking uncaught WebSocket.dispatchEvent
// exception. Not exercised by anything this test needs.
vi.mock('@/features/viewing-requests/hooks/useViewingRequestsRealtime', () => ({
  useViewingRequestsRealtime: () => {},
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>
          <UserDashboardOverviewPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

/**
 * Real integration test against the local Supabase stack, mirroring
 * AgentDashboardOverviewPage.test.tsx's pattern. Post-Sprint-8 (2026-08-04):
 * the welcome block is the fix for the "skeleton page after login" report —
 * this test's real point is that it renders unconditionally, even for a
 * brand-new customer whose bookings sections are legitimately empty, not
 * only once real booking history exists.
 */
describe('UserDashboardOverviewPage (integration, local Supabase)', () => {
  it('shows the welcome block with a working Browse Properties link, even for a brand-new customer with no bookings', async () => {
    const email = `rtl-dash-welcome-${Date.now()}@example.com`;
    await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Dashboard Welcome Test' } },
    });

    renderPage();

    expect(
      await screen.findByRole('heading', { name: /find your next home with confidence/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Compare')).toBeInTheDocument();
    expect(screen.getByText('Book a Viewing')).toBeInTheDocument();

    const browseLink = screen.getByRole('link', { name: /browse properties/i });
    expect(browseLink).toHaveAttribute('href', '/properties');

    // Bookings sections still render below, correctly empty for a new user
    // — the welcome block augments the page, it doesn't replace this.
    expect(
      await screen.findByText(/book a viewing from any property/i, {}, { timeout: 10000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your Bookings' })).toBeInTheDocument();

    await supabase.auth.signOut();
  }, 15000);
});
