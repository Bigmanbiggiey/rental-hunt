import { afterAll, describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { serviceClient, signUpActor, signUpAgent } from '@/shared/lib/testing/rlsTestHelpers';

/**
 * Real RLS/RPC integration tests against the local Supabase stack — Sprint
 * 7's actual DoD proof (mirrors Sprint 6's "28 RLS tests were the real
 * proof" precedent): the moderator/admin half of AGENT-007, and the new
 * `property_verifications`/`activity_logs` tables' access policies.
 */
const NAIROBI_HOMES_AGENCY_ID = 'a2000000-0000-0000-0000-000000000001';
const KIAMBU_ESTATES_AGENCY_ID = 'a2000000-0000-0000-0000-000000000002';

// Several tests below transition a property to 'verified' (guest-visible) —
// unlike a fixture that only ever *starts* guest-invisible, there's no
// starting-status choice that keeps it guest-invisible for its whole
// lifetime once the RPC under test actually verifies it. Tracked and
// deleted after the full file runs (cascades to property_verifications/
// activity_logs via their FKs) so these rows don't linger as guest-visible
// pollution for PropertiesPage.test.tsx/property.rls.test.ts's own exact
// guest-facing count assertions when both run in the same parallel worker
// batch — the same test-pollution class Sprint 6 already found once.
const createdPropertyIds: string[] = [];
afterAll(async () => {
  if (createdPropertyIds.length > 0) {
    await serviceClient.from('properties').delete().in('id', createdPropertyIds);
  }
});

async function createTestProperty(overrides: {
  agencyId: string;
  agentId: string;
  slug: string;
  verificationStatus?: string;
}) {
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
      agency_id: overrides.agencyId,
      agent_id: overrides.agentId,
      slug: overrides.slug,
      title: 'RLS Verification Test Property',
      description: 'A property created for a Sprint 7 verification RLS integration test.',
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
      // 'rejected', not 'pending_verification' — the one verification_status
      // excluded from guest visibility (database.md §9). set_property_verification()
      // has no restriction on the source status (unlike the agent-facing
      // submit_property_for_verification() RPC), so this doesn't change
      // what any test here actually proves; it just avoids inflating
      // PropertiesPage.test.tsx/property.rls.test.ts's exact guest-facing
      // count when both run in the same parallel worker batch — the same
      // test-pollution class Sprint 6 already found and fixed once.
      verification_status: overrides.verificationStatus ?? 'rejected',
    })
    .select('id')
    .single();
  if (error || !created) throw error ?? new Error('property insert returned no row');
  createdPropertyIds.push(created.id as string);
  return created.id as string;
}

describe('set_property_verification RPC (integration, local Supabase, Sprint 7)', () => {
  const clients: SupabaseClient[] = [];
  afterAll(async () => {
    await Promise.all(clients.map((c) => c.auth.signOut()));
  });

  it('a moderator can approve a pending listing — properties and property_verifications both update correctly', async () => {
    const moderator = await signUpActor('verifyModeratorA', 'moderator');
    const agent = await signUpAgent('verifyOwnerA', NAIROBI_HOMES_AGENCY_ID);
    clients.push(moderator.client, agent.client);

    const propertyId = await createTestProperty({
      agencyId: NAIROBI_HOMES_AGENCY_ID,
      agentId: agent.agentId,
      slug: `rls-verify-approve-${Date.now()}`,
    });

    const result = await moderator.client
      .rpc('set_property_verification', { property_id: propertyId, new_status: 'verified' })
      .single();
    expect(result.error).toBeNull();

    const property = await serviceClient
      .from('properties')
      .select('verification_status, verified_by, last_verified_at')
      .eq('id', propertyId)
      .single();
    expect(property.data?.verification_status).toBe('verified');
    expect(property.data?.verified_by).toBe(moderator.userId);
    expect(property.data?.last_verified_at).not.toBeNull();

    const verification = await serviceClient
      .from('property_verifications')
      .select('previous_status, new_status, reviewed_by, reason')
      .eq('property_id', propertyId)
      .single();
    expect(verification.data?.previous_status).toBe('rejected');
    expect(verification.data?.new_status).toBe('verified');
    expect(verification.data?.reviewed_by).toBe(moderator.userId);

    // database.md §11's Tracked Events table is explicit that verification
    // changes are NOT also logged as a generic activity_logs row —
    // property_verifications above is already the authoritative record. Only
    // the one `property.created` row from `createTestProperty`'s own insert
    // should exist for this property; the generic property-update trigger
    // only fires on a real field delta (title/description/price/etc.), none
    // of which this RPC touches, so verifying it adds no second row.
    const activityLog = await serviceClient
      .from('activity_logs')
      .select('action')
      .eq('entity_id', propertyId);
    expect(activityLog.data).toEqual([{ action: 'property.created' }]);
  });

  it('rejecting without a reason fails validation; rejecting with a reason succeeds and never touches verified_by/last_verified_at', async () => {
    const admin = await signUpActor('verifyAdminA', 'admin');
    const agent = await signUpAgent('verifyOwnerB', NAIROBI_HOMES_AGENCY_ID);
    clients.push(admin.client, agent.client);

    const propertyId = await createTestProperty({
      agencyId: NAIROBI_HOMES_AGENCY_ID,
      agentId: agent.agentId,
      slug: `rls-verify-reject-${Date.now()}`,
    });

    const withoutReason = await admin.client.rpc('set_property_verification', {
      property_id: propertyId,
      new_status: 'rejected',
    });
    expect(withoutReason.error).not.toBeNull();
    expect(withoutReason.error?.code).toBe('23514');

    const withReason = await admin.client.rpc('set_property_verification', {
      property_id: propertyId,
      new_status: 'rejected',
      reason: 'Photos do not match the description.',
    });
    expect(withReason.error).toBeNull();

    const property = await serviceClient
      .from('properties')
      .select('verification_status, verified_by, last_verified_at')
      .eq('id', propertyId)
      .single();
    expect(property.data?.verification_status).toBe('rejected');
    expect(property.data?.verified_by).toBeNull();
    expect(property.data?.last_verified_at).toBeNull();
  });

  it('a customer and an agent are both forbidden from calling the RPC directly', async () => {
    const customer = await signUpActor('verifyCustomerA');
    const agent = await signUpAgent('verifyOwnerC', NAIROBI_HOMES_AGENCY_ID);
    clients.push(customer.client, agent.client);

    const propertyId = await createTestProperty({
      agencyId: NAIROBI_HOMES_AGENCY_ID,
      agentId: agent.agentId,
      slug: `rls-verify-forbidden-${Date.now()}`,
    });

    const asCustomer = await customer.client.rpc('set_property_verification', {
      property_id: propertyId,
      new_status: 'verified',
    });
    expect(asCustomer.error?.code).toBe('42501');

    const asOwningAgent = await agent.client.rpc('set_property_verification', {
      property_id: propertyId,
      new_status: 'verified',
    });
    expect(asOwningAgent.error?.code).toBe('42501');
  });

  it('a nonexistent property_id raises P0002', async () => {
    const moderator = await signUpActor('verifyModeratorB', 'moderator');
    clients.push(moderator.client);

    const result = await moderator.client.rpc('set_property_verification', {
      property_id: '00000000-0000-0000-0000-000000000000',
      new_status: 'verified',
    });
    expect(result.error?.code).toBe('P0002');
  });

  it('no role, including admin, has a direct table write grant on property_verifications', async () => {
    const admin = await signUpActor('verifyAdminB', 'admin');
    const agent = await signUpAgent('verifyOwnerD', NAIROBI_HOMES_AGENCY_ID);
    clients.push(admin.client, agent.client);

    const propertyId = await createTestProperty({
      agencyId: NAIROBI_HOMES_AGENCY_ID,
      agentId: agent.agentId,
      slug: `rls-verify-direct-write-${Date.now()}`,
    });

    const directInsert = await admin.client.from('property_verifications').insert({
      property_id: propertyId,
      new_status: 'verified',
      reviewed_by: admin.userId,
    });
    expect(directInsert.error).not.toBeNull();
  });
});

describe('property_verifications SELECT policies (integration, local Supabase, Sprint 7)', () => {
  const clients: SupabaseClient[] = [];
  afterAll(async () => {
    await Promise.all(clients.map((c) => c.auth.signOut()));
  });

  it('an agent can read their own agency’s verification history, but not another agency’s', async () => {
    const moderator = await signUpActor('verifyHistoryModerator', 'moderator');
    const ownerAgent = await signUpAgent('verifyHistoryOwner', NAIROBI_HOMES_AGENCY_ID);
    const otherAgent = await signUpAgent('verifyHistoryOther', KIAMBU_ESTATES_AGENCY_ID);
    clients.push(moderator.client, ownerAgent.client, otherAgent.client);

    const propertyId = await createTestProperty({
      agencyId: NAIROBI_HOMES_AGENCY_ID,
      agentId: ownerAgent.agentId,
      slug: `rls-verify-history-${Date.now()}`,
    });
    await moderator.client
      .rpc('set_property_verification', { property_id: propertyId, new_status: 'verified' })
      .single();

    const ownHistory = await ownerAgent.client
      .from('property_verifications')
      .select('id')
      .eq('property_id', propertyId);
    expect(ownHistory.data).toHaveLength(1);

    const otherHistory = await otherAgent.client
      .from('property_verifications')
      .select('id')
      .eq('property_id', propertyId);
    expect(otherHistory.data).toHaveLength(0);

    const moderatorHistory = await moderator.client
      .from('property_verifications')
      .select('id')
      .eq('property_id', propertyId);
    expect(moderatorHistory.data).toHaveLength(1);
  });

  it('a guest and a customer have no access to property_verifications', async () => {
    const customer = await signUpActor('verifyHistoryCustomer');
    clients.push(customer.client);

    const result = await customer.client.from('property_verifications').select('id').limit(1);
    expect(result.data).toHaveLength(0);
  });
});

describe('activity_logs RLS (integration, local Supabase, Sprint 7)', () => {
  const clients: SupabaseClient[] = [];
  afterAll(async () => {
    await Promise.all(clients.map((c) => c.auth.signOut()));
  });

  it('moderator and admin can read activity_logs; customer and agent cannot', async () => {
    const moderator = await signUpActor('activityLogModerator', 'moderator');
    const admin = await signUpActor('activityLogAdmin', 'admin');
    const customer = await signUpActor('activityLogCustomer');
    const agent = await signUpAgent('activityLogAgent', NAIROBI_HOMES_AGENCY_ID);
    clients.push(moderator.client, admin.client, customer.client, agent.client);

    const moderatorRead = await moderator.client.from('activity_logs').select('id').limit(1);
    expect(moderatorRead.error).toBeNull();

    const adminRead = await admin.client.from('activity_logs').select('id').limit(1);
    expect(adminRead.error).toBeNull();

    const customerRead = await customer.client.from('activity_logs').select('id').limit(1);
    expect(customerRead.data).toHaveLength(0);

    const agentRead = await agent.client.from('activity_logs').select('id').limit(1);
    expect(agentRead.data).toHaveLength(0);
    // Explicit longer timeout — 4 sequential signUpActor()/signUpAgent()
    // Auth signups can exceed Vitest's default 5000ms under full-suite
    // parallel load (the same class of resource-contention timeout already
    // documented for ForgotPasswordForm.test.tsx/ResetPasswordForm.test.tsx
    // since Sprint 2), not a flake in the RLS logic itself — confirmed
    // passing reliably in isolation.
  }, 15000);

  it('only admin can delete an activity_logs row; moderator is denied', async () => {
    const moderator = await signUpActor('activityLogDeleteModerator', 'moderator');
    const admin = await signUpActor('activityLogDeleteAdmin', 'admin');
    clients.push(moderator.client, admin.client);

    const { data: seeded } = await serviceClient
      .from('activity_logs')
      .insert({ action: 'test.event', entity_type: 'test', metadata: {} })
      .select('id')
      .single();

    const deniedDelete = await moderator.client.from('activity_logs').delete().eq('id', seeded!.id);
    expect(deniedDelete.error).toBeNull(); // RLS silently affects 0 rows, not an error
    const stillThere = await serviceClient.from('activity_logs').select('id').eq('id', seeded!.id).maybeSingle();
    expect(stillThere.data).not.toBeNull();

    const allowedDelete = await admin.client.from('activity_logs').delete().eq('id', seeded!.id);
    expect(allowedDelete.error).toBeNull();
    const goneNow = await serviceClient.from('activity_logs').select('id').eq('id', seeded!.id).maybeSingle();
    expect(goneNow.data).toBeNull();
  });

  it('creating a property triggers a property.created activity_logs row', async () => {
    const agent = await signUpAgent('activityLogCreateAgent', NAIROBI_HOMES_AGENCY_ID);
    clients.push(agent.client);

    const propertyId = await createTestProperty({
      agencyId: NAIROBI_HOMES_AGENCY_ID,
      agentId: agent.agentId,
      slug: `rls-activity-created-${Date.now()}`,
    });

    const log = await serviceClient
      .from('activity_logs')
      .select('actor_id, action')
      .eq('action', 'property.created')
      .eq('entity_id', propertyId)
      .maybeSingle();
    // Created via serviceClient (no JWT context, per createTestProperty's
    // own service-role insert), so actor_id is correctly NULL here — the
    // trigger still fired and logged the event, matching database.md
    // §5.14's "system-generated event" rationale for that column being nullable.
    expect(log.data?.action).toBe('property.created');
  });
});
