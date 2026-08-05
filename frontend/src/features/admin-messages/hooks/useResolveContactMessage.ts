import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactMessageAdminService } from '../services/contact-message-admin.service';

/** Admin only (RLS `contact_messages_update_admin`, api-design.md §23.3). */
export function useResolveContactMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isResolved }: { id: string; isResolved: boolean }) =>
      contactMessageAdminService.setResolved(id, isResolved),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'contactMessages'] });
    },
  });
}
