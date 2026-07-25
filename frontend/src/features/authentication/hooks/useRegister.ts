import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEY } from '@/entities/user';
import { authService } from '../services/auth.service';
import type { RegisterInput } from '../schemas/register.schema';

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterInput) => authService.register(input),
    onSuccess: () => {
      // supabase.auth's own onAuthStateChange listener (entities/user's
      // AuthProvider) also invalidates this on SIGNED_IN — this makes the
      // new session available to consumers immediately rather than waiting
      // for that event to round-trip.
      void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
}
