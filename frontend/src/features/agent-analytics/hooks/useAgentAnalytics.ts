import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import { agentAnalyticsService } from '../services/agent-analytics.service';

/** AGENT-008. */
export function useAgentAnalytics() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['agentAnalytics', 'properties', profile?.id],
    queryFn: () => agentAnalyticsService.listPropertyAnalytics(profile!.id),
    enabled: !!profile,
    staleTime: 60_000,
  });
}
