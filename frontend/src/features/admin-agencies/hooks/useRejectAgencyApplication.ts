import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAgencyService } from '../services/admin-agency.service';

export function useRejectAgencyApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminAgencyService.rejectApplication(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'agencies'] });
      void queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
    },
  });
}
