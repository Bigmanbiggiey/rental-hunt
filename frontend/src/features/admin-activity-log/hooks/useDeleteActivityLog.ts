import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activityLogService } from '../services/activity-log.service';

/** Admin only (RLS `activity_logs_delete_admin`) — retention/GDPR purposes (api-design.md §9). */
export function useDeleteActivityLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activityLogService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'activityLogs'] });
    },
  });
}
