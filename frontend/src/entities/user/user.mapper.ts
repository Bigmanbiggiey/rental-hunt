import type { Profile, UserRole } from './user.types';

/** Shape of a raw `public.profiles` row (database.md §5.1), snake_case as PostgREST returns it. */
export interface ProfileRow {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  notification_preferences: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
}

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    role: row.role,
    fullName: row.full_name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    notificationPreferences: row.notification_preferences,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}
