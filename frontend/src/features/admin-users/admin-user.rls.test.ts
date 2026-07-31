import { afterAll, describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { serviceClient, signUpActor } from '@/shared/lib/testing/rlsTestHelpers';

/**
 * Real RLS integration tests against the local Supabase stack, exercised
 * directly through a per-actor client — matching every other `*.rls.test.ts`
 * file's convention (the module-level `supabase` singleton `adminUserRepository`
 * calls has no clean per-test session swap, so RLS itself is proven here,
 * the same way `verification.rls.test.ts` proves the RPC via a raw
 * `.client.rpc(...)` call rather than through `verificationRepository`).
 * The SQL logic already checks out on inspection
 * (`profiles_update_all_admin`, `prevent_self_role_change_trigger`'s admin
 * bypass resolving via `current_role()` on the *acting* caller, not the
 * target row) — this is the one line item worth re-verifying live end to
 * end, per the Sprint 7 plan.
 */
describe('profiles admin role/status management RLS (integration, local Supabase, Sprint 7)', () => {
  const clients: SupabaseClient[] = [];
  afterAll(async () => {
    await Promise.all(clients.map((c) => c.auth.signOut()));
  });

  it('an admin can change another user’s role and deactivate them', async () => {
    const admin = await signUpActor('adminUserAdminA', 'admin');
    const target = await signUpActor('adminUserTargetA');
    clients.push(admin.client, target.client);

    const result = await admin.client
      .from('profiles')
      .update({ role: 'agent', is_active: false })
      .eq('id', target.userId)
      .select('role, is_active')
      .single();

    expect(result.error).toBeNull();
    expect(result.data?.role).toBe('agent');
    expect(result.data?.is_active).toBe(false);

    const check = await serviceClient
      .from('profiles')
      .select('role, is_active')
      .eq('id', target.userId)
      .single();
    expect(check.data?.role).toBe('agent');
    expect(check.data?.is_active).toBe(false);
  });

  it('a non-admin cannot change another user’s role or active status', async () => {
    const agent = await signUpActor('adminUserAgentA', 'agent');
    const target = await signUpActor('adminUserTargetB');
    clients.push(agent.client, target.client);

    const roleAttempt = await agent.client
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', target.userId)
      .select('role')
      .single();
    expect(roleAttempt.error).not.toBeNull();

    const statusAttempt = await agent.client
      .from('profiles')
      .update({ is_active: false })
      .eq('id', target.userId)
      .select('is_active')
      .single();
    expect(statusAttempt.error).not.toBeNull();

    const check = await serviceClient.from('profiles').select('role, is_active').eq('id', target.userId).single();
    expect(check.data?.role).toBe('customer');
    expect(check.data?.is_active).toBe(true);
  });

  it('a non-admin still cannot change their own role, even after Sprint 7 (regression check on the pre-existing trigger)', async () => {
    const customer = await signUpActor('adminUserSelfA');
    clients.push(customer.client);

    const attempt = await customer.client.from('profiles').update({ role: 'admin' }).eq('id', customer.userId);
    expect(attempt.error).not.toBeNull();
  });
});
