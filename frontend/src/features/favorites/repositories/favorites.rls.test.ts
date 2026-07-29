import { afterAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Real RLS integration tests against the local Supabase stack, mirroring
 * `entities/user/profile.rls.test.ts`'s isolated-per-actor pattern —
 * database.md §9's `favorites` policies, plus the `properties_select_
 * favorited_by_customer` carve-out added this sprint (archived/rejected
 * properties a customer favorited must stay visible to that customer, per
 * FAV-003's "unavailable or archived saved properties are clearly marked").
 */
const SUPABASE_URL = 'http://127.0.0.1:54321';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const VISIBLE_SLUG = '2br-apartment-kilimani-a1';
const ARCHIVED_SLUG = 'bungalow-ngong-road-a9';

function actorClient(name: string): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, storageKey: `test-fav-actor-${name}-${Date.now()}` },
  });
}

const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function signUpCustomer(name: string) {
  const client = actorClient(name);
  const email = `rls-fav-${name}-${Date.now()}@example.com`;
  const { data, error } = await client.auth.signUp({
    email,
    password: 'Kilimani2026',
    options: { data: { full_name: `RLS ${name}` } },
  });
  if (error || !data.user) throw error ?? new Error('signUp returned no user');
  return { client, userId: data.user.id };
}

async function propertyIdForSlug(slug: string): Promise<string> {
  const { data, error } = await serviceClient
    .from('properties')
    .select('id')
    .eq('slug', slug)
    .single();
  if (error || !data) throw error ?? new Error(`fixture property not found: ${slug}`);
  return data.id;
}

const createdClients: SupabaseClient[] = [];

describe('favorites RLS (integration, local Supabase)', () => {
  afterAll(async () => {
    await Promise.all(createdClients.map((c) => c.auth.signOut()));
  });

  it('a customer can save (idempotently), see, and remove their own favorite', async () => {
    const customer = await signUpCustomer('customerA');
    createdClients.push(customer.client);
    const propertyId = await propertyIdForSlug(VISIBLE_SLUG);

    const save1 = await customer.client
      .from('favorites')
      .upsert(
        { customer_id: customer.userId, property_id: propertyId },
        { onConflict: 'customer_id,property_id', ignoreDuplicates: true },
      );
    expect(save1.error).toBeNull();

    // Idempotent: saving again is a no-op success, not a CONFLICT.
    const save2 = await customer.client
      .from('favorites')
      .upsert(
        { customer_id: customer.userId, property_id: propertyId },
        { onConflict: 'customer_id,property_id', ignoreDuplicates: true },
      );
    expect(save2.error).toBeNull();

    const list = await customer.client.from('favorites').select('property_id');
    expect(list.data).toHaveLength(1);
    expect(list.data?.[0]?.property_id).toBe(propertyId);

    const remove = await customer.client
      .from('favorites')
      .delete()
      .match({ customer_id: customer.userId, property_id: propertyId });
    expect(remove.error).toBeNull();

    const listAfter = await customer.client.from('favorites').select('property_id');
    expect(listAfter.data).toHaveLength(0);
  });

  it('a customer cannot see another customer’s favorites', async () => {
    const customerA = await signUpCustomer('customerB');
    const customerB = await signUpCustomer('customerC');
    createdClients.push(customerA.client, customerB.client);
    const propertyId = await propertyIdForSlug(VISIBLE_SLUG);

    await customerA.client
      .from('favorites')
      .upsert(
        { customer_id: customerA.userId, property_id: propertyId },
        { onConflict: 'customer_id,property_id', ignoreDuplicates: true },
      );

    const bList = await customerB.client.from('favorites').select('property_id');
    expect(bList.data).toHaveLength(0);
  });

  it('a guest has no access to favorites at all', async () => {
    const guest = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const result = await guest.from('favorites').select('property_id').limit(1);
    expect(result.error).not.toBeNull();
  });

  it('a moderator can see every customer’s favorites (support/analytics)', async () => {
    const customer = await signUpCustomer('customerD');
    const moderatorClient = actorClient('moderatorA');
    const email = `rls-fav-moderatorA-${Date.now()}@example.com`;
    const { data: modData, error: modError } = await moderatorClient.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'RLS Moderator' } },
    });
    if (modError || !modData.user) throw modError ?? new Error('moderator signUp failed');
    await serviceClient.from('profiles').update({ role: 'moderator' }).eq('id', modData.user.id);
    createdClients.push(customer.client, moderatorClient);

    const propertyId = await propertyIdForSlug(VISIBLE_SLUG);
    await customer.client
      .from('favorites')
      .upsert(
        { customer_id: customer.userId, property_id: propertyId },
        { onConflict: 'customer_id,property_id', ignoreDuplicates: true },
      );

    const modView = await moderatorClient
      .from('favorites')
      .select('property_id')
      .eq('customer_id', customer.userId);
    expect(modView.data).toHaveLength(1);
  });

  it('an archived property a customer favorited stays visible to that customer (properties_select_favorited_by_customer)', async () => {
    const customer = await signUpCustomer('customerE');
    createdClients.push(customer.client);
    const archivedId = await propertyIdForSlug(ARCHIVED_SLUG);

    // A guest/public query never sees the archived property at all.
    const guestView = await customer.client
      .from('properties')
      .select('id')
      .eq('id', archivedId)
      .maybeSingle();
    expect(guestView.data).toBeNull();

    // Favoriting doesn't require the property to be visible via the public
    // policy — only that the FK resolves and the row belongs to the caller.
    const favorite = await customer.client
      .from('favorites')
      .upsert(
        { customer_id: customer.userId, property_id: archivedId },
        { onConflict: 'customer_id,property_id', ignoreDuplicates: true },
      );
    expect(favorite.error).toBeNull();

    // The new carve-out policy makes the archived property visible again,
    // specifically to the customer who favorited it.
    const embedded = await customer.client
      .from('favorites')
      .select('property_id, property:properties(id, slug, is_archived)')
      .eq('property_id', archivedId)
      .single<{
        property_id: string;
        property: { id: string; slug: string; is_archived: boolean };
      }>();

    expect(embedded.error).toBeNull();
    expect(embedded.data?.property?.slug).toBe(ARCHIVED_SLUG);
    expect(embedded.data?.property?.is_archived).toBe(true);
  });
});
