import { afterAll, describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { serviceClient, signUpAgent } from '@/shared/lib/testing/rlsTestHelpers';

/**
 * Real RLS integration tests against the local Supabase stack — proving
 * database.md §9's `agents` Policy Summary row for the new
 * `agentRepository.getCurrentAgent()` query shape (own row + profile embed).
 */
const NAIROBI_HOMES_AGENCY_ID = 'a2000000-0000-0000-0000-000000000001';
const KIAMBU_ESTATES_AGENCY_ID = 'a2000000-0000-0000-0000-000000000002';

const createdClients: SupabaseClient[] = [];

describe('agents RLS (integration, local Supabase, Sprint 6)', () => {
  afterAll(async () => {
    await Promise.all(createdClients.map((c) => c.auth.signOut()));
  });

  it('getCurrentAgent’s query shape resolves an agent’s own row with the profiles embed populated', async () => {
    const agentA = await signUpAgent('agentA', NAIROBI_HOMES_AGENCY_ID);
    createdClients.push(agentA.client);

    const result = await agentA.client
      .from('agents')
      .select('id, profile_id, agency_id, job_title, bio, is_active, profile:profiles(full_name, avatar_url)')
      .eq('profile_id', agentA.userId)
      .single();

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe(agentA.agentId);
    expect(result.data?.agency_id).toBe(NAIROBI_HOMES_AGENCY_ID);
    // supabase-js infers a to-many embed shape here (it can't see the FK
    // cardinality from a raw select string) even though the real relation
    // is many-to-one — the actual runtime PostgREST response is a single
    // object, not an array; only the inferred TS type disagrees.
    expect((result.data?.profile as unknown as { full_name: string } | null)?.full_name).toBe(
      'RLS agentA',
    );
  });

  it('two agents in different agencies each resolve their own distinct row', async () => {
    const agentB = await signUpAgent('agentB', NAIROBI_HOMES_AGENCY_ID);
    const agentC = await signUpAgent('agentC', KIAMBU_ESTATES_AGENCY_ID);
    createdClients.push(agentB.client, agentC.client);

    const resultB = await agentB.client
      .from('agents')
      .select('id, agency_id')
      .eq('profile_id', agentB.userId)
      .single();
    const resultC = await agentC.client
      .from('agents')
      .select('id, agency_id')
      .eq('profile_id', agentC.userId)
      .single();

    expect(resultB.data?.id).toBe(agentB.agentId);
    expect(resultB.data?.agency_id).toBe(NAIROBI_HOMES_AGENCY_ID);
    expect(resultC.data?.id).toBe(agentC.agentId);
    expect(resultC.data?.agency_id).toBe(KIAMBU_ESTATES_AGENCY_ID);
    expect(resultB.data?.id).not.toBe(resultC.data?.id);
  });

  it('an agent can update their own bio, but not another agent’s', async () => {
    const agentD = await signUpAgent('agentD', NAIROBI_HOMES_AGENCY_ID);
    const agentE = await signUpAgent('agentE', NAIROBI_HOMES_AGENCY_ID);
    createdClients.push(agentD.client, agentE.client);

    const ownUpdate = await agentD.client
      .from('agents')
      .update({ bio: 'Updated by self.' })
      .eq('id', agentD.agentId)
      .select('bio')
      .single();
    expect(ownUpdate.error).toBeNull();
    expect(ownUpdate.data?.bio).toBe('Updated by self.');

    const hijackAttempt = await agentD.client
      .from('agents')
      .update({ bio: 'Hijacked.' })
      .eq('id', agentE.agentId)
      .select('bio')
      .single();
    expect(hijackAttempt.error).not.toBeNull();

    const check = await serviceClient.from('agents').select('bio').eq('id', agentE.agentId).single();
    expect(check.data?.bio).not.toBe('Hijacked.');
  });
});
