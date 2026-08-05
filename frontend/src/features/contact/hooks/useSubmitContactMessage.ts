import { useMutation } from '@tanstack/react-query';
import { contactService } from '../services/contact.service';
import type { SubmitContactMessageInput } from '../schemas/submitContactMessage.schema';

export function useSubmitContactMessage() {
  return useMutation({
    mutationFn: (input: SubmitContactMessageInput) => contactService.submit(input),
  });
}
