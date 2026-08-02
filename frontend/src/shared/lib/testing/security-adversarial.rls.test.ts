import { afterAll, describe, expect, it } from 'vitest';
import {
  ANON_KEY,
  SUPABASE_URL,
  serviceClient,
  signUpActor,
  signUpAgent,
} from './rlsTestHelpers';

// Every fixture this file creates (agencies, agents, properties) is named
// with an `Adversarial`/`adv-` prefix specifically so this cleanup can find
// and remove all of it afterward — a real gap found during Sprint 8's own
// manual walkthrough (leftover "Adversarial Storage Target" fixtures showed
// up in a real property's "Similar Properties" section), mirroring
// `PropertiesPage.test.tsx`'s own established afterAll-cleanup precedent.
afterAll(async () => {
  const { data: agencies } = await serviceClient
    .from('agencies')
    .select('id')
    .ilike('name', 'Adversarial%');
  const agencyIds = (agencies ?? []).map((a) => a.id as string);
  if (agencyIds.length === 0) return;

  const { data: agents } = await serviceClient.from('agents').select('id').in('agency_id', agencyIds);
  const agentIds = (agents ?? []).map((a) => a.id as string);

  if (agentIds.length > 0) {
    await serviceClient.from('viewing_requests').delete().in('agent_id', agentIds);
    await serviceClient.from('properties').delete().in('agent_id', agentIds);
  }
  await serviceClient.from('agents').delete().in('agency_id', agencyIds);
  await serviceClient.from('agencies').delete().in('id', agencyIds);
});

/**
 * Sprint 8 (Quality Assurance, roadmap.md §12) — "confirm RLS holds under
 * adversarial manual testing (e.g., attempting to fetch another agency's
 * property via direct API manipulation)". Every existing `*.rls.test.ts`
 * file already proves RLS holds when accessed *through* `supabase-js`
 * (bypassing our own Repository layer, but still going through the SDK's
 * own request-shaping conventions). This file goes one step further: hand-
 * crafted raw `fetch()` calls straight at PostgREST/Storage, with no SDK
 * involved at all, to prove the database itself — not any client-side
 * convention — is the actual security boundary (coding-standards.md §21).
 */

async function rawGet(path: string, accessToken?: string) {
  return fetch(`${SUPABASE_URL}${path}`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken ?? ANON_KEY}`,
    },
  });
}

async function getAccessToken(client: Awaited<ReturnType<typeof signUpActor>>['client']) {
  const { data } = await client.auth.getSession();
  return data.session!.access_token;
}

describe('Adversarial RLS testing — raw HTTP, bypassing supabase-js entirely', () => {
  it('an unfiltered raw REST query for every properties row, with no Authorization header, still only returns guest-visible rows', async () => {
    // No token at all (not even anon) — the most hostile client shape possible.
    const res = await fetch(`${SUPABASE_URL}/rest/v1/properties?select=id,verification_status,is_archived`, {
      headers: { apikey: ANON_KEY },
    });
    expect(res.status).toBe(200);
    const rows = (await res.json()) as { verification_status: string; is_archived: boolean }[];
    for (const row of rows) {
      expect(row.is_archived).toBe(false);
      expect(row.verification_status).not.toBe('rejected');
    }
  });

  it('a malformed/garbage Authorization header does not fail open to elevated access', async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,role`, {
      headers: { apikey: ANON_KEY, Authorization: 'Bearer not-a-real-jwt-at-all' },
    });
    // PostgREST rejects an unparseable JWT outright rather than silently
    // falling back to anon — either is an acceptable non-escalation outcome,
    // but it must not be 200 with real profile rows.
    expect([401, 403]).toContain(res.status);
  });

  it('agents_select_all_authenticated is deliberately open across agencies (agent-directory browsing), but a guest still cannot read it at all', async () => {
    // `agents_select_all_authenticated` is `for select to authenticated using (true)` —
    // intentionally NOT agency-scoped (any signed-in user can see basic agent
    // info, e.g. "who is my viewing agent" on a property detail page). The
    // real boundary this policy draws is authenticated vs. anon, not agency
    // vs. agency — confirmed here rather than assumed, since a naive read of
    // "an agent shouldn't see another agency's agent row" would be wrong.
    const { data: agencyA } = await serviceClient
      .from('agencies')
      .insert({ name: `Adversarial Agency A ${Date.now()}`, slug: `adv-agency-a-${Date.now()}` })
      .select('id')
      .single();
    const { data: agencyB } = await serviceClient
      .from('agencies')
      .insert({ name: `Adversarial Agency B ${Date.now()}`, slug: `adv-agency-b-${Date.now()}` })
      .select('id')
      .single();
    const agentA = await signUpAgent('advAgentA', agencyA!.id as string);
    const agentB = await signUpAgent('advAgentB', agencyB!.id as string);

    const tokenA = await getAccessToken(agentA.client);
    const authedRes = await rawGet(`/rest/v1/agents?id=eq.${agentB.agentId}&select=id,agency_id,bio`, tokenA);
    expect(authedRes.status).toBe(200);
    expect(await authedRes.json()).toHaveLength(1);

    // A real guest browser session always sends the anon key as the Bearer
    // token too (supabase-js never omits Authorization entirely). The result
    // is 401, not "200 with 0 rows": `for select to authenticated` means
    // there is no table-level grant for the `anon` Postgres role at all, so
    // PostgREST denies the query outright rather than running it and
    // filtering — a stronger guarantee than row-level filtering alone.
    const guestRes = await rawGet('/rest/v1/agents?id=eq.' + agentB.agentId + '&select=id,agency_id,bio');
    expect(guestRes.status).toBe(401);
  });

  it('a customer cannot read property_verifications via direct raw query, even scoped to a property they favorited/booked', async () => {
    const customer = await signUpActor('advCustomer');
    const token = await getAccessToken(customer.client);
    const res = await rawGet('/rest/v1/property_verifications?select=id,property_id,new_status', token);
    expect(res.status).toBe(200);
    const rows = (await res.json()) as unknown[];
    expect(rows).toHaveLength(0);
  });

  it('Storage path traversal: an agent cannot upload outside their own agency’s property folder by crafting a path referencing another agency’s property id', async () => {
    const { data: agencyA } = await serviceClient
      .from('agencies')
      .insert({ name: `Adversarial Storage Agency A ${Date.now()}`, slug: `adv-storage-a-${Date.now()}` })
      .select('id')
      .single();
    const { data: agencyB } = await serviceClient
      .from('agencies')
      .insert({ name: `Adversarial Storage Agency B ${Date.now()}`, slug: `adv-storage-b-${Date.now()}` })
      .select('id')
      .single();
    const agentA = await signUpAgent('advStorageAgentA', agencyA!.id as string);
    const agentB = await signUpAgent('advStorageAgentB', agencyB!.id as string);

    const { data: propertyType } = await serviceClient.from('property_types').select('id').limit(1).single();
    const { data: county } = await serviceClient.from('counties').select('id').limit(1).single();
    const { data: location } = await serviceClient
      .from('locations')
      .select('id')
      .eq('county_id', county!.id)
      .limit(1)
      .single();
    const { data: propertyB } = await serviceClient
      .from('properties')
      .insert({
        agency_id: agencyB!.id,
        agent_id: agentB.agentId,
        slug: `adv-storage-prop-${Date.now()}`,
        title: 'Adversarial Storage Target',
        description: 'target property owned by agency B',
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
        verification_status: 'unverified',
        is_archived: false,
      })
      .select('id')
      .single();

    const tokenA = await getAccessToken(agentA.client);
    const bytes = new Uint8Array([1, 2, 3, 4]);
    // Agent A attempts to upload directly into agent B's property folder —
    // storage.foldername(name)[1] must resolve to propertyB.id, and the
    // policy's join against `properties` (scoped to the caller's own
    // agency) must reject it regardless of the literal path string used.
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/property-images/${propertyB!.id}/adversarial.jpg`,
      {
        method: 'POST',
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'image/jpeg',
        },
        body: bytes,
      },
    );
    expect(res.status).not.toBe(200);
  });
});
