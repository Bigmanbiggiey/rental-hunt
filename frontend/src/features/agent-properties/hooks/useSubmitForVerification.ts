import { useMutation, useQueryClient } from '@tanstack/react-query';
import { agentPropertyService } from '../services/agent-property.service';

/** AGENT-007's agent-facing half. */
export function useSubmitForVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => agentPropertyService.submitForVerification(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['properties', 'agent'] });
    },
  });
}
