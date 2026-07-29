import { parseOrThrow } from '@/shared/lib/errors';
import { profileRepository } from '@/entities/user';
import { UpdateProfileSchema, type UpdateProfileInput } from '../schemas/updateProfile.schema';
import {
  NotificationPreferencesSchema,
  type NotificationPreferencesInput,
} from '../schemas/notificationPreferences.schema';

export const profileService = {
  async updateProfile(id: string, input: UpdateProfileInput) {
    const parsed = parseOrThrow(UpdateProfileSchema, input);
    return profileRepository.update(id, { fullName: parsed.fullName, phone: parsed.phone });
  },

  // CUST-004's "not fully disable-able, only their delivery channel" AC has
  // no delivery-channel infrastructure to hook up yet (no `notifications`
  // table, no email/SMS pipeline — deliberately deferred, database.md §15) —
  // forcing `bookingUpdates: true` after validation is the honest,
  // minimal-scope reading, not a fake channel selector with nothing behind it.
  async updateNotificationPreferences(id: string, input: NotificationPreferencesInput) {
    const parsed = parseOrThrow(NotificationPreferencesSchema, input);
    return profileRepository.update(id, {
      notificationPreferences: { ...parsed, bookingUpdates: true },
    });
  },
};
