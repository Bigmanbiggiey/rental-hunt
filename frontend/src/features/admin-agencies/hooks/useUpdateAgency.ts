import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateAgencyFormInput } from '../schemas/updateAgency.schema';
import { adminAgencyService } from '../services/admin-agency.service';

export function useUpdateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAgencyFormInput }) =>
      adminAgencyService.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'agencies'] });
      void queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
    },
  });
}
