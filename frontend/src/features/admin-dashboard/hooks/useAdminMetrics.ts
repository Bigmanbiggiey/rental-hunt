import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import { adminMetricsService } from '../services/admin-metrics.service';

/** api-design.md §9's Dashboard Metrics row. */
export function useAdminMetrics() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['adminMetrics'],
    queryFn: () => adminMetricsService.getMetrics(),
    enabled: !!profile,
    staleTime: 30_000,
  });
}
