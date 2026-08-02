import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AuthProvider } from '@/entities/user';
import { supabase } from '@/shared/lib/supabase';
import { HomePage } from './HomePage';
import { PropertiesPage } from './PropertiesPage';
import { PropertyDetailPage } from './PropertyDetailPage';
import { AgentDashboardOverviewPage } from './AgentDashboardOverviewPage';
import { AdminOverviewPage } from './AdminOverviewPage';
import { LoginPage } from './LoginPage';
import { AgentPropertiesPage } from './AgentPropertiesPage';
import { AdminVerificationQueuePage } from './AdminVerificationQueuePage';

// Same undici/jsdom WebSocket-teardown quirk `AgentPropertyFormPage.test.tsx`
// already worked around (Sprint 7) — `AgentPropertiesPage` mounts the same
// Realtime hook.
vi.mock('@/features/agent-properties/hooks/useAgentPropertyVerificationRealtime', () => ({
  useAgentPropertyVerificationRealtime: () => {},
}));

/**
 * Sprint 8 (Quality Assurance, roadmap.md §12/§21) — automated axe-core pass
 * across the "primary screens" the roadmap names for the Lighthouse
 * Accessibility ≥95 / "zero critical-serious axe violations" gate: home,
 * search, detail, and both dashboards. Real integration tests against the
 * local Supabase stack (seeded fixtures), not isolated component snapshots —
 * mirrors this project's existing `*.test.tsx` page-test convention.
 */
function renderWithProviders(ui: React.ReactElement, initialEntries: string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/properties/:slug" element={ui} />
            <Route path="*" element={ui} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

async function signIn(email: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password: 'seed-password-not-real' });
  if (error) throw error;
}

afterEach(async () => {
  await supabase.auth.signOut();
});

describe('Primary screens — axe accessibility (WCAG 2.2 AA)', () => {
  it('HomePage has no axe violations', async () => {
    const { container } = renderWithProviders(<HomePage />, ['/']);
    await screen.findByText(/find your next home/i);
    expect(await axe(container)).toHaveNoViolations();
  }, 15000);

  it('PropertiesPage (search) has no axe violations', async () => {
    const { container } = renderWithProviders(<PropertiesPage />, ['/properties']);
    await waitFor(() => expect(screen.queryAllByRole('link').length).toBeGreaterThan(0), { timeout: 10000 });
    expect(await axe(container)).toHaveNoViolations();
  }, 15000);

  it('PropertyDetailPage has no axe violations', async () => {
    const { container } = renderWithProviders(<PropertyDetailPage />, ['/properties/2br-apartment-kilimani-a1']);
    await screen.findByRole('heading', { level: 1 }, { timeout: 10000 });
    expect(await axe(container)).toHaveNoViolations();
  }, 15000);

  it('AgentDashboardOverviewPage has no axe violations', async () => {
    await signIn('agent2.seed@rentalhunt.test');
    const { container } = renderWithProviders(<AgentDashboardOverviewPage />, ['/dashboard']);
    await screen.findByText('Dashboard', {}, { timeout: 10000 });
    await waitFor(() => expect(screen.queryByText('Total properties')).toBeInTheDocument());
    expect(await axe(container)).toHaveNoViolations();
  }, 15000);

  it('AdminOverviewPage has no axe violations', async () => {
    await signIn('admin1.seed@rentalhunt.test');
    const { container } = renderWithProviders(<AdminOverviewPage />, ['/admin']);
    await screen.findByText('Admin Overview', {}, { timeout: 10000 });
    expect(await axe(container)).toHaveNoViolations();
  }, 15000);
});

/**
 * Additional high-risk-for-a11y screens beyond roadmap.md §21's literal
 * "primary screens" list — forms (label/focus-order risk) and table+Dialog
 * flows (Radix focus-trap/aria-describedby risk), the two component
 * categories most likely to regress silently.
 */
describe('High-risk screens (forms, dialogs) — axe accessibility', () => {
  it('LoginPage has no axe violations', async () => {
    const { container } = renderWithProviders(<LoginPage />, ['/login']);
    await screen.findByRole('button', { name: /log in/i });
    expect(await axe(container)).toHaveNoViolations();
  }, 15000);

  it('AgentPropertiesPage (table + filters) has no axe violations', async () => {
    await signIn('agent2.seed@rentalhunt.test');
    const { container } = renderWithProviders(<AgentPropertiesPage />, ['/dashboard/properties']);
    await waitFor(() => expect(screen.queryAllByRole('row').length).toBeGreaterThan(1), { timeout: 10000 });
    expect(await axe(container)).toHaveNoViolations();
  }, 15000);

  it('AdminVerificationQueuePage has no axe violations', async () => {
    await signIn('moderator1.seed@rentalhunt.test');
    const { container } = renderWithProviders(<AdminVerificationQueuePage />, ['/admin/verification-queue']);
    await screen.findByText('Verification Queue', {}, { timeout: 10000 });
    expect(await axe(container)).toHaveNoViolations();
  }, 15000);
});
