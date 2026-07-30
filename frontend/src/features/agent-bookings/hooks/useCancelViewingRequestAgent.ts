import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ViewingRequest } from '@/entities/viewing-request';
import { agentViewingRequestService } from '../services/agent-viewing-request.service';

/** BOOK-004. */
export function useCancelViewingRequestAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ viewingRequest, reason }: { viewingRequest: ViewingRequest; reason?: string }) =>
      agentViewingRequestService.cancel(viewingRequest, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['viewingRequests', 'agent'] });
    },
  });
}
