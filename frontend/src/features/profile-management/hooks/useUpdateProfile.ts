import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEY, useAuth } from '@/entities/user';
import { AppError } from '@/shared/lib/errors';
import { profileService } from '../services/profile.service';
import type { UpdateProfileInput } from '../schemas/updateProfile.schema';

export function useUpdateProfile() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => {
      if (!profile) throw new AppError('UNAUTHENTICATED', 'Please sign in to continue.');
      return profileService.updateProfile(profile.id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
}
