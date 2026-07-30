import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import { agentDashboardService } from '../services/agent-dashboard.service';

/** AGENT-001. */
export function useAgentDashboardSummary() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['agentDashboard', 'summary', profile?.id],
    queryFn: () => agentDashboardService.getSummary(profile!.id),
    enabled: !!profile,
    staleTime: 30_000,
  });
}
