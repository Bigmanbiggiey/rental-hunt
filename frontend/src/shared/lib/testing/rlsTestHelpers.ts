import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Shared setup for real-RLS integration tests against the local Supabase
 * stack — extracted once this pattern reached its third near-identical
 * inline copy (`entities/user/profile.rls.test.ts`, `entities/agent/agent.rls.test.ts`,
 * and this Sprint 6 pass adding `entities/property`/`entities/viewing-request`
 * coverage), per coding-standards.md's "extract on the third real
 * duplicate." Test-only — never imported by application code, so it's
 * tree-shaken out of the production bundle regardless.
 */
export const SUPABASE_URL = 'http://127.0.0.1:54321';
// Fixed local-dev-only demo keys (identical on every `supabase start`), not real secrets.
export const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
export const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export function actorClient(name: string): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, storageKey: `test-actor-${name}-${Date.now()}` },
  });
}

/** service_role bypasses RLS entirely — the one legitimate way to promote a role or seed fixture rows in these tests. */
export const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export interface SignedUpActor {
  client: SupabaseClient;
  userId: string;
  email: string;
}

export async function signUpActor(
  name: string,
  role?: 'agent' | 'moderator' | 'admin',
): Promise<SignedUpActor> {
  const client = actorClient(name);
  const email = `rls-${name}-${Date.now()}@example.com`;
  const { data, error } = await client.auth.signUp({
    email,
    password: 'Kilimani2026',
    options: { data: { full_name: `RLS ${name}` } },
  });
  if (error || !data.user) throw error ?? new Error('signUp returned no user');

  if (role) {
    const { error: promoteError } = await serviceClient
      .from('profiles')
      .update({ role })
      .eq('id', data.user.id);
    if (promoteError) throw promoteError;
  }

  return { client, userId: data.user.id, email };
}

export interface SignedUpAgent extends SignedUpActor {
  agentId: string;
}

/** Promotes to 'agent' and inserts the corresponding `agents` row (which plain role promotion doesn't create on its own). */
export async function signUpAgent(name: string, agencyId: string): Promise<SignedUpAgent> {
  const actor = await signUpActor(name, 'agent');

  const { data: agentRow, error } = await serviceClient
    .from('agents')
    .insert({ profile_id: actor.userId, agency_id: agencyId, job_title: 'Leasing Agent', bio: 'Seed bio.' })
    .select('id')
    .single();
  if (error || !agentRow) throw error ?? new Error('agents insert returned no row');

  return { ...actor, agentId: agentRow.id as string };
}
