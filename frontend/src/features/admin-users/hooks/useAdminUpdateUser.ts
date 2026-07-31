import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminUpdateUserFormInput } from '../schemas/adminUpdateUser.schema';
import { adminUserService } from '../services/admin-user.service';

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminUpdateUserFormInput }) =>
      adminUserService.adminUpdate(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
