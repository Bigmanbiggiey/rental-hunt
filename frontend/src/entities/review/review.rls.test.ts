import { afterAll, describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { ANON_KEY, SUPABASE_URL, serviceClient, signUpActor } from '@/shared/lib/testing/rlsTestHelpers';

/**
 * Real RLS integration tests against the local Supabase stack — Epic 12's
 * `reviews` table, the `enforce_review_eligibility()` trigger, and the two
 * rating-summary views (`supabase/migrations/20260805110000_agency_marketplace.sql`).
 */
const guest = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

const AVAILABLE_SLUG = '2br-apartment-kilimani-a1';

async function propertyFixture(slug: string): Promise<{ id: string; agent_id: string; agency_id: string }> {
  const { data, error } = await serviceClient
    .from('properties')
    .select('id, agent_id, agency_id')
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

async function createViewingRequest(
  customerId: string,
  prop: { id: string; agent_id: string },
  status: 'pending' | 'completed' | 'cancelled',
): Promise<string> {
  const { data, error } = await serviceClient
    .from('viewing_requests')
    .insert({
      customer_id: customerId,
      property_id: prop.id,
      agent_id: prop.agent_id,
      requested_date: tomorrow(),
      requested_time: '14:00',
    })
    .select('id')
    .single();
  if (error || !data) throw error ?? new Error('viewing_requests fixture insert failed');

  if (status !== 'pending') {
    const { error: updateError } = await serviceClient
      .from('viewing_requests')
      .update({ status })
      .eq('id', data.id);
    if (updateError) throw updateError;
  }

  return data.id as string;
}

const createdClients: SupabaseClient[] = [];

describe('reviews RLS (integration, local Supabase, Epic 12)', () => {
  afterAll(async () => {
    await Promise.all(createdClients.map((c) => c.auth.signOut()));
  });

  it('a customer can review their own completed viewing, deriving agency/agent/property server-side', async () => {
    const customer = await signUpActor('reviewCustomerA');
    createdClients.push(customer.client);
    const prop = await propertyFixture(AVAILABLE_SLUG);
    const vrId = await createViewingRequest(customer.userId, prop, 'completed');

    const { data, error } = await customer.client
      .from('reviews')
      .insert({ customer_id: customer.userId, viewing_request_id: vrId, rating: 5, comment: 'Great agent!' })
      .select('id, agency_id, agent_id, property_id, rating')
      .single();

    expect(error).toBeNull();
    expect(data?.agency_id).toBe(prop.agency_id);
    expect(data?.agent_id).toBe(prop.agent_id);
    expect(data?.property_id).toBe(prop.id);

    const guestSees = await guest.from('reviews').select('id').eq('id', data!.id).maybeSingle();
    expect(guestSees.data?.id).toBe(data!.id);
  });

  it('a customer cannot review a pending (not yet completed) viewing', async () => {
    const customer = await signUpActor('reviewCustomerB');
    createdClients.push(customer.client);
    const prop = await propertyFixture(AVAILABLE_SLUG);
    const vrId = await createViewingRequest(customer.userId, prop, 'pending');

    const { error } = await customer.client
      .from('reviews')
      .insert({ customer_id: customer.userId, viewing_request_id: vrId, rating: 4 });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('RH003');
  });

  it('a customer cannot review a completed viewing that belongs to someone else', async () => {
    const owner = await signUpActor('reviewCustomerC');
    const intruder = await signUpActor('reviewCustomerD');
    createdClients.push(owner.client, intruder.client);
    const prop = await propertyFixture(AVAILABLE_SLUG);
    const vrId = await createViewingRequest(owner.userId, prop, 'completed');

    const { error } = await intruder.client
      .from('reviews')
      .insert({ customer_id: intruder.userId, viewing_request_id: vrId, rating: 3 });

    expect(error).not.toBeNull();
  });

  it('a second review on the same viewing request is rejected (one review per booking)', async () => {
    const customer = await signUpActor('reviewCustomerE');
    createdClients.push(customer.client);
    const prop = await propertyFixture(AVAILABLE_SLUG);
    const vrId = await createViewingRequest(customer.userId, prop, 'completed');

    const first = await customer.client
      .from('reviews')
      .insert({ customer_id: customer.userId, viewing_request_id: vrId, rating: 5 });
    expect(first.error).toBeNull();

    const second = await customer.client
      .from('reviews')
      .insert({ customer_id: customer.userId, viewing_request_id: vrId, rating: 2 });
    expect(second.error).not.toBeNull();
  });

  it('a rating outside 1-5 is rejected by the check constraint', async () => {
    const customer = await signUpActor('reviewCustomerF');
    createdClients.push(customer.client);
    const prop = await propertyFixture(AVAILABLE_SLUG);
    const vrId = await createViewingRequest(customer.userId, prop, 'completed');

    const { error } = await customer.client
      .from('reviews')
      .insert({ customer_id: customer.userId, viewing_request_id: vrId, rating: 6 });

    expect(error).not.toBeNull();
  });

  it('agency_rating_summary/agent_rating_summary reflect a new review and are guest-readable', async () => {
    const customer = await signUpActor('reviewCustomerG');
    createdClients.push(customer.client);
    const prop = await propertyFixture(AVAILABLE_SLUG);
    const vrId = await createViewingRequest(customer.userId, prop, 'completed');

    const { error: insertError } = await customer.client
      .from('reviews')
      .insert({ customer_id: customer.userId, viewing_request_id: vrId, rating: 4 });
    expect(insertError).toBeNull();

    const agencySummary = await guest
      .from('agency_rating_summary')
      .select('agency_id, average_rating, review_count')
      .eq('agency_id', prop.agency_id)
      .single();
    expect(agencySummary.error).toBeNull();
    expect(agencySummary.data?.review_count).toBeGreaterThanOrEqual(1);

    const agentSummary = await guest
      .from('agent_rating_summary')
      .select('agent_id, average_rating, review_count')
      .eq('agent_id', prop.agent_id)
      .single();
    expect(agentSummary.error).toBeNull();
    expect(agentSummary.data?.review_count).toBeGreaterThanOrEqual(1);
  });

  it('admin can soft-delete (moderate) another customer\'s review via UPDATE', async () => {
    const admin = await signUpActor('reviewAdminA', 'admin');
    const customer = await signUpActor('reviewCustomerH');
    createdClients.push(admin.client, customer.client);
    const prop = await propertyFixture(AVAILABLE_SLUG);
    const vrId = await createViewingRequest(customer.userId, prop, 'completed');

    const { data: review } = await customer.client
      .from('reviews')
      .insert({ customer_id: customer.userId, viewing_request_id: vrId, rating: 1 })
      .select('id')
      .single();

    const asAdmin = await admin.client
      .from('reviews')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', review!.id)
      .select('id')
      .single();
    expect(asAdmin.error).toBeNull();

    const guestAfter = await guest.from('reviews').select('id').eq('id', review!.id).maybeSingle();
    expect(guestAfter.data).toBeNull();
  });
});
