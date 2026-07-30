import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ViewingRequest } from '@/entities/viewing-request';
import { agentViewingRequestService } from '../services/agent-viewing-request.service';

/** BOOK-006. */
export function useMarkNoShow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (viewingRequest: ViewingRequest) => agentViewingRequestService.markNoShow(viewingRequest),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['viewingRequests', 'agent'] });
    },
  });
}
