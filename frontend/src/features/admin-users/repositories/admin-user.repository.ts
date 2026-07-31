import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors';
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
}

const PROFILE_COLUMNS =
  'id, role, full_name, phone, avatar_url, notification_preferences, is_active, created_at';
const DEFAULT_PAGE_SIZE = 20;

// api-design.md §9's "Manage Users" row — `list()`/`adminUpdate()` only this
// feature needs (no other consumer anywhere in the roadmap), so this
// repository stays feature-local rather than extending
// `entities/user/profile.repository.ts` (ADR-026/028's "2+ consumers" test;
// `getById`/`update` there stay scoped to a user's own row, per CUST-003).
export interface AdminUserRepository {
  list(filters?: AdminUserFilters, page?: number, pageSize?: number): Promise<AdminUserListResult>;
  adminUpdate(id: string, input: AdminUpdateUserInput): Promise<Profile>;
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

    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', id)
      .select(PROFILE_COLUMNS)
      .single<ProfileRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'PROFILE_NOT_FOUND' });
    return mapProfileRow(data);
  },
};
