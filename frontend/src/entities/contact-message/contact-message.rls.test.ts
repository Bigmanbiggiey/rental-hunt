import { afterAll, describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { ANON_KEY, SUPABASE_URL, serviceClient, signUpActor } from '@/shared/lib/testing/rlsTestHelpers';

/**
 * Real RLS integration tests against the local Supabase stack — proves
 * database.md §9's `contact_messages` Policy Summary row (CONTENT-002/003,
 * added 2026-08-05): anyone can insert, only admin can read/update/delete,
 * and an authenticated caller cannot spoof another user's `user_id`.
 */
const guest = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

describe('contact_messages RLS (integration, local Supabase)', () => {
  const clients: SupabaseClient[] = [];
  afterAll(async () => {
    await Promise.all(clients.map((c) => c.auth.signOut()));
  });

  // Verified via `serviceClient` afterward (service_role bypasses RLS), not
  // by reading back through the inserting client's own session — a guest
  // has no `auth.uid()` for any self-scoped SELECT policy to key off, and
  // database.md §5.16's RLS design gives no role but admin SELECT at all,
  // so `.insert().select()` as the guest/customer themselves fails with
  // `42501` (found via this exact test failing for real, not assumed —
  // see `contact-message.repository.ts`'s `submit()` for the fix this
  // drove: the repository never chains `.select()` after `insert()`).
  it('a guest can submit a message with a null user_id', async () => {
    const email = `guest-rls-${Date.now()}@example.test`;
    const insertResult = await guest
      .from('contact_messages')
      .insert({ name: 'Guest Submitter', email, message: 'Is this listing still open?' });
    expect(insertResult.error).toBeNull();

    const stored = await serviceClient.from('contact_messages').select('user_id').eq('email', email).single();
    expect(stored.data?.user_id).toBeNull();
  });

  it("an authenticated customer's submission defaults user_id to their own id", async () => {
    const customer = await signUpActor('contactCustomerA');
    clients.push(customer.client);
    const email = `customer-rls-${Date.now()}@example.test`;

    const insertResult = await customer.client
      .from('contact_messages')
      .insert({ name: 'Real Customer', email, message: 'A question about a booking.' });
    expect(insertResult.error).toBeNull();

    const stored = await serviceClient.from('contact_messages').select('user_id').eq('email', email).single();
    expect(stored.data?.user_id).toBe(customer.userId);
  });

  it('an authenticated customer cannot spoof another user_id on insert', async () => {
    const customer = await signUpActor('contactCustomerB');
    const other = await signUpActor('contactCustomerC');
    clients.push(customer.client, other.client);

    const result = await customer.client.from('contact_messages').insert({
      user_id: other.userId,
      name: 'Spoofer',
      email: 'spoof-rls@example.test',
      message: 'Trying to spoof another user id.',
    });

    expect(result.error).not.toBeNull();
  });

  it('only admin can select/update/delete; guest and customer are denied', async () => {
    const admin = await signUpActor('contactAdminA', 'admin');
    const customer = await signUpActor('contactCustomerD');
    clients.push(admin.client, customer.client);

    const { data: created } = await serviceClient
      .from('contact_messages')
      .insert({ name: 'Triage Target', email: 'triage-rls@example.test', message: 'Needs admin review.' })
      .select('id')
      .single();
    const messageId = created!.id as string;

    const guestSelect = await guest.from('contact_messages').select('id').eq('id', messageId).maybeSingle();
    expect(guestSelect.data).toBeNull();

    const customerSelect = await customer.client
      .from('contact_messages')
      .select('id')
      .eq('id', messageId)
      .maybeSingle();
    expect(customerSelect.data).toBeNull();

    const customerUpdate = await customer.client
      .from('contact_messages')
      .update({ is_resolved: true })
      .eq('id', messageId)
      .select('id');
    expect(customerUpdate.data).toEqual([]);

    const adminSelect = await admin.client.from('contact_messages').select('id').eq('id', messageId).maybeSingle();
    expect(adminSelect.data?.id).toBe(messageId);

    const adminUpdate = await admin.client
      .from('contact_messages')
      .update({ is_resolved: true })
      .eq('id', messageId)
      .select('is_resolved')
      .single();
    expect(adminUpdate.data?.is_resolved).toBe(true);

    const adminDelete = await admin.client.from('contact_messages').delete().eq('id', messageId);
    expect(adminDelete.error).toBeNull();
  });
});
