import { useMutation, useQueryClient } from '@tanstack/react-query';
import { agentPropertyService } from '../services/agent-property.service';
import type { UpdatePropertyFormInput } from '../schemas/updateProperty.schema';

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePropertyFormInput }) =>
      agentPropertyService.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['properties', 'agent'] });
    },
  });
}
