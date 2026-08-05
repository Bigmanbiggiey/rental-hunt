import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactMessageAdminService } from '../services/contact-message-admin.service';

/** Admin only (RLS `contact_messages_delete_admin`, api-design.md §23.4). */
export function useDeleteContactMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactMessageAdminService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'contactMessages'] });
    },
  });
}
