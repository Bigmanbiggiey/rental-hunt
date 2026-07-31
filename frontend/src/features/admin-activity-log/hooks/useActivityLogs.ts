import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import type { ActivityLogFilters } from '../repositories/activity-log.repository';
import { activityLogService } from '../services/activity-log.service';

export function useActivityLogs(filters?: ActivityLogFilters, page?: number, pageSize?: number) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['admin', 'activityLogs', filters, page, pageSize],
    queryFn: () => activityLogService.list(filters, page, pageSize),
    enabled: !!profile,
    staleTime: 30_000,
  });
}
