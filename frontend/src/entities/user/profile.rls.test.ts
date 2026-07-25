import { afterAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Real RLS integration tests against the local Supabase stack — proving
 * database.md §9's `profiles`/`roles` policies (Policy Summary rows 1–2),
 * not just the client-side ProtectedRoute guard. Per roadmap.md §6's
 * acceptance test: "navigating to /admin as a Customer is blocked (both
 * client-side redirect *and* verified this can't be bypassed by directly
 * hitting a data query, per RLS)". SYS-002 baseline.
 *
 * Each actor gets its own isolated client (separate `storageKey`, no
 * `persistSession`) so multiple concurrently-authenticated identities can
 * be exercised in one process — the app's shared `shared/lib/supabase`
 * singleton is deliberately not reused here.
 */
const SUPABASE_URL = 'http://127.0.0.1:54321';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
// Fixed local-dev-only demo key (identical on every `supabase start`), not a real secret.
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

function actorClient(name: string): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, storageKey: `test-actor-${name}-${Date.now()}` },
  });
}

const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function signUpActor(name: string, role?: 'agent' | 'moderator' | 'admin') {
  const client = actorClient(name);
  const email = `rls-${name}-${Date.now()}@example.com`;
  const { data, error } = await client.auth.signUp({
    email,
    password: 'Kilimani2026',
    options: { data: { full_name: `RLS ${name}` } },
  });
  if (error || !data.user) throw error ?? new Error('signUp returned no user');

  if (role) {
    // service_role bypasses RLS entirely — the one legitimate way to
    // promote a role in this test, mirroring how a real Admin's own
    // security-definer-backed path would work once one exists.
    const { error: promoteError } = await serviceClient
      .from('profiles')
      .update({ role })
      .eq('id', data.user.id);
    if (promoteError) throw promoteError;
  }

  return { client, userId: data.user.id, email };
}

const createdClients: SupabaseClient[] = [];

describe('profiles/roles RLS (integration, local Supabase, SYS-002)', () => {
  afterAll(async () => {
    await Promise.all(createdClients.map((c) => c.auth.signOut()));
  });

  it('a Customer can read and update only their own profile', async () => {
    const customerA = await signUpActor('customerA');
    const customerB = await signUpActor('customerB');
    createdClients.push(customerA.client, customerB.client);

    const own = await customerA.client
      .from('profiles')
      .select('id')
      .eq('id', customerA.userId)
      .single();
    expect(own.error).toBeNull();
    expect(own.data?.id).toBe(customerA.userId);

    // RLS filters the row out entirely — PostgREST reports it as "no rows",
    // not a permission error, which is the correct (non-leaking) behavior.
    const others = await customerA.client
      .from('profiles')
      .select('id')
      .eq('id', customerB.userId)
      .single();
    expect(others.error).not.toBeNull();
    expect(others.data).toBeNull();

    const update = await customerA.client
      .from('profiles')
      .update({ full_name: 'Updated By Self' })
      .eq('id', customerA.userId)
      .select('full_name')
      .single();
    expect(update.error).toBeNull();
    expect(update.data?.full_name).toBe('Updated By Self');
  });

  it('a Customer cannot update another Customer’s profile', async () => {
    const customerA = await signUpActor('customerC');
    const customerB = await signUpActor('customerD');
    createdClients.push(customerA.client, customerB.client);

    const result = await customerA.client
      .from('profiles')
      .update({ full_name: 'Hijacked' })
      .eq('id', customerB.userId)
      .select('full_name')
      .single();

    // RLS's own-row `USING` clause filters the target row out before the
    // UPDATE can match anything — PostgREST reports 0 rows affected.
    expect(result.error).not.toBeNull();

    const check = await serviceClient
      .from('profiles')
      .select('full_name')
      .eq('id', customerB.userId)
      .single();
    expect(check.data?.full_name).not.toBe('Hijacked');
  });

  it('a non-admin cannot change their own role (prevent_self_role_change trigger)', async () => {
    const customer = await signUpActor('customerE');
    createdClients.push(customer.client);

    const result = await customer.client
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', customer.userId)
      .select('role')
      .single();

    expect(result.error).not.toBeNull();
    expect(result.error?.message).toMatch(/only an admin/i);

    const check = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', customer.userId)
      .single();
    expect(check.data?.role).toBe('customer');
  });

  it('a Moderator can read every profile, but a Customer cannot', async () => {
    const moderator = await signUpActor('moderatorA', 'moderator');
    const customer = await signUpActor('customerF');
    createdClients.push(moderator.client, customer.client);

    const moderatorView = await moderator.client
      .from('profiles')
      .select('id')
      .eq('id', customer.userId)
      .single();
    expect(moderatorView.error).toBeNull();
    expect(moderatorView.data?.id).toBe(customer.userId);

    const customerView = await customer.client
      .from('profiles')
      .select('id')
      .eq('id', moderator.userId)
      .single();
    expect(customerView.error).not.toBeNull();
  });

  it('an Admin can read and update any profile, including changing another user’s role', async () => {
    const admin = await signUpActor('adminA', 'admin');
    const customer = await signUpActor('customerG');
    createdClients.push(admin.client, customer.client);

    const adminRead = await admin.client
      .from('profiles')
      .select('id')
      .eq('id', customer.userId)
      .single();
    expect(adminRead.error).toBeNull();

    const promote = await admin.client
      .from('profiles')
      .update({ role: 'agent' })
      .eq('id', customer.userId)
      .select('role')
      .single();
    expect(promote.error).toBeNull();
    expect(promote.data?.role).toBe('agent');
  });

  it('the roles reference table is publicly readable, even signed out', async () => {
    const guest = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const result = await guest.from('roles').select('code').order('sort_order');
    expect(result.error).toBeNull();
    expect(result.data?.map((r) => r.code)).toEqual(['customer', 'agent', 'moderator', 'admin']);
  });

  it('a guest has no access to the profiles table at all', async () => {
    const guest = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const result = await guest.from('profiles').select('id').limit(1);
    // anon has no GRANT on profiles at all (not just no matching RLS policy),
    // so this fails outright rather than succeeding with an empty set —
    // the strictest reading of the Policy Summary's "No access".
    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});
