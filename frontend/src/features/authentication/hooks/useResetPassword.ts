import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { ResetPasswordInput } from '../schemas/resetPassword.schema';

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => authService.resetPassword(input),
  });
}
