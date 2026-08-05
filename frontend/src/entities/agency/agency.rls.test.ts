import { afterAll, describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { ANON_KEY, SUPABASE_URL, serviceClient, signUpActor } from '@/shared/lib/testing/rlsTestHelpers';

/**
 * Real RLS integration tests against the local Supabase stack — proves
 * database.md §9's `agencies` Policy Summary row for Sprint 7's new
 * `entities/agency` slice (the existing Sprint 3 RLS policies themselves are
 * unchanged; this is the slice's first real exercise of them).
 */
const guest = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

describe('agencies RLS (integration, local Supabase, Sprint 7)', () => {
  const clients: SupabaseClient[] = [];
  afterAll(async () => {
    await Promise.all(clients.map((c) => c.auth.signOut()));
  });

  it('an admin can create an (already-approved) agency; agent/moderator cannot insert at all', async () => {
    const admin = await signUpActor('agencyAdminA', 'admin');
    const agent = await signUpActor('agencyAgentA', 'agent');
    const moderator = await signUpActor('agencyModeratorA', 'moderator');
    clients.push(admin.client, agent.client, moderator.client);

    const asAdmin = await admin.client
      .from('agencies')
      .insert({ name: 'RLS Test Agency', slug: `rls-test-agency-${Date.now()}` })
      .select('id, onboarding_status, is_active')
      .single();
    expect(asAdmin.error).toBeNull();
    expect(asAdmin.data?.id).toBeDefined();
    // Admin's own create flow is untouched by Epic 12's self-service trigger
    // (enforce_agency_onboarding_status() only narrows a 'customer' caller).
    expect(asAdmin.data?.onboarding_status).toBe('approved');
    expect(asAdmin.data?.is_active).toBe(true);

    // A bare customer INSERT with no `.select()` (no RETURNING) is not denied
    // outright anymore — Epic 12 lets a customer self-apply — but it isn't
    // exercised here; see the dedicated "self-apply" tests below for the
    // full, trigger-narrowed behavior. Agent/moderator still have no INSERT
    // policy on `agencies` at all, unaffected by Epic 12.
    const asAgent = await agent.client
      .from('agencies')
      .insert({ name: 'Denied Agency', slug: `denied-agency-${Date.now()}` });
    expect(asAgent.error).not.toBeNull();

    const asModerator = await moderator.client
      .from('agencies')
      .insert({ name: 'Denied Agency 2', slug: `denied-agency-2-${Date.now()}` });
    expect(asModerator.error).not.toBeNull();
  });

  it('an admin can deactivate an agency; a guest then loses visibility while agent/moderator/admin retain it', async () => {
    const admin = await signUpActor('agencyAdminB', 'admin');
    const agent = await signUpActor('agencyAgentB', 'agent');
    clients.push(admin.client, agent.client);

    const { data: created } = await serviceClient
      .from('agencies')
      .insert({ name: 'Deactivation Test Agency', slug: `deactivation-test-${Date.now()}`, is_active: true })
      .select('id')
      .single();
    const agencyId = created!.id as string;

    const guestBefore = await guest.from('agencies').select('id').eq('id', agencyId).maybeSingle();
    expect(guestBefore.data?.id).toBe(agencyId);

    const update = await admin.client.from('agencies').update({ is_active: false }).eq('id', agencyId);
    expect(update.error).toBeNull();

    const guestAfter = await guest.from('agencies').select('id').eq('id', agencyId).maybeSingle();
    expect(guestAfter.data).toBeNull();

    const agentAfter = await agent.client.from('agencies').select('id').eq('id', agencyId).maybeSingle();
    expect(agentAfter.data?.id).toBe(agencyId);
  });

  it('a customer can self-apply; the trigger forces pending_review/is_active=false regardless of client input, and the agency is not guest-visible yet', async () => {
    const customer = await signUpActor('agencyApplicantA');
    clients.push(customer.client);

    const { data, error } = await customer.client
      .from('agencies')
      .insert({
        name: 'Self-Service Agency A',
        slug: `self-service-agency-a-${Date.now()}`,
        applied_by: customer.userId,
        // A malicious client trying to skip review entirely — the trigger
        // must override both of these, not just accept them.
        onboarding_status: 'approved',
        is_active: true,
      })
      .select('id, onboarding_status, is_active, applied_by')
      .single();

    expect(error).toBeNull();
    expect(data?.onboarding_status).toBe('pending_review');
    expect(data?.is_active).toBe(false);
    expect(data?.applied_by).toBe(customer.userId);

    const guestSees = await guest.from('agencies').select('id').eq('id', data!.id).maybeSingle();
    expect(guestSees.data).toBeNull();
  });

  it('a customer cannot spoof applied_by as someone else — the trigger forces it to the real caller', async () => {
    const customer = await signUpActor('agencyApplicantB');
    const other = await signUpActor('agencyApplicantC');
    clients.push(customer.client, other.client);

    const { data, error } = await customer.client
      .from('agencies')
      .insert({
        name: 'Spoofed Applicant Agency',
        slug: `spoofed-applicant-agency-${Date.now()}`,
        applied_by: other.userId,
      })
      .select('applied_by')
      .single();

    expect(error).toBeNull();
    expect(data?.applied_by).toBe(customer.userId);
    expect(data?.applied_by).not.toBe(other.userId);
  });

  it('only an admin can approve/reject an agency application; approval promotes the applicant to agent and creates their agents row', async () => {
    const admin = await signUpActor('agencyApproveAdminA', 'admin');
    const agent = await signUpActor('agencyApproveAgentA', 'agent');
    const applicant = await signUpActor('agencyApplicantD');
    clients.push(admin.client, agent.client, applicant.client);

    const { data: applied } = await applicant.client
      .from('agencies')
      .insert({
        name: 'Pending Approval Agency A',
        slug: `pending-approval-agency-a-${Date.now()}`,
        applied_by: applicant.userId,
      })
      .select('id')
      .single();
    const agencyId = applied!.id as string;

    const asAgent = await agent.client.rpc('approve_agency_application', { p_agency_id: agencyId });
    expect(asAgent.error).not.toBeNull();

    const asAdmin = await admin.client.rpc('approve_agency_application', { p_agency_id: agencyId });
    expect(asAdmin.error).toBeNull();
    expect(asAdmin.data?.onboarding_status).toBe('approved');
    expect(asAdmin.data?.is_active).toBe(true);

    const { data: promotedProfile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', applicant.userId)
      .single();
    expect(promotedProfile?.role).toBe('agent');

    const { data: agentRow } = await serviceClient
      .from('agents')
      .select('agency_id')
      .eq('profile_id', applicant.userId)
      .single();
    expect(agentRow?.agency_id).toBe(agencyId);

    // Approving an already-approved application is rejected (not pending anymore).
    const reapprove = await admin.client.rpc('approve_agency_application', { p_agency_id: agencyId });
    expect(reapprove.error).not.toBeNull();
    expect(reapprove.error?.code).toBe('RH002');
  });

  it('rejecting an agency application requires a reason and does not touch is_active', async () => {
    const admin = await signUpActor('agencyApproveAdminB', 'admin');
    const applicant = await signUpActor('agencyApplicantE');
    clients.push(admin.client, applicant.client);

    const { data: applied } = await applicant.client
      .from('agencies')
      .insert({
        name: 'Pending Approval Agency B',
        slug: `pending-approval-agency-b-${Date.now()}`,
        applied_by: applicant.userId,
      })
      .select('id')
      .single();
    const agencyId = applied!.id as string;

    const withoutReason = await admin.client.rpc('reject_agency_application', { p_agency_id: agencyId });
    expect(withoutReason.error).not.toBeNull();

    const withReason = await admin.client.rpc('reject_agency_application', {
      p_agency_id: agencyId,
      p_reason: 'Duplicate submission.',
    });
    expect(withReason.error).toBeNull();
    expect(withReason.data?.onboarding_status).toBe('rejected');
    expect(withReason.data?.is_active).toBe(false);
    expect(withReason.data?.rejection_reason).toBe('Duplicate submission.');
  });
});
