import { afterAll, describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ANON_KEY,
  SUPABASE_URL,
  serviceClient,
  signUpActor,
  signUpAgent,
} from '@/shared/lib/testing/rlsTestHelpers';

/**
 * Sprint 8 (Quality Assurance, roadmap.md §12) — "confirm RLS holds under
 * adversarial manual testing (e.g. attempting to fetch another agency's
 * property via direct API manipulation)". The rest of the suite
 * (`property.rls.test.ts`, `viewing-request.rls.test.ts`,
 * `verification.rls.test.ts`, `admin-user.rls.test.ts`, `agency.rls.test.ts`)
 * already covers cross-agency read/write isolation extensively through
 * `supabase-js`. This file deliberately targets attack shapes that suite
 * doesn't: raw REST calls bypassing the SDK's query builder entirely (to
 * rule out any chance the SDK itself is doing something protective that a
 * genuinely adversarial client wouldn't), ownership-reassignment via
 * mass-assignment, an IDOR guess on another customer's row, and a direct
 * role-escalation attempt on an admin-only RPC.
 */

const NAIROBI_HOMES_AGENCY_ID = 'a2000000-0000-0000-0000-000000000001';
const KIAMBU_ESTATES_AGENCY_ID = 'a2000000-0000-0000-0000-000000000002';

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
      title: 'Adversarial Test Property',
      description: 'A property created for a Sprint 8 adversarial RLS test.',
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
      verification_status: overrides.verificationStatus ?? 'verified',
    })
    .select('id')
    .single();
  if (error || !created) throw error ?? new Error('property insert returned no row');
  return created.id as string;
}

/** Direct REST call against PostgREST, bypassing supabase-js's query builder entirely. */
async function rawRest(
  accessToken: string,
  method: 'GET' | 'PATCH' | 'POST',
  path: string,
  body?: unknown,
): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: method === 'PATCH' || method === 'POST' ? 'return=representation' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function accessTokenFor(client: SupabaseClient): Promise<string> {
  const { data } = await client.auth.getSession();
  if (!data.session) throw new Error('no session on client');
  return data.session.access_token;
}

describe('security adversarial pass (Sprint 8, raw REST — integration, local Supabase)', () => {
  const clients: SupabaseClient[] = [];
  afterAll(async () => {
    await Promise.all(clients.map((c) => c.auth.signOut()));
  });

  it('an agent cannot UPDATE a different agency\'s property via a raw REST PATCH (not supabase-js)', async () => {
    const agentA = await signUpAgent('advAgentA', NAIROBI_HOMES_AGENCY_ID);
    const agentB = await signUpAgent('advAgentB', KIAMBU_ESTATES_AGENCY_ID);
    clients.push(agentA.client, agentB.client);

    const victimPropertyId = await createTestProperty({
      agencyId: KIAMBU_ESTATES_AGENCY_ID,
      agentId: agentB.agentId,
      slug: `adv-victim-${Date.now()}`,
    });

    const token = await accessTokenFor(agentA.client);
    const { status, json } = await rawRest(token, 'PATCH', `properties?id=eq.${victimPropertyId}`, {
      title: 'Stolen listing',
    });

    // PostgREST returns 200/204 with an empty array/body when RLS's `using`
    // clause hides the row from the UPDATE entirely — a real adversary sees
    // no error, just zero effect. The only trustworthy proof is that the
    // row itself is untouched, verified separately via service_role below.
    expect([200, 204, 401, 403, 404]).toContain(status);
    if (Array.isArray(json)) expect(json).toHaveLength(0);

    const { data: stillIntact } = await serviceClient
      .from('properties')
      .select('title, agency_id')
      .eq('id', victimPropertyId)
      .single();
    expect(stillIntact!.title).toBe('Adversarial Test Property');
    expect(stillIntact!.agency_id).toBe(KIAMBU_ESTATES_AGENCY_ID);
  });

  it('an agent cannot reassign their own property to a different agency via mass-assignment (raw REST PATCH)', async () => {
    const agentC = await signUpAgent('advAgentC', NAIROBI_HOMES_AGENCY_ID);
    clients.push(agentC.client);

    const ownPropertyId = await createTestProperty({
      agencyId: NAIROBI_HOMES_AGENCY_ID,
      agentId: agentC.agentId,
      slug: `adv-reassign-${Date.now()}`,
    });

    const token = await accessTokenFor(agentC.client);
    // Attempts to both edit a legitimate field AND smuggle agency_id into a
    // different agency in the same request — the `with check` clause must
    // reject the whole row, not silently drop just the disallowed column.
    const { status, json } = await rawRest(token, 'PATCH', `properties?id=eq.${ownPropertyId}`, {
      title: 'Reassigned listing',
      agency_id: KIAMBU_ESTATES_AGENCY_ID,
    });

    expect([200, 204, 401, 403, 404]).toContain(status);
    if (Array.isArray(json)) expect(json).toHaveLength(0);

    const { data: stillOwn } = await serviceClient
      .from('properties')
      .select('title, agency_id')
      .eq('id', ownPropertyId)
      .single();
    expect(stillOwn!.agency_id).toBe(NAIROBI_HOMES_AGENCY_ID);
    expect(stillOwn!.title).toBe('Adversarial Test Property');
  });

  it('an agent cannot INSERT a new property directly into a different agency via mass-assignment (raw REST POST)', async () => {
    const agentD = await signUpAgent('advAgentD', NAIROBI_HOMES_AGENCY_ID);
    clients.push(agentD.client);

    const { data: propertyType } = await serviceClient.from('property_types').select('id').limit(1).single();
    const { data: county } = await serviceClient.from('counties').select('id').limit(1).single();
    const { data: location } = await serviceClient
      .from('locations')
      .select('id')
      .eq('county_id', county!.id)
      .limit(1)
      .single();

    const token = await accessTokenFor(agentD.client);
    const { status } = await rawRest(token, 'POST', 'properties', {
      agency_id: KIAMBU_ESTATES_AGENCY_ID, // not agentD's own agency
      agent_id: agentD.agentId,
      slug: `adv-foreign-insert-${Date.now()}`,
      title: 'Planted listing',
      description: 'Should never be created.',
      property_type_id: propertyType!.id,
      county_id: county!.id,
      location_id: location!.id,
      latitude: -1.29,
      longitude: 36.78,
      bedrooms: 1,
      bathrooms: 1,
      rent_amount: 1,
      deposit_amount: 1,
      availability_status: 'available',
    });

    // 201 would mean the insert succeeded — the one status this attack must
    // never produce, regardless of which non-2xx code RLS/PostgREST chooses.
    expect(status).not.toBe(201);

    const { count } = await serviceClient
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', KIAMBU_ESTATES_AGENCY_ID)
      .ilike('title', 'Planted listing');
    expect(count).toBe(0);
  });

  it('a customer cannot fetch or cancel another customer\'s viewing_request by guessing its id (IDOR, raw REST)', async () => {
    const agentE = await signUpAgent('advAgentE', NAIROBI_HOMES_AGENCY_ID);
    const victimCustomer = await signUpActor('advVictimCustomer');
    const attackerCustomer = await signUpActor('advAttackerCustomer');
    clients.push(agentE.client, victimCustomer.client, attackerCustomer.client);

    const propertyId = await createTestProperty({
      agencyId: NAIROBI_HOMES_AGENCY_ID,
      agentId: agentE.agentId,
      slug: `adv-idor-${Date.now()}`,
    });

    const { data: victimRequest, error } = await serviceClient
      .from('viewing_requests')
      .insert({
        customer_id: victimCustomer.userId,
        property_id: propertyId,
        agent_id: agentE.agentId,
        requested_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        requested_time: '14:00',
        status: 'pending',
      })
      .select('id')
      .single();
    if (error || !victimRequest) throw error ?? new Error('viewing_request insert returned no row');

    const token = await accessTokenFor(attackerCustomer.client);

    const { status: readStatus, json: readJson } = await rawRest(
      token,
      'GET',
      `viewing_requests?id=eq.${victimRequest.id}`,
    );
    expect(readStatus).toBe(200);
    expect(readJson).toEqual([]); // RLS hides the row entirely, not just its contents

    const { status: writeStatus } = await rawRest(
      token,
      'PATCH',
      `viewing_requests?id=eq.${victimRequest.id}`,
      { status: 'cancelled', cancellation_reason: 'Attacker-forced cancellation' },
    );
    expect([200, 204]).toContain(writeStatus);

    const { data: stillPending } = await serviceClient
      .from('viewing_requests')
      .select('status')
      .eq('id', victimRequest.id)
      .single();
    expect(stillPending!.status).toBe('pending');
  });

  it('an authenticated agent cannot call the admin-only set_property_verification RPC to self-verify their own property (role escalation, raw REST)', async () => {
    const agentF = await signUpAgent('advAgentF', NAIROBI_HOMES_AGENCY_ID);
    clients.push(agentF.client);

    const propertyId = await createTestProperty({
      agencyId: NAIROBI_HOMES_AGENCY_ID,
      agentId: agentF.agentId,
      slug: `adv-escalation-${Date.now()}`,
      verificationStatus: 'pending_verification',
    });

    const token = await accessTokenFor(agentF.client);
    const { status, json } = await rawRest(token, 'POST', 'rpc/set_property_verification', {
      p_property_id: propertyId,
      p_new_status: 'verified',
      p_reason: null,
    });

    // Postgres raises 42501 (insufficient_privilege) inside the function's
    // own guard, which PostgREST surfaces as a 4xx — the one thing that must
    // never happen is the property actually becoming verified.
    expect(status).toBeGreaterThanOrEqual(400);
    void json;

    const { data: stillPending } = await serviceClient
      .from('properties')
      .select('verification_status')
      .eq('id', propertyId)
      .single();
    expect(stillPending!.verification_status).toBe('pending_verification');
  });
});
