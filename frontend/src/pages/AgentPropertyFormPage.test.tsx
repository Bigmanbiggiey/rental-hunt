import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AuthProvider } from '@/entities/user';
import { supabase } from '@/shared/lib/supabase';
import { serviceClient } from '@/shared/lib/testing/rlsTestHelpers';
import { PATHS } from '@/shared/config';
import { AgentPropertyFormPage } from './AgentPropertyFormPage';

// Sprint 7: this page now mounts `useAgentPropertyVerificationRealtime()`,
// which opens a real `postgres_changes` WebSocket subscription. Stubbed out
// here (not exercised — no test in this file needs a live status change)
// because a real subscription's connection handshake can complete after
// jsdom's environment tears down, surfacing as an unrelated-looking
// uncaught `WebSocket.dispatchEvent` exception — an undici/jsdom
// compatibility quirk, the same class of "genuine environment limitation,
// not a real app bug" Sprint 6 already hit and worked around for
// `AgentBookingQueue.test.tsx`'s Radix focus-scope issue.
vi.mock('@/features/agent-properties/hooks/useAgentPropertyVerificationRealtime', () => ({
  useAgentPropertyVerificationRealtime: () => {},
}));

/**
 * Real integration test against the local Supabase stack — mirrors
 * PropertyDetailPage.test.tsx's `<Routes><Route path=":id" .../></Routes>`
 * pattern for supplying the `:id` route param. AGENT-002 (create)/AGENT-003
 * (edit). See AgentDashboardOverviewPage.test.tsx's note on the two-client
 * (app `supabase` + `serviceClient`) signup pattern.
 */
async function signUpFormAgent(name: string) {
  const email = `rtl-${name}-${Date.now()}@example.com`;
  const { data } = await supabase.auth.signUp({
    email,
    password: 'Kilimani2026',
    options: { data: { full_name: `Form ${name}` } },
  });
  const userId = data.user!.id;

  await serviceClient.from('profiles').update({ role: 'agent' }).eq('id', userId);

  const { data: agency } = await serviceClient
    .from('agencies')
    .insert({ name: `Form Test Agency ${Date.now()}`, slug: `form-test-agency-${Date.now()}` })
    .select('id')
    .single();

  const { data: agentRow } = await serviceClient
    .from('agents')
    .insert({ profile_id: userId, agency_id: agency!.id, job_title: 'Leasing Agent' })
    .select('id')
    .single();

  return { userId, agencyId: agency!.id as string, agentId: agentRow!.id as string };
}

async function createTestProperty(agencyId: string, agentId: string) {
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
      slug: `form-test-property-${Date.now()}`,
      title: 'Form Test Property Title',
      description: 'A property created for the AgentPropertyFormPage integration test.',
      property_type_id: propertyType!.id,
      county_id: county!.id,
      location_id: location!.id,
      latitude: -1.29,
      longitude: 36.78,
      bedrooms: 2,
      bathrooms: 1,
      rent_amount: 45000,
      deposit_amount: 45000,
      availability_status: 'available',
      // 'rejected' — the one verification_status excluded from guest
      // visibility (database.md §9) — so this fixture doesn't inflate
      // PropertiesPage.test.tsx's exact guest-facing count when both run in
      // the same parallel batch.
      verification_status: 'rejected',
    })
    .select('id')
    .single();
  if (error || !created) throw error ?? new Error('property insert returned no row');
  return created.id as string;
}

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={PATHS.agentDashboard.propertyEdit} element={<AgentPropertyFormPage />} />
            <Route path={PATHS.agentDashboard.propertyNew} element={<AgentPropertyFormPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AgentPropertyFormPage (integration, local Supabase)', () => {
  it('renders an empty create form with no Verification/Images sections (AGENT-002)', async () => {
    await signUpFormAgent('formCreate');

    renderAt(PATHS.agentDashboard.propertyNew);

    expect(await screen.findByRole('heading', { name: 'New listing' })).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.queryByRole('heading', { name: 'Verification' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Images' })).not.toBeInTheDocument();

    await supabase.auth.signOut();
  }, 15000);

  it('renders a pre-filled edit form with Verification and Images sections for a real property (AGENT-003)', async () => {
    const agent = await signUpFormAgent('formEdit');
    const propertyId = await createTestProperty(agent.agencyId, agent.agentId);

    renderAt(PATHS.agentDashboard.propertyEdit.replace(':id', propertyId));

    expect(await screen.findByRole('heading', { name: 'Edit listing' }, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue('Form Test Property Title');
    expect(screen.getByRole('heading', { name: 'Verification' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Images' })).toBeInTheDocument();
    expect(await screen.findByText(/no images uploaded yet/i, {}, { timeout: 10000 })).toBeInTheDocument();

    await supabase.auth.signOut();
  }, 15000);

  it('shows a not-found message for a property belonging to a different agency', async () => {
    const ownerAgent = await signUpFormAgent('formOwner');
    const propertyId = await createTestProperty(ownerAgent.agencyId, ownerAgent.agentId);
    await supabase.auth.signOut();

    await signUpFormAgent('formOther');
    renderAt(PATHS.agentDashboard.propertyEdit.replace(':id', propertyId));

    expect(
      await screen.findByText(/this property could not be found/i, {}, { timeout: 10000 }),
    ).toBeInTheDocument();

    await supabase.auth.signOut();
  }, 15000);
});
