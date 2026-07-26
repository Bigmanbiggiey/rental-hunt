import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { RequestPasswordResetInput } from '../schemas/requestPasswordReset.schema';

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (input: RequestPasswordResetInput) => authService.requestPasswordReset(input),
  });
}
