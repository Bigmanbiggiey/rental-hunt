import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';

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

describe('properties/property_images/property_amenities/agent_directory RLS (integration, local Supabase)', () => {
  it('a guest sees exactly the 7 seeded properties that are non-archived, non-deleted, and not rejected', async () => {
    const { data, error } = await guest.from('properties').select('slug');
    expect(error).toBeNull();
    expect(data).toHaveLength(7);
    expect(data?.map((p) => p.slug)).not.toContain(REJECTED_SLUG);
    expect(data?.map((p) => p.slug)).not.toContain(ARCHIVED_SLUG);
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
