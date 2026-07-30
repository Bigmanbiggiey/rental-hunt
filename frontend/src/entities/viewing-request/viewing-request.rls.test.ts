import { afterAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Real RLS integration tests against the local Supabase stack, mirroring
 * `entities/user/profile.rls.test.ts`'s isolated-per-actor pattern —
 * database.md §9's `viewing_requests` policies, the
 * `prevent_booking_unavailable_property()` trigger, and the
 * `requested_date >= current_date` CHECK constraint.
 */
const SUPABASE_URL = 'http://127.0.0.1:54321';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const AVAILABLE_SLUG = '2br-apartment-kilimani-a1';
const OCCUPIED_SLUG = 'townhouse-lavington-a4';
const ARCHIVED_SLUG = 'bungalow-ngong-road-a9';

function actorClient(name: string): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, storageKey: `test-vr-actor-${name}-${Date.now()}` },
  });
}

const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function signUpActor(name: string, role?: 'agent' | 'moderator' | 'admin') {
  const client = actorClient(name);
  const email = `rls-vr-${name}-${Date.now()}@example.com`;
  const { data, error } = await client.auth.signUp({
    email,
    password: 'Kilimani2026',
    options: { data: { full_name: `RLS ${name}` } },
  });
  if (error || !data.user) throw error ?? new Error('signUp returned no user');
  if (role) {
    const { error: promoteError } = await serviceClient
      .from('profiles')
      .update({ role })
      .eq('id', data.user.id);
    if (promoteError) throw promoteError;
  }
  return { client, userId: data.user.id };
}

async function property(slug: string): Promise<{ id: string; agent_id: string }> {
  const { data, error } = await serviceClient
    .from('properties')
    .select('id, agent_id')
    .eq('slug', slug)
    .single();
  if (error || !data) throw error ?? new Error(`fixture property not found: ${slug}`);
  return data;
}

function tomorrow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function yesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

const createdClients: SupabaseClient[] = [];

describe('viewing_requests RLS (integration, local Supabase)', () => {
  afterAll(async () => {
    await Promise.all(createdClients.map((c) => c.auth.signOut()));
  });

  it('a customer can create a viewing request on an available property', async () => {
    const customer = await signUpActor('customerA');
    createdClients.push(customer.client);
    const prop = await property(AVAILABLE_SLUG);

    const { data, error } = await customer.client
      .from('viewing_requests')
      .insert({
        customer_id: customer.userId,
        property_id: prop.id,
        agent_id: prop.agent_id,
        requested_date: tomorrow(),
        requested_time: '14:00',
      })
      .select('id, status')
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe('pending');
  });

  it('the prevent_booking_unavailable_property trigger rejects a booking on an occupied property', async () => {
    const customer = await signUpActor('customerB');
    createdClients.push(customer.client);
    const prop = await property(OCCUPIED_SLUG);

    const { error } = await customer.client.from('viewing_requests').insert({
      customer_id: customer.userId,
      property_id: prop.id,
      agent_id: prop.agent_id,
      requested_date: tomorrow(),
      requested_time: '14:00',
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('RH001');
  });

  it('the trigger rejects a booking on an archived property', async () => {
    const customer = await signUpActor('customerC');
    createdClients.push(customer.client);
    const prop = await property(ARCHIVED_SLUG);

    const { error } = await customer.client.from('viewing_requests').insert({
      customer_id: customer.userId,
      property_id: prop.id,
      agent_id: prop.agent_id,
      requested_date: tomorrow(),
      requested_time: '14:00',
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('RH001');
  });

  it('the requested_date CHECK constraint rejects a past date even if the Service check is bypassed', async () => {
    const customer = await signUpActor('customerD');
    createdClients.push(customer.client);
    const prop = await property(AVAILABLE_SLUG);

    const { error } = await customer.client.from('viewing_requests').insert({
      customer_id: customer.userId,
      property_id: prop.id,
      agent_id: prop.agent_id,
      requested_date: yesterday(),
      requested_time: '14:00',
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('23514'); // check_violation
  });

  it('a customer sees only their own viewing requests', async () => {
    const customerA = await signUpActor('customerE');
    const customerB = await signUpActor('customerF');
    createdClients.push(customerA.client, customerB.client);
    const prop = await property(AVAILABLE_SLUG);

    await customerA.client.from('viewing_requests').insert({
      customer_id: customerA.userId,
      property_id: prop.id,
      agent_id: prop.agent_id,
      requested_date: tomorrow(),
      requested_time: '10:00',
    });

    const bView = await customerB.client
      .from('viewing_requests')
      .select('id')
      .eq('customer_id', customerA.userId);
    expect(bView.data).toHaveLength(0);
  });

  it('a customer can cancel their own pending request', async () => {
    const customer = await signUpActor('customerG');
    createdClients.push(customer.client);
    const prop = await property(AVAILABLE_SLUG);

    const { data: created } = await customer.client
      .from('viewing_requests')
      .insert({
        customer_id: customer.userId,
        property_id: prop.id,
        agent_id: prop.agent_id,
        requested_date: tomorrow(),
        requested_time: '11:00',
      })
      .select('id')
      .single();

    const cancel = await customer.client
      .from('viewing_requests')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', created!.id)
      .select('status')
      .single();

    expect(cancel.error).toBeNull();
    expect(cancel.data?.status).toBe('cancelled');
  });

  it('cancelling another customer’s request fails (0 rows matched by RLS)', async () => {
    const customerA = await signUpActor('customerH');
    const customerB = await signUpActor('customerI');
    createdClients.push(customerA.client, customerB.client);
    const prop = await property(AVAILABLE_SLUG);

    const { data: created } = await customerA.client
      .from('viewing_requests')
      .insert({
        customer_id: customerA.userId,
        property_id: prop.id,
        agent_id: prop.agent_id,
        requested_date: tomorrow(),
        requested_time: '12:00',
      })
      .select('id')
      .single();

    const cancel = await customerB.client
      .from('viewing_requests')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', created!.id)
      .select('status')
      .single();

    expect(cancel.error).not.toBeNull();
  });

  it('cancelling an already-terminal request fails (RLS USING clause excludes it)', async () => {
    const customer = await signUpActor('customerJ');
    createdClients.push(customer.client);
    const prop = await property(AVAILABLE_SLUG);

    const { data: created } = await customer.client
      .from('viewing_requests')
      .insert({
        customer_id: customer.userId,
        property_id: prop.id,
        agent_id: prop.agent_id,
        requested_date: tomorrow(),
        requested_time: '13:00',
      })
      .select('id')
      .single();

    await customer.client
      .from('viewing_requests')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', created!.id);

    const secondCancel = await customer.client
      .from('viewing_requests')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', created!.id)
      .select('status')
      .single();

    expect(secondCancel.error).not.toBeNull();
  });

  it('an agent sees and can update viewing requests assigned to them (Sprint 6 grant, exercised here without agent-side UI)', async () => {
    const customer = await signUpActor('customerK');
    createdClients.push(customer.client);
    const prop = await property(AVAILABLE_SLUG);

    // Promote an existing seeded agent's profile row to an isolated test
    // session by signing up fresh and linking it as a new `agents` row for
    // the same agency — simplest way to get a real agent identity whose
    // `current_agent_id()` resolves without touching seeded agent accounts
    // other tests may depend on.
    const agentActor = await signUpActor('agentA', 'agent');
    createdClients.push(agentActor.client);
    const { data: seededAgent } = await serviceClient
      .from('agents')
      .select('agency_id')
      .eq('id', prop.agent_id)
      .single();
    const { data: newAgent, error: agentInsertError } = await serviceClient
      .from('agents')
      .insert({ profile_id: agentActor.userId, agency_id: seededAgent!.agency_id })
      .select('id')
      .single();
    expect(agentInsertError).toBeNull();

    const { data: created } = await customer.client
      .from('viewing_requests')
      .insert({
        customer_id: customer.userId,
        property_id: prop.id,
        agent_id: newAgent!.id,
        requested_date: tomorrow(),
        requested_time: '15:00',
      })
      .select('id')
      .single();

    const agentView = await agentActor.client
      .from('viewing_requests')
      .select('id')
      .eq('id', created!.id)
      .single();
    expect(agentView.error).toBeNull();

    const agentUpdate = await agentActor.client
      .from('viewing_requests')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', created!.id)
      .select('status')
      .single();
    expect(agentUpdate.error).toBeNull();
    expect(agentUpdate.data?.status).toBe('confirmed');
  });

  it('Sprint 6: a second agent (different agency, not assigned) cannot confirm/reschedule/cancel/complete/no-show a request assigned to another agent', async () => {
    const customer = await signUpActor('customerM');
    createdClients.push(customer.client);
    const prop = await property(AVAILABLE_SLUG);

    const agentActor = await signUpActor('agentB', 'agent');
    createdClients.push(agentActor.client);
    const { data: seededAgent } = await serviceClient
      .from('agents')
      .select('agency_id')
      .eq('id', prop.agent_id)
      .single();
    const { data: ownAgent } = await serviceClient
      .from('agents')
      .insert({ profile_id: agentActor.userId, agency_id: seededAgent!.agency_id })
      .select('id')
      .single();

    const otherAgentActor = await signUpActor('agentC', 'agent');
    createdClients.push(otherAgentActor.client);
    await serviceClient
      .from('agents')
      .insert({ profile_id: otherAgentActor.userId, agency_id: 'a2000000-0000-0000-0000-000000000002' })
      .select('id')
      .single();

    const { data: created } = await customer.client
      .from('viewing_requests')
      .insert({
        customer_id: customer.userId,
        property_id: prop.id,
        agent_id: ownAgent!.id,
        requested_date: tomorrow(),
        requested_time: '09:00',
      })
      .select('id')
      .single();

    // Not assigned to this request at all — RLS filters the row out entirely.
    const otherView = await otherAgentActor.client
      .from('viewing_requests')
      .select('id')
      .eq('id', created!.id)
      .maybeSingle();
    expect(otherView.data).toBeNull();

    const confirmAttempt = await otherAgentActor.client
      .from('viewing_requests')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', created!.id)
      .select('status')
      .single();
    expect(confirmAttempt.error).not.toBeNull();

    const rescheduleAttempt = await otherAgentActor.client
      .from('viewing_requests')
      .update({ requested_time: '10:30' })
      .eq('id', created!.id)
      .select('requested_time')
      .single();
    expect(rescheduleAttempt.error).not.toBeNull();

    const cancelAttempt = await otherAgentActor.client
      .from('viewing_requests')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', created!.id)
      .select('status')
      .single();
    expect(cancelAttempt.error).not.toBeNull();

    const check = await serviceClient.from('viewing_requests').select('status').eq('id', created!.id).single();
    expect(check.data?.status).toBe('pending');

    // The owning agent CAN confirm it — proving the block above is about
    // ownership, not a broken policy that blocks everyone.
    const ownConfirm = await agentActor.client
      .from('viewing_requests')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', created!.id)
      .select('status')
      .single();
    expect(ownConfirm.error).toBeNull();

    const otherComplete = await otherAgentActor.client
      .from('viewing_requests')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', created!.id)
      .select('status')
      .single();
    expect(otherComplete.error).not.toBeNull();

    const otherNoShow = await otherAgentActor.client
      .from('viewing_requests')
      .update({ status: 'no_show' })
      .eq('id', created!.id)
      .select('status')
      .single();
    expect(otherNoShow.error).not.toBeNull();
  });

  it('Sprint 6, Gap 6: an agent can read the customer profile for their own assigned request, but not for one that isn’t theirs', async () => {
    const customer = await signUpActor('customerN');
    createdClients.push(customer.client);
    const prop = await property(AVAILABLE_SLUG);

    const agentActor = await signUpActor('agentD', 'agent');
    createdClients.push(agentActor.client);
    const { data: seededAgent } = await serviceClient
      .from('agents')
      .select('agency_id')
      .eq('id', prop.agent_id)
      .single();
    const { data: ownAgent } = await serviceClient
      .from('agents')
      .insert({ profile_id: agentActor.userId, agency_id: seededAgent!.agency_id })
      .select('id')
      .single();

    const unrelatedAgentActor = await signUpActor('agentE', 'agent');
    createdClients.push(unrelatedAgentActor.client);
    await serviceClient
      .from('agents')
      .insert({ profile_id: unrelatedAgentActor.userId, agency_id: 'a2000000-0000-0000-0000-000000000002' })
      .select('id')
      .single();

    await customer.client.from('viewing_requests').insert({
      customer_id: customer.userId,
      property_id: prop.id,
      agent_id: ownAgent!.id,
      requested_date: tomorrow(),
      requested_time: '08:00',
    });

    const ownAgentRead = await agentActor.client
      .from('profiles')
      .select('id, full_name')
      .eq('id', customer.userId)
      .maybeSingle();
    expect(ownAgentRead.data?.id).toBe(customer.userId);

    const unrelatedAgentRead = await unrelatedAgentActor.client
      .from('profiles')
      .select('id, full_name')
      .eq('id', customer.userId)
      .maybeSingle();
    expect(unrelatedAgentRead.data).toBeNull();
  });

  it('a moderator can see every viewing request; an admin has full CRUD', async () => {
    const customer = await signUpActor('customerL');
    const moderator = await signUpActor('moderatorA', 'moderator');
    const admin = await signUpActor('adminA', 'admin');
    createdClients.push(customer.client, moderator.client, admin.client);
    const prop = await property(AVAILABLE_SLUG);

    const { data: created } = await customer.client
      .from('viewing_requests')
      .insert({
        customer_id: customer.userId,
        property_id: prop.id,
        agent_id: prop.agent_id,
        requested_date: tomorrow(),
        requested_time: '16:00',
      })
      .select('id')
      .single();

    const modView = await moderator.client
      .from('viewing_requests')
      .select('id')
      .eq('id', created!.id)
      .single();
    expect(modView.error).toBeNull();

    const adminDelete = await admin.client.from('viewing_requests').delete().eq('id', created!.id);
    expect(adminDelete.error).toBeNull();
  });

  it('a guest has no access to viewing_requests at all', async () => {
    const guest = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const result = await guest.from('viewing_requests').select('id').limit(1);
    expect(result.error).not.toBeNull();
  });
});
