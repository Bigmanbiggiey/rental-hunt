import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ViewingRequest } from '@/entities/viewing-request';
import { agentViewingRequestService } from '../services/agent-viewing-request.service';
import type { RescheduleViewingRequestInput } from '../schemas/rescheduleViewingRequest.schema';

/** BOOK-003. */
export function useRescheduleViewingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      viewingRequest,
      input,
    }: {
      viewingRequest: ViewingRequest;
      input: RescheduleViewingRequestInput;
    }) => agentViewingRequestService.reschedule(viewingRequest, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['viewingRequests', 'agent'] });
    },
  });
}
