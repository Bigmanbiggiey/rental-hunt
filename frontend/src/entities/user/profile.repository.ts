import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors/mapSupabaseError';
import { mapProfileRow, type ProfileRow } from './user.mapper';
import type { Profile, UUID } from './user.types';

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  notificationPreferences?: Record<string, boolean>;
}

export interface ProfileRepository {
  getById(id: UUID): Promise<Profile>;
  update(id: UUID, input: UpdateProfileInput): Promise<Profile>;
}

const PROFILE_COLUMNS =
  'id, role, full_name, phone, avatar_url, notification_preferences, is_active, created_at';

export const profileRepository: ProfileRepository = {
  async getById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', id)
      .single<ProfileRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'PROFILE_NOT_FOUND' });
    return mapProfileRow(data);
  },

  async update(id, input) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: input.fullName,
        phone: input.phone,
        avatar_url: input.avatarUrl,
        notification_preferences: input.notificationPreferences,
      })
      .eq('id', id)
      .select(PROFILE_COLUMNS)
      .single<ProfileRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'PROFILE_NOT_FOUND' });
    return mapProfileRow(data);
  },
};
