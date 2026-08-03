import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEY } from '@/entities/user';
import { authService } from '../services/auth.service';
import type { LoginInput } from '../schemas/login.schema';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    // Write the already-resolved profile into the cache synchronously
    // instead of firing an async invalidate-and-refetch and hoping it wins a
    // race against the caller's own post-login navigate(). It doesn't:
    // invalidateQueries only *starts* a refetch (a real network round-trip —
    // getSession() + a profiles lookup), so ProtectedRoute's very next
    // render still saw the pre-login cached profile (null) and bounced the
    // user straight back to /login. Invisible against local Supabase's
    // near-zero latency (Sprint 2's own manual verification never caught
    // it); reliably reproducible against a real remote project's network
    // latency (found 2026-08-04, against production).
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
    },
  });
}
