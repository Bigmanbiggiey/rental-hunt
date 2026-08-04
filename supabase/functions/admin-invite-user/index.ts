import { corsHeaders } from '../_shared/cors.ts';
import { AdminAuthError, requireAdmin } from '../_shared/adminAuth.ts';

export const VALID_ROLES = ['customer', 'agent', 'moderator', 'admin'];
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface InviteUserBody {
  email?: string;
  fullName?: string;
  role?: string;
}

export interface ValidatedInvite {
  email: string;
  fullName: string;
  role: string;
}

export type ValidationResult = { ok: true; value: ValidatedInvite } | { ok: false; message: string };

// Pure, exported separately from the Deno.serve handler below specifically
// so it's directly unit-testable (api-design.md §20 — "Local: supabase
// functions serve + Deno's test runner for unit-level logic") without
// needing a real HTTP request/response or a live Supabase project.
export function validateInvite(body: InviteUserBody): ValidationResult {
  const email = body.email?.trim().toLowerCase();
  const fullName = body.fullName?.trim();
  const role = body.role ?? 'customer';

  if (!email || !EMAIL_PATTERN.test(email)) {
    return { ok: false, message: 'A valid email is required.' };
  }
  if (!fullName || fullName.length < 2) {
    return { ok: false, message: 'Full name is required.' };
  }
  if (!VALID_ROLES.includes(role)) {
    return { ok: false, message: 'Choose a valid role.' };
  }
  return { ok: true, value: { email, fullName, role } };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// api-design.md §9/§12 — admin-only, direct-invoke Edge Function (the "rare
// manual admin action" case §12 already anticipated). Creates the
// auth.users row via a real invite email (Supabase's own Admin API) rather
// than an admin ever setting/knowing the new user's password — the
// developer's explicit choice over a temp-password flow, 2026-08-04.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { adminId, serviceClient } = await requireAdmin(req);

    const body = (await req.json()) as InviteUserBody;
    const validated = validateInvite(body);
    if (!validated.ok) {
      return jsonResponse(400, { code: 'VALIDATION_ERROR', message: validated.message });
    }
    const { email, fullName, role } = validated.value;

    const { data: invited, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
    });

    if (inviteError) {
      // Supabase's own message for this case is stable enough to match on;
      // still falls through to the generic 500 branch below if it ever changes.
      if (inviteError.message.toLowerCase().includes('already been registered')) {
        return jsonResponse(409, { code: 'EMAIL_ALREADY_REGISTERED', message: 'A user with this email already exists.' });
      }
      throw inviteError;
    }

    const newUserId = invited.user.id;

    // handle_new_user always creates the profile as 'customer' — set the
    // real role only if it differs. current_role() already special-cases
    // service_role in prevent_self_role_change_trigger (database.md §9),
    // so this update isn't blocked by that trigger.
    if (role !== 'customer') {
      const { error: roleError } = await serviceClient.from('profiles').update({ role }).eq('id', newUserId);
      if (roleError) throw roleError;
    }

    await serviceClient.from('activity_logs').insert({
      actor_id: adminId,
      action: 'user.invited',
      entity_type: 'profile',
      entity_id: newUserId,
      metadata: { email, role },
    });

    return jsonResponse(200, { id: newUserId, email, fullName, role });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return jsonResponse(error.status, { code: error.status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN', message: error.message });
    }
    console.error('admin-invite-user failed:', error);
    return jsonResponse(500, { code: 'INTERNAL_ERROR', message: 'Could not send the invite. Try again.' });
  }
});
