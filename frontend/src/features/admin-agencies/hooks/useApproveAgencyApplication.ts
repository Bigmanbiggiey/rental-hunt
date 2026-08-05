import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAgencyService } from '../services/admin-agency.service';

export function useApproveAgencyApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminAgencyService.approveApplication(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'agencies'] });
      void queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
    },
  });
}
