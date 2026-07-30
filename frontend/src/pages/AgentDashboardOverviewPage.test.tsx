import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from '@/entities/user';
import { supabase } from '@/shared/lib/supabase';
import { serviceClient, signUpActor } from '@/shared/lib/testing/rlsTestHelpers';
import { AgentDashboardOverviewPage } from './AgentDashboardOverviewPage';

/**
 * Real integration test against the local Supabase stack — mirrors
 * FavoritesPage.test.tsx's AuthProvider-wrapped pattern. AGENT-001.
 *
 * Signs up through the app's own `supabase` singleton (so `AuthProvider`'s
 * session picks it up), then promotes/links the `agents` row via
 * `serviceClient` (service_role, bypassing RLS) — same two-client split
 * FavoritesPage.test.tsx and the entities-layer RLS tests both already use.
 * A brand-new agency is created per test run (not one of the two seeded
 * agencies) so property/viewing-request counts are exact, not polluted by
 * seed data or other tests' accumulated fixtures.
 */
async function signUpDashboardAgent(name: string) {
  const email = `rtl-${name}-${Date.now()}@example.com`;
  const { data } = await supabase.auth.signUp({
    email,
    password: 'Kilimani2026',
    options: { data: { full_name: `Dashboard ${name}` } },
  });
  const userId = data.user!.id;

  await serviceClient.from('profiles').update({ role: 'agent' }).eq('id', userId);

  const { data: agency } = await serviceClient
    .from('agencies')
    .insert({ name: `Dashboard Test Agency ${Date.now()}`, slug: `dashboard-test-agency-${Date.now()}` })
    .select('id')
    .single();

  const { data: agentRow } = await serviceClient
    .from('agents')
    .insert({ profile_id: userId, agency_id: agency!.id, job_title: 'Leasing Agent' })
    .select('id')
    .single();

  return { userId, agencyId: agency!.id as string, agentId: agentRow!.id as string };
}

async function createTestProperty(agencyId: string, agentId: string, slug: string, isArchived = false) {
  const { data: propertyType } = await serviceClient.from('property_types').select('id').limit(1).single();
  const { data: county } = await serviceClient.from('counties').select('id').limit(1).single();
  const { data: location } = await serviceClient
    .from('locations')
    .select('id')
    .eq('county_id', county!.id)
    .limit(1)
    .single();

  const { data: created, error } = await serviceClient
    .from('properties')
    .insert({
      agency_id: agencyId,
      agent_id: agentId,
      slug,
      title: 'Dashboard Test Property',
      description: 'A property created for the AgentDashboardOverviewPage integration test.',
      property_type_id: propertyType!.id,
      county_id: county!.id,
      location_id: location!.id,
      latitude: -1.29,
      longitude: 36.78,
      bedrooms: 2,
      bathrooms: 1,
      rent_amount: 40000,
      deposit_amount: 40000,
      availability_status: 'available',
      // 'rejected' — the one verification_status excluded from guest
      // visibility (database.md §9) — so this fixture doesn't inflate
      // PropertiesPage.test.tsx's exact guest-facing count when both run in
      // the same parallel batch. The dashboard's own counts don't filter by
      // verification_status at all, so this has no effect on what's asserted.
      verification_status: 'rejected',
      is_archived: isArchived,
    })
    .select('id')
    .single();
  if (error || !created) throw error ?? new Error('property insert returned no row');
  return created.id as string;
}

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <AgentDashboardOverviewPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AgentDashboardOverviewPage (integration, local Supabase)', () => {
  it('shows all-zero stat cards for a brand-new agent with no properties or viewing requests', async () => {
    await signUpDashboardAgent('dashEmpty');

    renderDashboard();

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    const cards = await screen.findAllByText('0');
    expect(cards.length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText('Total properties')).toBeInTheDocument();
    expect(screen.getByText('Active listings')).toBeInTheDocument();
    expect(screen.getByText('Pending viewings')).toBeInTheDocument();
    expect(screen.getByText('Completed viewings')).toBeInTheDocument();

    await supabase.auth.signOut();
  });

  it('counts only this agent’s own agency properties and own assigned viewing requests', async () => {
    const agent = await signUpDashboardAgent('dashCounts');
    const activeProperty = await createTestProperty(agent.agencyId, agent.agentId, `dash-active-${Date.now()}`);
    await createTestProperty(agent.agencyId, agent.agentId, `dash-archived-${Date.now()}`, true);

    const customer = await signUpActor('dashCustomer');
    await serviceClient.from('viewing_requests').insert([
      {
        customer_id: customer.userId,
        property_id: activeProperty,
        agent_id: agent.agentId,
        requested_date: '2026-08-15',
        requested_time: '14:00',
        status: 'pending',
      },
      {
        customer_id: customer.userId,
        property_id: activeProperty,
        agent_id: agent.agentId,
        requested_date: '2026-08-01',
        requested_time: '10:00',
        status: 'completed',
      },
    ]);

    renderDashboard();

    const totalCard = (await screen.findByText('Total properties', {}, { timeout: 10000 }))
      .closest('div')!.parentElement!;
    expect(within(totalCard).getByText('2')).toBeInTheDocument();

    const activeCard = screen.getByText('Active listings').closest('div')!.parentElement!;
    expect(within(activeCard).getByText('1')).toBeInTheDocument();

    const pendingCard = screen.getByText('Pending viewings').closest('div')!.parentElement!;
    expect(within(pendingCard).getByText('1')).toBeInTheDocument();

    const completedCard = screen.getByText('Completed viewings').closest('div')!.parentElement!;
    expect(within(completedCard).getByText('1')).toBeInTheDocument();

    await supabase.auth.signOut();
  }, 15000);
});
