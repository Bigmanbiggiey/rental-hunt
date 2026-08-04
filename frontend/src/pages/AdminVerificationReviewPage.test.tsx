import { afterAll, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AuthProvider } from '@/entities/user';
import { supabase } from '@/shared/lib/supabase';
import { serviceClient } from '@/shared/lib/testing/rlsTestHelpers';
import { PATHS } from '@/shared/config';
import { AdminVerificationReviewPage } from './AdminVerificationReviewPage';

/**
 * Real integration test against the local Supabase stack, mirroring
 * `AgentPropertyFormPage.test.tsx`'s two-client (app `supabase` singleton +
 * `serviceClient`) signup pattern — this page's data comes through
 * `getByIdAdmin()`, so RLS's `properties_select_all_moderator_admin` policy
 * is the real thing being exercised, not a mock.
 *
 * Every fixture created here is `pending_verification` — unlike a status
 * that's merely excluded from *guest* visibility, this one shows up directly
 * in the real Verification Queue/Agencies list any dev session would see, so
 * (unlike some existing RLS test files' looser precedent) this file tracks
 * and deletes everything it creates rather than leaving it for the next
 * `supabase db reset` — found via a real manual browser pass during this
 * task leaving stray "Review Test..." rows visible in the live queue.
 */
const createdPropertyIds: string[] = [];
const createdAgencyIds: string[] = [];
afterAll(async () => {
  if (createdPropertyIds.length > 0) {
    await serviceClient.from('properties').delete().in('id', createdPropertyIds);
  }
  if (createdAgencyIds.length > 0) {
    await serviceClient.from('agencies').delete().in('id', createdAgencyIds);
  }
});

async function signUpReviewer(name: string, role: 'moderator' | 'admin') {
  const email = `rtl-${name}-${Date.now()}@example.com`;
  const { data } = await supabase.auth.signUp({
    email,
    password: 'Kilimani2026',
    options: { data: { full_name: `Review ${name}` } },
  });
  const userId = data.user!.id;
  await serviceClient.from('profiles').update({ role }).eq('id', userId);
  return userId;
}

async function createPendingProperty() {
  const { data: agency } = await serviceClient
    .from('agencies')
    .insert({ name: `Review Test Agency ${Date.now()}`, slug: `review-test-agency-${Date.now()}` })
    .select('id')
    .single();

  const { data: agentSignup } = await supabase.auth.signUp({
    email: `rtl-reviewAgent-${Date.now()}@example.com`,
    password: 'Kilimani2026',
    options: { data: { full_name: 'Review Test Agent' } },
  });
  await serviceClient.from('profiles').update({ role: 'agent' }).eq('id', agentSignup.user!.id);
  const { data: agentRow } = await serviceClient
    .from('agents')
    .insert({ profile_id: agentSignup.user!.id, agency_id: agency!.id, job_title: 'Leasing Agent' })
    .select('id')
    .single();
  await supabase.auth.signOut();

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
      agency_id: agency!.id,
      agent_id: agentRow!.id,
      slug: `review-test-property-${Date.now()}`,
      title: 'Review Test Property Title',
      description: 'A property created for the AdminVerificationReviewPage integration test.',
      property_type_id: propertyType!.id,
      county_id: county!.id,
      location_id: location!.id,
      latitude: -1.29,
      longitude: 36.78,
      bedrooms: 3,
      bathrooms: 2,
      rent_amount: 60000,
      deposit_amount: 60000,
      availability_status: 'available',
      verification_status: 'pending_verification',
    })
    .select('id')
    .single();
  if (error || !created) throw error ?? new Error('property insert returned no row');
  createdAgencyIds.push(agency!.id as string);
  createdPropertyIds.push(created.id as string);
  return created.id as string;
}

function renderAt(propertyId: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[PATHS.adminDashboard.verificationReview.replace(':id', propertyId)]}>
          <Routes>
            <Route path={PATHS.adminDashboard.verificationReview} element={<AdminVerificationReviewPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AdminVerificationReviewPage (integration, local Supabase)', () => {
  it('shows the full listing — gallery/title/price/description/amenities/agent/bed-bath — for a real admin', async () => {
    const propertyId = await createPendingProperty();
    await signUpReviewer('reviewAdmin', 'admin');

    renderAt(propertyId);

    expect(
      await screen.findByRole('heading', { name: 'Review Test Property Title' }, { timeout: 10000 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/rent: kes 60,000\/mo/i)).toBeInTheDocument();
    expect(screen.getByText(/a property created for the adminverificationreviewpage/i)).toBeInTheDocument();
    expect(screen.getByText('Review Test Agent')).toBeInTheDocument();
    expect(screen.getByText('3 beds')).toBeInTheDocument();
    expect(screen.getByText('2 baths')).toBeInTheDocument();
    expect(screen.getByText('Pending Verification')).toBeInTheDocument();

    await supabase.auth.signOut();
  }, 15000);

  it('approves a listing — the decision is really written to the database, not just the UI', async () => {
    const propertyId = await createPendingProperty();
    await signUpReviewer('reviewApprove', 'moderator');

    renderAt(propertyId);

    const approveButton = await screen.findByRole('button', { name: /approve/i }, { timeout: 10000 });
    fireEvent.click(approveButton);

    await waitFor(async () => {
      const { data } = await serviceClient
        .from('properties')
        .select('verification_status')
        .eq('id', propertyId)
        .single();
      expect(data?.verification_status).toBe('verified');
    });

    await supabase.auth.signOut();
  }, 15000);

  it('blocks rejecting with no reason, then rejects with a reason once one is entered', async () => {
    const propertyId = await createPendingProperty();
    await signUpReviewer('reviewReject', 'admin');

    renderAt(propertyId);

    const rejectButton = await screen.findByRole('button', { name: /reject/i }, { timeout: 10000 });
    fireEvent.click(rejectButton);
    expect(await screen.findByText(/a reason is required/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/reason/i), {
      target: { value: 'Photos do not match the description.' },
    });
    fireEvent.click(rejectButton);

    await waitFor(async () => {
      const { data } = await serviceClient
        .from('properties')
        .select('verification_status')
        .eq('id', propertyId)
        .single();
      expect(data?.verification_status).toBe('rejected');
    });

    const { data: history } = await serviceClient
      .from('property_verifications')
      .select('reason')
      .eq('property_id', propertyId)
      .eq('new_status', 'rejected')
      .single();
    expect(history?.reason).toBe('Photos do not match the description.');

    await supabase.auth.signOut();
  }, 15000);
});
