import { afterAll, describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { ANON_KEY, SUPABASE_URL, serviceClient, signUpActor } from '@/shared/lib/testing/rlsTestHelpers';

/**
 * Real RLS integration tests against the local Supabase stack — proves
 * database.md §9's `agencies` Policy Summary row for Sprint 7's new
 * `entities/agency` slice (the existing Sprint 3 RLS policies themselves are
 * unchanged; this is the slice's first real exercise of them).
 */
const guest = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

describe('agencies RLS (integration, local Supabase, Sprint 7)', () => {
  const clients: SupabaseClient[] = [];
  afterAll(async () => {
    await Promise.all(clients.map((c) => c.auth.signOut()));
  });

  it('an admin can create an agency; a customer/agent/moderator cannot', async () => {
    const admin = await signUpActor('agencyAdminA', 'admin');
    const customer = await signUpActor('agencyCustomerA');
    const moderator = await signUpActor('agencyModeratorA', 'moderator');
    clients.push(admin.client, customer.client, moderator.client);

    const asAdmin = await admin.client
      .from('agencies')
      .insert({ name: 'RLS Test Agency', slug: `rls-test-agency-${Date.now()}` })
      .select('id')
      .single();
    expect(asAdmin.error).toBeNull();
    expect(asAdmin.data?.id).toBeDefined();

    const asCustomer = await customer.client
      .from('agencies')
      .insert({ name: 'Denied Agency', slug: `denied-agency-${Date.now()}` });
    expect(asCustomer.error).not.toBeNull();

    const asModerator = await moderator.client
      .from('agencies')
      .insert({ name: 'Denied Agency 2', slug: `denied-agency-2-${Date.now()}` });
    expect(asModerator.error).not.toBeNull();
  });

  it('an admin can deactivate an agency; a guest then loses visibility while agent/moderator/admin retain it', async () => {
    const admin = await signUpActor('agencyAdminB', 'admin');
    const agent = await signUpActor('agencyAgentB', 'agent');
    clients.push(admin.client, agent.client);

    const { data: created } = await serviceClient
      .from('agencies')
      .insert({ name: 'Deactivation Test Agency', slug: `deactivation-test-${Date.now()}`, is_active: true })
      .select('id')
      .single();
    const agencyId = created!.id as string;

    const guestBefore = await guest.from('agencies').select('id').eq('id', agencyId).maybeSingle();
    expect(guestBefore.data?.id).toBe(agencyId);

    const update = await admin.client.from('agencies').update({ is_active: false }).eq('id', agencyId);
    expect(update.error).toBeNull();

    const guestAfter = await guest.from('agencies').select('id').eq('id', agencyId).maybeSingle();
    expect(guestAfter.data).toBeNull();

    const agentAfter = await agent.client.from('agencies').select('id').eq('id', agencyId).maybeSingle();
    expect(agentAfter.data?.id).toBe(agencyId);
  });
});
