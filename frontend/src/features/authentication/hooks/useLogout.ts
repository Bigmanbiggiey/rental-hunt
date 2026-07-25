import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEY } from '@/entities/user';
import { authService } from '../services/auth.service';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
}
