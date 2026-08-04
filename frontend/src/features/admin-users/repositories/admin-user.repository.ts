import { supabase } from '@/shared/lib/supabase';
import { AppError, mapSupabaseError, type ErrorCode, type ErrorDetails } from '@/shared/lib/errors';
import { mapProfileRow, type Profile, type ProfileRow, type UserRole } from '@/entities/user';

export interface AdminUserFilters {
  role?: UserRole;
  isActive?: boolean;
  q?: string;
}

export interface AdminUserListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminUserListResult {
  data: Profile[];
  meta: AdminUserListMeta;
}

export interface AdminUpdateUserInput {
  role?: UserRole;
  isActive?: boolean;
  fullName?: string;
  phone?: string;
}

export interface InviteUserInput {
  email: string;
  fullName: string;
  role: UserRole;
}

export interface InvitedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface DeleteUserResult {
  id: string;
  deleted: true;
}

const PROFILE_COLUMNS =
  'id, role, full_name, phone, avatar_url, notification_preferences, is_active, created_at';
const DEFAULT_PAGE_SIZE = 20;

// Both Edge Functions return a body already shaped like `{ code, message }`
// with one of *our* ErrorCodes — a real invite/delete failure is meaningful
// application flow (EMAIL_ALREADY_REGISTERED, USER_HAS_ACTIVITY), not a raw
// Postgres/Auth error `mapSupabaseError` was built to normalize, so this
// stays a small local helper rather than growing that shared one's guard
// logic (and risking it misreading this shape as the generic Auth-error-like
// case it already checks for, since both have `message` + `code`).
const KNOWN_FUNCTION_ERROR_CODES: ErrorCode[] = [
  'VALIDATION_ERROR',
  'EMAIL_ALREADY_REGISTERED',
  'USER_HAS_ACTIVITY',
  'PROFILE_NOT_FOUND',
  'UNAUTHENTICATED',
  'FORBIDDEN',
];

async function invokeAdminFunction<T, B extends object = object>(name: string, body: B): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body: body as Record<string, unknown> });
  if (error) {
    let parsed: { code?: string; message?: string; details?: ErrorDetails } | null = null;
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        parsed = await context.clone().json();
      } catch {
        parsed = null;
      }
    }
    if (parsed?.code && KNOWN_FUNCTION_ERROR_CODES.includes(parsed.code as ErrorCode)) {
      throw new AppError(parsed.code as ErrorCode, parsed.message ?? 'Something went wrong.', parsed.details ?? null);
    }
    throw new AppError('UNEXPECTED_ERROR', 'Something went wrong on our end. Please try again.', null);
  }
  return data as T;
}

// api-design.md §9's "Manage Users" row — `list()`/`adminUpdate()` only this
// feature needs (no other consumer anywhere in the roadmap), so this
// repository stays feature-local rather than extending
// `entities/user/profile.repository.ts` (ADR-026/028's "2+ consumers" test;
// `getById`/`update` there stay scoped to a user's own row, per CUST-003).
// `invite`/`deleteUser` (post-Sprint-8) both go through an Edge Function,
// never a direct table call — they need `service_role` (creating/deleting a
// real `auth.users` row), which never reaches the frontend (api-design.md §12).
export interface AdminUserRepository {
  list(filters?: AdminUserFilters, page?: number, pageSize?: number): Promise<AdminUserListResult>;
  adminUpdate(id: string, input: AdminUpdateUserInput): Promise<Profile>;
  invite(input: InviteUserInput): Promise<InvitedUser>;
  deleteUser(id: string): Promise<DeleteUserResult>;
}

export const adminUserRepository: AdminUserRepository = {
  async list(filters = {}, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('profiles')
      .select(PROFILE_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.role) query = query.eq('role', filters.role);
    if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive);
    if (filters.q) query = query.ilike('full_name', `%${filters.q}%`);

    const { data, error, count } = await query.returns<ProfileRow[]>();
    if (error) throw mapSupabaseError(error);

    const total = count ?? 0;
    return {
      data: (data ?? []).map(mapProfileRow),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  // The only path that can change profiles.role (api-design.md §9) —
  // `profiles_update_all_admin` (RLS) is the real authority; `prevent_self_role_change_trigger`
  // already special-cases admin correctly for *another* user's row
  // (database.md §9's column-level note — current_role() resolves the
  // acting caller, not the target row, so this needs no trigger change).
  async adminUpdate(id, input) {
    const patch: Record<string, unknown> = {};
    if (input.role !== undefined) patch.role = input.role;
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    if (input.fullName !== undefined) patch.full_name = input.fullName;
    if (input.phone !== undefined) patch.phone = input.phone === '' ? null : input.phone;

    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', id)
      .select(PROFILE_COLUMNS)
      .single<ProfileRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'PROFILE_NOT_FOUND' });
    return mapProfileRow(data);
  },

  async invite(input) {
    return invokeAdminFunction<InvitedUser>('admin-invite-user', input);
  },

  async deleteUser(id) {
    return invokeAdminFunction<DeleteUserResult>('admin-delete-user', { userId: id });
  },
};
