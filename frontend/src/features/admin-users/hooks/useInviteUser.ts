import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InviteUserFormInput } from '../schemas/inviteUser.schema';
import { adminUserService } from '../services/admin-user.service';

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InviteUserFormInput) => adminUserService.invite(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
