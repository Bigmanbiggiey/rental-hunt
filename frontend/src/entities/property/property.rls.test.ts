import { afterAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { actorClient, serviceClient, signUpAgent } from '@/shared/lib/testing/rlsTestHelpers';
import { propertyRepository } from './property.repository';

/**
 * Real RLS integration tests against the local Supabase stack (mirrors
 * `entities/user/profile.rls.test.ts`'s pattern), proving `database.md` §9's
 * guest-visibility rule for `properties`/`property_images`/`property_amenities`
 * and the `agent_directory` view — not just that `propertyRepository` calls
 * the right query, but that RLS itself enforces it even if a bug or a direct
 * SQL client bypassed the service layer. Uses `supabase/seed.sql`'s stable
 * fixture rows rather than signing up new actors — reference/property data,
 * unlike a per-test user identity, doesn't need to be created per test.
 */
const SUPABASE_URL = 'http://127.0.0.1:54321';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const REJECTED_SLUG = 'apartment-south-c-a8';
const ARCHIVED_SLUG = 'bungalow-ngong-road-a9';
const VISIBLE_SLUG = '2br-apartment-kilimani-a1';

const guest = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

const SEEDED_VISIBLE_SLUGS = [
  '2br-apartment-kilimani-a1',
  '3br-apartment-westlands-a2',
  'family-villa-karen-a3',
  'townhouse-lavington-a4',
  'maisonette-embakasi-a5',
  'studio-kileleshwa-a6',
  'bedsitter-south-b-a7',
];

describe('properties/property_images/property_amenities/agent_directory RLS (integration, local Supabase)', () => {
  it('a guest sees at least the 7 seeded properties that are non-archived, non-deleted, and not rejected', async () => {
    const { data, error } = await guest.from('properties').select('slug');
    expect(error).toBeNull();
    // >= not ===: pinning an exact global count on a shared,
    // concurrently-writable table is inherently fragile once other test
    // files start transitioning fixtures to a guest-visible status mid-run
    // (Sprint 7's `verification.rls.test.ts` does exactly this to prove
    // `set_property_verification()` approvals) — the same fragility
    // `PropertiesPage.test.tsx`'s own pagination assertion was hardened
    // against in Sprint 6 (`toBe(22)` -> `toBeGreaterThanOrEqual(22)`).
    // What this test actually needs to prove — every one of the 7 known
    // seed slugs is present, and the excluded ones never are — doesn't
    // require an exact total.
    const slugs = data?.map((p) => p.slug) ?? [];
    expect(slugs.length).toBeGreaterThanOrEqual(7);
    for (const slug of SEEDED_VISIBLE_SLUGS) {
      expect(slugs).toContain(slug);
    }
    expect(slugs).not.toContain(REJECTED_SLUG);
    expect(slugs).not.toContain(ARCHIVED_SLUG);
  });

  it('a guest cannot read the rejected fixture property directly by slug', async () => {
    const { data, error } = await guest.from('properties').select('slug').eq('slug', REJECTED_SLUG).single();
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it('a guest cannot read the archived fixture property directly by slug', async () => {
    const { data, error } = await guest.from('properties').select('slug').eq('slug', ARCHIVED_SLUG).single();
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it('property_images/property_amenities follow the same parent-visibility rule as their property', async () => {
    const rejectedProperty = await guest
      .from('properties')
      .select('id')
      .eq('slug', REJECTED_SLUG)
      .maybeSingle();
    // RLS hides the row, so its id can't even be looked up as a guest —
    // querying child tables scoped to a known-hidden property (fetched via
    // service context below) proves the child policy, not just the parent's.
    expect(rejectedProperty.data).toBeNull();

    const serviceClient = createClient(
      SUPABASE_URL,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
      { auth: { persistSession: false } },
    );
    const { data: rejected } = await serviceClient
      .from('properties')
      .select('id')
      .eq('slug', REJECTED_SLUG)
      .single();
    expect(rejected).not.toBeNull();

    const images = await guest.from('property_images').select('id').eq('property_id', rejected!.id);
    expect(images.data).toHaveLength(0);

    const amenities = await guest.from('property_amenities').select('amenity_id').eq('property_id', rejected!.id);
    expect(amenities.data).toHaveLength(0);
  });

  it('agent_directory exposes only the documented public-safe fields, never phone/email/role', async () => {
    const { data, error } = await guest.from('agent_directory').select('*').limit(1).single();
    expect(error).toBeNull();
    expect(Object.keys(data ?? {}).sort()).toEqual(
      ['agent_id', 'agency_id', 'full_name', 'avatar_url', 'job_title', 'bio'].sort(),
    );
  });

  it('a visible property embeds its agent via agent_directory in one query', async () => {
    const { data, error } = await guest
      .from('properties')
      .select('slug, agent:agent_directory(full_name)')
      .eq('slug', VISIBLE_SLUG)
      .single<{ slug: string; agent: { full_name: string } }>();
    expect(error).toBeNull();
    expect(data?.agent?.full_name).toBeTruthy();
  });

  it('property_ids_with_all_amenities never leaks ids of properties invisible to the caller', async () => {
    const serviceClient = createClient(
      SUPABASE_URL,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
      { auth: { persistSession: false } },
    );
    const { data: parking } = await serviceClient.from('amenities').select('id').eq('name', 'Parking').single();

    const { data } = await guest.rpc('property_ids_with_all_amenities', {
      p_amenity_ids: [parking!.id],
    });
    const returnedIds: string[] = (data ?? []).map((row: { property_id: string } | string) =>
      typeof row === 'string' ? row : row.property_id,
    );

    const { data: rejectedProp } = await serviceClient
      .from('properties')
      .select('id')
      .eq('slug', REJECTED_SLUG)
      .single();
    expect(returnedIds).not.toContain(rejectedProp!.id);
  });
});

describe('propertyRepository.getBySlug/listRelated RLS (integration, local Supabase, Sprint 4)', () => {
  it('getBySlug returns a fully embedded Property for a guest-visible slug', async () => {
    const property = await propertyRepository.getBySlug(VISIBLE_SLUG);
    expect(property.slug).toBe(VISIBLE_SLUG);
    expect(property.images.length).toBeGreaterThan(0);
    expect(property.amenities.length).toBeGreaterThan(0);
    expect(property.agent.fullName).not.toBe('');
  });

  it('getBySlug throws PROPERTY_NOT_FOUND for a rejected property, proving RLS not just repository logic', async () => {
    await expect(propertyRepository.getBySlug(REJECTED_SLUG)).rejects.toMatchObject({
      code: 'PROPERTY_NOT_FOUND',
    });
  });

  it('getBySlug throws PROPERTY_NOT_FOUND for an archived property', async () => {
    await expect(propertyRepository.getBySlug(ARCHIVED_SLUG)).rejects.toMatchObject({
      code: 'PROPERTY_NOT_FOUND',
    });
  });

  it('listRelated never returns the rejected or archived fixture properties', async () => {
    const visible = await propertyRepository.getBySlug(VISIBLE_SLUG);
    const related = await propertyRepository.listRelated({
      propertyId: visible.id,
      countyId: visible.countyId,
      propertyTypeId: visible.propertyTypeId,
      limit: 50,
    });
    expect(related.some((p) => p.slug === REJECTED_SLUG)).toBe(false);
    expect(related.some((p) => p.slug === ARCHIVED_SLUG)).toBe(false);
    expect(related.some((p) => p.id === visible.id)).toBe(false);
  });
});

const NAIROBI_HOMES_AGENCY_ID = 'a2000000-0000-0000-0000-000000000001';
const KIAMBU_ESTATES_AGENCY_ID = 'a2000000-0000-0000-0000-000000000002';

/** Inserts a minimal valid property (via service_role, bypassing RLS) for a test to act on. */
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
      title: 'RLS Test Property',
      description: 'A property created for a Sprint 6 RLS integration test.',
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

describe('properties RLS — Sprint 6 agent writes (integration, local Supabase)', () => {
  const clients: SupabaseClient[] = [];
  afterAll(async () => {
    await Promise.all(clients.map((c) => c.auth.signOut()));
  });

  it('an agent can create/update/archive/change availability on their own agency’s property; a different agency’s agent is blocked on all of it', async () => {
    const agentA = await signUpAgent('propAgentA', NAIROBI_HOMES_AGENCY_ID);
    const agentB = await signUpAgent('propAgentB', KIAMBU_ESTATES_AGENCY_ID);
    clients.push(agentA.client, agentB.client);

    const { data: propertyType } = await serviceClient.from('property_types').select('id').limit(1).single();
    const { data: county } = await serviceClient.from('counties').select('id').limit(1).single();
    const { data: location } = await serviceClient
      .from('locations')
      .select('id')
      .eq('county_id', county!.id)
      .limit(1)
      .single();

    const { data: created, error: createError } = await agentA.client
      .from('properties')
      .insert({
        agency_id: NAIROBI_HOMES_AGENCY_ID,
        agent_id: agentA.agentId,
        slug: `rls-test-property-${Date.now()}`,
        title: 'RLS Test Property',
        description: 'A property created for an RLS integration test.',
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
        // `rejected` is the ONLY verification_status the guest-visibility
        // policy excludes (database.md §9: guests/customers see everything
        // except `is_archived`/deleted/`rejected` — `unverified` and
        // `pending_verification` are still publicly browsable). So
        // `rejected` is the only status that isolates this test to the
        // agent-specific "own agency" policy — a `verified` (or even
        // `unverified`) property would ALSO be visible to agentB via the
        // ordinary guest-visibility policy (RLS policies OR together),
        // which would make this specific isolation assertion meaningless.
        verification_status: 'rejected',
      })
      .select('id')
      .single();
    expect(createError).toBeNull();
    const propertyId = created!.id as string;

    // A different agency's agent can't even see it — RLS filters the row out entirely.
    const bRead = await agentB.client.from('properties').select('id').eq('id', propertyId).maybeSingle();
    expect(bRead.data).toBeNull();

    const bUpdate = await agentB.client
      .from('properties')
      .update({ title: 'Hijacked' })
      .eq('id', propertyId)
      .select('title')
      .single();
    expect(bUpdate.error).not.toBeNull();

    const bArchive = await agentB.client
      .from('properties')
      .update({ is_archived: true })
      .eq('id', propertyId)
      .select('is_archived')
      .single();
    expect(bArchive.error).not.toBeNull();

    const bAvailability = await agentB.client
      .from('properties')
      .update({ availability_status: 'hidden' })
      .eq('id', propertyId)
      .select('availability_status')
      .single();
    expect(bAvailability.error).not.toBeNull();

    const check = await serviceClient
      .from('properties')
      .select('title, is_archived, availability_status')
      .eq('id', propertyId)
      .single();
    expect(check.data?.title).toBe('RLS Test Property');
    expect(check.data?.is_archived).toBe(false);
    expect(check.data?.availability_status).toBe('available');

    // The owning agent (own agency) can do all of the above.
    const aUpdate = await agentA.client
      .from('properties')
      .update({ title: 'Updated By Owner' })
      .eq('id', propertyId)
      .select('title')
      .single();
    expect(aUpdate.error).toBeNull();
    expect(aUpdate.data?.title).toBe('Updated By Owner');

    const aArchive = await agentA.client
      .from('properties')
      .update({ is_archived: true })
      .eq('id', propertyId)
      .select('is_archived')
      .single();
    expect(aArchive.error).toBeNull();
    expect(aArchive.data?.is_archived).toBe(true);
  });

  it('an agent sees their own agency’s non-guest-visible properties, but not another agency’s (listForAgent’s RLS scoping)', async () => {
    // Both properties are `rejected` — the only verification_status guests
    // don't see (database.md §9) — so the only way either could appear for
    // agentC is the agent-specific "own agency" policy. An `unverified` or
    // `verified` property would be a meaningless test here, since the
    // ordinary guest-visibility policy would grant access to it regardless
    // of agency (RLS policies OR together — see the note in the test above).
    const agentC = await signUpAgent('propAgentC', KIAMBU_ESTATES_AGENCY_ID);
    const agentD = await signUpAgent('propAgentD', NAIROBI_HOMES_AGENCY_ID);
    clients.push(agentC.client, agentD.client);

    const ownRejectedId = await createTestProperty({
      agencyId: KIAMBU_ESTATES_AGENCY_ID,
      agentId: agentC.agentId,
      slug: `rls-own-rejected-${Date.now()}`,
      verificationStatus: 'rejected',
    });
    const otherRejectedId = await createTestProperty({
      agencyId: NAIROBI_HOMES_AGENCY_ID,
      agentId: agentD.agentId,
      slug: `rls-other-rejected-${Date.now()}`,
      verificationStatus: 'rejected',
    });

    const ownRead = await agentC.client
      .from('properties')
      .select('id')
      .eq('id', ownRejectedId)
      .maybeSingle();
    expect(ownRead.data?.id).toBe(ownRejectedId);

    const otherRead = await agentC.client
      .from('properties')
      .select('id')
      .eq('id', otherRejectedId)
      .maybeSingle();
    expect(otherRead.data).toBeNull();
  });

  it('getById’s query shape (id + agency_id) excludes another agency’s guest-visible property — the exact leak found via manual browser testing', async () => {
    // Deliberately `verified` (guest-visible) this time — this is the real
    // bug that was found: RLS alone (no `agency_id` filter) lets an agent
    // fetch another agency's `verified`/non-archived property too, since
    // the guest-visibility policy has no role restriction and OR-combines
    // with the agent-specific one. The `rejected` fixtures used above
    // wouldn't reproduce this — they isolate the agent-specific policy
    // deliberately, which is a different (and already-passing) case.
    const agentE = await signUpAgent('propAgentE', KIAMBU_ESTATES_AGENCY_ID);
    const agentF = await signUpAgent('propAgentF', NAIROBI_HOMES_AGENCY_ID);
    clients.push(agentE.client, agentF.client);

    const otherAgencyGuestVisibleId = await createTestProperty({
      agencyId: NAIROBI_HOMES_AGENCY_ID,
      agentId: agentF.agentId,
      slug: `rls-other-guest-visible-${Date.now()}`,
      verificationStatus: 'verified',
    });

    // Confirms the leak is real without the filter — RLS alone lets it through.
    const unscopedRead = await agentE.client
      .from('properties')
      .select('id')
      .eq('id', otherAgencyGuestVisibleId)
      .maybeSingle();
    expect(unscopedRead.data?.id).toBe(otherAgencyGuestVisibleId);

    // The fix: adding the agency_id filter (exactly what getById now does) excludes it.
    const scopedRead = await agentE.client
      .from('properties')
      .select('id')
      .eq('id', otherAgencyGuestVisibleId)
      .eq('agency_id', KIAMBU_ESTATES_AGENCY_ID)
      .maybeSingle();
    expect(scopedRead.data).toBeNull();
  });
});

describe('submit_property_for_verification RPC (integration, local Supabase, Sprint 6)', () => {
  const clients: SupabaseClient[] = [];
  afterAll(async () => {
    await Promise.all(clients.map((c) => c.auth.signOut()));
  });

  it('only the owning agent can submit, only from unverified/rejected', async () => {
    const agentA = await signUpAgent('verifyAgentA', NAIROBI_HOMES_AGENCY_ID);
    const agentB = await signUpAgent('verifyAgentB', KIAMBU_ESTATES_AGENCY_ID);
    clients.push(agentA.client, agentB.client);

    const propertyId = await createTestProperty({
      agencyId: NAIROBI_HOMES_AGENCY_ID,
      agentId: agentA.agentId,
      slug: `rls-verify-test-${Date.now()}`,
      // 'rejected', not 'unverified' — the RPC accepts submission from either
      // (both are asserted as valid source states elsewhere in this test),
      // and 'rejected' is also the one status excluded from guest visibility
      // (database.md §9), so this fixture doesn't inflate
      // PropertiesPage.test.tsx's exact guest-facing count when both run in
      // the same parallel batch.
      verificationStatus: 'rejected',
    });

    const wrongAgency = await agentB.client.rpc('submit_property_for_verification', {
      p_property_id: propertyId,
    });
    expect(wrongAgency.error).not.toBeNull();
    expect(wrongAgency.error?.code).toBe('42501');

    const ownSubmission = await agentA.client.rpc('submit_property_for_verification', {
      p_property_id: propertyId,
    });
    expect(ownSubmission.error).toBeNull();

    const check = await serviceClient
      .from('properties')
      .select('verification_status')
      .eq('id', propertyId)
      .single();
    expect(check.data?.verification_status).toBe('pending_verification');

    // Now pending_verification — a second submission is rejected (RH002 -> INVALID_STATE_TRANSITION).
    const wrongStatus = await agentA.client.rpc('submit_property_for_verification', {
      p_property_id: propertyId,
    });
    expect(wrongStatus.error).not.toBeNull();
    expect(wrongStatus.error?.code).toBe('RH002');
  });
});

describe('property-images Storage RLS (integration, local Supabase, Sprint 6)', () => {
  const clients: SupabaseClient[] = [];
  afterAll(async () => {
    await Promise.all(clients.map((c) => c.auth.signOut()));
  });

  it('an agent can upload to their own agency’s property folder; a different agency’s agent cannot upload or delete', async () => {
    const agentA = await signUpAgent('storageAgentA', NAIROBI_HOMES_AGENCY_ID);
    const agentB = await signUpAgent('storageAgentB', KIAMBU_ESTATES_AGENCY_ID);
    clients.push(agentA.client, agentB.client);

    const propertyId = await createTestProperty({
      agencyId: NAIROBI_HOMES_AGENCY_ID,
      agentId: agentA.agentId,
      slug: `rls-storage-test-${Date.now()}`,
      // 'rejected' (createTestProperty's default is 'verified'/guest-visible,
      // which is irrelevant to Storage RLS and would otherwise inflate
      // PropertiesPage.test.tsx's exact guest-facing count — see the note
      // on the RPC test above.
      verificationStatus: 'rejected',
    });
    const path = `${propertyId}/test-image.jpg`;
    // A `File`'s own `.type` doesn't reliably survive into supabase-js's
    // upload request via this environment's `fetch`/`FormData` (it was
    // observed arriving server-side as `text/plain`, tripping the bucket's
    // `allowed_mime_types` check) — raw bytes + an explicit `contentType`
    // sidesteps that inference entirely.
    const fileBody = new TextEncoder().encode('fake-image-content');
    const uploadOptions = { contentType: 'image/jpeg' };

    const wrongAgencyUpload = await agentB.client.storage
      .from('property-images')
      .upload(path, fileBody, uploadOptions);
    expect(wrongAgencyUpload.error).not.toBeNull();
    expect(wrongAgencyUpload.error?.message).not.toMatch(/mime type/i);

    const ownUpload = await agentA.client.storage
      .from('property-images')
      .upload(path, fileBody, uploadOptions);
    expect(ownUpload.error).toBeNull();

    await agentB.client.storage.from('property-images').remove([path]);
    const stillThere = await serviceClient.storage.from('property-images').list(propertyId);
    expect(stillThere.data?.some((f) => f.name === 'test-image.jpg')).toBe(true);

    // The bucket is public — even a guest can read it.
    const guest = actorClient('storageGuest');
    const guestRead = await guest.storage.from('property-images').download(path);
    expect(guestRead.error).toBeNull();
    await guest.auth.signOut();
  });
});
