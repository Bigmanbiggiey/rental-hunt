import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Both admin-only functions (`admin-invite-user`, `admin-delete-user`) need
 * the exact same check: `service_role` bypasses RLS entirely, so unlike a
 * normal Repository call, an Edge Function has to re-implement the
 * authorization RLS would otherwise provide (same posture as
 * `set_property_verification()`'s own role check, database.md §9) — an
 * Edge Function with no auth check of its own would let *any* authenticated
 * user reach `auth.admin.*`, not just admins.
 */
export class AdminAuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface AdminAuthResult {
  adminId: string;
  /** Only created once the caller is confirmed admin — least privilege, not handed out speculatively. */
  serviceClient: SupabaseClient;
}

export async function requireAdmin(req: Request): Promise<AdminAuthResult> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new AdminAuthError(401, 'Missing Authorization header.');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // The caller's own JWT-scoped client — RLS itself gates this profile read
  // to "your own row only" (profiles_select_own, since Sprint 2), so even a
  // bug here could never leak whether some *other* user is an admin.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();
  if (userError || !user) throw new AdminAuthError(401, 'Invalid or expired session.');

  const { data: profile, error: profileError } = await callerClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profileError || !profile || profile.role !== 'admin') {
    throw new AdminAuthError(403, 'Admin access required.');
  }

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  return { adminId: user.id, serviceClient };
}
