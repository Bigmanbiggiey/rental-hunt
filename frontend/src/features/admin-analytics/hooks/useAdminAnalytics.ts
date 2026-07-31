import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import type { AdminAnalyticsRange } from '../repositories/admin-analytics.repository';
import { adminAnalyticsService } from '../services/admin-analytics.service';

export function useAdminAnalytics(range: AdminAnalyticsRange) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['admin', 'analytics', range],
    queryFn: () => adminAnalyticsService.getAnalytics(range),
    enabled: !!profile,
    staleTime: 60_000,
  });
}
