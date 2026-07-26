import { useMutation } from '@tanstack/react-query';
import { credentialsService } from '../services/credentials.service';
import type { UpdateEmailInput } from '../schemas/updateEmail.schema';

export function useUpdateEmail() {
  return useMutation({
    mutationFn: (input: UpdateEmailInput) => credentialsService.updateEmail(input),
  });
}
