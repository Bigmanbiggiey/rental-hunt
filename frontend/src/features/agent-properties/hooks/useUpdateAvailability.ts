import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PropertyAvailabilityStatus } from '@/entities/property';
import { agentPropertyService } from '../services/agent-property.service';

/** AGENT-006. */
export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PropertyAvailabilityStatus }) =>
      agentPropertyService.updateAvailability(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['properties', 'agent'] });
    },
  });
}
