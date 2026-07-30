import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import type { AgentPropertyFilters } from '@/entities/property';
import { agentPropertyService } from '../services/agent-property.service';

/** AGENT-001/002/006's agency-wide list/search/filter (offset-paginated). */
export function useAgentProperties(filters?: AgentPropertyFilters, page?: number, pageSize?: number) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['properties', 'agent', filters, page, pageSize],
    queryFn: () => agentPropertyService.listForAgent(profile!.id, filters, page, pageSize),
    enabled: !!profile,
    staleTime: 30_000,
  });
}
