import { useMutation } from '@tanstack/react-query';
import { credentialsService } from '../services/credentials.service';
import type { UpdatePasswordInput } from '../schemas/updatePassword.schema';

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (input: UpdatePasswordInput) => credentialsService.updatePassword(input),
  });
}
