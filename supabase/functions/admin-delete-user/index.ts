import { corsHeaders } from '../_shared/cors.ts';
import { AdminAuthError, requireAdmin } from '../_shared/adminAuth.ts';

export interface DeleteUserBody {
  userId?: string;
}

export type ValidationResult = { ok: true; userId: string } | { ok: false; message: string };

// Pure — separated from the Deno.serve handler for the same reason as
// admin-invite-user's validateInvite (api-design.md §20).
export function validateDeleteRequest(body: DeleteUserBody, callerId: string): ValidationResult {
  const userId = body.userId?.trim();
  if (!userId) return { ok: false, message: 'userId is required.' };
  if (userId === callerId) return { ok: false, message: 'You cannot delete your own account.' };
  return { ok: true, userId };
}

export interface ActivityBlockers {
  properties: number;
  agentBookings: number;
  customerBookings: number;
  reviews: number;
  verifiedProperties: number;
}

export function hasBlockingActivity(blockers: ActivityBlockers): boolean {
  return Object.values(blockers).some((count) => count > 0);
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// api-design.md §9/§12. A real hard delete via Supabase's Admin API — but
// only when the target account is genuinely empty. `properties.agent_id`,
// `viewing_requests.customer_id`/`.agent_id`, and
// `property_verifications.reviewed_by` are all `on delete restrict`
// (database.md §5); `properties.verified_by` is `on delete set null` but
// still guarded by `enforce_verification_authority()`'s trigger (found via
// real testing, not inspection — see the comment below). All five exist so
// a real listing/booking/review/verification history can never be silently
// orphaned or bypass the verification-authority rule — this function
// proves that before attempting the delete, rather than letting the Admin
// API call fail with an opaque error. Any account with real history stays
// on Deactivate (`adminUpdate`'s existing `isActive` toggle) — developer's
// explicit choice over always-attempt-and-fail, 2026-08-04.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { adminId, serviceClient } = await requireAdmin(req);

    const body = (await req.json()) as DeleteUserBody;
    const validated = validateDeleteRequest(body, adminId);
    if (!validated.ok) {
      return jsonResponse(400, { code: 'VALIDATION_ERROR', message: validated.message });
    }
    const { userId } = validated;

    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) {
      return jsonResponse(404, { code: 'PROFILE_NOT_FOUND', message: 'This user no longer exists.' });
    }

    const { data: agent } = await serviceClient.from('agents').select('id').eq('profile_id', userId).maybeSingle();

    const [propertiesCount, agentBookingsCount, customerBookingsCount, reviewsCount, verifiedPropertiesCount] =
      await Promise.all([
        agent
          ? serviceClient.from('properties').select('id', { count: 'exact', head: true }).eq('agent_id', agent.id)
          : Promise.resolve({ count: 0 }),
        agent
          ? serviceClient.from('viewing_requests').select('id', { count: 'exact', head: true }).eq('agent_id', agent.id)
          : Promise.resolve({ count: 0 }),
        serviceClient.from('viewing_requests').select('id', { count: 'exact', head: true }).eq('customer_id', userId),
        serviceClient.from('property_verifications').select('id', { count: 'exact', head: true }).eq('reviewed_by', userId),
        // properties.verified_by is `on delete set null`, not `restrict` — so
        // it was never going to raise a clean FK-violation error. Found via
        // real testing (2026-08-04, not by inspection): even a *cascaded*
        // SET NULL write to properties.verified_by is still caught by
        // enforce_verification_authority()'s trigger guard, which only
        // allows that column to change through set_property_verification().
        // Without this check, deleting any profile ever recorded as a
        // property's verifier failed with an opaque 500 instead of a clean,
        // explained 409 — exactly what this function exists to prevent.
        serviceClient.from('properties').select('id', { count: 'exact', head: true }).eq('verified_by', userId),
      ]);

    const blockers: ActivityBlockers = {
      properties: propertiesCount.count ?? 0,
      agentBookings: agentBookingsCount.count ?? 0,
      customerBookings: customerBookingsCount.count ?? 0,
      reviews: reviewsCount.count ?? 0,
      verifiedProperties: verifiedPropertiesCount.count ?? 0,
    };

    if (hasBlockingActivity(blockers)) {
      // AppError.details (frontend) is typed Record<string, string> — a
      // field-path -> message map, matching Zod's error shape — so counts
      // are stringified here rather than widening that shared type for
      // this one call site.
      return jsonResponse(409, {
        code: 'USER_HAS_ACTIVITY',
        message: 'This user has real activity and cannot be deleted — deactivate them instead.',
        details: Object.fromEntries(Object.entries(blockers).map(([key, count]) => [key, String(count)])),
      });
    }

    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    // profiles.id -> auth.users.id is `on delete cascade`, so the profile
    // (and, via agents.profile_id's own cascade) any now-empty agent row
    // are already gone by this point — nothing left to clean up here.
    await serviceClient.from('activity_logs').insert({
      actor_id: adminId,
      action: 'user.deleted',
      entity_type: 'profile',
      entity_id: userId,
      metadata: {},
    });

    return jsonResponse(200, { id: userId, deleted: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return jsonResponse(error.status, { code: error.status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN', message: error.message });
    }
    console.error('admin-delete-user failed:', error);
    return jsonResponse(500, { code: 'INTERNAL_ERROR', message: 'Could not delete this user. Try again.' });
  }
});
