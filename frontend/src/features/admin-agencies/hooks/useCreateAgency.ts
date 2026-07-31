import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateAgencyFormInput } from '../schemas/createAgency.schema';
import { adminAgencyService } from '../services/admin-agency.service';

export function useCreateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAgencyFormInput) => adminAgencyService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'agencies'] });
      void queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
    },
  });
}
