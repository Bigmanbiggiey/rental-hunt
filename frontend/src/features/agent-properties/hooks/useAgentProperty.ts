import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import { agentPropertyService } from '../services/agent-property.service';

/** AGENT-003's edit form — a single property by id, for pre-filling `PropertyForm`. */
export function useAgentProperty(id: string | undefined) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['properties', 'agent', 'byId', id],
    queryFn: () => agentPropertyService.getById(profile!.id, id as string),
    enabled: !!id && !!profile,
  });
}
