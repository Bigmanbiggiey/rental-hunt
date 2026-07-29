import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Property } from '@/entities/property';
import { viewingRequestService } from '../services/viewing-request.service';
import type { CreateViewingRequestInput } from '../schemas/createViewingRequest.schema';

export function useCreateViewingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ property, input }: { property: Property; input: CreateViewingRequestInput }) =>
      viewingRequestService.create(property, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['viewingRequests', 'customer'] });
    },
  });
}
