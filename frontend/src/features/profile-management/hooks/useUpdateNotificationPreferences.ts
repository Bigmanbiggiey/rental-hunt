import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEY, useAuth } from '@/entities/user';
import { AppError } from '@/shared/lib/errors';
import { profileService } from '../services/profile.service';
import type { NotificationPreferencesInput } from '../schemas/notificationPreferences.schema';

export function useUpdateNotificationPreferences() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NotificationPreferencesInput) => {
      if (!profile) throw new AppError('UNAUTHENTICATED', 'Please sign in to continue.');
      return profileService.updateNotificationPreferences(profile.id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
}
