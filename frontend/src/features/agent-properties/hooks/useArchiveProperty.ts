import { useMutation, useQueryClient } from '@tanstack/react-query';
import { agentPropertyService } from '../services/agent-property.service';

/** AGENT-004. `archived: false` un-archives — the same mutation serves both directions. */
export function useArchiveProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, archived = true }: { id: string; archived?: boolean }) =>
      agentPropertyService.archive(id, archived),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['properties', 'agent'] });
    },
  });
}
