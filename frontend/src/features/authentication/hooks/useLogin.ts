import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEY } from '@/entities/user';
import { authService } from '../services/auth.service';
import type { LoginInput } from '../schemas/login.schema';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
}
