import { useMutation, useQueryClient } from '@tanstack/react-query';
import { viewingRequestService } from '../services/viewing-request.service';

export function useCancelViewingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      viewingRequestService.cancel(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['viewingRequests', 'customer'] });
    },
  });
}
